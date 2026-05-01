import { Test, TestingModule } from '@nestjs/testing';
import { TaxSettingsService } from './tax-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  taxes: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  businesses: {
    findUnique: jest.fn(),
  },
};

describe('TaxSettingsService', () => {
  let service: TaxSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxSettingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TaxSettingsService>(TaxSettingsService);
    jest.clearAllMocks();
  });

  describe('getAllDefaultTaxes', () => {
    it('should return all default taxes', async () => {
      const taxes = [
        { id: 1, name: 'TVA 19%', rate: 19, is_default: true },
        { id: 2, name: 'TVA 7%', rate: 7, is_default: true },
      ];
      mockPrisma.taxes.findMany.mockResolvedValue(taxes);

      const result = await service.getAllDefaultTaxes();

      expect(mockPrisma.taxes.findMany).toHaveBeenCalledWith({
        where: { is_default: true },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getBusinessTaxes', () => {
    it('should return taxes for a business', async () => {
      const business = { id: 1, name: 'Test Business' };
      const taxes = [
        { id: 1, name: 'TVA 19%', rate: 19, is_default: true },
        { id: 3, name: 'Custom Tax', rate: 5, business_id: 1 },
      ];
      mockPrisma.businesses.findUnique.mockResolvedValue(business);
      mockPrisma.taxes.findMany.mockResolvedValue(taxes);

      const result = await service.getBusinessTaxes(1);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException if business not found', async () => {
      mockPrisma.businesses.findUnique.mockResolvedValue(null);

      await expect(service.getBusinessTaxes(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTax', () => {
    it('should create a tax and return message + tax', async () => {
      const tax = { id: 1, name: 'TVA 19%', rate: 19, is_default: false };
      mockPrisma.taxes.create.mockResolvedValue(tax);

      const result = await service.createTax('TVA 19%', 19, 'Standard VAT', false, 1);

      expect(result.message).toBe('Tax created successfully');
      expect(result.tax).toEqual(tax);
    });
  });

  describe('updateTax', () => {
    it('should update a tax', async () => {
      const tax = { id: 1, name: 'TVA 19%', rate: 19 };
      const updated = { ...tax, name: 'TVA 20%', rate: 20 };
      mockPrisma.taxes.findUnique.mockResolvedValue(tax);
      mockPrisma.taxes.update.mockResolvedValue(updated);

      const result = await service.updateTax(1, 'TVA 20%', 20, 'Updated');

      expect(result.message).toBe('Tax updated successfully');
      expect(result.tax).toEqual(updated);
    });

    it('should throw NotFoundException if tax not found', async () => {
      mockPrisma.taxes.findUnique.mockResolvedValue(null);

      await expect(service.updateTax(99, 'X', 0, '')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTax', () => {
    it('should delete a tax and return message', async () => {
      const tax = { id: 1, name: 'TVA 19%' };
      mockPrisma.taxes.findUnique.mockResolvedValue(tax);
      mockPrisma.taxes.delete.mockResolvedValue(tax);

      const result = await service.deleteTax(1);
      expect(result.message).toBe('Tax deleted successfully');
    });

    it('should throw NotFoundException if tax not found', async () => {
      mockPrisma.taxes.findUnique.mockResolvedValue(null);

      await expect(service.deleteTax(99)).rejects.toThrow(NotFoundException);
    });
  });
});
