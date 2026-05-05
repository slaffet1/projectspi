
import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

const mockPurchaseOrdersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  validateOrder: jest.fn(),
};

describe('PurchaseOrdersController', () => {
  let controller: PurchaseOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [
        {
          provide: PurchaseOrdersService,
          useValue: mockPurchaseOrdersService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseOrdersController>(PurchaseOrdersController);
    jest.clearAllMocks();
  });

  const BUSINESS_ID = 1;

  // ── CREATE ────────────────────────────────────────────────
  describe('create', () => {
    it('should call service.create with businessId and data', async () => {
      const data = { supplier: 'ABC', total: 500 };
      const expected = { id: 1, ...data };

      mockPurchaseOrdersService.create.mockResolvedValue(expected);

      const result = await controller.create(BUSINESS_ID, data);

      expect(mockPurchaseOrdersService.create).toHaveBeenCalledWith(BUSINESS_ID, data);
      expect(result).toEqual(expected);
    });

    it('should propagate errors', async () => {
      mockPurchaseOrdersService.create.mockRejectedValue(new Error('Create failed'));

      await expect(
        controller.create(BUSINESS_ID, {}),
      ).rejects.toThrow('Create failed');
    });
  });

  // ── FIND ALL ──────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all purchase orders', async () => {
      const orders = [
        { id: 1, total: 100 },
        { id: 2, total: 200 },
      ];

      mockPurchaseOrdersService.findAll.mockResolvedValue(orders);

      const result = await controller.findAll(BUSINESS_ID);

      expect(mockPurchaseOrdersService.findAll).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(orders);
    });

    it('should return empty array if no orders exist', async () => {
      mockPurchaseOrdersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(BUSINESS_ID);

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockPurchaseOrdersService.findAll.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(
        controller.findAll(BUSINESS_ID),
      ).rejects.toThrow('Fetch failed');
    });
  });

  // ── VALIDATE ──────────────────────────────────────────────
  describe('validate', () => {
    it('should call service.validateOrder with businessId and id', async () => {
      const expected = { id: 1, status: 'validated' };

      mockPurchaseOrdersService.validateOrder.mockResolvedValue(expected);

      const result = await controller.validate(BUSINESS_ID, 1);

      expect(mockPurchaseOrdersService.validateOrder).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate errors', async () => {
      mockPurchaseOrdersService.validateOrder.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(
        controller.validate(BUSINESS_ID, 999),
      ).rejects.toThrow('Validation failed');
    });
  });
});
