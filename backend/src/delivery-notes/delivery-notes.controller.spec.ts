import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryNotesController } from './delivery-notes.controller';
import { DeliveryNotesService } from './delivery-notes.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermission } from 'src/permissions/permissions/permissions.guard';

// Défini localement car votre schema Prisma a exactement ces 3 valeurs
enum DeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

const mockDeliveryNotesService = {
  getAll: jest.fn(),
  getQuotesNotInvoiced: jest.fn(),
  getInvoicesWithoutDeliveryNote: jest.fn(),
  getOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  changeStatus: jest.fn(),
  delete: jest.fn(),
};

const BUSINESS_ID = 1;

describe('DeliveryNotesController', () => {
  let controller: DeliveryNotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryNotesController],
      providers: [
        { provide: DeliveryNotesService, useValue: mockDeliveryNotesService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RequirePermission)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DeliveryNotesController>(DeliveryNotesController);
    jest.clearAllMocks();
  });

  // ── getAll ──────────────────────────────────────────────────────
  describe('getAll', () => {
    it('should call service.getAll with businessId', async () => {
      const deliveryNotes = [
        { id: 1, business_id: BUSINESS_ID, status: DeliveryStatus.PENDING },
        { id: 2, business_id: BUSINESS_ID, status: DeliveryStatus.DELIVERED },
      ];

      mockDeliveryNotesService.getAll.mockResolvedValue(deliveryNotes);

      const result = await controller.getAll(BUSINESS_ID);

      expect(mockDeliveryNotesService.getAll).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(deliveryNotes);
    });

    it('should return empty array when no delivery notes exist', async () => {
      mockDeliveryNotesService.getAll.mockResolvedValue([]);

      const result = await controller.getAll(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ── getQuotesNotInvoiced ─────────────────────────────────────────
  describe('getQuotesNotInvoiced', () => {
    it('should call service.getQuotesNotInvoiced with businessId', async () => {
      const quotes = [
        { id: 1, business_id: BUSINESS_ID, invoiced: false },
        { id: 2, business_id: BUSINESS_ID, invoiced: false },
      ];

      mockDeliveryNotesService.getQuotesNotInvoiced.mockResolvedValue(quotes);

      const result = await controller.getQuotesNotInvoiced(BUSINESS_ID);

      expect(mockDeliveryNotesService.getQuotesNotInvoiced).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(quotes);
    });

    it('should return empty array when all quotes are invoiced', async () => {
      mockDeliveryNotesService.getQuotesNotInvoiced.mockResolvedValue([]);

      const result = await controller.getQuotesNotInvoiced(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ── getInvoicesWithoutDeliveryNote ──────────────────────────────
  describe('getInvoicesWithoutDeliveryNote', () => {
    it('should call service.getInvoicesWithoutDeliveryNote with businessId', async () => {
      const invoices = [
        { id: 1, business_id: BUSINESS_ID, delivery_note_id: null },
        { id: 2, business_id: BUSINESS_ID, delivery_note_id: null },
      ];

      mockDeliveryNotesService.getInvoicesWithoutDeliveryNote.mockResolvedValue(invoices);

      const result = await controller.getInvoicesWithoutDeliveryNote(BUSINESS_ID);

      expect(mockDeliveryNotesService.getInvoicesWithoutDeliveryNote).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(invoices);
    });

    it('should return empty array when all invoices have delivery notes', async () => {
      mockDeliveryNotesService.getInvoicesWithoutDeliveryNote.mockResolvedValue([]);

      const result = await controller.getInvoicesWithoutDeliveryNote(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ── getOne ──────────────────────────────────────────────────────
  describe('getOne', () => {
    it('should call service.getOne with businessId and id', async () => {
      const deliveryNote = { id: 1, business_id: BUSINESS_ID, status: DeliveryStatus.PENDING };

      mockDeliveryNotesService.getOne.mockResolvedValue(deliveryNote);

      const result = await controller.getOne(BUSINESS_ID, 1);

      expect(mockDeliveryNotesService.getOne).toHaveBeenCalledWith(BUSINESS_ID, 1);
      expect(result).toEqual(deliveryNote);
    });

    it('should propagate errors if delivery note not found', async () => {
      mockDeliveryNotesService.getOne.mockRejectedValue(new Error('Delivery note not found'));

      await expect(
        controller.getOne(BUSINESS_ID, 999),
      ).rejects.toThrow('Delivery note not found');
    });
  });

  // ── create ──────────────────────────────────────────────────────
  describe('create', () => {
    it('should call service.create with businessId and dto', async () => {
      const dto = {
        quote_id: 1,
        client_id: 2,
        items: [{ product_id: 1, quantity: 5 }],
      };
      const expected = { id: 1, business_id: BUSINESS_ID, ...dto };

      mockDeliveryNotesService.create.mockResolvedValue(expected);

      const result = await controller.create(BUSINESS_ID, dto as any);

      expect(mockDeliveryNotesService.create).toHaveBeenCalledWith(BUSINESS_ID, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors thrown by the service', async () => {
      mockDeliveryNotesService.create.mockRejectedValue(new Error('Quote not found'));

      await expect(
        controller.create(BUSINESS_ID, { quote_id: 999 } as any),
      ).rejects.toThrow('Quote not found');
    });
  });

  // ── update ──────────────────────────────────────────────────────
  describe('update', () => {
    it('should call service.update with businessId, id and dto', async () => {
      const dto = { items: [{ product_id: 1, quantity: 10 }] };
      const expected = { id: 1, business_id: BUSINESS_ID, ...dto };

      mockDeliveryNotesService.update.mockResolvedValue(expected);

      const result = await controller.update(BUSINESS_ID, 1, dto as any);

      expect(mockDeliveryNotesService.update).toHaveBeenCalledWith(BUSINESS_ID, 1, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors if delivery note not found', async () => {
      mockDeliveryNotesService.update.mockRejectedValue(new Error('Delivery note not found'));

      await expect(
        controller.update(BUSINESS_ID, 999, {} as any),
      ).rejects.toThrow('Delivery note not found');
    });
  });

  // ── changeStatus ─────────────────────────────────────────────────
  describe('changeStatus', () => {
    it('should call service.changeStatus with PENDING status', async () => {
      const expected = { id: 1, business_id: BUSINESS_ID, status: DeliveryStatus.PENDING };
      mockDeliveryNotesService.changeStatus.mockResolvedValue(expected);

      const result = await controller.changeStatus(BUSINESS_ID, 1, DeliveryStatus.PENDING);

      expect(mockDeliveryNotesService.changeStatus).toHaveBeenCalledWith(
        BUSINESS_ID, 1, DeliveryStatus.PENDING,
      );
      expect(result).toEqual(expected);
    });

    it('should call service.changeStatus with DELIVERED status', async () => {
      const expected = { id: 1, business_id: BUSINESS_ID, status: DeliveryStatus.DELIVERED };
      mockDeliveryNotesService.changeStatus.mockResolvedValue(expected);

      const result = await controller.changeStatus(BUSINESS_ID, 1, DeliveryStatus.DELIVERED);

      expect(mockDeliveryNotesService.changeStatus).toHaveBeenCalledWith(
        BUSINESS_ID, 1, DeliveryStatus.DELIVERED,
      );
      expect(result).toEqual(expected);
    });

    it('should call service.changeStatus with CANCELLED status', async () => {
      const expected = { id: 1, business_id: BUSINESS_ID, status: DeliveryStatus.CANCELLED };
      mockDeliveryNotesService.changeStatus.mockResolvedValue(expected);

      const result = await controller.changeStatus(BUSINESS_ID, 1, DeliveryStatus.CANCELLED);

      expect(mockDeliveryNotesService.changeStatus).toHaveBeenCalledWith(
        BUSINESS_ID, 1, DeliveryStatus.CANCELLED,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate errors if delivery note not found', async () => {
      mockDeliveryNotesService.changeStatus.mockRejectedValue(
        new Error('Delivery note not found'),
      );

      await expect(
        controller.changeStatus(BUSINESS_ID, 999, DeliveryStatus.DELIVERED),
      ).rejects.toThrow('Delivery note not found');
    });
  });

  // ── delete ──────────────────────────────────────────────────────
  describe('delete', () => {
    it('should call service.delete with businessId and id', async () => {
      mockDeliveryNotesService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete(BUSINESS_ID, 1);

      expect(mockDeliveryNotesService.delete).toHaveBeenCalledWith(BUSINESS_ID, 1);
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors if delivery note not found', async () => {
      mockDeliveryNotesService.delete.mockRejectedValue(new Error('Delivery note not found'));

      await expect(
        controller.delete(BUSINESS_ID, 999),
      ).rejects.toThrow('Delivery note not found');
    });
  });
});