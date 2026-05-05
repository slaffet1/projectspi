import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PrismaService } from 'src/prisma/prisma.service';

// ── Helpers ────────────────────────────────────────────────────────────────
const makePermission = (overrides: Partial<any> = {}) => ({
  id: 1,
  action: 'read',
  description: 'Read access',
  ...overrides,
});

const makeRole = (overrides: Partial<any> = {}) => ({
  id: 1,
  title: 'manager',
  business_id: 1,
  roles_permissions: [],
  ...overrides,
});

const makeUser = (overrides: Partial<any> = {}) => ({
  id: 1,
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  ...overrides,
});

const makeBusinessUser = (overrides: Partial<any> = {}) => ({
  id: 1,
  business_id: 1,
  created_at: new Date(),
  users: makeUser(),
  roles: makeRole(),
  ...overrides,
});

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockPrisma = {
  permissions: {
    findMany: jest.fn(),
  },
  business_users: {
    findMany: jest.fn(),
  },
  roles: {
    findUnique: jest.fn(),
  },
  roles_permissions: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
};

// ══════════════════════════════════════════════════════════════════════════
describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    jest.clearAllMocks();
  });

  // ── getAllPermissions ─────────────────────────────────────────────────────
  describe('getAllPermissions', () => {
    it('should return all permissions ordered by action', async () => {
      const permissions = [
        makePermission({ id: 1, action: 'create' }),
        makePermission({ id: 2, action: 'delete' }),
        makePermission({ id: 3, action: 'read' }),
      ];
      mockPrisma.permissions.findMany.mockResolvedValue(permissions);

      const result = await service.getAllPermissions();

      expect(mockPrisma.permissions.findMany).toHaveBeenCalledWith({
        orderBy: { action: 'asc' },
      });
      expect(result).toHaveLength(3);
      expect(result).toEqual(permissions);
    });

    it('should return empty array when no permissions exist', async () => {
      mockPrisma.permissions.findMany.mockResolvedValue([]);

      const result = await service.getAllPermissions();

      expect(result).toEqual([]);
    });
  });

  // ── getMembersWithRoles ───────────────────────────────────────────────────
  describe('getMembersWithRoles', () => {
    it('should return members with their roles excluding owners', async () => {
      const members = [
        makeBusinessUser(),
        makeBusinessUser({
          id: 2,
          users: makeUser({ id: 2, firstname: 'Jane', email: 'jane@example.com' }),
          roles: makeRole({ id: 2, title: 'editor' }),
        }),
      ];
      mockPrisma.business_users.findMany.mockResolvedValue(members);

      const result = await service.getMembersWithRoles(1);

      expect(mockPrisma.business_users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            business_id: 1,
            roles: {
              title: {
                not: 'owner',
                mode: 'insensitive',
              },
            },
          },
          include: {
            users: true,
            roles: true,
          },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should map members to the correct shape', async () => {
      const member = makeBusinessUser({
        users: makeUser({ id: 5, firstname: 'Alice', lastname: 'Smith', email: 'alice@test.com' }),
        roles: makeRole({ id: 3, title: 'Editor' }),
        created_at: new Date('2024-01-01'),
      });
      mockPrisma.business_users.findMany.mockResolvedValue([member]);

      const result = await service.getMembersWithRoles(1);

      expect(result[0]).toEqual({
        user_id: 5,
        firstname: 'Alice',
        lastname: 'Smith',
        email: 'alice@test.com',
        role: 'editor',
        role_id: 3,
        joined_at: member.created_at,
      });
    });

    it('should return role in lowercase', async () => {
      const member = makeBusinessUser({
        roles: makeRole({ title: 'MANAGER' }),
      });
      mockPrisma.business_users.findMany.mockResolvedValue([member]);

      const result = await service.getMembersWithRoles(1);

      expect(result[0].role).toBe('manager');
    });

    it('should return empty array when no members exist', async () => {
      mockPrisma.business_users.findMany.mockResolvedValue([]);

      const result = await service.getMembersWithRoles(1);

      expect(result).toEqual([]);
    });

    it('should handle members with null users or roles gracefully', async () => {
      const member = makeBusinessUser({ users: null, roles: null });
      mockPrisma.business_users.findMany.mockResolvedValue([member]);

      const result = await service.getMembersWithRoles(1);

      expect(result[0]).toEqual({
        user_id: undefined,
        firstname: undefined,
        lastname: undefined,
        email: undefined,
        role: undefined,
        role_id: undefined,
        joined_at: member.created_at,
      });
    });
  });

  // ── getRolePermissions ────────────────────────────────────────────────────
  describe('getRolePermissions', () => {
    it('should return role with its permissions', async () => {
      const role = makeRole({
        title: 'manager',
        roles_permissions: [
          { permissions: makePermission({ id: 1, action: 'read' }) },
          { permissions: makePermission({ id: 2, action: 'write' }) },
        ],
      });
      mockPrisma.roles.findUnique.mockResolvedValue(role);

      const result = await service.getRolePermissions(1);

      expect(mockPrisma.roles.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          roles_permissions: {
            include: { permissions: true },
          },
        },
      });
      expect(result).toEqual({
        roleId: 1,
        roleTitle: 'manager',
        permissions: [
          makePermission({ id: 1, action: 'read' }),
          makePermission({ id: 2, action: 'write' }),
        ],
      });
    });

    it('should return empty permissions array when role has no permissions', async () => {
      const role = makeRole({ roles_permissions: [] });
      mockPrisma.roles.findUnique.mockResolvedValue(role);

      const result = await service.getRolePermissions(1);

      expect(result.permissions).toEqual([]);
    });

    it('should return empty permissions when role is not found', async () => {
      mockPrisma.roles.findUnique.mockResolvedValue(null);

      const result = await service.getRolePermissions(999);

      expect(result).toEqual({
        roleId: 999,
        roleTitle: undefined,
        permissions: [],
      });
    });
  });

  // ── updateRolePermissions ─────────────────────────────────────────────────
  describe('updateRolePermissions', () => {
    it('should delete existing permissions and insert new ones', async () => {
      const role = makeRole({
        roles_permissions: [
          { permissions: makePermission({ id: 1 }) },
          { permissions: makePermission({ id: 2 }) },
        ],
      });
      mockPrisma.roles_permissions.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.roles_permissions.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.roles.findUnique.mockResolvedValue(role);

      const result = await service.updateRolePermissions(1, [1, 2]);

      expect(mockPrisma.roles_permissions.deleteMany).toHaveBeenCalledWith({
        where: { role_id: 1 },
      });
      expect(mockPrisma.roles_permissions.createMany).toHaveBeenCalledWith({
        data: [
          { role_id: 1, permission_id: 1 },
          { role_id: 1, permission_id: 2 },
        ],
        skipDuplicates: true,
      });
      expect(result.roleId).toBe(1);
    });

    it('should not call createMany when permissionIds is empty', async () => {
      const role = makeRole({ roles_permissions: [] });
      mockPrisma.roles_permissions.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.roles.findUnique.mockResolvedValue(role);

      await service.updateRolePermissions(1, []);

      expect(mockPrisma.roles_permissions.deleteMany).toHaveBeenCalledWith({
        where: { role_id: 1 },
      });
      expect(mockPrisma.roles_permissions.createMany).not.toHaveBeenCalled();
    });

    it('should return updated role permissions after update', async () => {
      const role = makeRole({
        title: 'editor',
        roles_permissions: [
          { permissions: makePermission({ id: 3, action: 'delete' }) },
        ],
      });
      mockPrisma.roles_permissions.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.roles_permissions.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.roles.findUnique.mockResolvedValue(role);

      const result = await service.updateRolePermissions(1, [3]);

      expect(result).toEqual({
        roleId: 1,
        roleTitle: 'editor',
        permissions: [makePermission({ id: 3, action: 'delete' })],
      });
    });

    it('should handle single permission correctly', async () => {
      const role = makeRole({
        roles_permissions: [
          { permissions: makePermission({ id: 5 }) },
        ],
      });
      mockPrisma.roles_permissions.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.roles_permissions.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.roles.findUnique.mockResolvedValue(role);

      await service.updateRolePermissions(1, [5]);

      expect(mockPrisma.roles_permissions.createMany).toHaveBeenCalledWith({
        data: [{ role_id: 1, permission_id: 5 }],
        skipDuplicates: true,
      });
    });
  });
});