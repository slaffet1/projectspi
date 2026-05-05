import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockPrisma = {
  expense_categories: {
    create:    jest.fn(),
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const makeCategory = (overrides: Partial<any> = {}) => ({
  id:          1,
  name:        'Office',
  color:       '#FF5733',
  icon:        'briefcase',
  business_id: 1,
  created_at:  new Date(),
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════
describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a category and return it', async () => {
      const dto    = { name: 'Office', color: '#FF5733', icon: 'briefcase' };
      const expected = makeCategory();

      mockPrisma.expense_categories.create.mockResolvedValue(expected);

      const result = await service.create(1, dto);

      expect(mockPrisma.expense_categories.create).toHaveBeenCalledWith({
        data: { name: dto.name, color: dto.color, icon: dto.icon, business_id: 1 },
      });
      expect(result).toEqual(expected);
    });

    it('should pass the correct businessId to prisma', async () => {
      const dto = { name: 'Travel', color: '#00BFFF', icon: 'plane' };
      mockPrisma.expense_categories.create.mockResolvedValue(makeCategory({ business_id: 7 }));

      await service.create(7, dto);

      expect(mockPrisma.expense_categories.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ business_id: 7 }) }),
      );
    });

    it('should create a category with only a name (color and icon optional)', async () => {
      const dto = { name: 'Misc' };
      mockPrisma.expense_categories.create.mockResolvedValue(
        makeCategory({ name: 'Misc', color: undefined, icon: undefined }),
      );

      const result = await service.create(1, dto);

      expect(mockPrisma.expense_categories.create).toHaveBeenCalledWith({
        data: { name: 'Misc', color: undefined, icon: undefined, business_id: 1 },
      });
      expect(result.name).toBe('Misc');
    });
  });

  // ── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all categories for a business', async () => {
      const categories = [
        makeCategory({ id: 1, name: 'Office' }),
        makeCategory({ id: 2, name: 'Travel' }),
      ];
      mockPrisma.expense_categories.findMany.mockResolvedValue(categories);

      const result = await service.findAll(1);

      expect(mockPrisma.expense_categories.findMany).toHaveBeenCalledWith({
        where:   { business_id: 1 },
        orderBy: { created_at: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result).toEqual(categories);
    });

    it('should return an empty array when the business has no categories', async () => {
      mockPrisma.expense_categories.findMany.mockResolvedValue([]);

      const result = await service.findAll(99);

      expect(result).toEqual([]);
    });

    it('should filter by the correct businessId', async () => {
      mockPrisma.expense_categories.findMany.mockResolvedValue([]);

      await service.findAll(42);

      expect(mockPrisma.expense_categories.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { business_id: 42 } }),
      );
    });

    it('should order results by created_at desc', async () => {
      mockPrisma.expense_categories.findMany.mockResolvedValue([]);

      await service.findAll(1);

      expect(mockPrisma.expense_categories.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { created_at: 'desc' } }),
      );
    });
  });

  // ── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update a category and return the updated record', async () => {
      const existing = makeCategory();
      const dto      = { name: 'Updated Office', color: '#123456' };
      const updated  = { ...existing, ...dto };

      mockPrisma.expense_categories.findFirst.mockResolvedValue(existing);
      mockPrisma.expense_categories.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, dto);

      expect(mockPrisma.expense_categories.findFirst).toHaveBeenCalledWith({
        where: { id: 1, business_id: 1 },
      });
      expect(mockPrisma.expense_categories.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data:  dto,
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockPrisma.expense_categories.findFirst.mockResolvedValue(null);

      await expect(service.update(1, 999, { name: 'Ghost' })).rejects.toThrow(
        new NotFoundException('Category not found'),
      );
      expect(mockPrisma.expense_categories.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category belongs to a different business', async () => {
      // findFirst returns null because business_id does not match
      mockPrisma.expense_categories.findFirst.mockResolvedValue(null);

      await expect(service.update(2, 1, { name: 'Hijack' })).rejects.toThrow(NotFoundException);
    });

    it('should look up category using both id and businessId', async () => {
      mockPrisma.expense_categories.findFirst.mockResolvedValue(makeCategory());
      mockPrisma.expense_categories.update.mockResolvedValue(makeCategory());

      await service.update(5, 10, { name: 'Test' });

      expect(mockPrisma.expense_categories.findFirst).toHaveBeenCalledWith({
        where: { id: 10, business_id: 5 },
      });
    });

    it('should pass only the DTO fields to prisma update', async () => {
      const dto = { icon: 'car' };
      mockPrisma.expense_categories.findFirst.mockResolvedValue(makeCategory());
      mockPrisma.expense_categories.update.mockResolvedValue(makeCategory(dto));

      await service.update(1, 1, dto);

      expect(mockPrisma.expense_categories.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: dto }),
      );
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a category and return a success message', async () => {
      mockPrisma.expense_categories.findFirst.mockResolvedValue(makeCategory());
      mockPrisma.expense_categories.delete.mockResolvedValue(makeCategory());

      const result = await service.remove(1, 1);

      expect(mockPrisma.expense_categories.findFirst).toHaveBeenCalledWith({
        where: { id: 1, business_id: 1 },
      });
      expect(mockPrisma.expense_categories.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ message: 'Category deleted' });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockPrisma.expense_categories.findFirst.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(
        new NotFoundException('Category not found'),
      );
      expect(mockPrisma.expense_categories.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category belongs to a different business', async () => {
      mockPrisma.expense_categories.findFirst.mockResolvedValue(null);

      await expect(service.remove(2, 1)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.expense_categories.delete).not.toHaveBeenCalled();
    });

    it('should not call delete if the category is not found', async () => {
      mockPrisma.expense_categories.findFirst.mockResolvedValue(null);

      await service.remove(1, 1).catch(() => {});

      expect(mockPrisma.expense_categories.delete).not.toHaveBeenCalled();
    });

    it('should delete using only the category id (not business_id)', async () => {
      mockPrisma.expense_categories.findFirst.mockResolvedValue(makeCategory());
      mockPrisma.expense_categories.delete.mockResolvedValue(makeCategory());

      await service.remove(1, 1);

      expect(mockPrisma.expense_categories.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});