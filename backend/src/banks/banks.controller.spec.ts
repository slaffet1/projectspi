import { Test, TestingModule } from '@nestjs/testing';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';

// Mock complet du BanksService
const mockBanksService = {
  create: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Helper pour créer un mock de Request avec user
const mockRequest = (businessId: number) => ({
  user: { businessId },
});

describe('BanksController', () => {
  let controller: BanksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BanksController],
      providers: [
        { provide: BanksService, useValue: mockBanksService },
      ],
    })
      // On override les guards pour ne pas bloquer les tests
      .overrideGuard(require('@nestjs/passport').AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(require('src/permissions/permissions/permissions.guard').PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BanksController>(BanksController);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────
  describe('create', () => {
    it('should call banksService.create with dto and businessId', async () => {
      const dto = { bank_name: 'BNA', account_number: '123456', iban: 'TN001' };
      const expected = { id: 1, ...dto, business_id: 1 };

      mockBanksService.create.mockResolvedValue(expected);

      const result = await controller.create(dto as any, '1');

      expect(mockBanksService.create).toHaveBeenCalledWith(dto, 1);
      expect(result).toEqual(expected);
    });

    it('should convert businessId string to number', async () => {
      const dto = { bank_name: 'STB', account_number: '654321', iban: 'TN002' };
      mockBanksService.create.mockResolvedValue({});

      await controller.create(dto as any, '42');

      expect(mockBanksService.create).toHaveBeenCalledWith(dto, 42);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should call banksService.findAll with converted businessId', async () => {
      const banks = [
        { id: 1, bank_name: 'BNA', business_id: 1 },
        { id: 2, bank_name: 'STB', business_id: 1 },
      ];
      mockBanksService.findAll.mockResolvedValue(banks);

      const result = await controller.findAll('1');

      expect(mockBanksService.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(banks);
    });

    it('should return empty array when no banks', async () => {
      mockBanksService.findAll.mockResolvedValue([]);

      const result = await controller.findAll('99');

      expect(result).toEqual([]);
    });
  });

  // ── search ──────────────────────────────────────────────────────
  describe('search', () => {
    it('should call banksService.search with query and businessId from req.user', async () => {
      const req = mockRequest(1);
      const banks = [{ id: 1, bank_name: 'BNA', business_id: 1 }];
      mockBanksService.search.mockResolvedValue(banks);

      const result = await controller.search('BNA', req);

      expect(mockBanksService.search).toHaveBeenCalledWith('BNA', 1);
      expect(result).toEqual(banks);
    });

    it('should return empty array if no match', async () => {
      const req = mockRequest(1);
      mockBanksService.search.mockResolvedValue([]);

      const result = await controller.search('xyz', req);

      expect(result).toEqual([]);
    });
  });

  // ── update ──────────────────────────────────────────────────────
  describe('update', () => {
    it('should call banksService.update with id, dto and businessId from req.user', async () => {
      const req = mockRequest(1);
      const dto = { bank_name: 'BNA Updated', account_number: '123456', iban: 'TN001' };
      mockBanksService.update.mockResolvedValue({ count: 1 });

      const result = await controller.update(1, dto as any, req);

      expect(mockBanksService.update).toHaveBeenCalledWith(1, dto, 1);
      expect(result).toEqual({ count: 1 });
    });

    it('should return count 0 if bank not found', async () => {
      const req = mockRequest(1);
      mockBanksService.update.mockResolvedValue({ count: 0 });

      const result = await controller.update(999, {} as any, req);

      expect(result).toEqual({ count: 0 });
    });
  });

  // ── remove ──────────────────────────────────────────────────────
  describe('remove', () => {
    it('should call banksService.remove with id and businessId from req.user', async () => {
      const req = mockRequest(1);
      mockBanksService.remove.mockResolvedValue({ count: 1 });

      const result = await controller.remove(1, req);

      expect(mockBanksService.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ count: 1 });
    });

    it('should return count 0 if bank not found', async () => {
      const req = mockRequest(1);
      mockBanksService.remove.mockResolvedValue({ count: 0 });

      const result = await controller.remove(999, req);

      expect(result).toEqual({ count: 0 });
    });
  });
});