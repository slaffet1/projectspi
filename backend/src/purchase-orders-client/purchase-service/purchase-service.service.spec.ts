import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseServiceService } from './purchase-service.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  purchase_orders_client: {
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  clients: {
    findFirst: jest.fn(),
  },
  purchase_order_client_details: {
    deleteMany: jest.fn(),
  },
  businesses: {
    findUnique: jest.fn(),
  },
  invoices: {
    create: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockOrder = {
  id: 1,
  status: 'draft',
  total_amount: 1000,
  clients: { id: 1, business_id: 1 },
  order_details: [
    { quantity: 2, products: { unit_price: 100, tax_rate: 20 } },
  ],
};

describe('PurchaseServiceService', () => {
  let service: PurchaseServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseServiceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PurchaseServiceService>(PurchaseServiceService);
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      client_id: 1,
      issue_date: '2024-01-01',
      expiration_date: '2024-02-01',
      total_amount: 1000,
      details: [{ product_id: 1, quantity: 2 }],
    };

    it('should create a purchase order', async () => {
      mockPrisma.purchase_orders_client.count.mockResolvedValue(0);
      mockPrisma.clients.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.purchase_orders_client.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(1, dto as any);
      expect(result).toMatchObject({ id: 1 });
    });

    it('should throw NotFoundException if client not found', async () => {
      mockPrisma.purchase_orders_client.count.mockResolvedValue(0);
      mockPrisma.clients.findFirst.mockResolvedValue(null);

      await expect(service.create(1, dto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid issue_date', async () => {
      mockPrisma.purchase_orders_client.count.mockResolvedValue(0);
      mockPrisma.clients.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        service.create(1, { ...dto, issue_date: 'not-a-date' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all orders for a business', async () => {
      mockPrisma.purchase_orders_client.findMany.mockResolvedValue([mockOrder]);
      const result = await service.findAll(1);
      expect(result).toEqual([mockOrder]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the order', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue(mockOrder);
      const result = await service.findOne(1, 1);
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue(null);
      await expect(service.findOne(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    const dto = { total_amount: 2000, issue_date: '2024-03-01', expiration_date: '2024-04-01', details: [] };

    it('should update a draft order', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.purchase_order_client_details.deleteMany.mockResolvedValue({});
      mockPrisma.purchase_orders_client.update.mockResolvedValue({ ...mockOrder, total_amount: 2000 });

      const result = await service.update(1, 1, dto as any);
      expect(result.total_amount).toBe(2000);
    });

    it('should throw ForbiddenException if order is not draft', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue({ ...mockOrder, status: 'sent' });

      await expect(service.update(1, 1, dto as any)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('should transition draft → sent', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.purchase_orders_client.update.mockResolvedValue({ ...mockOrder, status: 'sent' });

      const result = await service.updateStatus(1, 1, 'sent');
      expect(result.status).toBe('sent');
    });

    it('should throw ForbiddenException for invalid transition', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue(mockOrder);

      await expect(service.updateStatus(1, 1, 'invoiced')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for transition from invoiced', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue({ ...mockOrder, status: 'invoiced' });

      await expect(service.updateStatus(1, 1, 'draft')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── convertToInvoice ─────────────────────────────────────────────────────

  describe('convertToInvoice', () => {
    const dto = { issue_date: '2024-01-01', due_date: '2024-02-01' };

    it('should create an invoice from a confirmed order', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue({ ...mockOrder, status: 'confirmed' });
      mockPrisma.businesses.findUnique.mockResolvedValue({ invoice_prefix: 'BC' });
      mockPrisma.invoices.count.mockResolvedValue(0);
      const invoice = { id: 1, invoice_number: 'BC-2024-001' };
      mockPrisma.$transaction.mockResolvedValue([invoice]);

      const result = await service.convertToInvoice(1, 1, dto);
      expect(result).toEqual(invoice);
    });

    it('should throw BadRequestException for invalid issue_date', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue({ ...mockOrder, status: 'confirmed' });

      await expect(
        service.convertToInvoice(1, 1, { ...dto, issue_date: 'bad-date' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a draft order', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.purchase_order_client_details.deleteMany.mockResolvedValue({});
      mockPrisma.purchase_orders_client.delete.mockResolvedValue({});

      const result = await service.remove(1, 1);
      expect(result).toEqual({ message: 'Bon de commande supprimé avec succès' });
    });

    it('should throw ForbiddenException if order is not draft/cancelled', async () => {
      mockPrisma.purchase_orders_client.findFirst.mockResolvedValue({ ...mockOrder, status: 'sent' });

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});