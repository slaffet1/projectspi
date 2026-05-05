import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

const mockCompanyService = {
  create: jest.fn(),
  findAllForUser: jest.fn(),
  switchActiveBusiness: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getMembers: jest.fn(),
  removeMember: jest.fn(),
};

const USER_ID = 1;
const BUSINESS_ID = 10;

describe('CompanyController', () => {
  let controller: CompanyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        { provide: CompanyService, useValue: mockCompanyService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────
  describe('create', () => {
    it('should call companyService.create with userId and dto', async () => {
      const dto = { name: 'Acme Corp', industry: 'Tech' };
      const expected = { id: BUSINESS_ID, ...dto, owner_id: USER_ID };

      mockCompanyService.create.mockResolvedValue(expected);

      const result = await controller.create(USER_ID, dto as any);

      expect(mockCompanyService.create).toHaveBeenCalledWith(USER_ID, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors thrown by the service', async () => {
      mockCompanyService.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        controller.create(USER_ID, { name: 'Test' } as any),
      ).rejects.toThrow('Create failed');
    });
  });

  // ── findMine ────────────────────────────────────────────────────
  describe('findMine', () => {
    it('should call companyService.findAllForUser with userId', async () => {
      const businesses = [
        { id: 1, name: 'Acme Corp', owner_id: USER_ID },
        { id: 2, name: 'Beta Ltd', owner_id: USER_ID },
      ];

      mockCompanyService.findAllForUser.mockResolvedValue(businesses);

      const result = await controller.findMine(USER_ID);

      expect(mockCompanyService.findAllForUser).toHaveBeenCalledWith(USER_ID);
      expect(result).toEqual(businesses);
    });

    it('should return empty array when user has no businesses', async () => {
      mockCompanyService.findAllForUser.mockResolvedValue([]);

      const result = await controller.findMine(USER_ID);

      expect(result).toEqual([]);
    });
  });

  // ── switchActive ─────────────────────────────────────────────────
  describe('switchActive', () => {
    it('should call companyService.switchActiveBusiness with userId and businessId', async () => {
      const expected = { businessId: BUSINESS_ID, role: 'OWNER', token: 'jwt-token' };

      mockCompanyService.switchActiveBusiness.mockResolvedValue(expected);

      const result = await controller.switchActive(USER_ID, BUSINESS_ID);

      expect(mockCompanyService.switchActiveBusiness).toHaveBeenCalledWith(USER_ID, BUSINESS_ID);
      expect(result).toEqual(expected);
    });

    it('should propagate errors if user is not a member', async () => {
      mockCompanyService.switchActiveBusiness.mockRejectedValue(
        new Error('User is not a member of this business'),
      );

      await expect(
        controller.switchActive(USER_ID, 999),
      ).rejects.toThrow('User is not a member of this business');
    });
  });

  // ── findOne ─────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should call companyService.findOne with userId and businessId', async () => {
      const expected = { id: BUSINESS_ID, name: 'Acme Corp', owner_id: USER_ID };

      mockCompanyService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(USER_ID, BUSINESS_ID);

      expect(mockCompanyService.findOne).toHaveBeenCalledWith(USER_ID, BUSINESS_ID);
      expect(result).toEqual(expected);
    });

    it('should propagate errors if business not found', async () => {
      mockCompanyService.findOne.mockRejectedValue(new Error('Business not found'));

      await expect(
        controller.findOne(USER_ID, 999),
      ).rejects.toThrow('Business not found');
    });
  });

  // ── update ──────────────────────────────────────────────────────
  describe('update', () => {
    it('should call companyService.update with userId, businessId and dto', async () => {
      const dto = { name: 'Acme Corp Updated' };
      const expected = { id: BUSINESS_ID, ...dto, owner_id: USER_ID };

      mockCompanyService.update.mockResolvedValue(expected);

      const result = await controller.update(USER_ID, BUSINESS_ID, dto as any);

      expect(mockCompanyService.update).toHaveBeenCalledWith(USER_ID, BUSINESS_ID, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors thrown by the service', async () => {
      mockCompanyService.update.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        controller.update(USER_ID, BUSINESS_ID, {} as any),
      ).rejects.toThrow('Unauthorized');
    });
  });

  // ── remove ──────────────────────────────────────────────────────
  describe('remove', () => {
    it('should call companyService.remove with userId and businessId', async () => {
      mockCompanyService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(USER_ID, BUSINESS_ID);

      expect(mockCompanyService.remove).toHaveBeenCalledWith(USER_ID, BUSINESS_ID);
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors thrown by the service', async () => {
      mockCompanyService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(
        controller.remove(USER_ID, 999),
      ).rejects.toThrow('Delete failed');
    });
  });

  // ── getMembers ──────────────────────────────────────────────────
  describe('getMembers', () => {
    it('should call companyService.getMembers with userId and businessId', async () => {
      const members = [
        { id: 1, user_id: USER_ID, business_id: BUSINESS_ID, role: 'OWNER' },
        { id: 2, user_id: 2, business_id: BUSINESS_ID, role: 'MEMBER' },
      ];

      mockCompanyService.getMembers.mockResolvedValue(members);

      const result = await controller.getMembers(USER_ID, BUSINESS_ID);

      expect(mockCompanyService.getMembers).toHaveBeenCalledWith(USER_ID, BUSINESS_ID);
      expect(result).toEqual(members);
    });

    it('should return empty array when no members', async () => {
      mockCompanyService.getMembers.mockResolvedValue([]);

      const result = await controller.getMembers(USER_ID, BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ── removeMember ────────────────────────────────────────────────
  describe('removeMember', () => {
    it('should call companyService.removeMember with requesterId, businessId and targetUserId', async () => {
      const targetUserId = 2;
      mockCompanyService.removeMember.mockResolvedValue({ success: true });

      const result = await controller.removeMember(USER_ID, BUSINESS_ID, targetUserId);

      expect(mockCompanyService.removeMember).toHaveBeenCalledWith(
        USER_ID,
        BUSINESS_ID,
        targetUserId,
      );
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors if requester lacks permission', async () => {
      mockCompanyService.removeMember.mockRejectedValue(new Error('Forbidden'));

      await expect(
        controller.removeMember(USER_ID, BUSINESS_ID, 99),
      ).rejects.toThrow('Forbidden');
    });

    it('should propagate errors if target member not found', async () => {
      mockCompanyService.removeMember.mockRejectedValue(new Error('Member not found'));

      await expect(
        controller.removeMember(USER_ID, BUSINESS_ID, 999),
      ).rejects.toThrow('Member not found');
    });
  });
});