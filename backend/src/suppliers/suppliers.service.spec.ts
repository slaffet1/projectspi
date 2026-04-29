import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  fournisseurs: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SuppliersService', () => {
  let service: SuppliersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a supplier', async () => {
      const dto = { name: 'Supplier A', email: 'a@test.com', phone: '12345678' };
      const expected = { id: 1, ...dto, business_id: 1 };
      mockPrisma.fournisseurs.create.mockResolvedValue(expected);

      const result = await service.create(1, dto);

      expect(mockPrisma.fournisseurs.create).toHaveBeenCalledWith({
        data: { ...dto, business_id: 1 },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return all suppliers for a business', async () => {
      const suppliers = [
        { id: 1, name: 'Supplier A', business_id: 1 },
        { id: 2, name: 'Supplier B', business_id: 1 },
      ];
      mockPrisma.fournisseurs.findMany.mockResolvedValue(suppliers);

      const result = await service.findAll(1);

      expect(result).toHaveLength(2);
      expect(result).toEqual(suppliers);
    });

    it('should return empty array if no suppliers', async () => {
      mockPrisma.fournisseurs.findMany.mockResolvedValue([]);
      const result = await service.findAll(99);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a supplier if found', async () => {
      const supplier = { id: 1, name: 'Supplier A', business_id: 1 };
      mockPrisma.fournisseurs.findFirst.mockResolvedValue(supplier);

      const result = await service.findOne(1, 1);
      expect(result).toEqual(supplier);
    });

    it('should throw NotFoundException if supplier not found', async () => {
      mockPrisma.fournisseurs.findFirst.mockResolvedValue(null);

      await expect(service.findOne(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const supplier = { id: 1, name: 'Supplier A', business_id: 1 };
      const updated = { ...supplier, name: 'Supplier A Updated' };
      mockPrisma.fournisseurs.findFirst.mockResolvedValue(supplier);
      mockPrisma.fournisseurs.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, { name: 'Supplier A Updated' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if supplier not found on update', async () => {
      mockPrisma.fournisseurs.findFirst.mockResolvedValue(null);

      await expect(service.update(1, 99, { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a supplier', async () => {
      const supplier = { id: 1, name: 'Supplier A', business_id: 1 };
      mockPrisma.fournisseurs.findFirst.mockResolvedValue(supplier);
      mockPrisma.fournisseurs.delete.mockResolvedValue(supplier);

      const result = await service.remove(1, 1);
      expect(result).toEqual(supplier);
    });

    it('should throw NotFoundException if supplier not found on delete', async () => {
      mockPrisma.fournisseurs.findFirst.mockResolvedValue(null);

      await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
    });
  });
});
