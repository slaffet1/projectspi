import { Test, TestingModule } from '@nestjs/testing';
import { TelegramBotService } from './telegram-bot.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';
import axios from 'axios';
import * as Tesseract from 'tesseract.js';
import sharp from 'sharp';

// Mock des modules externes
jest.mock('axios');
jest.mock('tesseract.js', () => ({
  recognize: jest.fn(),
  PSM: {
    SPARSE_TEXT: 8,
  },
}));
jest.mock('sharp');

describe('TelegramBotService', () => {
  let service: TelegramBotService;
  let mockPrismaService: any;
  let mockAxios: jest.Mocked<typeof axios>;
  let mockSharp: any;

  const mockFileId = 'test-file-id';
  const mockToken = 'test-telegram-token';
  const mockFilePath = 'path/to/image.jpg';

  const mockQuote = {
    id: 1,
    quote_id: 'QT2024-1234',
    delivery_notes: [
      {
        id: 1,
        status: DeliveryStatus.PENDING,
        quote_id: 1,
      },
    ],
  };

  const mockUpdatedDeliveryNote = {
    id: 1,
    status: DeliveryStatus.DELIVERED,
    quote_id: 1,
  };

  const setupDefaultMocks = () => {
    mockAxios.get
      .mockResolvedValueOnce({
        data: {
          result: {
            file_path: mockFilePath,
          },
        },
      })
      .mockResolvedValueOnce({
        data: Buffer.from('image-data'),
      });

    (Tesseract.recognize as jest.MockedFunction<typeof Tesseract.recognize>).mockResolvedValue({
      data: {
        text: 'Delivery Note: QT2024-1234.',
      },
    } as any);

    mockPrismaService.quotes.findUnique.mockResolvedValue(mockQuote);
    mockPrismaService.delivery_notes.update.mockResolvedValue(mockUpdatedDeliveryNote);
  };

  beforeEach(async () => {
    // Mock PrismaService
    mockPrismaService = {
      quotes: {
        findUnique: jest.fn(),
      },
      delivery_notes: {
        update: jest.fn(),
      },
    };

    // Mock axios
    mockAxios = axios as jest.Mocked<typeof axios>;

    // Mock sharp
    mockSharp = {
      grayscale: jest.fn().mockReturnThis(),
      threshold: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
    };
    (sharp as jest.MockedFunction<typeof sharp>).mockReturnValue(mockSharp);

    // Mock environment variable
    process.env.TELEGRAM_BOT_TOKEN = mockToken;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramBotService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TelegramBotService>(TelegramBotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processDeliveryNoteImageFromFileId', () => {
    it('should process delivery note image successfully', async () => {
      setupDefaultMocks();

      const result = await service.processDeliveryNoteImageFromFileId(mockFileId);

      expect(mockAxios.get).toHaveBeenCalledTimes(2);
      expect(Tesseract.recognize).toHaveBeenCalledWith(
        expect.any(Buffer),
        'eng',
        expect.objectContaining({
          logger: expect.any(Function),
          tessedit_pageseg_mode: 8,
        })
      );

      expect(mockPrismaService.quotes.findUnique).toHaveBeenCalledWith({
        where: { quote_id: 'QT2024-1234' },
        include: { delivery_notes: true },
      });

      expect(result).toEqual(mockUpdatedDeliveryNote);
    });

    it('should extract different quote number formats', async () => {
      const testCases = [
        {
          text: 'Document BL-QT2024-1234-5678.',
          expected: 'BL-QT2024-1234-5678',
        },
        {
          text: 'Quote QT2024-1234,',
          expected: 'QT2024-1234',
        },
        {
          text: 'Invoice INV2024.123;',
          expected: 'INV2024.123',
        },
      ];

      for (const testCase of testCases) {
        // Clear all mocks before each iteration
        jest.clearAllMocks();

        // Setup mocks for this specific test case
        mockAxios.get
          .mockResolvedValueOnce({
            data: { result: { file_path: mockFilePath } },
          })
          .mockResolvedValueOnce({ data: Buffer.from('image-data') });

        // Reset sharp mock
        mockSharp.toBuffer.mockResolvedValueOnce(Buffer.from('processed-image'));

        // Use mockResolvedValueOnce for each iteration
        (Tesseract.recognize as jest.MockedFunction<typeof Tesseract.recognize>)
          .mockResolvedValueOnce({
            data: {
              text: testCase.text,
            },
          } as any);

        mockPrismaService.quotes.findUnique.mockResolvedValueOnce({
          ...mockQuote,
          quote_id: testCase.expected,
        });

        mockPrismaService.delivery_notes.update.mockResolvedValueOnce(mockUpdatedDeliveryNote);

        // Execute the test
        await service.processDeliveryNoteImageFromFileId(mockFileId);

        // Verify the results
        expect(mockPrismaService.quotes.findUnique).toHaveBeenCalledWith({
          where: { quote_id: testCase.expected },
          include: { delivery_notes: true },
        });
      }
    });

    it('should throw error when no quote number found in OCR text', async () => {
      setupDefaultMocks();

      (Tesseract.recognize as jest.MockedFunction<typeof Tesseract.recognize>).mockResolvedValue({
        data: {
          text: 'Random text 12345 no valid pattern',
        },
      } as any);

      await expect(service.processDeliveryNoteImageFromFileId(mockFileId)).rejects.toThrow(
        'Delivery Note number not found in image'
      );
    });

    it('should throw error when quote not found in database', async () => {
      setupDefaultMocks();

      mockPrismaService.quotes.findUnique.mockResolvedValue(null);

      await expect(service.processDeliveryNoteImageFromFileId(mockFileId)).rejects.toThrow(
        'No quote found for extracted number'
      );
    });

    it('should throw error when no delivery notes linked to quote', async () => {
      setupDefaultMocks();

      mockPrismaService.quotes.findUnique.mockResolvedValue({
        ...mockQuote,
        delivery_notes: [],
      });

      await expect(service.processDeliveryNoteImageFromFileId(mockFileId)).rejects.toThrow(
        'No delivery note linked to this quote'
      );
    });

    it('should handle Telegram API error', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('Telegram API Error'));

      await expect(service.processDeliveryNoteImageFromFileId(mockFileId)).rejects.toThrow(
        'Telegram API Error'
      );
    });

    it('should handle OCR processing error', async () => {
      setupDefaultMocks();

      (Tesseract.recognize as jest.MockedFunction<typeof Tesseract.recognize>).mockRejectedValue(
        new Error('OCR Error')
      );

      await expect(service.processDeliveryNoteImageFromFileId(mockFileId)).rejects.toThrow(
        'OCR Error'
      );
    });

    it('should handle image preprocessing error', async () => {
      setupDefaultMocks();

      mockSharp.toBuffer.mockRejectedValueOnce(new Error('Sharp processing error'));

      await expect(service.processDeliveryNoteImageFromFileId(mockFileId)).rejects.toThrow(
        'Sharp processing error'
      );
    });

    it('should handle database update error', async () => {
      setupDefaultMocks();

      mockPrismaService.delivery_notes.update.mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(service.processDeliveryNoteImageFromFileId(mockFileId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getTelegramFileUrl', () => {
    it('should return file URL successfully', async () => {
      const testFilePath = 'path/to/file.jpg';

      mockAxios.get.mockResolvedValueOnce({
        data: {
          result: {
            file_path: testFilePath,
          },
        },
      });

      const result = await service.getTelegramFileUrl(mockFileId);

      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${mockToken}/getFile?file_id=${mockFileId}`
      );

      expect(result).toBe(`https://api.telegram.org/file/bot${mockToken}/${testFilePath}`);
    });

    it('should throw error when Telegram API fails', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(service.getTelegramFileUrl(mockFileId)).rejects.toThrow(
        'Cannot retrieve Telegram file URL'
      );
    });
  });

  describe('logging', () => {
    it('should log errors properly', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

      setupDefaultMocks();
      mockPrismaService.quotes.findUnique.mockResolvedValue(null);

      await expect(service.processDeliveryNoteImageFromFileId(mockFileId)).rejects.toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('No quote found for number:')
      );

      loggerSpy.mockRestore();
    });

    it('should log debug messages', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'debug').mockImplementation();

      setupDefaultMocks();

      await service.processDeliveryNoteImageFromFileId(mockFileId);

      // Le logger est appelé avec deux arguments : logger.debug('Quote Number:', quoteNumber)
      expect(loggerSpy).toHaveBeenCalledWith('Quote Number:', 'QT2024-1234');
      expect(loggerSpy).toHaveBeenCalledWith('Updated Delivery Note:', mockUpdatedDeliveryNote);

      loggerSpy.mockRestore();
    });
  });
});