import { Test, TestingModule } from '@nestjs/testing';
import { UserManagementService } from './user-management.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UserManagementService', () => {
  let service: UserManagementService;

  const mockPrisma = {
    businesses: {
      findFirst: jest.fn(),
    },
    business_users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    join_requests: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    roles: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================
  // CREATE JOIN REQUEST
  // =========================
  it('should create join request', async () => {
    mockPrisma.businesses.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.business_users.findUnique.mockResolvedValue(null);
    mockPrisma.join_requests.findUnique.mockResolvedValue(null);
    mockPrisma.join_requests.create.mockResolvedValue({ id: 1 });

    const result = await service.createJoinRequest(1, 'MAT123');

    expect(result).toEqual({ id: 1 });
  });

  it('should throw if business not found', async () => {
    mockPrisma.businesses.findFirst.mockResolvedValue(null);

    await expect(
      service.createJoinRequest(1, 'INVALID'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw if already member', async () => {
    mockPrisma.businesses.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.business_users.findUnique.mockResolvedValue({ id: 1 });

    await expect(
      service.createJoinRequest(1, 'MAT123'),
    ).rejects.toThrow(BadRequestException);
  });

  // =========================
  // GET JOIN REQUESTS
  // =========================
  it('should get join requests', async () => {
    mockPrisma.join_requests.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.getJoinRequests(1);

    expect(result).toEqual([{ id: 1 }]);
  });

  // =========================
  // APPROVE REQUEST
  // =========================
  it('should approve request', async () => {
    mockPrisma.join_requests.findUnique.mockResolvedValue({
      id: 1,
      user_id: 10,
      business_id: 20,
    });

    mockPrisma.business_users.create.mockResolvedValue({});
    mockPrisma.join_requests.delete.mockResolvedValue({});

    const result = await service.approveRequest(1, 2);

    expect(result).toEqual({
      message: 'User approved successfully',
    });
  });

  it('should throw if request not found', async () => {
    mockPrisma.join_requests.findUnique.mockResolvedValue(null);

    await expect(service.approveRequest(1, 2)).rejects.toThrow(
      NotFoundException,
    );
  });

  // =========================
  // REJECT REQUEST
  // =========================
  it('should reject request', async () => {
    mockPrisma.join_requests.delete.mockResolvedValue({});

    const result = await service.rejectRequest(1);

    expect(result).toEqual({
      message: 'Request rejected',
    });
  });

  // =========================
  // GET ROLES
  // =========================
  it('should get roles', async () => {
    mockPrisma.roles.findMany.mockResolvedValue([
      { id: 1, title: 'Admin' },
    ]);

    const result = await service.getRoles();

    expect(result).toEqual([{ id: 1, title: 'Admin' }]);
  });
});