import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoice.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  quotes: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  businesses: {
    findUnique: jest.fn(),
  },
  invoices: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  banks: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  payment_traces: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  purchase_orders_client: {
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { quote_id: 1, issue_date: '2024-01-01', due_date: '2024-02-01', bank_id: null, total: 1000 };
    const quote = {
      id: 1,
      quote_details: [{ products: { unit_price: 100, tax_rate: 20 }, quantity: 5 }],
      clients: { id: 1 },
    };

    it('should create an invoice from a quote', async () => {
      mockPrisma.quotes.findUnique.mockResolvedValue(quote);
      mockPrisma.businesses.findUnique.mockResolvedValue({ invoice_prefix: 'INV' });
      mockPrisma.invoices.count.mockResolvedValue(0);
      const createdInvoice = { id: 1, invoice_number: 'INV-2024-001' };
      mockPrisma.$transaction.mockResolvedValue([createdInvoice]);

      const result = await service.create(1, dto);
      expect(result).toEqual(createdInvoice);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if quote not found', async () => {
      mockPrisma.quotes.findUnique.mockResolvedValue(null);

      await expect(service.create(1, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all invoices for a business', async () => {
      const invoices = [{ id: 1 }, { id: 2 }];
      mockPrisma.invoices.findMany.mockResolvedValue(invoices);

      const result = await service.findAll(1);
      expect(result).toEqual(invoices);
      expect(mockPrisma.invoices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.any(Object) }),
      );
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the invoice', async () => {
      const invoice = { id: 1, invoice_number: 'INV-2024-001' };
      mockPrisma.invoices.findUnique.mockResolvedValue(invoice);

      const result = await service.findOne(1, 1);
      expect(result).toEqual(invoice);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockPrisma.invoices.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should update the invoice status', async () => {
      const invoice = { id: 1, status: 'sent', bank_id: null, total_amount: 500 };
      mockPrisma.invoices.findUnique.mockResolvedValue(invoice);
      mockPrisma.invoices.update.mockResolvedValue({ ...invoice, status: 'paid' });

      const result = await service.updateStatus(1, 'paid');
      expect(result.status).toBe('paid');
    });

    it('should throw if invoice not found', async () => {
      mockPrisma.invoices.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(99, 'paid')).rejects.toThrow(NotFoundException);
    });

    it('should throw if invoice is already paid', async () => {
      mockPrisma.invoices.findUnique.mockResolvedValue({ id: 1, status: 'paid', bank_id: null });

      await expect(service.updateStatus(1, 'paid')).rejects.toThrow('Facture déjà payée');
    });

    it('should increment bank balance when marking as paid with bank_id', async () => {
      const invoice = { id: 1, status: 'sent', bank_id: 5, total_amount: 1000 };
      mockPrisma.invoices.findUnique.mockResolvedValue(invoice);
      mockPrisma.invoices.update.mockResolvedValue({ ...invoice, status: 'paid' });
      mockPrisma.banks.update.mockResolvedValue({});

      await service.updateStatus(1, 'paid');
      expect(mockPrisma.banks.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 5 }, data: { balance: { increment: 1000 } } }),
      );
    });
  });

  // ─── deleteInvoice ────────────────────────────────────────────────────────

  describe('deleteInvoice', () => {
    it('should delete invoice and reset purchase order status to draft', async () => {
      const invoice = { id: 1, purchase_order_id: 10, quote_id: null };
      mockPrisma.invoices.findUnique.mockResolvedValue(invoice);
      mockPrisma.purchase_orders_client.update.mockResolvedValue({});
      mockPrisma.invoices.delete.mockResolvedValue(invoice);

      await service.deleteInvoice(1);
      expect(mockPrisma.purchase_orders_client.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'draft' } }),
      );
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockPrisma.invoices.findUnique.mockResolvedValue(null);

      await expect(service.deleteInvoice(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateDueDate ────────────────────────────────────────────────────────

  describe('updateDueDate', () => {
    it('should update due_date and reset status if unpaid', async () => {
      mockPrisma.invoices.findUnique.mockResolvedValue({ id: 1, status: 'unpaid' });
      mockPrisma.invoices.update.mockResolvedValue({ id: 1, status: 'draft' });

      await service.updateDueDate(1, '2025-06-01');
      expect(mockPrisma.invoices.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'draft' }) }),
      );
    });

    it('should throw if no due date provided', async () => {
      await expect(service.updateDueDate(1, '')).rejects.toThrow("La date d'échéance est obligatoire");
    });

    it('should throw if date is invalid', async () => {
      await expect(service.updateDueDate(1, 'not-a-date')).rejects.toThrow('Date invalide');
    });
  });

  // ─── getPaymentTrace ──────────────────────────────────────────────────────

  describe('getPaymentTrace', () => {
    it('should return the trace', async () => {
      const trace = { id: 1, invoice_id: 1, payment_method: 'bank' };
      mockPrisma.payment_traces.findUnique.mockResolvedValue(trace);

      const result = await service.getPaymentTrace(1);
      expect(result).toEqual(trace);
    });

    it('should throw NotFoundException if no trace found', async () => {
      mockPrisma.payment_traces.findUnique.mockResolvedValue(null);

      await expect(service.getPaymentTrace(99)).rejects.toThrow(NotFoundException);
    });
  });
});