import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest();
    const userId: number = req.user?.id;

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
      include: {
        roles: {
          include: {
            roles_permissions: { include: { permissions: true } },
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this business');
    }

    const granted = new Set(
      membership.roles?.roles_permissions.map((rp) => rp.permissions.action) ?? [],
    );

    const missing = required.filter((p) => !granted.has(p));

    if (missing.length) {
      throw new ForbiddenException(`Missing permission(s): ${missing.join(', ')}`);
    }

    req.membership = membership;
    return true;
  }
}