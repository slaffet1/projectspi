import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';

// Mock de PDFKit
jest.mock('pdfkit');

describe('PdfService', () => {
  let service: PdfService;
  let mockPrismaService: any;
  let mockDoc: any;

  const mockBusiness = {
    id: 1,
    invoice_prefix: 'INV-',
    name: 'Ma Société',
  };

  const mockInvoice = {
    id: 1,
    invoice_number: '2024-001',
    issue_date: new Date('2024-01-15'),
    due_date: new Date('2024-02-15'),
    status: 'pending',
    quotes: {
      clients: {
        id: 1,
        name: 'Client Test',
        email: 'client@test.com',
        business_id: 1,
      },
      quote_details: [
        {
          id: 1,
          quantity: 2,
          products: {
            id: 1,
            name: 'Produit A',
            unit_price: '100.00',
            tax_rate: '19',
          },
        },
        {
          id: 2,
          quantity: 1,
          products: {
            id: 2,
            name: 'Produit B',
            unit_price: '50.00',
            tax_rate: '7',
          },
        },
      ],
    },
  };

  beforeEach(async () => {
    // Mock du PrismaService
    mockPrismaService = {
      invoices: {
        findUnique: jest.fn(),
      },
      businesses: {
        findUnique: jest.fn(),
      },
    };

    // Mock de PDFDocument
    mockDoc = {
      on: jest.fn((event: string, callback: Function) => {
        if (event === 'end') {
          // Simulate end event
          setTimeout(() => callback(), 0);
        }
        return mockDoc;
      }),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };

    (PDFDocument as jest.MockedClass<typeof PDFDocument>).mockImplementation(() => mockDoc);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should throw NotFoundException when invoice is not found', async () => {
      mockPrismaService.invoices.findUnique.mockResolvedValue(null);

      await expect(service.generate(999)).rejects.toThrow(NotFoundException);
      await expect(service.generate(999)).rejects.toThrow('Facture introuvable');
    });

    it('should throw NotFoundException when client is missing', async () => {
      const invoiceWithoutClient = {
        ...mockInvoice,
        quotes: {
          ...mockInvoice.quotes,
          clients: null,
        },
      };

      mockPrismaService.invoices.findUnique.mockResolvedValue(invoiceWithoutClient);

      await expect(service.generate(1)).rejects.toThrow(NotFoundException);
      await expect(service.generate(1)).rejects.toThrow(
        'Client ou société introuvable pour cette facture'
      );
    });

    it('should throw NotFoundException when business_id is missing', async () => {
      const invoiceWithoutBusinessId = {
        ...mockInvoice,
        quotes: {
          ...mockInvoice.quotes,
          clients: {
            ...mockInvoice.quotes.clients,
            business_id: null,
          },
        },
      };

      mockPrismaService.invoices.findUnique.mockResolvedValue(invoiceWithoutBusinessId);

      await expect(service.generate(1)).rejects.toThrow(NotFoundException);
    });

    it('should generate PDF successfully with valid invoice', async () => {
      mockPrismaService.invoices.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.businesses.findUnique.mockResolvedValue(mockBusiness);

      // Mock data event to simulate buffer chunks
      mockDoc.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          // Simulate pushing buffer chunks
          setTimeout(() => {
            callback(Buffer.from('test-pdf-chunk-1'));
            callback(Buffer.from('test-pdf-chunk-2'));
          }, 0);
        }
        if (event === 'end') {
          setTimeout(() => callback(), 10);
        }
        return mockDoc;
      });

      const result = await service.generate(1);

      expect(mockPrismaService.invoices.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          quotes: {
            include: {
              clients: true,
              quote_details: { include: { products: true } },
            },
          },
        },
      });

      expect(mockPrismaService.businesses.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should use default prefix when business has no invoice_prefix', async () => {
      const businessWithoutPrefix = { ...mockBusiness, invoice_prefix: null };
      mockPrismaService.invoices.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.businesses.findUnique.mockResolvedValue(businessWithoutPrefix);

      mockDoc.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockDoc;
      });

      await service.generate(1);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('INV-2024-001')
      );
    });

    it('should render invoice header correctly', async () => {
      mockPrismaService.invoices.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.businesses.findUnique.mockResolvedValue(mockBusiness);

      mockDoc.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockDoc;
      });

      await service.generate(1);

      expect(mockDoc.fontSize).toHaveBeenCalledWith(22);
      expect(mockDoc.text).toHaveBeenCalledWith('FACTURE', { align: 'center' });
      expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('Client Test'));
    });

    it('should calculate totals correctly', async () => {
      mockPrismaService.invoices.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.businesses.findUnique.mockResolvedValue(mockBusiness);

      mockDoc.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockDoc;
      });

      await service.generate(1);

      // Produit A: 2 * 100 = 200 HT, TVA 19% = 38
      // Produit B: 1 * 50 = 50 HT, TVA 7% = 3.5
      // Total HT = 250, Total TVA = 41.5, Total TTC = 291.5

      expect(mockDoc.text).toHaveBeenCalledWith(
        'Total HT: 250.00 DT',
        { align: 'right' }
      );
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Total TVA: 41.50 DT',
        { align: 'right' }
      );
      expect(mockDoc.font).toHaveBeenCalledWith('Helvetica-Bold');
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Total TTC: 291.50 DT',
        { align: 'right' }
      );
    });

    it('should handle empty quote_details', async () => {
      const invoiceWithoutDetails = {
        ...mockInvoice,
        quotes: {
          ...mockInvoice.quotes,
          quote_details: [],
        },
      };

      mockPrismaService.invoices.findUnique.mockResolvedValue(invoiceWithoutDetails);
      mockPrismaService.businesses.findUnique.mockResolvedValue(mockBusiness);

      mockDoc.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockDoc;
      });

      await service.generate(1);

      expect(mockDoc.text).toHaveBeenCalledWith(
        'Total HT: 0.00 DT',
        { align: 'right' }
      );
    });
  });
});