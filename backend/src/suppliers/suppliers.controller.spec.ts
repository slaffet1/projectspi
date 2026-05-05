
import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { AuthGuard } from '@nestjs/passport';

const mockSuppliersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('SuppliersController', () => {
  let controller: SuppliersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SuppliersController>(SuppliersController);
    jest.clearAllMocks();
  });

  const BUSINESS_ID = 1;

  // ───────── CREATE ─────────
  describe('create', () => {
    it('should create supplier', async () => {
      const dto = { name: 'Supplier A' };
      const expected = { id: 1, ...dto };

      mockSuppliersService.create.mockResolvedValue(expected);

      const result = await controller.create(BUSINESS_ID, dto as any);

      expect(mockSuppliersService.create).toHaveBeenCalledWith(
        BUSINESS_ID,
        dto,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate errors', async () => {
      mockSuppliersService.create.mockRejectedValue(
        new Error('Create failed'),
      );

      await expect(
        controller.create(BUSINESS_ID, {} as any),
      ).rejects.toThrow('Create failed');
    });
  });

  // ───────── FIND ALL ─────────
  describe('findAll', () => {
    it('should return all suppliers', async () => {
      const suppliers = [{ id: 1 }, { id: 2 }];

      mockSuppliersService.findAll.mockResolvedValue(suppliers);

      const result = await controller.findAll(BUSINESS_ID);

      expect(mockSuppliersService.findAll).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(suppliers);
    });

    it('should return empty array', async () => {
      mockSuppliersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ───────── FIND ONE ─────────
  describe('findOne', () => {
    it('should return one supplier', async () => {
      const supplier = { id: 1 };

      mockSuppliersService.findOne.mockResolvedValue(supplier);

      const result = await controller.findOne(BUSINESS_ID, 1);

      expect(mockSuppliersService.findOne).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
      );
      expect(result).toEqual(supplier);
    });

    it('should propagate errors', async () => {
      mockSuppliersService.findOne.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(
        controller.findOne(BUSINESS_ID, 999),
      ).rejects.toThrow('Not found');
    });
  });

  // ───────── UPDATE ─────────
  describe('update', () => {
    it('should update supplier', async () => {
      const dto = { name: 'Updated Supplier' };
      const expected = { id: 1, ...dto };

      mockSuppliersService.update.mockResolvedValue(expected);

      const result = await controller.update(BUSINESS_ID, 1, dto as any);

      expect(mockSuppliersService.update).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
        dto,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate errors', async () => {
      mockSuppliersService.update.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.update(BUSINESS_ID, 1, {} as any),
      ).rejects.toThrow('Update failed');
    });
  });

  // ───────── DELETE ─────────
  describe('remove', () => {
    it('should remove supplier', async () => {
      mockSuppliersService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(BUSINESS_ID, 1);

      expect(mockSuppliersService.remove).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
      );
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors', async () => {
      mockSuppliersService.remove.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.remove(BUSINESS_ID, 1),
      ).rejects.toThrow('Delete failed');
    });
  });
});
