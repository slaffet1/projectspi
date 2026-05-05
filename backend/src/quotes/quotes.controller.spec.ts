
import { Test, TestingModule } from '@nestjs/testing';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { AuthGuard } from '@nestjs/passport';

// ───────── MOCK SERVICE ─────────
const mockQuotesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  send: jest.fn(),
  updateStatus: jest.fn(),
  convertToInvoice: jest.fn(),
  remove: jest.fn(),
};

describe('QuotesController', () => {
  let controller: QuotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [
        {
          provide: QuotesService,
          useValue: mockQuotesService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QuotesController>(QuotesController);
    jest.clearAllMocks();
  });

  const BUSINESS_ID = 1;
  const USER_ID = 10;

  // ✅ TEST MINIMUM
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ───────── CREATE ─────────
  describe('create', () => {
    it('should create quote', async () => {
      const dto = { total: 1000 };
      const expected = { id: 1, ...dto };

      mockQuotesService.create.mockResolvedValue(expected);

      const result = await controller.create(BUSINESS_ID, USER_ID, dto as any);

      expect(mockQuotesService.create).toHaveBeenCalledWith(BUSINESS_ID, dto);
      expect(result).toEqual(expected);
    });
  });

  // ───────── FIND ALL ─────────
  describe('findAll', () => {
    it('should return all quotes', async () => {
      const quotes = [{ id: 1 }, { id: 2 }];

      mockQuotesService.findAll.mockResolvedValue(quotes);

      const result = await controller.findAll(BUSINESS_ID);

      expect(mockQuotesService.findAll).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(quotes);
    });
  });

  // ───────── FIND ONE ─────────
  describe('findOne', () => {
    it('should return one quote', async () => {
      const quote = { id: 1 };

      mockQuotesService.findOne.mockResolvedValue(quote);

      const result = await controller.findOne(BUSINESS_ID, 1);

      expect(mockQuotesService.findOne).toHaveBeenCalledWith(BUSINESS_ID, 1);
      expect(result).toEqual(quote);
    });

    it('should propagate errors', async () => {
      mockQuotesService.findOne.mockRejectedValue(new Error('Not found'));

      await expect(
        controller.findOne(BUSINESS_ID, 999),
      ).rejects.toThrow('Not found');
    });
  });

  // ───────── UPDATE ─────────
  describe('update', () => {
    it('should update quote', async () => {
      const dto = { total: 2000 };
      const expected = { id: 1, ...dto };

      mockQuotesService.update.mockResolvedValue(expected);

      const result = await controller.update(BUSINESS_ID, 1, dto as any);

      expect(mockQuotesService.update).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  // ───────── SEND ─────────
  describe('send', () => {
    it('should send quote', async () => {
      const expected = { id: 1, status: 'sent' };

      mockQuotesService.send.mockResolvedValue(expected);

      const result = await controller.send(BUSINESS_ID, 1);

      expect(mockQuotesService.send).toHaveBeenCalledWith(BUSINESS_ID, 1);
      expect(result).toEqual(expected);
    });
  });

  // ───────── UPDATE STATUS ─────────
  describe('updateStatus', () => {
    it('should update status', async () => {
      const expected = { id: 1, status: 'accepted' };

      mockQuotesService.updateStatus.mockResolvedValue(expected);

      const result = await controller.updateStatus(
        BUSINESS_ID,
        1,
        'accepted',
      );

      expect(mockQuotesService.updateStatus).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
        'accepted',
      );
      expect(result).toEqual(expected);
    });
  });

  // ───────── CONVERT ─────────
  describe('convertToInvoice', () => {
    it('should convert quote to invoice', async () => {
      const expected = { invoiceId: 10 };

      mockQuotesService.convertToInvoice.mockResolvedValue(expected);

      const result = await controller.convertToInvoice(BUSINESS_ID, 1);

      expect(mockQuotesService.convertToInvoice).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
      );
      expect(result).toEqual(expected);
    });
  });

  // ───────── DELETE ─────────
  describe('remove', () => {
    it('should delete quote', async () => {
      mockQuotesService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(BUSINESS_ID, 1);

      expect(mockQuotesService.remove).toHaveBeenCalledWith(
        BUSINESS_ID,
        1,
      );
      expect(result).toEqual({ success: true });
    });

    it('should propagate errors', async () => {
      mockQuotesService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(
        controller.remove(BUSINESS_ID, 1),
      ).rejects.toThrow('Delete failed');
    });
  });
});
