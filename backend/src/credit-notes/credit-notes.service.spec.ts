import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreditNotesService } from './credit-notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStatus } from '@prisma/client';

// ── Helpers ────────────────────────────────────────────────────────────────
const makeClient = (overrides: Partial<any> = {}) => ({
  id: 1, name: 'Client A', email: 'a@a.com', ...overrides,
});

const makeCreditNote = (overrides: Partial<any> = {}) => ({
  id: 1,
  credit_number: 'CN-2025-0001',
  status: 'DRAFT',
  total_amount: 500,
  business_id: 1,
  invoice_id: null,
  delivery_note_id: null,
  reason: 'Return',
  note: null,
  return_date: new Date(),
  created_at: new Date(),
  clients: makeClient(),
  credit_note_items: [],
  invoices: null,
  delivery_notes: null,
  ...overrides,
});

const makeInvoice = (overrides: Partial<any> = {}) => ({
  id: 10,
  invoice_number: 'INV-001',
  status: 'paid',
  issue_date: new Date(),
  total_amount: 1000,
  quotes: {
    clients: makeClient(),
    quote_details: [
      { product_id: 1, quantity: 5, unit_price: 100 },
    ],
  },
  ...overrides,
});

const makeDeliveryNote = (overrides: Partial<any> = {}) => ({
  id: 20,
  delivery_number: 'DN-001',
  status: DeliveryStatus.DELIVERED,
  delivery_date: new Date(),
  quotes: {
    clients: makeClient(),
    quote_details: [
      {
        product_id: 1,
        quantity: 3,
        unit_price: 50,
        products: { unit_price: 50 },
      },
    ],
  },
  ...overrides,
});

const makeItem = (overrides: Partial<any> = {}) => ({
  product_id: 1,
  quantity: 2,
  unit_price: 100,
  ...overrides,
});

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockTx = {
  credit_notes:    { create: jest.fn() },
  mouvements:      { create: jest.fn() },
  inventaires:     { updateMany: jest.fn() },
  warehouse_products: { updateMany: jest.fn() },
};

const mockPrisma = {
  credit_notes: {
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    count:     jest.fn(),
    update:    jest.fn(),
  },
  invoices:       { findMany: jest.fn(), findFirst: jest.fn() },
  delivery_notes: { findMany: jest.fn(), findFirst: jest.fn() },
  $transaction: jest.fn(),
};

// ══════════════════════════════════════════════════════════════════════════
describe('CreditNotesService', () => {
  let service: CreditNotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditNotesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CreditNotesService>(CreditNotesService);
    jest.clearAllMocks();

    // Default $transaction executes callback with mockTx
    mockPrisma.$transaction.mockImplementation((cb: (tx: any) => any) => cb(mockTx));
    mockTx.credit_notes.create.mockResolvedValue(makeCreditNote());
    mockTx.mouvements.create.mockResolvedValue({});
    mockTx.inventaires.updateMany.mockResolvedValue({ count: 1 });
    mockTx.warehouse_products.updateMany.mockResolvedValue({ count: 1 });
  });

  // ── getAll ───────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('should return all credit notes for a business', async () => {
      const notes = [makeCreditNote(), makeCreditNote({ id: 2 })];
      mockPrisma.credit_notes.findMany.mockResolvedValue(notes);

      const result = await service.getAll(1);

      expect(mockPrisma.credit_notes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { business_id: 1 }, orderBy: { created_at: 'desc' } }),
      );
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when no credit notes exist', async () => {
      mockPrisma.credit_notes.findMany.mockResolvedValue([]);
      const result = await service.getAll(99);
      expect(result).toEqual([]);
    });

    it('should include clients, invoices, delivery_notes and items', async () => {
      mockPrisma.credit_notes.findMany.mockResolvedValue([]);
      await service.getAll(1);
      expect(mockPrisma.credit_notes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            clients: true,
            credit_note_items: expect.anything(),
          }),
        }),
      );
    });
  });

  // ── getOne ───────────────────────────────────────────────────────────────
  describe('getOne', () => {
    it('should return the credit note when found', async () => {
      const note = makeCreditNote();
      mockPrisma.credit_notes.findFirst.mockResolvedValue(note);

      const result = await service.getOne(1, 1);

      expect(mockPrisma.credit_notes.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1, business_id: 1 } }),
      );
      expect(result).toEqual(note);
    });

    it('should throw NotFoundException when credit note does not exist', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      await expect(service.getOne(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when credit note belongs to a different business', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      await expect(service.getOne(2, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // ── searchInvoices ───────────────────────────────────────────────────────
  describe('searchInvoices', () => {
    it('should return matching paid invoices excluding already credited ones', async () => {
      mockPrisma.credit_notes.findMany.mockResolvedValue([{ invoice_id: 5 }]);
      mockPrisma.invoices.findMany.mockResolvedValue([makeInvoice()]);

      const result = await service.searchInvoices(1, 'INV');

      expect(mockPrisma.credit_notes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ business_id: 1, invoice_id: { not: null } }),
        }),
      );
      expect(mockPrisma.invoices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'paid',
            invoice_number: { contains: 'INV', mode: 'insensitive' },
            id: { notIn: [5] },
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should use [-1] as notIn fallback when no credited invoices exist', async () => {
      mockPrisma.credit_notes.findMany.mockResolvedValue([]);
      mockPrisma.invoices.findMany.mockResolvedValue([]);

      await service.searchInvoices(1, 'INV');

      expect(mockPrisma.invoices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { notIn: [-1] } }),
        }),
      );
    });

    it('should limit results to 10', async () => {
      mockPrisma.credit_notes.findMany.mockResolvedValue([]);
      mockPrisma.invoices.findMany.mockResolvedValue([]);

      await service.searchInvoices(1, '');

      expect(mockPrisma.invoices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  // ── searchDeliveryNotes ──────────────────────────────────────────────────
  describe('searchDeliveryNotes', () => {
    it('should return matching delivered delivery notes excluding already credited ones', async () => {
      // First call: credited delivery note IDs
      // Second call: credited invoice IDs
      mockPrisma.credit_notes.findMany
        .mockResolvedValueOnce([{ delivery_note_id: 20 }])
        .mockResolvedValueOnce([]);

      mockPrisma.delivery_notes.findMany.mockResolvedValue([makeDeliveryNote()]);

      const result = await service.searchDeliveryNotes(1, 'DN');

      expect(result).toHaveLength(1);
      expect(mockPrisma.delivery_notes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DeliveryStatus.DELIVERED,
            delivery_number: { contains: 'DN', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should also exclude delivery notes linked to credited invoices', async () => {
      mockPrisma.credit_notes.findMany
        .mockResolvedValueOnce([])               // no directly credited DNs
        .mockResolvedValueOnce([{ invoice_id: 10 }]); // one credited invoice

      // Delivery note linked to that invoice
      mockPrisma.delivery_notes.findMany
        .mockResolvedValueOnce([{ id: 20 }])     // lookup by invoice
        .mockResolvedValueOnce([]);              // final search returns none

      await service.searchDeliveryNotes(1, 'DN');

      const finalCall = mockPrisma.delivery_notes.findMany.mock.calls[1][0];
      expect(finalCall.where.id.notIn).toContain(20);
    });

    it('should use [-1] as notIn fallback when nothing is excluded', async () => {
      mockPrisma.credit_notes.findMany.mockResolvedValue([]);
      mockPrisma.delivery_notes.findMany.mockResolvedValue([]);

      await service.searchDeliveryNotes(1, 'DN');

      const finalCall = mockPrisma.delivery_notes.findMany.mock.calls[0][0];
      expect(finalCall.where.id.notIn).toEqual([-1]);
    });

    it('should limit results to 10', async () => {
      mockPrisma.credit_notes.findMany.mockResolvedValue([]);
      mockPrisma.delivery_notes.findMany.mockResolvedValue([]);

      await service.searchDeliveryNotes(1, '');

      const finalCall = mockPrisma.delivery_notes.findMany.mock.calls[0][0];
      expect(finalCall.take).toBe(10);
    });
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create', () => {

    // ── validation guards ──────────────────────────────────────────────────
    it('should throw BadRequestException when neither invoice_id nor delivery_note_id is provided', async () => {
      await expect(
        service.create(1, { return_date: '2025-01-01', reason: 'Test', items: [] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when both invoice_id and delivery_note_id are provided', async () => {
      await expect(
        service.create(1, { invoice_id: 1, delivery_note_id: 2, return_date: '2025-01-01', reason: 'Test', items: [] } as any),
      ).rejects.toThrow(BadRequestException);
    });

    // ── from invoice ───────────────────────────────────────────────────────
    it('should throw BadRequestException when creating from invoice without items', async () => {
      await expect(
        service.create(1, { invoice_id: 10, return_date: '2025-01-01', reason: 'Test', items: [] } as any),
      ).rejects.toThrow('Must provide items when creating from an invoice');
    });

    it('should throw BadRequestException when invoice already has a credit note', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(makeCreditNote({ invoice_id: 10 }));

      await expect(
        service.create(1, { invoice_id: 10, return_date: '2025-01-01', reason: 'Test', items: [makeItem()] } as any),
      ).rejects.toThrow('This invoice already has a credit note');
    });

    it('should throw NotFoundException when invoice is not found', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.invoices.findFirst.mockResolvedValue(null);

      await expect(
        service.create(1, { invoice_id: 999, return_date: '2025-01-01', reason: 'Test', items: [makeItem()] } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when item product is not in the invoice', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.invoices.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.credit_notes.count.mockResolvedValue(0);

      await expect(
        service.create(1, {
          invoice_id: 10,
          return_date: '2025-01-01',
          reason: 'Test',
          items: [makeItem({ product_id: 999 })], // product not in invoice
        } as any),
      ).rejects.toThrow(`Product #999 not found in invoice`);
    });

    it('should throw BadRequestException when return quantity exceeds sold quantity', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.invoices.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.credit_notes.count.mockResolvedValue(0);

      await expect(
        service.create(1, {
          invoice_id: 10,
          return_date: '2025-01-01',
          reason: 'Test',
          items: [makeItem({ product_id: 1, quantity: 999 })],
        } as any),
      ).rejects.toThrow('Cannot return more than sold quantity');
    });

    it('should create a credit note from invoice and run stock movements in transaction', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.invoices.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.credit_notes.count.mockResolvedValue(0);

      const result = await service.create(1, {
        invoice_id: 10,
        return_date: '2025-01-01',
        reason: 'Return',
        items: [makeItem({ product_id: 1, quantity: 2, unit_price: 100 })],
      } as any);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.credit_notes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoice_id: 10,
            business_id: 1,
            status: 'DRAFT',
            total_amount: 200,
          }),
        }),
      );
      expect(mockTx.mouvements.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'IN', quantity: 2 }) }),
      );
      expect(mockTx.inventaires.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { product_id: 1 },
          data: expect.objectContaining({ quantity_available: { increment: 2 } }),
        }),
      );
      expect(mockTx.warehouse_products.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: { increment: 2 } }),
        }),
      );
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        status: 'DRAFT',
        total_amount: 500,
        business_id: 1,
        credit_number: 'CN-2025-0001',
        reason: 'Return',
      }));
    });

    it('should generate correct credit number from count', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.invoices.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.credit_notes.count.mockResolvedValue(3);

      await service.create(1, {
        invoice_id: 10,
        return_date: '2025-01-01',
        reason: 'Return',
        items: [makeItem()],
      } as any);

      const year = new Date().getFullYear();
      expect(mockTx.credit_notes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ credit_number: `CN-${year}-0004` }),
        }),
      );
    });

    // ── from delivery note ─────────────────────────────────────────────────
    it('should throw BadRequestException when delivery note already has a credit note', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(makeCreditNote({ delivery_note_id: 20 }));

      await expect(
        service.create(1, { delivery_note_id: 20, return_date: '2025-01-01', reason: 'Test' } as any),
      ).rejects.toThrow('This delivery note already has a credit note');
    });

    it('should throw NotFoundException when delivery note is not found', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.delivery_notes.findFirst.mockResolvedValue(null);

      await expect(
        service.create(1, { delivery_note_id: 999, return_date: '2025-01-01', reason: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a credit note from delivery note and run stock movements', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.delivery_notes.findFirst.mockResolvedValue(makeDeliveryNote());
      mockPrisma.credit_notes.count.mockResolvedValue(0);

      const result = await service.create(1, {
        delivery_note_id: 20,
        return_date: '2025-01-01',
        reason: 'Return',
      } as any);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.credit_notes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            delivery_note_id: 20,
            business_id: 1,
            status: 'DRAFT',
          }),
        }),
      );
      expect(mockTx.mouvements.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'IN' }) }),
      );
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        status: 'DRAFT',
        total_amount: 500,
        business_id: 1,
        credit_number: 'CN-2025-0001',
        reason: 'Return',
      }));
    });

    it('should compute total amount from delivery note quote_details', async () => {
      const dn = makeDeliveryNote({
        quotes: {
          clients: makeClient(),
          quote_details: [
            { product_id: 1, quantity: 4, products: { unit_price: 25 } },
            { product_id: 2, quantity: 2, products: { unit_price: 50 } },
          ],
        },
      });

      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.delivery_notes.findFirst.mockResolvedValue(dn);
      mockPrisma.credit_notes.count.mockResolvedValue(0);

      await service.create(1, {
        delivery_note_id: 20,
        return_date: '2025-01-01',
        reason: 'Return',
      } as any);

      // 4*25 + 2*50 = 200
      expect(mockTx.credit_notes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ total_amount: 200 }),
        }),
      );
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should set status to CANCELLED and return the updated record', async () => {
      const note = makeCreditNote();
      mockPrisma.credit_notes.findFirst.mockResolvedValue(note);
      mockPrisma.credit_notes.update.mockResolvedValue({ ...note, status: 'CANCELLED' });

      const result = await service.remove(1, 1);

      expect(mockPrisma.credit_notes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'CANCELLED' },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw NotFoundException when credit note does not exist', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.credit_notes.update).not.toHaveBeenCalled();
    });

    it('should not call update when getOne throws', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      await service.remove(1, 1).catch(() => {});
      expect(mockPrisma.credit_notes.update).not.toHaveBeenCalled();
    });
  });

  // ── generateCreditNumber (via create) ────────────────────────────────────
  describe('generateCreditNumber', () => {
    it('should pad sequence number to 4 digits', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.invoices.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.credit_notes.count.mockResolvedValue(0);

      await service.create(1, {
        invoice_id: 10,
        return_date: '2025-01-01',
        reason: 'Test',
        items: [makeItem()],
      } as any);

      const year = new Date().getFullYear();
      expect(mockTx.credit_notes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ credit_number: `CN-${year}-0001` }),
        }),
      );
    });

    it('should increment sequence based on existing count', async () => {
      mockPrisma.credit_notes.findFirst.mockResolvedValue(null);
      mockPrisma.invoices.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.credit_notes.count.mockResolvedValue(11);

      await service.create(1, {
        invoice_id: 10,
        return_date: '2025-01-01',
        reason: 'Test',
        items: [makeItem()],
      } as any);

      const year = new Date().getFullYear();
      expect(mockTx.credit_notes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ credit_number: `CN-${year}-0012` }),
        }),
      );
    });
  });
});