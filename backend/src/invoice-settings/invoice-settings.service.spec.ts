import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceSettingsService } from './invoice-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  businesses: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('InvoiceSettingsService', () => {
  let service: InvoiceSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceSettingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InvoiceSettingsService>(InvoiceSettingsService);
    jest.clearAllMocks();
  });

  describe('getInvoiceSettings', () => {
    it('should return invoice settings for a business', async () => {
      const business = { id: 1, name: 'Test Co', invoice_prefix: 'INV-' };
      mockPrisma.businesses.findUnique.mockResolvedValue(business);

      const result = await service.getInvoiceSettings(1);

      expect(result).toEqual({
        business_id: 1,
        business_name: 'Test Co',
        invoice_prefix: 'INV-',
      });
    });

    it('should throw NotFoundException if business not found', async () => {
      mockPrisma.businesses.findUnique.mockResolvedValue(null);

      await expect(service.getInvoiceSettings(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateInvoiceSettings', () => {
    it('should update invoice prefix and return updated settings', async () => {
      const business = { id: 1, name: 'Test Co', invoice_prefix: 'INV-' };
      const updated = { id: 1, name: 'Test Co', invoice_prefix: 'FACT-' };
      mockPrisma.businesses.findUnique.mockResolvedValue(business);
      mockPrisma.businesses.update.mockResolvedValue(updated);

      const result = await service.updateInvoiceSettings(1, 'FACT-');

      expect(result.message).toBe('Invoice settings updated successfully');
      expect(result.invoice_prefix).toBe('FACT-');
    });

    it('should throw NotFoundException if business not found', async () => {
      mockPrisma.businesses.findUnique.mockResolvedValue(null);

      await expect(service.updateInvoiceSettings(99, 'FACT-')).rejects.toThrow(NotFoundException);
    });
  });
});
