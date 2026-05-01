import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';

// ── Mock PrismaService ────────────────────────────────────────────────────────
const mockPrisma = {
  roles: {
    findFirst: jest.fn(),
  },
  businesses: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  business_users: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
};

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockOwnerRole = { id: 1, title: Role.OWNER };
const mockBusiness  = { id: 10, name: 'TestCorp', updated_at: new Date() };
const mockUser      = { id: 99, firstname: 'Said', lastname: 'Laffet', email: 'said@test.com' };

const mockMembership = {
  user_id: mockUser.id,
  business_id: mockBusiness.id,
  created_at: new Date(),
  roles: mockOwnerRole,
  businesses: mockBusiness,
};

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a business and enrol the user as OWNER', async () => {
      mockPrisma.roles.findFirst.mockResolvedValue(mockOwnerRole);
      mockPrisma.businesses.create.mockResolvedValue({
        ...mockBusiness,
        business_users: [mockMembership],
      });

      const dto = { name: 'TestCorp' };
      const result = await service.create(mockUser.id, dto as any);

      expect(mockPrisma.roles.findFirst).toHaveBeenCalledWith({ where: { title: Role.OWNER } });
      expect(mockPrisma.businesses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'TestCorp',
            business_users: expect.objectContaining({ create: { user_id: mockUser.id, role_id: mockOwnerRole.id } }),
          }),
        }),
      );
      expect(result.name).toBe('TestCorp');
    });

    it('should throw ConflictException if OWNER role is not seeded', async () => {
      mockPrisma.roles.findFirst.mockResolvedValue(null);
      await expect(service.create(mockUser.id, { name: 'X' } as any))
        .rejects.toThrow(ConflictException);
    });
  });

  // ── findAllForUser ──────────────────────────────────────────────────────────
  describe('findAllForUser', () => {
    it('should return businesses with role and joined_at', async () => {
      mockPrisma.business_users.findMany.mockResolvedValue([mockMembership]);

      const result = await service.findAllForUser(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockBusiness.id,
        name: mockBusiness.name,
        your_role: Role.OWNER,
      });
      expect(result[0]).toHaveProperty('joined_at');
    });

    it('should return empty array if user has no businesses', async () => {
      mockPrisma.business_users.findMany.mockResolvedValue([]);
      const result = await service.findAllForUser(mockUser.id);
      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a business with its members', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.businesses.findUnique.mockResolvedValue({
        ...mockBusiness,
        business_users: [mockMembership],
      });

      const result = await service.findOne(mockUser.id, mockBusiness.id);
      expect(result.id).toBe(mockBusiness.id);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(null);
      await expect(service.findOne(mockUser.id, mockBusiness.id))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if business does not exist', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.businesses.findUnique.mockResolvedValue(null);
      await expect(service.findOne(mockUser.id, mockBusiness.id))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update and return the business', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.businesses.update.mockResolvedValue({ ...mockBusiness, name: 'Updated' });

      const result = await service.update(mockUser.id, mockBusiness.id, { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
      expect(mockPrisma.businesses.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockBusiness.id } }),
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(null);
      await expect(service.update(mockUser.id, mockBusiness.id, {} as any))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete the business and return success message', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.businesses.delete.mockResolvedValue(mockBusiness);

      const result = await service.remove(mockUser.id, mockBusiness.id);
      expect(result).toEqual({ message: 'Business deleted successfully' });
      expect(mockPrisma.businesses.delete).toHaveBeenCalledWith({ where: { id: mockBusiness.id } });
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(null);
      await expect(service.remove(mockUser.id, mockBusiness.id))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ── switchActiveBusiness ────────────────────────────────────────────────────
  describe('switchActiveBusiness', () => {
    it('should return business context with role and permissions', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue({
        ...mockMembership,
        roles: {
          ...mockOwnerRole,
          roles_permissions: [
            { permissions: { action: 'read:invoices' } },
            { permissions: { action: 'write:invoices' } },
          ],
        },
      });

      const result = await service.switchActiveBusiness(mockUser.id, mockBusiness.id);
      expect(result.role).toBe(Role.OWNER);
      expect(result.permissions).toContain('read:invoices');
      expect(result.permissions).toContain('write:invoices');
      expect(result.business.id).toBe(mockBusiness.id);
    });

    it('should throw ForbiddenException if user does not belong to business', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(null);
      await expect(service.switchActiveBusiness(mockUser.id, mockBusiness.id))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ── getMembers ───────────────────────────────────────────────────────────────
  describe('getMembers', () => {
    it('should return all members of a business', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(mockMembership);
      mockPrisma.business_users.findMany.mockResolvedValue([mockMembership]);

      const result = await service.getMembers(mockUser.id, mockBusiness.id);
      expect(result).toHaveLength(1);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(null);
      await expect(service.getMembers(mockUser.id, mockBusiness.id))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ── removeMember ─────────────────────────────────────────────────────────────
  describe('removeMember', () => {
    const targetUserId = 55;
    const targetMembership = {
      user_id: targetUserId,
      business_id: mockBusiness.id,
      roles: { title: Role.MEMBER },
    };

    it('should remove a member successfully', async () => {
      mockPrisma.business_users.findUnique
        .mockResolvedValueOnce(mockMembership)   // assertMembership (requester)
        .mockResolvedValueOnce(targetMembership); // target lookup
      mockPrisma.business_users.count.mockResolvedValue(1);
      mockPrisma.business_users.delete.mockResolvedValue({});

      const result = await service.removeMember(mockUser.id, mockBusiness.id, targetUserId);
      expect(result).toEqual({ message: 'Member removed successfully' });
    });

    it('should throw ForbiddenException when removing last OWNER', async () => {
      const ownerTarget = { ...targetMembership, roles: { title: Role.OWNER } };
      mockPrisma.business_users.findUnique
        .mockResolvedValueOnce(mockMembership)
        .mockResolvedValueOnce(ownerTarget);
      mockPrisma.business_users.count.mockResolvedValue(1); // only 1 owner

      await expect(service.removeMember(mockUser.id, mockBusiness.id, targetUserId))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if target member does not exist', async () => {
      mockPrisma.business_users.findUnique
        .mockResolvedValueOnce(mockMembership)
        .mockResolvedValueOnce(null); // target not found
      mockPrisma.business_users.count.mockResolvedValue(1);

      await expect(service.removeMember(mockUser.id, mockBusiness.id, targetUserId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requester is not a member', async () => {
      mockPrisma.business_users.findUnique.mockResolvedValue(null);
      await expect(service.removeMember(mockUser.id, mockBusiness.id, targetUserId))
        .rejects.toThrow(ForbiddenException);
    });
  });
});

