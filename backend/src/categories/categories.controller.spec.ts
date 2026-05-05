import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '@nestjs/passport';

const mockCategoriesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: mockCategoriesService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────
  describe('create', () => {
    it('should call categoriesService.create with businessId and dto', async () => {
      const businessId = 1;
      const dto = { name: 'Alimentation', type: 'expense' };
      const expected = { id: 1, ...dto, business_id: businessId };

      mockCategoriesService.create.mockResolvedValue(expected);

      const result = await controller.create(businessId, dto as any);

      expect(mockCategoriesService.create).toHaveBeenCalledWith(businessId, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors thrown by the service', async () => {
      mockCategoriesService.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        controller.create(1, { name: 'Test', type: 'expense' } as any),
      ).rejects.toThrow('Create failed');
    });
  });

  // ── findAll ─────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should call categoriesService.findAll with businessId', async () => {
      const businessId = 1;
      const categories = [
        { id: 1, name: 'Alimentation', business_id: 1 },
        { id: 2, name: 'Transport', business_id: 1 },
      ];

      mockCategoriesService.findAll.mockResolvedValue(categories);

      const result = await controller.findAll(businessId);

      expect(mockCategoriesService.findAll).toHaveBeenCalledWith(businessId);
      expect(result).toEqual(categories);
    });

    it('should return empty array when no categories exist', async () => {
      mockCategoriesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(99);

      expect(result).toEqual([]);
    });
  });

  // ── update ──────────────────────────────────────────────────────
  describe('update', () => {
    it('should call categoriesService.update with businessId, id and dto', async () => {
      const businessId = 1;
      const id = 2;
      const dto = { name: 'Transport Updated' };
      const expected = { id, name: 'Transport Updated', business_id: businessId };

      mockCategoriesService.update.mockResolvedValue(expected);

      const result = await controller.update(businessId, id, dto as any);

      expect(mockCategoriesService.update).toHaveBeenCalledWith(businessId, id, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors thrown by the service', async () => {
      mockCategoriesService.update.mockRejectedValue(new Error('Category not found'));

      await expect(
        controller.update(1, 999, { name: 'Ghost' } as any),
      ).rejects.toThrow('Category not found');
    });
  });

  // ── remove ──────────────────────────────────────────────────────
  describe('remove', () => {
    it('should call categoriesService.remove with businessId and id', async () => {
      const businessId = 1;
      const id = 2;

      mockCategoriesService.remove.mockResolvedValue({ count: 1 });

      const result = await controller.remove(businessId, id);

      expect(mockCategoriesService.remove).toHaveBeenCalledWith(businessId, id);
      expect(result).toEqual({ count: 1 });
    });

    it('should return count 0 if category not found', async () => {
      mockCategoriesService.remove.mockResolvedValue({ count: 0 });

      const result = await controller.remove(1, 999);

      expect(result).toEqual({ count: 0 });
    });

    it('should propagate errors thrown by the service', async () => {
      mockCategoriesService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove(1, 999)).rejects.toThrow('Delete failed');
    });
  });
});