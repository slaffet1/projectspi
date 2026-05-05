
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { AuthGuard } from '@nestjs/passport';

const mockPermissionsService = {
  getAllPermissions: jest.fn(),
  getMembersWithRoles: jest.fn(),
  getRolePermissions: jest.fn(),
  updateRolePermissions: jest.fn(),
};

describe('PermissionsController', () => {
  let controller: PermissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PermissionsController>(PermissionsController);
    jest.clearAllMocks();
  });

  // ── GET all permissions ─────────────────────────────────────
  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      const permissions = [
        { id: 1, name: 'READ' },
        { id: 2, name: 'WRITE' },
      ];

      mockPermissionsService.getAllPermissions.mockResolvedValue(permissions);

      const result = await controller.getAllPermissions();

      expect(mockPermissionsService.getAllPermissions).toHaveBeenCalled();
      expect(result).toEqual(permissions);
    });

    it('should return empty array if no permissions exist', async () => {
      mockPermissionsService.getAllPermissions.mockResolvedValue([]);

      const result = await controller.getAllPermissions();

      expect(result).toEqual([]);
    });
  });

  // ── GET members with roles ─────────────────────────────────
  describe('getMembers', () => {
    it('should call service with businessId', async () => {
      const members = [
        { id: 1, name: 'User1', role: 'Admin' },
      ];

      mockPermissionsService.getMembersWithRoles.mockResolvedValue(members);

      const result = await controller.getMembers(1);

      expect(mockPermissionsService.getMembersWithRoles).toHaveBeenCalledWith(1);
      expect(result).toEqual(members);
    });

    it('should propagate errors', async () => {
      mockPermissionsService.getMembersWithRoles.mockRejectedValue(
        new Error('Error fetching members'),
      );

      await expect(controller.getMembers(1)).rejects.toThrow('Error fetching members');
    });
  });

  // ── GET role permissions ───────────────────────────────────
  describe('getRolePermissions', () => {
    it('should call service with roleId', async () => {
      const permissions = [{ id: 1, name: 'READ' }];

      mockPermissionsService.getRolePermissions.mockResolvedValue(permissions);

      const result = await controller.getRolePermissions(2);

      expect(mockPermissionsService.getRolePermissions).toHaveBeenCalledWith(2);
      expect(result).toEqual(permissions);
    });

    it('should propagate errors', async () => {
      mockPermissionsService.getRolePermissions.mockRejectedValue(
        new Error('Role not found'),
      );

      await expect(controller.getRolePermissions(999)).rejects.toThrow('Role not found');
    });
  });

  // ── UPDATE role permissions ────────────────────────────────
  describe('updateRolePermissions', () => {
    it('should call service with roleId and permissionIds', async () => {
      const body = { permissionIds: [1, 2, 3] };
      const expected = { success: true };

      mockPermissionsService.updateRolePermissions.mockResolvedValue(expected);

      const result = await controller.updateRolePermissions(5, body);

      expect(mockPermissionsService.updateRolePermissions).toHaveBeenCalledWith(
        5,
        [1, 2, 3],
      );
      expect(result).toEqual(expected);
    });

    it('should handle empty permissions array', async () => {
      const body = { permissionIds: [] };

      mockPermissionsService.updateRolePermissions.mockResolvedValue({ success: true });

      const result = await controller.updateRolePermissions(5, body);

      expect(mockPermissionsService.updateRolePermissions).toHaveBeenCalledWith(
        5,
        [],
      );
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors', async () => {
      const body = { permissionIds: [1] };

      mockPermissionsService.updateRolePermissions.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateRolePermissions(5, body),
      ).rejects.toThrow('Update failed');
    });
  });
});
