import { Test, TestingModule } from '@nestjs/testing';
import { BanksService } from './banks.service';
import { PrismaService } from 'src/prisma/prisma.service';

// Mock de PrismaService — on ne touche jamais la vraie DB
const mockPrisma = {
  banks: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('BanksService', () => {
  let service: BanksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BanksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BanksService>(BanksService);

    // Reset tous les mocks avant chaque test
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a bank and return it', async () => {
      const dto = { bank_name: 'BNA', account_number: '123456', iban: 'TN001' };
      const businessId = 1;
      const expected = { id: 1, ...dto, business_id: businessId };

      mockPrisma.banks.create.mockResolvedValue(expected);

      const result = await service.create(dto, businessId);

      expect(mockPrisma.banks.create).toHaveBeenCalledWith({
        data: { ...dto, business_id: businessId },
      });
      expect(result).toEqual(expected);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all banks for a business', async () => {
      const businessId = 1;
      const banks = [
        { id: 1, bank_name: 'BNA', business_id: 1 },
        { id: 2, bank_name: 'STB', business_id: 1 },
      ];

      mockPrisma.banks.findMany.mockResolvedValue(banks);

      const result = await service.findAll(businessId);

      expect(mockPrisma.banks.findMany).toHaveBeenCalledWith({
        where: { business_id: businessId },
        orderBy: { created_at: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result).toEqual(banks);
    });

    it('should return empty array if no banks', async () => {
      mockPrisma.banks.findMany.mockResolvedValue([]);
      const result = await service.findAll(99);
      expect(result).toEqual([]);
    });
  });

  // ── update ──────────────────────────────────────────────────────
  describe('update', () => {
    it('should update a bank', async () => {
      const updateData = { bank_name: 'BNA Updated' };
      mockPrisma.banks.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.update(1, updateData, 1);

      expect(mockPrisma.banks.updateMany).toHaveBeenCalledWith({
        where: { id: 1, business_id: 1 },
        data: updateData,
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  // ── remove ──────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a bank', async () => {
      mockPrisma.banks.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(1, 1);

      expect(mockPrisma.banks.deleteMany).toHaveBeenCalledWith({
        where: { id: 1, business_id: 1 },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
