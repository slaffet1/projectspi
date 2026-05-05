
import { Test, TestingModule } from '@nestjs/testing';
import { TaxSettingsController } from './tax-settings.controller';
import { TaxSettingsService } from './tax-settings.service';

const mockTaxSettingsService = {
  getAllDefaultTaxes: jest.fn(),
  getBusinessTaxes: jest.fn(),
  createTax: jest.fn(),
  updateTax: jest.fn(),
  deleteTax: jest.fn(),
};

describe('TaxSettingsController', () => {
  let controller: TaxSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxSettingsController],
      providers: [
        {
          provide: TaxSettingsService,
          useValue: mockTaxSettingsService,
        },
      ],
    }).compile();

    controller = module.get<TaxSettingsController>(TaxSettingsController);
    jest.clearAllMocks();
  });

  // ───────── DEFAULT TAXES ─────────
  describe('getAllDefaultTaxes', () => {
    it('should return default taxes', async () => {
      const expected = [{ id: 1, name: 'VAT', rate: 19 }];

      mockTaxSettingsService.getAllDefaultTaxes.mockResolvedValue(expected);

      const result = await controller.getAllDefaultTaxes();

      expect(mockTaxSettingsService.getAllDefaultTaxes).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('should return empty array', async () => {
      mockTaxSettingsService.getAllDefaultTaxes.mockResolvedValue([]);

      const result = await controller.getAllDefaultTaxes();

      expect(result).toEqual([]);
    });
  });

  // ───────── BUSINESS TAXES ─────────
  describe('getBusinessTaxes', () => {
    it('should return business taxes', async () => {
      const expected = [{ id: 1, rate: 20 }];

      mockTaxSettingsService.getBusinessTaxes.mockResolvedValue(expected);

      const result = await controller.getBusinessTaxes('1');

      expect(mockTaxSettingsService.getBusinessTaxes).toHaveBeenCalledWith(
        1,
      );
      expect(result).toEqual(expected);
    });

    it('should convert id to number', async () => {
      mockTaxSettingsService.getBusinessTaxes.mockResolvedValue([]);

      await controller.getBusinessTaxes('99');

      expect(mockTaxSettingsService.getBusinessTaxes).toHaveBeenCalledWith(
        99,
      );
    });
  });

  // ───────── CREATE TAX ─────────
  describe('createTax', () => {
    it('should create tax with business_id', async () => {
      const body = {
        name: 'VAT',
        rate: 19,
        description: 'tax',
        is_default: true,
        business_id: 1,
      };

      const expected = { id: 1, ...body };

      mockTaxSettingsService.createTax.mockResolvedValue(expected);

      const result = await controller.createTax(body);

      expect(mockTaxSettingsService.createTax).toHaveBeenCalledWith(
        body.name,
        body.rate,
        body.description,
        body.is_default,
        body.business_id,
      );

      expect(result).toEqual(expected);
    });

    it('should handle missing business_id', async () => {
      const body = {
        name: 'VAT',
        rate: 10,
        description: 'desc',
        is_default: false,
      };

      mockTaxSettingsService.createTax.mockResolvedValue({ id: 2 });

      await controller.createTax(body);

      expect(mockTaxSettingsService.createTax).toHaveBeenCalledWith(
        body.name,
        body.rate,
        body.description,
        body.is_default,
        undefined,
      );
    });
  });

  // ───────── UPDATE TAX ─────────
  describe('updateTax', () => {
    it('should update tax', async () => {
      const body = {
        name: 'Updated VAT',
        rate: 18,
        description: 'updated desc',
      };

      const expected = { id: 1, ...body };

      mockTaxSettingsService.updateTax.mockResolvedValue(expected);

      const result = await controller.updateTax('1', body);

      expect(mockTaxSettingsService.updateTax).toHaveBeenCalledWith(
        1,
        body.name,
        body.rate,
        body.description,
      );

      expect(result).toEqual(expected);
    });

    it('should convert id to number', async () => {
      const body = {
        name: 'Test',
        rate: 5,
        description: 'desc',
      };

      mockTaxSettingsService.updateTax.mockResolvedValue({});

      await controller.updateTax('50', body);

      expect(mockTaxSettingsService.updateTax).toHaveBeenCalledWith(
        50,
        body.name,
        body.rate,
        body.description,
      );
    });
  });

  // ───────── DELETE TAX ─────────
  describe('deleteTax', () => {
    it('should delete tax', async () => {
      mockTaxSettingsService.deleteTax.mockResolvedValue({ success: true });

      const result = await controller.deleteTax('1');

      expect(mockTaxSettingsService.deleteTax).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });

    it('should convert id to number', async () => {
      mockTaxSettingsService.deleteTax.mockResolvedValue({});

      await controller.deleteTax('99');

      expect(mockTaxSettingsService.deleteTax).toHaveBeenCalledWith(99);
    });
  });
});
