import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  warehouses: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  warehouse_products: {
    upsert: jest.fn(),
    aggregate: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  inventaires: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  mouvements: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  inventory_sessions: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  inventory_counts: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  products: {
    findFirst: jest.fn(),
  },
};

describe('StockService', () => {
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    jest.clearAllMocks();
  });

  // ── Warehouses ─────────────────────────────────────────────────
  describe('createWarehouse', () => {
    it('should create a warehouse', async () => {
      const dto = { name: 'Depot Tunis', location: 'Tunis' };
      const expected = { id: 1, ...dto, business_id: 1 };
      mockPrisma.warehouses.create.mockResolvedValue(expected);

      const result = await service.createWarehouse(dto as any, 1);
      expect(result).toEqual(expected);
    });
  });

  describe('getWarehouses', () => {
    it('should return warehouses for a business', async () => {
      const warehouses = [
        { id: 1, name: 'Depot Tunis', business_id: 1, warehouse_products: [] },
      ];
      mockPrisma.warehouses.findMany.mockResolvedValue(warehouses);

      const result = await service.getWarehouses(1);
      expect(result).toHaveLength(1);
    });
  });

  // ── assignProduct ───────────────────────────────────────────────
  describe('assignProduct', () => {
    it('should assign product and sync inventaires (create)', async () => {
      mockPrisma.warehouse_products.upsert.mockResolvedValue({ id: 1 });
      mockPrisma.warehouse_products.aggregate.mockResolvedValue({ _sum: { quantity: 50 } });
      mockPrisma.inventaires.findFirst.mockResolvedValue(null);
      mockPrisma.inventaires.create.mockResolvedValue({ id: 1, quantity_available: 50 });

      const result = await service.assignProduct(1, { product_id: 1, quantity: 50 });

      expect(mockPrisma.inventaires.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });

    it('should assign product and sync inventaires (update)', async () => {
      mockPrisma.warehouse_products.upsert.mockResolvedValue({ id: 1 });
      mockPrisma.warehouse_products.aggregate.mockResolvedValue({ _sum: { quantity: 80 } });
      mockPrisma.inventaires.findFirst.mockResolvedValue({ id: 5, quantity_available: 50 });
      mockPrisma.inventaires.update.mockResolvedValue({ id: 5, quantity_available: 80 });

      await service.assignProduct(1, { product_id: 1, quantity: 80 });

      expect(mockPrisma.inventaires.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { quantity_available: 80, last_updated: expect.any(Date) },
      });
    });
  });

  // ── getStockLevels ──────────────────────────────────────────────
  describe('getStockLevels', () => {
    it('should return stock levels for a business', async () => {
      const levels = [
        { id: 1, quantity_available: 50, products: { name: 'Laptop', business_id: 1 } },
      ];
      mockPrisma.inventaires.findMany.mockResolvedValue(levels);

      const result = await service.getStockLevels(1);
      expect(result).toHaveLength(1);
      expect(result[0].quantity_available).toBe(50);
    });
  });

  // ── createMovement ──────────────────────────────────────────────
  describe('createMovement', () => {
    it('should create IN movement and increase stock', async () => {
      const movement = { id: 1, type: 'IN', quantity: 30 };
      mockPrisma.mouvements.create.mockResolvedValue(movement);
      mockPrisma.inventaires.findFirst.mockResolvedValue({ id: 1, quantity_available: 50 });
      mockPrisma.inventaires.update.mockResolvedValue({ id: 1, quantity_available: 80 });

      const result = await service.createMovement(
        { product_id: 1, quantity: 30, type: 'IN', note: '' } as any, 1
      );

      expect(mockPrisma.inventaires.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity_available: 80, last_updated: expect.any(Date) },
      });
      expect(result).toEqual(movement);
    });

    it('should create OUT movement and decrease stock', async () => {
      const movement = { id: 2, type: 'OUT', quantity: 10 };
      mockPrisma.mouvements.create.mockResolvedValue(movement);
      mockPrisma.inventaires.findFirst.mockResolvedValue({ id: 1, quantity_available: 50 });
      mockPrisma.inventaires.update.mockResolvedValue({ id: 1, quantity_available: 40 });

      const result = await service.createMovement(
        { product_id: 1, quantity: 10, type: 'OUT', note: '' } as any, 1
      );

      expect(mockPrisma.inventaires.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity_available: 40, last_updated: expect.any(Date) },
      });
      expect(result).toEqual(movement);
    });
  });

  // ── transferStock ───────────────────────────────────────────────
  describe('transferStock', () => {
    it('should transfer stock between warehouses', async () => {
      mockPrisma.warehouse_products.findFirst.mockResolvedValue({ id: 1, quantity: 50 });
      mockPrisma.warehouse_products.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.warehouse_products.upsert.mockResolvedValue({});

      const result = await service.transferStock(1, 2, 1, 10);
      expect(result.message).toBe('Stock transferred successfully');
    });

    it('should throw NotFoundException if insufficient stock', async () => {
      mockPrisma.warehouse_products.findFirst.mockResolvedValue({ id: 1, quantity: 5 });

      await expect(service.transferStock(1, 2, 1, 50)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if product not in warehouse', async () => {
      mockPrisma.warehouse_products.findFirst.mockResolvedValue(null);

      await expect(service.transferStock(1, 2, 1, 10)).rejects.toThrow(NotFoundException);
    });
  });
});
