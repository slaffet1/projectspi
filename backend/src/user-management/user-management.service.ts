import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserManagementService {
  constructor(private prisma: PrismaService) {}

  // =============================
  // CREATE JOIN REQUEST
  // =============================
  async createJoinRequest(userId: number, matricule: string) {
    const business = await this.prisma.businesses.findFirst({
      where: { matricule_fiscale: matricule },
    });

    if (!business) {
      throw new BadRequestException('Business not found');
    }

    // vérifier si déjà membre
    const alreadyMember = await this.prisma.business_users.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: business.id,
        },
      },
    });

    if (alreadyMember) {
      throw new BadRequestException('User already member');
    }

    const existing = await this.prisma.join_requests.findUnique({
      where: {
        user_id_business_id: {
          user_id: userId,
          business_id: business.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Request already sent');
    }

    return this.prisma.join_requests.create({
      data: {
        user_id: userId,
        business_id: business.id,
      },
    });
  }

  // =============================
  // GET JOIN REQUESTS
  // =============================
  async getJoinRequests(businessId: number) {
    return this.prisma.join_requests.findMany({
      where: {
        business_id: businessId,
        status: 'pending',
      },
      include: {
        user: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // =============================
  // APPROVE REQUEST
  // =============================
  async approveRequest(requestId: number, roleId: number) {
    const request = await this.prisma.join_requests.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // ajouter dans business_users
    await this.prisma.business_users.create({
      data: {
        user_id: request.user_id,
        business_id: request.business_id,
        role_id: roleId,
      },
    });

    // supprimer demande
    await this.prisma.join_requests.delete({
      where: { id: requestId },
    });

    return { message: 'User approved successfully' };
  }

  // =============================
  // REJECT REQUEST
  // =============================
  async rejectRequest(requestId: number) {
    await this.prisma.join_requests.delete({
      where: { id: requestId },
    });

    return { message: 'Request rejected' };
  }

  // =============================
  // GET ROLES
  // =============================
  async getRoles() {
    return this.prisma.roles.findMany({
      select: {
        id: true,
        title: true,
      },
    });
  }
}