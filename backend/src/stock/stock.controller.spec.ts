
import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { AuthGuard } from '@nestjs/passport';

const mockStockService = {
  createWarehouse: jest.fn(),
  getWarehouses: jest.fn(),
  updateWarehouse: jest.fn(),
  deleteWarehouse: jest.fn(),
  assignProduct: jest.fn(),
  removeProductFromWarehouse: jest.fn(),
  getStockLevels: jest.fn(),
  createMovement: jest.fn(),
  getMovementHistory: jest.fn(),
  transferStock: jest.fn(),
  createInventorySession: jest.fn(),
  getInventorySessions: jest.fn(),
  getSessionCounts: jest.fn(),
  recordCount: jest.fn(),
  adjustInventory: jest.fn(),
  getAdjustmentHistory: jest.fn(),
  getVarianceReport: jest.fn(),
  importFromExcel: jest.fn(),
};

describe('StockController', () => {
  let controller: StockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: mockStockService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StockController>(StockController);
    jest.clearAllMocks();
  });

  const BUSINESS_ID = 1;

  // ───────── BASIC TEST ─────────
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ───────── WAREHOUSES ─────────
  describe('warehouses', () => {
    it('should create warehouse', async () => {
      const dto = { name: 'WH1' };
      mockStockService.createWarehouse.mockResolvedValue(dto);

      const result = await controller.createWarehouse(dto as any, BUSINESS_ID);

      expect(mockStockService.createWarehouse).toHaveBeenCalledWith(dto, BUSINESS_ID);
      expect(result).toEqual(dto);
    });

    it('should get warehouses', async () => {
      mockStockService.getWarehouses.mockResolvedValue([]);

      const result = await controller.getWarehouses(BUSINESS_ID);

      expect(result).toEqual([]);
    });

    it('should update warehouse', async () => {
      const dto = { name: 'Updated' };
      mockStockService.updateWarehouse.mockResolvedValue(dto);

      const result = await controller.updateWarehouse(1, BUSINESS_ID, dto as any);

      expect(mockStockService.updateWarehouse).toHaveBeenCalledWith(1, dto, BUSINESS_ID);
      expect(result).toEqual(dto);
    });

    it('should delete warehouse', async () => {
      mockStockService.deleteWarehouse.mockResolvedValue({ success: true });

      const result = await controller.deleteWarehouse(1, BUSINESS_ID);

      expect(result).toEqual({ success: true });
    });
  });

  // ───────── PRODUCTS ─────────
  describe('products in warehouse', () => {
    it('should assign product', async () => {
      const dto = { productId: 1, qty: 5 };

      mockStockService.assignProduct.mockResolvedValue(dto);

      const result = await controller.assignProduct(1, dto as any);

      expect(mockStockService.assignProduct).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(dto);
    });

    it('should remove product', async () => {
      mockStockService.removeProductFromWarehouse.mockResolvedValue({ ok: true });

      const result = await controller.removeProduct(1, 2);

      expect(result).toEqual({ ok: true });
    });
  });

  // ───────── STOCK LEVELS ─────────
  describe('stock levels', () => {
    it('should get stock levels', async () => {
      mockStockService.getStockLevels.mockResolvedValue([]);

      const result = await controller.getStockLevels(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ───────── MOVEMENTS ─────────
  describe('movements', () => {
    it('should create movement', async () => {
      const dto = { productId: 1, qty: 10 };

      mockStockService.createMovement.mockResolvedValue(dto);

      const result = await controller.createMovement(dto as any, BUSINESS_ID);

      expect(result).toEqual(dto);
    });

    it('should get history', async () => {
      mockStockService.getMovementHistory.mockResolvedValue([]);

      const result = await controller.getMovementHistory(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });

  // ───────── TRANSFER ─────────
  describe('transfer stock', () => {
    it('should transfer stock', async () => {
      const body = {
        fromWarehouseId: 1,
        toWarehouseId: 2,
        productId: 3,
        quantity: 5,
      };

      mockStockService.transferStock.mockResolvedValue({ success: true });

      const result = await controller.transferStock(body);

      expect(mockStockService.transferStock).toHaveBeenCalledWith(
        1,
        2,
        3,
        5,
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ───────── INVENTORY ─────────
  describe('inventory sessions', () => {
    it('should create session', async () => {
      mockStockService.createInventorySession.mockResolvedValue({ id: 1 });

      const result = await controller.createSession('test', BUSINESS_ID);

      expect(result).toEqual({ id: 1 });
    });

    it('should get sessions', async () => {
      mockStockService.getInventorySessions.mockResolvedValue([]);

      const result = await controller.getSessions(BUSINESS_ID);

      expect(result).toEqual([]);
    });

    it('should get session counts', async () => {
      mockStockService.getSessionCounts.mockResolvedValue([]);

      const result = await controller.getSessionCounts(1);

      expect(result).toEqual([]);
    });

    it('should record count', async () => {
      const body = { product_id: 1, physical_quantity: 10 };

      mockStockService.recordCount.mockResolvedValue(body);

      const result = await controller.recordCount(1, body);

      expect(result).toEqual(body);
    });

    it('should adjust inventory', async () => {
      mockStockService.adjustInventory.mockResolvedValue({ ok: true });

      const result = await controller.adjustInventory(1);

      expect(result).toEqual({ ok: true });
    });
  });

  // ───────── REPORT ─────────
  describe('reports', () => {
    it('should get adjustment history', async () => {
      mockStockService.getAdjustmentHistory.mockResolvedValue([]);

      const result = await controller.getAdjustmentHistory(BUSINESS_ID);

      expect(result).toEqual([]);
    });

    it('should get variance report', async () => {
      mockStockService.getVarianceReport.mockResolvedValue([]);

      const result = await controller.getVarianceReport(1);

      expect(result).toEqual([]);
    });
  });

  // ───────── IMPORT ─────────
  describe('import excel', () => {
    it('should import file', async () => {
      const file = {
        originalname: 'file.xlsx',
      } as Express.Multer.File;

      mockStockService.importFromExcel.mockResolvedValue({ imported: true });

      const result = await controller.importFromExcel(file, BUSINESS_ID, '2');

      expect(mockStockService.importFromExcel).toHaveBeenCalledWith(
        file,
        BUSINESS_ID,
        2,
      );
      expect(result).toEqual({ imported: true });
    });
  });
});
