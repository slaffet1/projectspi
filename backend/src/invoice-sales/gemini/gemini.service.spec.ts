import { Test, TestingModule } from '@nestjs/testing';
import { GeminiService } from './gemini.service';
import Groq from 'groq-sdk';

// Mock du module Groq
jest.mock('groq-sdk');

describe('GeminiService', () => {
  let service: GeminiService;
  let mockGroqClient: any;

  const DEFAULT_LABELS = {
    invoice_title: "FACTURE",
    billed_to: "Facturé à",
    due_date: "Échéance",
    product: "Produit",
    qty: "Qté",
    price: "Prix",
    tax: "TVA",
    total: "Total",
    subtotal: "Sous-total",
    discount: "Remise",
    adjustment: "Ajustement",
    thank_you: "Merci pour votre confiance",
    professional_billing: "Facturation professionnelle",
  };

  const ENGLISH_LABELS = {
    invoice_title: "INVOICE",
    billed_to: "Billed to",
    due_date: "Due date",
    product: "Product",
    qty: "Qty",
    price: "Price",
    tax: "VAT",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    adjustment: "Adjustment",
    thank_you: "Thank you for your trust",
    professional_billing: "Professional billing",
  };

  beforeEach(async () => {
    // Mock de l'instance Groq
    mockGroqClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (Groq as jest.MockedClass<typeof Groq>).mockImplementation(() => mockGroqClient);

    // Mock de la variable d'environnement
    process.env.API_TRANS = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GeminiService],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('translateInvoiceLabels', () => {
    it('should return default labels for French language', async () => {
      const result = await service.translateInvoiceLabels('fr');
      expect(result).toEqual(DEFAULT_LABELS);
      expect(mockGroqClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should return default labels when language is empty', async () => {
      const result = await service.translateInvoiceLabels('');
      expect(result).toEqual(DEFAULT_LABELS);
      expect(mockGroqClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should translate labels to English successfully', async () => {
      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(ENGLISH_LABELS),
            },
          },
        ],
      });

      const result = await service.translateInvoiceLabels('en');

      expect(mockGroqClient.chat.completions.create).toHaveBeenCalledWith({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: expect.stringContaining('English'),
          },
        ],
        temperature: 0.2,
      });

      expect(result).toEqual(ENGLISH_LABELS);
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: `\`\`\`json\n${JSON.stringify(ENGLISH_LABELS)}\n\`\`\``,
            },
          },
        ],
      });

      const result = await service.translateInvoiceLabels('en');

      expect(result).toEqual(ENGLISH_LABELS);
    });

    it('should return default labels when API returns empty response', async () => {
      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await service.translateInvoiceLabels('en');

      expect(result).toEqual(DEFAULT_LABELS);
    });

    it('should return default labels when API returns invalid JSON', async () => {
      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.translateInvoiceLabels('en');

      expect(result).toEqual(DEFAULT_LABELS);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Groq translation error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return default labels when translated JSON has missing keys', async () => {
      const incompleteLabels = {
        invoice_title: "INVOICE",
        billed_to: "Billed to",
        // missing other keys
      };

      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(incompleteLabels),
            },
          },
        ],
      });

      const result = await service.translateInvoiceLabels('en');

      expect(result).toEqual(DEFAULT_LABELS);
    });

    it('should handle API errors gracefully', async () => {
      mockGroqClient.chat.completions.create.mockRejectedValue(
        new Error('API Error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.translateInvoiceLabels('en');

      expect(result).toEqual(DEFAULT_LABELS);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Groq translation error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should include target language in prompt for Arabic', async () => {
      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(DEFAULT_LABELS),
            },
          },
        ],
      });

      await service.translateInvoiceLabels('ar');

      expect(mockGroqClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: "user",
              content: expect.stringContaining('ar'),
            },
          ],
        })
      );
    });
  });
});