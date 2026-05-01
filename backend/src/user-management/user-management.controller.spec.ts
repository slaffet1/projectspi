import { Test, TestingModule } from '@nestjs/testing';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { AuthGuard } from '@nestjs/passport';

describe('UserManagementController', () => {
  let controller: UserManagementController;

  const mockService = {
    createJoinRequest: jest.fn(),
    getJoinRequests: jest.fn(),
    approveRequest: jest.fn(),
    rejectRequest: jest.fn(),
    getRoles: jest.fn(),
  };

  // mock JWT guard (on bypass auth)
  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserManagementController],
      providers: [
        {
          provide: UserManagementService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UserManagementController>(
      UserManagementController,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================
  // JOIN COMPANY
  // =========================
  it('should call joinCompany', async () => {
    mockService.createJoinRequest.mockResolvedValue({ id: 1 });

    const req = { user: { id: 1 } };
    const dto = { matricule_fiscale: 'MAT123' };

    const result = await controller.joinCompany(req, dto);

    expect(mockService.createJoinRequest).toHaveBeenCalledWith(
      1,
      'MAT123',
    );
    expect(result).toEqual({ id: 1 });
  });

  // =========================
  // GET REQUESTS
  // =========================
  it('should get join requests', async () => {
    mockService.getJoinRequests.mockResolvedValue([{ id: 1 }]);

    const result = await controller.getRequests('1');

    expect(mockService.getJoinRequests).toHaveBeenCalledWith(1);
    expect(result).toEqual([{ id: 1 }]);
  });

  // =========================
  // APPROVE
  // =========================
  it('should approve request', async () => {
    mockService.approveRequest.mockResolvedValue({
      message: 'User approved successfully',
    });

    const result = await controller.approve({
      requestId: 1,
      roleId: 2,
    });

    expect(mockService.approveRequest).toHaveBeenCalledWith(1, 2);
    expect(result).toEqual({
      message: 'User approved successfully',
    });
  });

  // =========================
  // REJECT
  // =========================
  it('should reject request', async () => {
    mockService.rejectRequest.mockResolvedValue({
      message: 'Request rejected',
    });

    const result = await controller.reject('1');

    expect(mockService.rejectRequest).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      message: 'Request rejected',
    });
  });

  // =========================
  // ROLES
  // =========================
  it('should get roles', async () => {
    mockService.getRoles.mockResolvedValue([{ id: 1, title: 'Admin' }]);

    const result = await controller.getRoles();

    expect(result).toEqual([{ id: 1, title: 'Admin' }]);
  });
});