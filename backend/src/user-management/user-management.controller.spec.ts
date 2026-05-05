
import { Test, TestingModule } from '@nestjs/testing';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { AuthGuard } from '@nestjs/passport';

const mockUserManagementService = {
  createJoinRequest: jest.fn(),
  getJoinRequests: jest.fn(),
  approveRequest: jest.fn(),
  rejectRequest: jest.fn(),
  getRoles: jest.fn(),
};

describe('UserManagementController', () => {
  let controller: UserManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserManagementController],
      providers: [
        {
          provide: UserManagementService,
          useValue: mockUserManagementService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserManagementController>(
      UserManagementController,
    );

    jest.clearAllMocks();
  });

  const USER_ID = 1;

  // ───────── JOIN COMPANY ─────────
  describe('joinCompany', () => {
    it('should create join request', async () => {
      const req = { user: { id: USER_ID } };
      const dto = { matricule_fiscale: 'ABC123' };

      const expected = { id: 1, status: 'pending' };

      mockUserManagementService.createJoinRequest.mockResolvedValue(expected);

      const result = await controller.joinCompany(req as any, dto as any);

      expect(mockUserManagementService.createJoinRequest).toHaveBeenCalledWith(
        USER_ID,
        dto.matricule_fiscale,
      );

      expect(result).toEqual(expected);
    });
  });

  // ───────── GET REQUESTS ─────────
  describe('getRequests', () => {
    it('should return join requests', async () => {
      const businessId = '1';
      const expected = [{ id: 1 }, { id: 2 }];

      mockUserManagementService.getJoinRequests.mockResolvedValue(expected);

      const result = await controller.getRequests(businessId);

      expect(mockUserManagementService.getJoinRequests).toHaveBeenCalledWith(
        1,
      );

      expect(result).toEqual(expected);
    });

    it('should convert businessId to number', async () => {
      mockUserManagementService.getJoinRequests.mockResolvedValue([]);

      await controller.getRequests('99');

      expect(mockUserManagementService.getJoinRequests).toHaveBeenCalledWith(
        99,
      );
    });
  });

  // ───────── APPROVE REQUEST ─────────
  describe('approve', () => {
    it('should approve request', async () => {
      const body = {
        requestId: 10,
        roleId: 2,
      };

      const expected = { success: true };

      mockUserManagementService.approveRequest.mockResolvedValue(expected);

      const result = await controller.approve(body);

      expect(mockUserManagementService.approveRequest).toHaveBeenCalledWith(
        body.requestId,
        body.roleId,
      );

      expect(result).toEqual(expected);
    });
  });

  // ───────── REJECT REQUEST ─────────
  describe('reject', () => {
    it('should reject request', async () => {
      const expected = { success: true };

      mockUserManagementService.rejectRequest.mockResolvedValue(expected);

      const result = await controller.reject('1');

      expect(mockUserManagementService.rejectRequest).toHaveBeenCalledWith(
        1,
      );

      expect(result).toEqual(expected);
    });

    it('should convert id to number', async () => {
      mockUserManagementService.rejectRequest.mockResolvedValue({});

      await controller.reject('50');

      expect(mockUserManagementService.rejectRequest).toHaveBeenCalledWith(
        50,
      );
    });
  });

  // ───────── GET ROLES ─────────
  describe('getRoles', () => {
    it('should return roles', async () => {
      const expected = [
        { id: 1, name: 'ADMIN' },
        { id: 2, name: 'USER' },
      ];

      mockUserManagementService.getRoles.mockResolvedValue(expected);

      const result = await controller.getRoles();

      expect(mockUserManagementService.getRoles).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('should return empty array', async () => {
      mockUserManagementService.getRoles.mockResolvedValue([]);

      const result = await controller.getRoles();

      expect(result).toEqual([]);
    });
  });
});
