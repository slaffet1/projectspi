import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockPrisma = {
  quotes: {
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
  quote_details: {
    deleteMany: jest.fn(),
  },
  clients: {
    findFirst: jest.fn(),
  },
  invoices: {
    count:  jest.fn(),
    create: jest.fn(),
  },
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const businessId = 1;

const mockClient = {
  id:          10,
  name:        'Client Test',
  email:       'client@test.com',
  business_id: businessId,
};

const mockQuoteDetail = {
  id:         1,
  quote_id:   1,
  product_id: 5,
  quantity:   2,
  products:   { id: 5, name: 'Produit A', price: 100 },
};

const mockQuote = {
  id:              1,
  quote_id:        'QT-2024-0001',
  status:          'draft',
  total_amount:    200,
  issue_date:      new Date('2024-01-01'),
  expiration_date: new Date('2024-02-01'),
  client_id:       10,
  clients:         mockClient,
  quote_details:   [mockQuoteDetail],
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('QuotesService', () => {
  let service: QuotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    jest.clearAllMocks();
  });

  // ─── generateQuoteId (via create) ──────────────────────────────────────────

  describe('generateQuoteId', () => {
    it('devrait générer QT-YYYY-0001 si aucun devis existant', async () => {
      const year = new Date().getFullYear();

      mockPrisma.quotes.findFirst.mockResolvedValueOnce(null); // generateQuoteId
      mockPrisma.clients.findFirst.mockResolvedValue(mockClient);
      mockPrisma.quotes.create.mockResolvedValue({
        ...mockQuote,
        quote_id: `QT-${year}-0001`,
      });

      const dto = {
        client_id:       10,
        issue_date:      '2024-01-01',
        expiration_date: '2024-02-01',
        total_amount:    200,
        details:         [{ product_id: 5, quantity: 2 }],
      };

      const result = await service.create(businessId, dto as any);
      expect(result.quote_id).toBe(`QT-${year}-0001`);
    });

    it('devrait incrémenter le numéro si un devis existe déjà', async () => {
      const year = new Date().getFullYear();

      // findFirst pour generateQuoteId renvoie un devis existant
      mockPrisma.quotes.findFirst.mockResolvedValueOnce({
        quote_id: `QT-${year}-0003`,
      });
      mockPrisma.clients.findFirst.mockResolvedValue(mockClient);
      mockPrisma.quotes.create.mockResolvedValue({
        ...mockQuote,
        quote_id: `QT-${year}-0004`,
      });

      const dto = {
        client_id:       10,
        issue_date:      '2024-01-01',
        expiration_date: '2024-02-01',
        total_amount:    200,
        details:         [{ product_id: 5, quantity: 2 }],
      };

      const result = await service.create(businessId, dto as any);
      expect(result.quote_id).toBe(`QT-${year}-0004`);
    });
  });

  // ─── US-33 : create ────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      client_id:       10,
      issue_date:      '2024-01-01',
      expiration_date: '2024-02-01',
      total_amount:    200,
      details:         [{ product_id: 5, quantity: 2 }],
    };

    it('devrait créer un devis avec statut draft par défaut', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValueOnce(null);
      mockPrisma.clients.findFirst.mockResolvedValue(mockClient);
      mockPrisma.quotes.create.mockResolvedValue(mockQuote);

      const result = await service.create(businessId, dto as any);

      expect(mockPrisma.clients.findFirst).toHaveBeenCalledWith({
        where: { id: dto.client_id, business_id: businessId },
      });
      expect(mockPrisma.quotes.create).toHaveBeenCalled();
      expect(result.status).toBe('draft');
    });

    it('devrait lever NotFoundException si le client est introuvable', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValueOnce(null);
      mockPrisma.clients.findFirst.mockResolvedValue(null);

      await expect(service.create(businessId, dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait utiliser le statut fourni dans le DTO', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValueOnce(null);
      mockPrisma.clients.findFirst.mockResolvedValue(mockClient);
      mockPrisma.quotes.create.mockResolvedValue({
        ...mockQuote,
        status: 'sent',
      });

      const result = await service.create(businessId, {
        ...dto,
        status: 'sent',
      } as any);

      expect(result.status).toBe('sent');
    });
  });

  // ─── US-36 : findAll ───────────────────────────────────────────────────────

  describe('findAll', () => {
    it('devrait retourner tous les devis du business', async () => {
      mockPrisma.quotes.findMany.mockResolvedValue([mockQuote]);

      const result = await service.findAll(businessId);

      expect(mockPrisma.quotes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clients: { business_id: businessId } },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('devrait retourner un tableau vide si aucun devis', async () => {
      mockPrisma.quotes.findMany.mockResolvedValue([]);

      const result = await service.findAll(businessId);
      expect(result).toEqual([]);
    });
  });

  // ─── US-37 : findOne ───────────────────────────────────────────────────────

  describe('findOne', () => {
    it('devrait retourner le devis correspondant', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(mockQuote);

      const result = await service.findOne(businessId, 1);

      expect(mockPrisma.quotes.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, clients: { business_id: businessId } },
        }),
      );
      expect(result).toEqual(mockQuote);
    });

    it('devrait lever NotFoundException si le devis est introuvable', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(null);

      await expect(service.findOne(businessId, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── US-34 : update ────────────────────────────────────────────────────────

  describe('update', () => {
    const dto = {
      total_amount: 300,
      details:      [{ product_id: 5, quantity: 3 }],
    };

    it('devrait mettre à jour un devis en statut draft', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(mockQuote); // draft
      mockPrisma.quote_details.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.quotes.update.mockResolvedValue({
        ...mockQuote,
        total_amount: 300,
      });

      const result = await service.update(businessId, 1, dto as any);

      expect(mockPrisma.quote_details.deleteMany).toHaveBeenCalledWith({
        where: { quote_id: 1 },
      });
      expect(result.total_amount).toBe(300);
    });

    it('devrait lever ForbiddenException si le devis n\'est pas en draft', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'sent',
      });

      await expect(
        service.update(businessId, 1, dto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('devrait lever NotFoundException si le devis est introuvable', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(null);

      await expect(
        service.update(businessId, 99, dto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── US-35 : send ──────────────────────────────────────────────────────────

  describe('send', () => {
    it('devrait passer un devis draft à sent', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(mockQuote); // draft
      mockPrisma.quotes.update.mockResolvedValue({
        ...mockQuote,
        status: 'sent',
      });

      const result = await service.send(businessId, 1);
      expect(result.status).toBe('sent');
    });

    it('devrait lever ForbiddenException si le statut ne permet pas l\'envoi', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'accepted',
      });

      await expect(service.send(businessId, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('devrait lever NotFoundException si le devis est introuvable', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(null);

      await expect(service.send(businessId, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('devrait autoriser la transition sent → accepted', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'sent',
      });
      mockPrisma.quotes.update.mockResolvedValue({
        ...mockQuote,
        status: 'accepted',
      });

      const result = await service.updateStatus(businessId, 1, 'accepted');
      expect(result.status).toBe('accepted');
    });

    it('devrait autoriser la transition sent → rejected', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'sent',
      });
      mockPrisma.quotes.update.mockResolvedValue({
        ...mockQuote,
        status: 'rejected',
      });

      const result = await service.updateStatus(businessId, 1, 'rejected');
      expect(result.status).toBe('rejected');
    });

    it('devrait autoriser la transition draft → cancelled', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(mockQuote); // draft
      mockPrisma.quotes.update.mockResolvedValue({
        ...mockQuote,
        status: 'cancelled',
      });

      const result = await service.updateStatus(businessId, 1, 'cancelled');
      expect(result.status).toBe('cancelled');
    });

    it('devrait lever ForbiddenException pour une transition interdite', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'rejected',
      });

      await expect(
        service.updateStatus(businessId, 1, 'accepted'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('devrait lever NotFoundException si le devis est introuvable', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(businessId, 99, 'sent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── US-38 : convertToInvoice ──────────────────────────────────────────────

  describe('convertToInvoice', () => {
    it('devrait convertir un devis accepté en facture', async () => {
      const acceptedQuote = { ...mockQuote, status: 'accepted' };
      mockPrisma.quotes.findFirst.mockResolvedValue(acceptedQuote);
      mockPrisma.invoices.count.mockResolvedValue(3);
      mockPrisma.invoices.create.mockResolvedValue({
        id:             1,
        invoice_number: `INV-${new Date().getFullYear()}-0004`,
        status:         'draft',
        total_amount:   200,
        quote_id:       1,
      });
      mockPrisma.quotes.update.mockResolvedValue({
        ...acceptedQuote,
        status: 'converted',
      });

      const result = await service.convertToInvoice(businessId, 1);

      expect(mockPrisma.invoices.create).toHaveBeenCalled();
      expect(mockPrisma.quotes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data:  { status: 'converted' },
      });
      expect(result.invoice_number).toContain('INV-');
    });

    it('devrait lever ForbiddenException si le devis n\'est pas accepté', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'sent',
      });

      await expect(
        service.convertToInvoice(businessId, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('devrait lever NotFoundException si le devis est introuvable', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(null);

      await expect(
        service.convertToInvoice(businessId, 99),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait générer un numéro de facture avec padding correct', async () => {
      const year = new Date().getFullYear();
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'accepted',
      });
      mockPrisma.invoices.count.mockResolvedValue(0);
      mockPrisma.invoices.create.mockResolvedValue({
        id:             1,
        invoice_number: `INV-${year}-0001`,
        status:         'draft',
        total_amount:   200,
        quote_id:       1,
      });
      mockPrisma.quotes.update.mockResolvedValue({});

      const result = await service.convertToInvoice(businessId, 1);
      expect(result.invoice_number).toBe(`INV-${year}-0001`);
    });
  });

  // ─── US-39 : remove ────────────────────────────────────────────────────────

  describe('remove', () => {
    it('devrait supprimer un devis en statut draft', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(mockQuote); // draft
      mockPrisma.quote_details.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.quotes.delete.mockResolvedValue(mockQuote);

      const result = await service.remove(businessId, 1);

      expect(mockPrisma.quote_details.deleteMany).toHaveBeenCalledWith({
        where: { quote_id: 1 },
      });
      expect(mockPrisma.quotes.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result.message).toBe('Devis supprimé avec succès');
    });

    it('devrait supprimer un devis en statut cancelled', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'cancelled',
      });
      mockPrisma.quote_details.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.quotes.delete.mockResolvedValue(mockQuote);

      const result = await service.remove(businessId, 1);
      expect(result.message).toBe('Devis supprimé avec succès');
    });

    it('devrait lever ForbiddenException si le statut est sent', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'sent',
      });

      await expect(service.remove(businessId, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('devrait lever ForbiddenException si le statut est accepted', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue({
        ...mockQuote,
        status: 'accepted',
      });

      await expect(service.remove(businessId, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('devrait lever NotFoundException si le devis est introuvable', async () => {
      mockPrisma.quotes.findFirst.mockResolvedValue(null);

      await expect(service.remove(businessId, 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});