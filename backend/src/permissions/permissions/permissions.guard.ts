import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';


export const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (action: string) =>
  SetMetadata(PERMISSION_KEY, action);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

 async canActivate(context: ExecutionContext): Promise<boolean> {
  const requiredAction = this.reflector.getAllAndOverride<string>(
    PERMISSION_KEY,
    [context.getHandler(), context.getClass()],
  );

  if (!requiredAction) return true;

  const request = context.switchToHttp().getRequest();
  const user = request.user;
  const businessId = parseInt(request.params.businessId);
  if (!user || !businessId) throw new ForbiddenException();

  const businessUser = await this.prisma.business_users.findUnique({
    where: { user_id_business_id: { user_id: user.id, business_id: businessId } },
    include: {
      roles: {
        include: { roles_permissions: { include: { permissions: true } } },
      },
    },
  });

  if (!businessUser) throw new ForbiddenException();

  // Owner bypass
  if (businessUser.roles?.title?.toLowerCase().trim() === 'owner') return true;

  const hasAccess = businessUser.roles?.roles_permissions.some(
    rp => rp.permissions.action === requiredAction,
  );

  if (!hasAccess) throw new ForbiddenException(`Accès refusé : ${requiredAction}`);

  return true;
}
}