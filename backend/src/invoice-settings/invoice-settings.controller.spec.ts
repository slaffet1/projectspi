
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceSettingsController } from './invoice-settings.controller';
import { InvoiceSettingsService } from './invoice-settings.service';

const mockInvoiceSettingsService = {
  getInvoiceSettings: jest.fn(),
  updateInvoiceSettings: jest.fn(),
};

describe('InvoiceSettingsController', () => {
  let controller: InvoiceSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceSettingsController],
      providers: [
        {
          provide: InvoiceSettingsService,
          useValue: mockInvoiceSettingsService,
        },
      ],
    }).compile();

    controller = module.get<InvoiceSettingsController>(InvoiceSettingsController);
    jest.clearAllMocks();
  });

  // ── GET invoice settings ─────────────────────────────────────
  describe('getInvoiceSettings', () => {
    it('should call service with numeric id', async () => {
      const expected = { invoice_prefix: 'INV-' };

      mockInvoiceSettingsService.getInvoiceSettings.mockResolvedValue(expected);

      const result = await controller.getInvoiceSettings('1');

      expect(mockInvoiceSettingsService.getInvoiceSettings).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });

    it('should propagate errors from service', async () => {
      mockInvoiceSettingsService.getInvoiceSettings.mockRejectedValue(
        new Error('Settings not found'),
      );

      await expect(
        controller.getInvoiceSettings('999'),
      ).rejects.toThrow('Settings not found');
    });
  });

  // ── UPDATE invoice settings ─────────────────────────────────
  describe('updateInvoiceSettings', () => {
    it('should call service with id and prefix', async () => {
      const body = { invoice_prefix: 'FACT-' };
      const expected = { success: true, invoice_prefix: 'FACT-' };

      mockInvoiceSettingsService.updateInvoiceSettings.mockResolvedValue(expected);

      const result = await controller.updateInvoiceSettings('1', body);

      expect(mockInvoiceSettingsService.updateInvoiceSettings).toHaveBeenCalledWith(
        1,
        'FACT-',
      );
      expect(result).toEqual(expected);
    });

    it('should propagate errors from service', async () => {
      const body = { invoice_prefix: 'ERR-' };

      mockInvoiceSettingsService.updateInvoiceSettings.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateInvoiceSettings('1', body),
      ).rejects.toThrow('Update failed');
    });

    it('should pass undefined if invoice_prefix is missing', async () => {
      const body = {} as any;

      mockInvoiceSettingsService.updateInvoiceSettings.mockResolvedValue({});

      await controller.updateInvoiceSettings('1', body);

      expect(mockInvoiceSettingsService.updateInvoiceSettings).toHaveBeenCalledWith(
        1,
        undefined,
      );
    });
  });
});