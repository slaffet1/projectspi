import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private helpers ───────────────────────────────────────────────────────

  /** Get a seeded role by its title — throws clearly if seed migration hasn't run. */
  private async getRoleByTitle(title: Role) {
    const role = await this.prisma.roles.findFirst({ where: { title } });
    if (!role) {
      throw new ConflictException(
        `Role "${title}" not found. Run the seed migration: 20260301000000_add_roles_seed`,
      );
    }
    return role;
  }

  /** Assert the caller belongs to a business and return the membership row. */
  private async assertMembership(userId: number, businessId: number) {
    const membership = await this.prisma.business_users.findUnique({
      where: { user_id_business_id: { user_id: userId, business_id: businessId } },
      include: { roles: true },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this business');
    }
    return membership;
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * Create a new business and automatically enrol the creator as OWNER.
   */
  async create(userId: number, dto: CreateBusinessDto) {
    const ownerRole = await this.getRoleByTitle(Role.OWNER);

    return this.prisma.businesses.create({
      data: {
        ...dto,
        business_users: {
          create: {
            user_id: userId,
            role_id: ownerRole.id,
          },
        },
      },
      include: {
        business_users: {
          where: { user_id: userId },
          include: { roles: true },
        },
      },
    });
  }

  // ─── List all businesses for the current user ──────────────────────────────

  /**
   * "View Business List" — returns every business the user belongs to,
   * enriched with their role and join date.
   */
  async findAllForUser(userId: number) {
    const memberships = await this.prisma.business_users.findMany({
      where: { user_id: userId },
      include: {
        businesses: true,
        roles: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.businesses,
      your_role: m.roles?.title ?? null,
      joined_at: m.created_at,
    }));
  }

  // ─── Get single business ───────────────────────────────────────────────────

  async findOne(userId: number, businessId: number) {
    await this.assertMembership(userId, businessId);

    const business = await this.prisma.businesses.findUnique({
      where: { id: businessId },
      include: {
        business_users: {
          include: {
            users: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                phone_number: true,
              },
            },
            roles: true,
          },
        },
      },
    });

    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * "Edit Business Profile" — only OWNER (enforced by @Roles in controller).
   */
  async update(userId: number, businessId: number, dto: UpdateBusinessDto) {
    // Membership check is a safety net (RolesGuard already validates OWNER)
    await this.assertMembership(userId, businessId);

    return this.prisma.businesses.update({
      where: { id: businessId },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  /**
   * Hard-delete the business. Only OWNER (enforced by @Roles in controller).
   * All related data cascades via DB constraints.
   */
  async remove(userId: number, businessId: number) {
    await this.assertMembership(userId, businessId);

    await this.prisma.businesses.delete({ where: { id: businessId } });
    return { message: 'Business deleted successfully' };
  }

  // ─── Switch active business ────────────────────────────────────────────────

  /**
   * "Switch Active Business" — validates membership, then returns the full
   * business context (profile + role + permissions) the client needs to
   * cache as its active session. The client stores the businessId and sends
   * it as the X-Business-Id header on every subsequent request.
   */
  async switchActiveBusiness(userId: number, businessId: number) {
    const membership = await this.prisma.business_users.findUnique({
      where: { user_id_business_id: { user_id: userId, business_id: businessId } },
      include: {
        businesses: true,
        roles: {
          include: {
            roles_permissions: {
              include: { permissions: true },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not belong to this business or it does not exist',
      );
    }

    const permissions =
      membership.roles?.roles_permissions.map((rp) => rp.permissions.action) ?? [];

    return {
      business: membership.businesses,
      role: membership.roles?.title ?? null,
      permissions,
    };
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async getMembers(userId: number, businessId: number) {
    await this.assertMembership(userId, businessId);

    return this.prisma.business_users.findMany({
      where: { business_id: businessId },
      include: {
        users: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            phone_number: true,
          },
        },
        roles: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async removeMember(
    requesterId: number,
    businessId: number,
    targetUserId: number,
  ) {
    await this.assertMembership(requesterId, businessId);

    // Prevent removing yourself if you are the only OWNER
    const ownerCount = await this.prisma.business_users.count({
      where: {
        business_id: businessId,
        roles: { title: Role.OWNER },
      },
    });

    const targetMembership = await this.prisma.business_users.findUnique({
      where: {
        user_id_business_id: { user_id: targetUserId, business_id: businessId },
      },
      include: { roles: true },
    });

    if (!targetMembership) throw new NotFoundException('Member not found');

    if (targetMembership.roles?.title === Role.OWNER && ownerCount <= 1) {
      throw new ForbiddenException(
        'Cannot remove the last OWNER of a business',
      );
    }

    await this.prisma.business_users.delete({
      where: {
        user_id_business_id: { user_id: targetUserId, business_id: businessId },
      },
    });

    return { message: 'Member removed successfully' };
  }
}