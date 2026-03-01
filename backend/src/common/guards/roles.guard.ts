import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() → any authenticated user may proceed
    if (!requiredRoles?.length) return true;

    const req = context.switchToHttp().getRequest();
    const userId: number = req.user?.id;

    // Business id comes from the route param OR the X-Business-Id header
    const businessId =
      parseInt(req.params?.businessId, 10) ||
      parseInt(req.headers['x-business-id'] as string, 10);

    if (!userId || !businessId) {
      throw new ForbiddenException('Missing user or business context');
    }

    const membership = await this.prisma.business_users.findUnique({
      where: {
        user_id_business_id: { user_id: userId, business_id: businessId },
      },
      include: { roles: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this business');
    }

    const userRole = membership.roles?.title as Role;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Requires role(s): ${requiredRoles.join(' | ')} — your role: ${userRole}`,
      );
    }

    // Attach for downstream use (e.g. service layer)
    req.membership = membership;
    return true;
  }
}