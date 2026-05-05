import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';
import * as puppeteer from 'puppeteer';

// Mock des modules externes
jest.mock('nodemailer');
jest.mock('puppeteer');

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: any;
  let mockBrowser: any;
  let mockPage: any;

  const mockInvoice = {
    invoice_number: 'INV-001',
    issue_date: new Date('2024-01-15'),
    due_date: new Date('2024-02-15'),
    status: 'pending',
    quotes: {
      clients: {
        name: 'Client Test',
        email: 'client@test.com',
        businesses: {
          name: 'Ma Société',
        },
      },
      quote_details: [
        {
          quantity: 2,
          products: {
            name: 'Produit A',
            unit_price: '100.00',
            tax_rate: '19',
          },
        },
        {
          quantity: 1,
          products: {
            name: 'Produit B',
            unit_price: '50.00',
            tax_rate: '7',
          },
        },
      ],
    },
  };

  beforeEach(async () => {
    // Mock du transporteur Nodemailer
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    // Mock de Puppeteer
    mockPage = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('renderInvoiceHtml', () => {
    it('should generate HTML with invoice data', () => {
      const html = (service as any).renderInvoiceHtml(mockInvoice);

      expect(html).toContain('Ma Société');
      expect(html).toContain('INV-001');
      expect(html).toContain('Client Test');
      expect(html).toContain('Produit A');
      expect(html).toContain('Produit B');
    });
  });

  describe('generatePdf', () => {
    it('should generate a PDF buffer from invoice', async () => {
      const pdfBuffer = await service.generatePdf(mockInvoice);

      expect(puppeteer.launch).toHaveBeenCalledWith({ headless: true });
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.any(String),
        { waitUntil: 'networkidle0' }
      );
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('sendInvoice', () => {
    it('should send an invoice email with PDF attachment', async () => {
      const recipientEmail = 'client@test.com';

      await service.sendInvoice(recipientEmail, mockInvoice);

      expect(puppeteer.launch).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"MonApplication" <mohamedaminechoukani02@gmail.com>',
        to: recipientEmail,
        subject: 'Votre facture #INV-001',
        html: expect.stringContaining('Facture #INV-001'),
        attachments: [
          {
            filename: 'facture-INV-001.pdf',
            content: expect.any(Buffer),
            contentType: 'application/pdf',
          },
        ],
      });
    });

    it('should log success message after sending email', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.sendInvoice('test@example.com', mockInvoice);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Facture #INV-001 envoyée à test@example.com'
      );

      consoleSpy.mockRestore();
    });
  });
});