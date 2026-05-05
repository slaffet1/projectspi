import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let mockPrismaService: any;

  const mockBusinessId = 1;

  const mockCreateData = {
    supplier_id: 1,
    order_date: '2024-01-15',
    expected_date: '2024-01-30',
    total_amount: 1500.0,
    notes: 'Commande test',
    items: [
      {
        product_id: 1,
        quantity: 10,
        unit_price: 100.0,
      },
      {
        product_id: 2,
        quantity: 5,
        unit_price: 100.0,
      },
    ],
  };

  const mockPurchaseOrder = {
    id: 1,
    business_id: 1,
    supplier_id: 1,
    order_number: 'PO-2024-001',
    order_date: new Date('2024-01-15'),
    expected_date: new Date('2024-01-30'),
    total_amount: 1500.0,
    notes: 'Commande test',
    status: 'DRAFT',
    created_at: new Date(),
    fournisseurs: {
      id: 1,
      name: 'Fournisseur Test',
    },
    items: [
      {
        id: 1,
        product_id: 1,
        quantity: 10,
        unit_price: 100.0,
        total: 1000.0,
      },
      {
        id: 2,
        product_id: 2,
        quantity: 5,
        unit_price: 100.0,
        total: 500.0,
      },
    ],
  };

  const mockInventaire = {
    id: 1,
    product_id: 1,
    quantity_available: 50,
    minimum_quantity: 10,
  };

  beforeEach(async () => {
    mockPrismaService = {
      purchase_orders: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      expenses: {
        create: jest.fn(),
      },
      mouvements: {
        create: jest.fn(),
      },
      inventaires: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a purchase order with generated order number', async () => {
      const lastOrder = { id: 5 };
      mockPrismaService.purchase_orders.findFirst.mockResolvedValue(lastOrder);
      mockPrismaService.purchase_orders.create.mockResolvedValue(mockPurchaseOrder);

      const result = await service.create(mockBusinessId, mockCreateData);

      expect(mockPrismaService.purchase_orders.findFirst).toHaveBeenCalledWith({
        orderBy: { id: 'desc' },
      });

      expect(mockPrismaService.purchase_orders.create).toHaveBeenCalledWith({
        data: {
          business_id: mockBusinessId,
          supplier_id: mockCreateData.supplier_id,
          order_number: expect.stringMatching(/^PO-\d{4}-\d{3}$/),
          order_date: new Date(mockCreateData.order_date),
          expected_date: new Date(mockCreateData.expected_date),
          total_amount: mockCreateData.total_amount,
          notes: mockCreateData.notes,
          status: 'DRAFT',
          items: {
            create: mockCreateData.items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.quantity * item.unit_price,
            })),
          },
        },
        include: { items: true },
      });

      expect(result).toEqual(mockPurchaseOrder);
    });

    it('should create first order when no previous orders exist', async () => {
      mockPrismaService.purchase_orders.findFirst.mockResolvedValue(null);
      mockPrismaService.purchase_orders.create.mockResolvedValue(mockPurchaseOrder);

      await service.create(mockBusinessId, mockCreateData);

      expect(mockPrismaService.purchase_orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order_number: expect.stringMatching(/^PO-\d{4}-001$/),
          }),
        })
      );
    });

    it('should handle null expected_date', async () => {
      const dataWithoutExpectedDate = { ...mockCreateData, expected_date: null };
      mockPrismaService.purchase_orders.findFirst.mockResolvedValue(null);
      mockPrismaService.purchase_orders.create.mockResolvedValue(mockPurchaseOrder);

      await service.create(mockBusinessId, dataWithoutExpectedDate);

      expect(mockPrismaService.purchase_orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expected_date: null,
          }),
        })
      );
    });
  });

  describe('validateOrder', () => {
    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.purchase_orders.findFirst.mockResolvedValue(null);

      await expect(service.validateOrder(mockBusinessId, 999)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.validateOrder(mockBusinessId, 999)).rejects.toThrow(
        'Bon de commande introuvable'
      );
    });

    it('should throw BadRequestException when order already validated', async () => {
      const validatedOrder = { ...mockPurchaseOrder, status: 'VALIDATED' };
      mockPrismaService.purchase_orders.findFirst.mockResolvedValue(validatedOrder);

      await expect(service.validateOrder(mockBusinessId, 1)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.validateOrder(mockBusinessId, 1)).rejects.toThrow(
        'Ce bon est déjà validé'
      );
    });

    it('should validate order successfully with complete transaction', async () => {
      const updatedOrder = { ...mockPurchaseOrder, status: 'VALIDATED' };

      mockPrismaService.purchase_orders.findFirst.mockResolvedValue(mockPurchaseOrder);
      mockPrismaService.inventaires.findFirst
        .mockResolvedValueOnce(mockInventaire) // Pour product_id: 1
        .mockResolvedValueOnce(null); // Pour product_id: 2 (nouveau produit)

      // Mock de la transaction
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrismaTransaction = {
          purchase_orders: {
            update: jest.fn().mockResolvedValue(updatedOrder),
          },
          expenses: {
            create: jest.fn().mockResolvedValue({}),
          },
          mouvements: {
            create: jest.fn().mockResolvedValue({}),
          },
          inventaires: {
            findFirst: jest.fn()
              .mockResolvedValueOnce(mockInventaire)
              .mockResolvedValueOnce(null),
            update: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockResolvedValue({}),
          },
        };

        return await callback(mockPrismaTransaction);
      });

      const result = await service.validateOrder(mockBusinessId, 1);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedOrder);

      // Vérifier que la transaction a appelé toutes les opérations nécessaires
      const transactionCallback = mockPrismaService.$transaction.mock.calls[0][0];
      const mockTx = {
        purchase_orders: { update: jest.fn().mockResolvedValue(updatedOrder) },
        expenses: { create: jest.fn() },
        mouvements: { create: jest.fn() },
        inventaires: {
          findFirst: jest.fn()
            .mockResolvedValueOnce(mockInventaire)
            .mockResolvedValueOnce(null),
          update: jest.fn(),
          create: jest.fn(),
        },
      };

      await transactionCallback(mockTx);

      expect(mockTx.purchase_orders.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'VALIDATED' },
      });

      expect(mockTx.expenses.create).toHaveBeenCalledWith({
        data: {
          label: 'Achat - Fournisseur Test (PO-2024-001)',
          amount: 1500.0,
          expense_date: expect.any(Date),
          business_id: mockBusinessId,
          purchase_order_id: 1,
        },
      });

      expect(mockTx.mouvements.create).toHaveBeenCalledTimes(2);
      expect(mockTx.inventaires.update).toHaveBeenCalledTimes(1);
      expect(mockTx.inventaires.create).toHaveBeenCalledTimes(1);
    });

    it('should handle order without supplier name in expense creation', async () => {
      const orderWithoutSupplier = {
        ...mockPurchaseOrder,
        fournisseurs: null,
      };

      mockPrismaService.purchase_orders.findFirst.mockResolvedValue(orderWithoutSupplier);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          purchase_orders: { update: jest.fn().mockResolvedValue(orderWithoutSupplier) },
          expenses: { create: jest.fn() },
          mouvements: { create: jest.fn() },
          inventaires: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
        };
        return await callback(mockTx);
      });

      await service.validateOrder(mockBusinessId, 1);

      const transactionCallback = mockPrismaService.$transaction.mock.calls[0][0];
      const mockTx = {
        purchase_orders: { update: jest.fn().mockResolvedValue(orderWithoutSupplier) },
        expenses: { create: jest.fn() },
        mouvements: { create: jest.fn() },
        inventaires: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
      };

      await transactionCallback(mockTx);

      expect(mockTx.expenses.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          label: 'Achat - Fournisseur (PO-2024-001)',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return all purchase orders for business', async () => {
      const mockOrders = [mockPurchaseOrder];
      mockPrismaService.purchase_orders.findMany.mockResolvedValue(mockOrders);

      const result = await service.findAll(mockBusinessId);

      expect(mockPrismaService.purchase_orders.findMany).toHaveBeenCalledWith({
        where: { business_id: mockBusinessId },
        include: { fournisseurs: true, _count: { select: { items: true } } },
        orderBy: { created_at: 'desc' },
      });

      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when no orders exist', async () => {
      mockPrismaService.purchase_orders.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockBusinessId);

      expect(result).toEqual([]);
    });
  });
});