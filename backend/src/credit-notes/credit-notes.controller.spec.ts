import { Test, TestingModule } from '@nestjs/testing';
import { CreditNotesController } from './credit-notes.controller';
import { CreditNotesService } from './credit-notes.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermission } from 'src/permissions/permissions/permissions.guard';

const mockCreditNotesService = {
  getAll: jest.fn(),
  searchInvoices: jest.fn(),
  searchDeliveryNotes: jest.fn(),
  getOne: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};

const BUSINESS_ID = 1;

describe('CreditNotesController', () => {
  let controller: CreditNotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditNotesController],
      providers: [
        { provide: CreditNotesService, useValue: mockCreditNotesService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RequirePermission)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CreditNotesController>(CreditNotesController);
    jest.clearAllMocks();
  });

  // ── getAll ──────────────────────────────────────────────────────
  describe('getAll', () => {
    it('should call service.getAll with businessId', async () => {
      const creditNotes = [
        { id: 1, business_id: BUSINESS_ID, amount: 500 },
        { id: 2, business_id: BUSINESS_ID, amount: 300 },
      ];

      mockCreditNotesService.getAll.mockResolvedValue(creditNotes);

      const result = await controller.getAll(BUSINESS_ID);

      expect(mockCreditNotesService.getAll).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(creditNotes);
    });

    it('should return empty array when no credit notes exist', async () => {
      mockCreditNotesService.getAll.mockResolvedValue([]);

      const result = await controller.getAll(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ── searchInvoices ──────────────────────────────────────────────
  describe('searchInvoices', () => {
    it('should call service.searchInvoices with businessId and query', async () => {
      const invoices = [{ id: 1, number: 'INV-001', business_id: BUSINESS_ID }];

      mockCreditNotesService.searchInvoices.mockResolvedValue(invoices);

      const result = await controller.searchInvoices(BUSINESS_ID, 'INV');

      expect(mockCreditNotesService.searchInvoices).toHaveBeenCalledWith(BUSINESS_ID, 'INV');
      expect(result).toEqual(invoices);
    });

    it('should use empty string as default query', async () => {
      mockCreditNotesService.searchInvoices.mockResolvedValue([]);

      const result = await controller.searchInvoices(BUSINESS_ID, '');

      expect(mockCreditNotesService.searchInvoices).toHaveBeenCalledWith(BUSINESS_ID, '');
      expect(result).toEqual([]);
    });

    it('should return empty array if no invoices match', async () => {
      mockCreditNotesService.searchInvoices.mockResolvedValue([]);

      const result = await controller.searchInvoices(BUSINESS_ID, 'xyz');

      expect(result).toEqual([]);
    });
  });

  // ── searchDeliveryNotes ─────────────────────────────────────────
  describe('searchDeliveryNotes', () => {
    it('should call service.searchDeliveryNotes with businessId and query', async () => {
      const deliveryNotes = [{ id: 1, number: 'DN-001', business_id: BUSINESS_ID }];

      mockCreditNotesService.searchDeliveryNotes.mockResolvedValue(deliveryNotes);

      const result = await controller.searchDeliveryNotes(BUSINESS_ID, 'DN');

      expect(mockCreditNotesService.searchDeliveryNotes).toHaveBeenCalledWith(BUSINESS_ID, 'DN');
      expect(result).toEqual(deliveryNotes);
    });

    it('should use empty string as default query', async () => {
      mockCreditNotesService.searchDeliveryNotes.mockResolvedValue([]);

      const result = await controller.searchDeliveryNotes(BUSINESS_ID, '');

      expect(mockCreditNotesService.searchDeliveryNotes).toHaveBeenCalledWith(BUSINESS_ID, '');
      expect(result).toEqual([]);
    });

    it('should return empty array if no delivery notes match', async () => {
      mockCreditNotesService.searchDeliveryNotes.mockResolvedValue([]);

      const result = await controller.searchDeliveryNotes(BUSINESS_ID, 'xyz');

      expect(result).toEqual([]);
    });
  });

  // ── getOne ──────────────────────────────────────────────────────
  describe('getOne', () => {
    it('should call service.getOne with businessId and id', async () => {
      const creditNote = { id: 1, business_id: BUSINESS_ID, amount: 500 };

      mockCreditNotesService.getOne.mockResolvedValue(creditNote);

      const result = await controller.getOne(BUSINESS_ID, 1);

      expect(mockCreditNotesService.getOne).toHaveBeenCalledWith(BUSINESS_ID, 1);
      expect(result).toEqual(creditNote);
    });

    it('should propagate errors if credit note not found', async () => {
      mockCreditNotesService.getOne.mockRejectedValue(new Error('Credit note not found'));

      await expect(
        controller.getOne(BUSINESS_ID, 999),
      ).rejects.toThrow('Credit note not found');
    });
  });

  // ── create ──────────────────────────────────────────────────────
  describe('create', () => {
    it('should call service.create with businessId and dto', async () => {
      const dto = {
        invoice_id: 1,
        reason: 'Retour produit',
        amount: 200,
      };
      const expected = { id: 1, business_id: BUSINESS_ID, ...dto };

      mockCreditNotesService.create.mockResolvedValue(expected);

      const result = await controller.create(BUSINESS_ID, dto as any);

      expect(mockCreditNotesService.create).toHaveBeenCalledWith(BUSINESS_ID, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors thrown by the service', async () => {
      mockCreditNotesService.create.mockRejectedValue(new Error('Invoice not found'));

      await expect(
        controller.create(BUSINESS_ID, { invoice_id: 999 } as any),
      ).rejects.toThrow('Invoice not found');
    });
  });

  // ── remove ──────────────────────────────────────────────────────
  describe('remove', () => {
    it('should call service.remove with businessId and id', async () => {
      mockCreditNotesService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(BUSINESS_ID, 1);

      expect(mockCreditNotesService.remove).toHaveBeenCalledWith(BUSINESS_ID, 1);
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors if credit note not found', async () => {
      mockCreditNotesService.remove.mockRejectedValue(new Error('Credit note not found'));

      await expect(
        controller.remove(BUSINESS_ID, 999),
      ).rejects.toThrow('Credit note not found');
    });
  });
});