
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthGuard } from '@nestjs/passport';

const mockProductsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  toggleActive: jest.fn(),
};

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    jest.clearAllMocks();
  });

  const BUSINESS_ID = '1';

  // ── CREATE ────────────────────────────────────────────────
  describe('create', () => {
    it('should call service with businessId and dto', async () => {
      const dto = { name: 'Product 1', price: 100 };
      const expected = { id: 1, ...dto };

      mockProductsService.create.mockResolvedValue(expected);

      const result = await controller.create(BUSINESS_ID, dto as any);

      expect(mockProductsService.create).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors', async () => {
      mockProductsService.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        controller.create(BUSINESS_ID, {} as any),
      ).rejects.toThrow('Create failed');
    });
  });

  // ── FIND ALL ──────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [{ id: 1 }, { id: 2 }];

      mockProductsService.findAll.mockResolvedValue(products);

      const result = await controller.findAll(BUSINESS_ID);

      expect(mockProductsService.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(products);
    });

    it('should return empty array', async () => {
      mockProductsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ── FIND ONE ──────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a product', async () => {
      const product = { id: 1, name: 'Test' };

      mockProductsService.findOne.mockResolvedValue(product);

      const result = await controller.findOne(BUSINESS_ID, '1');

      expect(mockProductsService.findOne).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(product);
    });

    it('should propagate errors', async () => {
      mockProductsService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(
        controller.findOne(BUSINESS_ID, '999'),
      ).rejects.toThrow('Not found');
    });
  });

  // ── UPDATE ────────────────────────────────────────────────
  describe('update', () => {
    it('should update a product', async () => {
      const dto = { name: 'Updated' };
      const expected = { id: 1, ...dto };

      mockProductsService.update.mockResolvedValue(expected);

      const result = await controller.update(BUSINESS_ID, '1', dto as any);

      expect(mockProductsService.update).toHaveBeenCalledWith(1, 1, dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors', async () => {
      mockProductsService.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        controller.update(BUSINESS_ID, '1', {} as any),
      ).rejects.toThrow('Update failed');
    });
  });

  // ── DELETE ────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a product', async () => {
      mockProductsService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(BUSINESS_ID, '1');

      expect(mockProductsService.remove).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors', async () => {
      mockProductsService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(
        controller.remove(BUSINESS_ID, '1'),
      ).rejects.toThrow('Delete failed');
    });
  });

  // ── TOGGLE ACTIVE ─────────────────────────────────────────
  describe('toggleActive', () => {
    it('should toggle product active status', async () => {
      const expected = { id: 1, isActive: false };

      mockProductsService.toggleActive.mockResolvedValue(expected);

      const result = await controller.toggleActive(BUSINESS_ID, '1');

      expect(mockProductsService.toggleActive).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual(expected);
    });

    it('should propagate errors', async () => {
      mockProductsService.toggleActive.mockRejectedValue(new Error('Toggle failed'));

      await expect(
        controller.toggleActive(BUSINESS_ID, '1'),
      ).rejects.toThrow('Toggle failed');
    });
  });
});
