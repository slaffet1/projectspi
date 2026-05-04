import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionsService {
    constructor(private prisma: PrismaService) {}
 
  // Toutes les permissions du système
  async getAllPermissions() {
    return this.prisma.permissions.findMany({
      orderBy: { action: 'asc' },
    });
  }
async getMembersWithRoles(businessId: number) {
  const members = await this.prisma.business_users.findMany({
    where: {
      business_id: businessId,
      roles: {
        title: {
          not: "owner",
          mode: "insensitive", 
        },
      },
    },
    include: {
      users: true,
      roles: true,
    },
  });

  return members.map((m) => ({
    user_id: m.users?.id,
    firstname: m.users?.firstname,
    lastname: m.users?.lastname,
    email: m.users?.email,

    role: m.roles?.title?.toLowerCase(), // 👈 affichage uniforme
    role_id: m.roles?.id,

    joined_at: m.created_at,
  }));
}
  // Permissions actuellement assignées à un rôle
  async getRolePermissions(roleId: number) {
    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        roles_permissions: {
          include: { permissions: true },
        },
      },
    });
 
    return {
      roleId,
      roleTitle: role?.title,
      permissions: role?.roles_permissions.map((rp) => rp.permissions) ?? [],
    };
  }
 
  // Remplace toutes les permissions d'un rôle par la nouvelle liste
  async updateRolePermissions(roleId: number, permissionIds: number[]) {
    // 1. Supprimer toutes les permissions actuelles du rôle
    await this.prisma.roles_permissions.deleteMany({
      where: { role_id: roleId },
    });
 
    // 2. Insérer les nouvelles permissions
    if (permissionIds.length > 0) {
      await this.prisma.roles_permissions.createMany({
        data: permissionIds.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        })),
        skipDuplicates: true,
      });
    }
 
    return this.getRolePermissions(roleId);
  }
}
