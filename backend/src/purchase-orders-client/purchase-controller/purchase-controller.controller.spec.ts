
import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseControllerController } from './purchase-controller.controller';
import { PurchaseServiceService } from '../purchase-service/purchase-service.service';
import { PurchaseOrderEmailService } from '../PurchaseOrderEmailService.service';
import { WhisperService } from '../Whisper.service';
import { AuthGuard } from '@nestjs/passport';

// ───────── MOCKS ─────────
const mockPurchaseService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  convertToInvoice: jest.fn(),
  remove: jest.fn(),
};

const mockEmailService = {
  sendPurchaseOrder: jest.fn(),
};

const mockWhisperService = {
  transcribe: jest.fn(),
};

describe('PurchaseControllerController', () => {
  let controller: PurchaseControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseControllerController],
      providers: [
        { provide: PurchaseServiceService, useValue: mockPurchaseService },
        { provide: PurchaseOrderEmailService, useValue: mockEmailService },
        { provide: WhisperService, useValue: mockWhisperService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PurchaseControllerController>(
      PurchaseControllerController,
    );

    jest.clearAllMocks();
  });

  const BUSINESS_ID = 1;

  // ✅ TEST MINIMUM (évite ton erreur)
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ───────── CREATE ─────────
  describe('create', () => {
    it('should create purchase order', async () => {
      const dto = { total: 100 };
      const expected = { id: 1, ...dto };

      mockPurchaseService.create.mockResolvedValue(expected);

      const result = await controller.create(BUSINESS_ID, dto as any);

      expect(mockPurchaseService.create).toHaveBeenCalledWith(BUSINESS_ID, dto);
      expect(result).toEqual(expected);
    });
  });

  // ───────── FIND ALL ─────────
  describe('findAll', () => {
    it('should return all orders', async () => {
      const orders = [{ id: 1 }, { id: 2 }];

      mockPurchaseService.findAll.mockResolvedValue(orders);

      const result = await controller.findAll(BUSINESS_ID);

      expect(result).toEqual(orders);
    });
  });

  // ───────── FIND ONE ─────────
  describe('findOne', () => {
    it('should return one order', async () => {
      const order = { id: 1 };

      mockPurchaseService.findOne.mockResolvedValue(order);

      const result = await controller.findOne(BUSINESS_ID, 1);

      expect(mockPurchaseService.findOne).toHaveBeenCalledWith(BUSINESS_ID, 1);
      expect(result).toEqual(order);
    });
  });

  // ───────── UPDATE ─────────
  describe('update', () => {
    it('should update order', async () => {
      const dto = { total: 200 };
      const expected = { id: 1, ...dto };

      mockPurchaseService.update.mockResolvedValue(expected);

      const result = await controller.update(BUSINESS_ID, 1, dto as any);

      expect(mockPurchaseService.update).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  // ───────── UPDATE STATUS ─────────
  describe('updateStatus', () => {
    it('should update status', async () => {
      const expected = { id: 1, status: 'validated' };

      mockPurchaseService.updateStatus.mockResolvedValue(expected);

      const result = await controller.updateStatus(
        BUSINESS_ID,
        1,
        'validated',
      );

      expect(mockPurchaseService.updateStatus).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
        'validated',
      );
      expect(result).toEqual(expected);
    });
  });

  // ───────── CONVERT ─────────
  describe('convertToInvoice', () => {
    it('should convert to invoice', async () => {
      const dto = {
        issue_date: '2025-01-01',
        due_date: '2025-02-01',
      };

      const expected = { id: 1, invoiceId: 10 };

      mockPurchaseService.convertToInvoice.mockResolvedValue(expected);

      const result = await controller.convertToInvoice(
        BUSINESS_ID,
        1,
        dto,
      );

      expect(mockPurchaseService.convertToInvoice).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  // ───────── DELETE ─────────
  describe('remove', () => {
    it('should delete order', async () => {
      mockPurchaseService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(BUSINESS_ID, 1);

      expect(mockPurchaseService.remove).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ───────── SEND EMAIL ─────────
  describe('sendByEmail', () => {
    it('should send email and update status', async () => {
      const order = {
        id: 1,
        clients: { email: 'test@mail.com' },
      };

      mockPurchaseService.findOne.mockResolvedValue(order);
      mockEmailService.sendPurchaseOrder.mockResolvedValue(undefined);
      mockPurchaseService.updateStatus.mockResolvedValue({});

      const result = await controller.sendByEmail(BUSINESS_ID, 1);

      expect(mockEmailService.sendPurchaseOrder).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Email sent successfully' });
    });

    it('should throw error if no email', async () => {
      const order = { id: 1, clients: { email: null } };

      mockPurchaseService.findOne.mockResolvedValue(order);

      await expect(
        controller.sendByEmail(BUSINESS_ID, 1),
      ).rejects.toThrow('Client has no email address');
    });
  });

  // ───────── TRANSCRIBE ─────────
  describe('transcribe', () => {
    it('should return text', async () => {
      const file = {
        originalname: 'audio.mp3',
        buffer: Buffer.from('audio'),
      } as Express.Multer.File;

      mockWhisperService.transcribe.mockResolvedValue('hello');

      const result = await controller.transcribe(file);

      expect(result).toEqual({ text: 'hello' });
    });
  });
});