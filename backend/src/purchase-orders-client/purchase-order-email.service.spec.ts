import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderEmailService } from './PurchaseOrderEmailService.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mocks externes ───────────────────────────────────────────────────────────

// Mock nodemailer — pas de variable externe à cause du hoisting
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

// Mock playwright — même raison
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf:        jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

// ─── Imports après les mocks ──────────────────────────────────────────────────
import * as nodemailer from 'nodemailer';
import { chromium } from 'playwright';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
const mockPrisma = {};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const mockOrder = {
  id:           1,
  order_number: 'PO-2024-0001',
  clients: {
    name:  'Client Test',
    email: 'client@test.com',
    businesses: {
      name: 'Ma Société',
    },
  },
  order_details: [
    {
      quantity: 2,
      products: {
        name:       'Produit A',
        unit_price: 100,
        tax_rate:   19,
      },
    },
    {
      quantity: 1,
      products: {
        name:       'Produit B',
        unit_price: 50,
        tax_rate:   7,
      },
    },
  ],
};

// ─── Helpers pour accéder aux mocks ──────────────────────────────────────────
const getMockPage = async () => {
  const browser = await (chromium.launch as jest.Mock).mock.results[0]?.value;
  return browser;
};

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('PurchaseOrderEmailService', () => {
  let service: PurchaseOrderEmailService;

  // Références aux fonctions mockées
  let mockSendMail:    jest.Mock;
  let mockLaunch:      jest.Mock;
  let mockNewPage:     jest.Mock;
  let mockSetContent:  jest.Mock;
  let mockPdf:         jest.Mock;
  let mockClose:       jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderEmailService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PurchaseOrderEmailService>(PurchaseOrderEmailService);

    // Récupérer les références mockées APRÈS les imports
    mockSendMail   = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;
    mockLaunch     = chromium.launch as jest.Mock;
    mockPdf        = jest.fn().mockResolvedValue(Buffer.from('fake-pdf'));
    mockClose      = jest.fn().mockResolvedValue(undefined);
    mockSetContent = jest.fn().mockResolvedValue(undefined);
    mockNewPage    = jest.fn().mockResolvedValue({
      setContent: mockSetContent,
      pdf:        mockPdf,
    });

    // Réinitialiser launch pour retourner une nouvelle page fraîche
    mockLaunch.mockResolvedValue({
      newPage: mockNewPage,
      close:   mockClose,
    });

    mockSendMail.mockClear();
    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
  });

  // ─── renderOrderHtml (via generatePdf) ──────────────────────────────────────

  describe('renderOrderHtml', () => {
    it('devrait appeler setContent avec un HTML contenant le numéro de commande', async () => {
      await service.generatePdf(mockOrder);

      expect(mockSetContent).toHaveBeenCalledTimes(1);
      const html: string = mockSetContent.mock.calls[0][0];
      expect(html).toContain('PO-2024-0001');
    });

    it('devrait inclure le nom du business dans le HTML', async () => {
      await service.generatePdf(mockOrder);

      const html: string = mockSetContent.mock.calls[0][0];
      expect(html).toContain('Ma Société');
    });

    it('devrait inclure le nom et email du client dans le HTML', async () => {
      await service.generatePdf(mockOrder);

      const html: string = mockSetContent.mock.calls[0][0];
      expect(html).toContain('Client Test');
      expect(html).toContain('client@test.com');
    });

    it('devrait inclure les noms des produits dans le HTML', async () => {
      await service.generatePdf(mockOrder);

      const html: string = mockSetContent.mock.calls[0][0];
      expect(html).toContain('Produit A');
      expect(html).toContain('Produit B');
    });

    it('devrait calculer et afficher le total correct', async () => {
      // Subtotal : 2*100 + 1*50 = 250
      // Tax      : 2*100*0.19 + 1*50*0.07 = 38 + 3.5 = 41.5
      // Total    : 291.50
      await service.generatePdf(mockOrder);

      const html: string = mockSetContent.mock.calls[0][0];
      expect(html).toContain('291.50');
    });

    it('devrait utiliser "Business" par défaut si businesses est absent', async () => {
      const orderSansBusinesses = {
        ...mockOrder,
        clients: { name: 'Client', email: 'c@c.com' },
      };

      await service.generatePdf(orderSansBusinesses);

      const html: string = mockSetContent.mock.calls[0][0];
      expect(html).toContain('Business');
    });

    it('devrait gérer un order_details vide sans erreur', async () => {
      const orderVide = { ...mockOrder, order_details: [] };

      await service.generatePdf(orderVide);

      const html: string = mockSetContent.mock.calls[0][0];
      expect(html).toContain('PO-2024-0001');
    });

    it('devrait afficher 0% de TVA si tax_rate absent', async () => {
      const orderSansTax = {
        ...mockOrder,
        order_details: [
          {
            quantity: 1,
            products: { name: 'Produit C', unit_price: 80 },
          },
        ],
      };

      await service.generatePdf(orderSansTax);

      const html: string = mockSetContent.mock.calls[0][0];
      expect(html).toContain('0%');
    });
  });

  // ─── generatePdf ────────────────────────────────────────────────────────────

  describe('generatePdf', () => {
    it('devrait lancer chromium en mode headless', async () => {
      await service.generatePdf(mockOrder);

      expect(mockLaunch).toHaveBeenCalledWith({ headless: true });
    });

    it('devrait ouvrir une nouvelle page', async () => {
      await service.generatePdf(mockOrder);

      expect(mockNewPage).toHaveBeenCalledTimes(1);
    });

    it('devrait appeler page.pdf avec le format A4', async () => {
      await service.generatePdf(mockOrder);

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'A4' }),
      );
    });

    it('devrait fermer le browser après génération', async () => {
      await service.generatePdf(mockOrder);

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('devrait retourner un Buffer', async () => {
      const result = await service.generatePdf(mockOrder);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('devrait appeler setContent avec waitUntil networkidle', async () => {
      await service.generatePdf(mockOrder);

      expect(mockSetContent).toHaveBeenCalledWith(
        expect.any(String),
        { waitUntil: 'networkidle' },
      );
    });

    it('devrait inclure les marges dans l\'appel pdf', async () => {
      await service.generatePdf(mockOrder);

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: {
            top:    '20px',
            bottom: '20px',
            left:   '20px',
            right:  '20px',
          },
        }),
      );
    });
  });

  // ─── sendPurchaseOrder ──────────────────────────────────────────────────────

  describe('sendPurchaseOrder', () => {
    it('devrait appeler generatePdf avant d\'envoyer l\'email', async () => {
      const generatePdfSpy = jest
        .spyOn(service, 'generatePdf')
        .mockResolvedValue(Buffer.from('pdf'));

      await service.sendPurchaseOrder('client@test.com', mockOrder);

      expect(generatePdfSpy).toHaveBeenCalledWith(mockOrder);
    });

    it('devrait envoyer un email à la bonne adresse', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));

      await service.sendPurchaseOrder('client@test.com', mockOrder);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'client@test.com' }),
      );
    });

    it('devrait inclure le numéro de commande dans le sujet', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));

      await service.sendPurchaseOrder('client@test.com', mockOrder);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('PO-2024-0001'),
        }),
      );
    });

    it('devrait joindre le PDF avec le bon nom de fichier', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));

      await service.sendPurchaseOrder('client@test.com', mockOrder);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename:    'purchase-order-PO-2024-0001.pdf',
              contentType: 'application/pdf',
            }),
          ]),
        }),
      );
    });

    it('devrait inclure les liens accept et reject dans le HTML', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));

      await service.sendPurchaseOrder('client@test.com', mockOrder);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('action=accept');
      expect(callArgs.html).toContain('action=reject');
    });

    it('devrait inclure l\'id de la commande dans les URLs de réponse', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));

      await service.sendPurchaseOrder('client@test.com', mockOrder);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('/1/respond');
    });

    it('devrait inclure le nom du client dans le corps de l\'email', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));

      await service.sendPurchaseOrder('client@test.com', mockOrder);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Client Test');
    });

    it('devrait utiliser le nom du business dans le champ from', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));

      await service.sendPurchaseOrder('client@test.com', mockOrder);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.from).toContain('Ma Société');
    });

    it('devrait utiliser "Business" par défaut si businesses est absent', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));

      const orderSansBusinesses = {
        ...mockOrder,
        clients: { name: 'Client', email: 'c@c.com' },
      };

      await service.sendPurchaseOrder('c@c.com', orderSansBusinesses);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.from).toContain('Business');
    });

    it('devrait propager l\'erreur si sendMail échoue', async () => {
      jest.spyOn(service, 'generatePdf').mockResolvedValue(Buffer.from('pdf'));
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        service.sendPurchaseOrder('client@test.com', mockOrder),
      ).rejects.toThrow('SMTP error');
    });

    it('devrait propager l\'erreur si generatePdf échoue', async () => {
      jest
        .spyOn(service, 'generatePdf')
        .mockRejectedValue(new Error('PDF generation failed'));

      await expect(
        service.sendPurchaseOrder('client@test.com', mockOrder),
      ).rejects.toThrow('PDF generation failed');
    });
  });
});