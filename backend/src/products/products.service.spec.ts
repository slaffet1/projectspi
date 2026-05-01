import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../search/embedding.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  products: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// EmbeddingService → on mocke getEmbedding pour ne pas appeler Hugging Face
const mockEmbedding = {
  getEmbedding: jest.fn().mockResolvedValue([]),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: mockEmbedding },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const dto = { name: 'Laptop', unit_price: 1500, unit: 'piece' };
      const expected = { id: 1, ...dto, business_id: 1, is_active: true };
      mockPrisma.products.create.mockResolvedValue(expected);
      mockEmbedding.getEmbedding.mockResolvedValue([]);

      const result = await service.create(1, dto as any);

      expect(mockPrisma.products.create).toHaveBeenCalledWith({
        data: { ...dto, business_id: 1 },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return all products for a business', async () => {
      const products = [
        { id: 1, name: 'Laptop', business_id: 1 },
        { id: 2, name: 'Mouse', business_id: 1 },
      ];
      mockPrisma.products.findMany.mockResolvedValue(products);

      const result = await service.findAll(1);

      expect(result).toHaveLength(2);
      expect(result).toEqual(products);
    });

    it('should return empty array if no products', async () => {
      mockPrisma.products.findMany.mockResolvedValue([]);
      const result = await service.findAll(99);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      const product = { id: 1, name: 'Laptop', business_id: 1 };
      mockPrisma.products.findFirst.mockResolvedValue(product);

      const result = await service.findOne(1, 1);
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.products.findFirst.mockResolvedValue(null);

      await expect(service.findOne(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const product = { id: 1, name: 'Laptop', business_id: 1 };
      const updated = { ...product, name: 'Laptop Pro' };
      mockPrisma.products.findFirst.mockResolvedValue(product);
      mockPrisma.products.update.mockResolvedValue(updated);
      mockEmbedding.getEmbedding.mockResolvedValue([]);

      const result = await service.update(1, 1, { name: 'Laptop Pro' } as any);
      expect(result.name).toBe('Laptop Pro');
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.products.findFirst.mockResolvedValue(null);

      await expect(service.update(1, 99, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      const product = { id: 1, name: 'Laptop', business_id: 1 };
      mockPrisma.products.findFirst.mockResolvedValue(product);
      mockPrisma.products.delete.mockResolvedValue(product);

      const result = await service.remove(1, 1);
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.products.findFirst.mockResolvedValue(null);

      await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    it('should toggle product from active to inactive', async () => {
      const product = { id: 1, name: 'Laptop', is_active: true, business_id: 1 };
      const toggled = { ...product, is_active: false };
      mockPrisma.products.findFirst.mockResolvedValue(product);
      mockPrisma.products.update.mockResolvedValue(toggled);

      const result = await service.toggleActive(1, 1);
      expect(result.is_active).toBe(false);
    });

    it('should toggle product from inactive to active', async () => {
      const product = { id: 1, name: 'Laptop', is_active: false, business_id: 1 };
      const toggled = { ...product, is_active: true };
      mockPrisma.products.findFirst.mockResolvedValue(product);
      mockPrisma.products.update.mockResolvedValue(toggled);

      const result = await service.toggleActive(1, 1);
      expect(result.is_active).toBe(true);
    });
  });
});
