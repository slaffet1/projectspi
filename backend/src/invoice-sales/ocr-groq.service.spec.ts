import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { OcrGroqService, PaymentOcrResult } from './ocr.service';

// ─── Référence directe au mock create ────────────────────────────────────────
// Déclarée ICI pour être accessible partout sans hoisting problem
const mockGroqCreate = jest.fn();

// ─── Mocks externes ───────────────────────────────────────────────────────────

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockGroqCreate,
      },
    },
  }));
});

jest.mock('tesseract.js', () => ({
  recognize: jest.fn(),
}));

import * as Tesseract from 'tesseract.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockFile = {
  buffer:       Buffer.from('fake-image'),
  originalname: 'payment.png',
  mimetype:     'image/png',
} as Express.Multer.File;

const fullPaymentResult: PaymentOcrResult = {
  payment_method: 'cheque',
  payment_date:   '2024-03-15',
  amount:         '1500',
  reference:      'REF-001',
  cheque_number:  'CHQ-123',
  bank_name:      'BNA',
  notes:          'Test note',
};

const emptyResult: PaymentOcrResult = {
  payment_method: 'other',
  payment_date:   '',
  amount:         '',
  reference:      '',
  cheque_number:  '',
  bank_name:      '',
  notes:          '',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeGroqResponse(content: string) {
  return {
    choices: [{ message: { content } }],
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('OcrGroqService', () => {
  let service: OcrGroqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrGroqService],
    }).compile();

    service = module.get<OcrGroqService>(OcrGroqService);

    // Reset tous les mocks proprement
    jest.clearAllMocks();
  });

  // ─── imageToText ────────────────────────────────────────────────────────────

  describe('imageToText', () => {
    it('devrait retourner le texte extrait par Tesseract', async () => {
      (Tesseract.recognize as jest.Mock).mockResolvedValue({
        data: { text: 'Chèque BNA 1500 DT' },
      });

      const result = await service.imageToText(mockFile);

      expect(Tesseract.recognize).toHaveBeenCalledWith(
        mockFile.buffer,
        'eng+fra',
      );
      expect(result).toBe('Chèque BNA 1500 DT');
    });

    it('devrait retourner une chaîne vide si data.text est null', async () => {
      (Tesseract.recognize as jest.Mock).mockResolvedValue({
        data: { text: null },
      });

      const result = await service.imageToText(mockFile);
      expect(result).toBe('');
    });

    it('devrait lever InternalServerErrorException si Tesseract échoue', async () => {
      (Tesseract.recognize as jest.Mock).mockRejectedValue(
        new Error('Tesseract crash'),
      );

      await expect(service.imageToText(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("devrait inclure le message d'erreur dans l'exception Tesseract", async () => {
      (Tesseract.recognize as jest.Mock).mockRejectedValue(
        new Error('engine not found'),
      );

      await expect(service.imageToText(mockFile)).rejects.toThrow(
        'Tesseract OCR failed: engine not found',
      );
    });
  });

  // ─── extractPaymentData ─────────────────────────────────────────────────────

  describe('extractPaymentData', () => {
    it('devrait extraire correctement toutes les données depuis Groq', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(JSON.stringify(fullPaymentResult)),
      );

      const result = await service.extractPaymentData('Chèque BNA 1500 DT');
      expect(result).toEqual(fullPaymentResult);
    });

    it('devrait nettoyer les balises markdown ```json``` dans la réponse', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(
          '```json\n' + JSON.stringify(fullPaymentResult) + '\n```',
        ),
      );

      const result = await service.extractPaymentData('Chèque BNA 1500');
      expect(result.payment_method).toBe('cheque');
    });

    it('devrait nettoyer les balises ``` simples', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(
          '```' + JSON.stringify(fullPaymentResult) + '```',
        ),
      );

      const result = await service.extractPaymentData('virement 500');
      expect(result.amount).toBe('1500');
    });

    it('devrait retourner emptyResult si aucun JSON trouvé dans la réponse', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse('Aucun résultat trouvé, désolé.'),
      );

      const result = await service.extractPaymentData('texte incompréhensible');
      expect(result).toEqual(emptyResult);
    });

    it('devrait retourner emptyResult si le JSON est invalide', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse('{ invalid json :::'),
      );

      const result = await service.extractPaymentData('bla bla');
      expect(result).toEqual(emptyResult);
    });

    it('devrait fallback sur "other" si payment_method est invalide', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(
          JSON.stringify({ ...fullPaymentResult, payment_method: 'bitcoin' }),
        ),
      );

      const result = await service.extractPaymentData('paiement inconnu');
      expect(result.payment_method).toBe('other');
    });

    it('devrait fallback sur "other" si payment_method est null', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(
          JSON.stringify({ ...fullPaymentResult, payment_method: null }),
        ),
      );

      const result = await service.extractPaymentData('texte');
      expect(result.payment_method).toBe('other');
    });

    it('devrait accepter "espece" comme payment_method valide', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(
          JSON.stringify({ ...fullPaymentResult, payment_method: 'espece' }),
        ),
      );

      const result = await service.extractPaymentData('cash 200');
      expect(result.payment_method).toBe('espece');
    });

    it('devrait accepter "virement" comme payment_method valide', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(
          JSON.stringify({ ...fullPaymentResult, payment_method: 'virement' }),
        ),
      );

      const result = await service.extractPaymentData('virement bancaire');
      expect(result.payment_method).toBe('virement');
    });

    it('devrait retourner "" pour les champs absents dans le JSON', async () => {
      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(
          JSON.stringify({ payment_method: 'cheque' }),
        ),
      );

      const result = await service.extractPaymentData('chèque sans détails');
      expect(result.payment_date).toBe('');
      expect(result.amount).toBe('');
      expect(result.reference).toBe('');
      expect(result.cheque_number).toBe('');
      expect(result.bank_name).toBe('');
      expect(result.notes).toBe('');
    });

    it('devrait retourner emptyResult si choices est vide', async () => {
      mockGroqCreate.mockResolvedValue({ choices: [] });

      const result = await service.extractPaymentData('texte');
      expect(result).toEqual(emptyResult);
    });

    it("devrait lever InternalServerErrorException si l'API Groq échoue", async () => {
      mockGroqCreate.mockRejectedValue(new Error('API rate limit'));

      await expect(
        service.extractPaymentData('texte'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("devrait inclure le message d'erreur Groq dans l'exception", async () => {
      mockGroqCreate.mockRejectedValue(new Error('timeout'));

      await expect(
        service.extractPaymentData('texte'),
      ).rejects.toThrow('Groq API call failed: timeout');
    });

    it('devrait extraire un JSON imbriqué dans du texte parasite', async () => {
      const json = JSON.stringify({
        payment_method: 'virement',
        amount:         '750',
      });

      mockGroqCreate.mockResolvedValue(
        makeGroqResponse(`Voici le résultat : ${json} fin.`),
      );

      const result = await service.extractPaymentData('VIR 750');
      expect(result.payment_method).toBe('virement');
      expect(result.amount).toBe('750');
    });
  });

  // ─── processImage ───────────────────────────────────────────────────────────

  describe('processImage', () => {
    it('devrait appeler imageToText puis extractPaymentData', async () => {
      const imageToTextSpy = jest
        .spyOn(service, 'imageToText')
        .mockResolvedValue('Chèque BNA 1500 DT référence REF-001');

      const extractSpy = jest
        .spyOn(service, 'extractPaymentData')
        .mockResolvedValue(fullPaymentResult);

      const result = await service.processImage(mockFile);

      expect(imageToTextSpy).toHaveBeenCalledWith(mockFile);
      expect(extractSpy).toHaveBeenCalledWith(
        'Chèque BNA 1500 DT référence REF-001',
      );
      expect(result).toEqual(fullPaymentResult);
    });

    it('devrait retourner emptyResult si le texte OCR est vide', async () => {
      jest.spyOn(service, 'imageToText').mockResolvedValue('');

      const result = await service.processImage(mockFile);
      expect(result).toEqual(emptyResult);
    });

    it('devrait retourner emptyResult si le texte OCR est trop court (< 5 chars)', async () => {
      jest.spyOn(service, 'imageToText').mockResolvedValue('abc');

      const result = await service.processImage(mockFile);
      expect(result).toEqual(emptyResult);
    });

    it('devrait retourner emptyResult si le texte est uniquement des espaces', async () => {
      jest.spyOn(service, 'imageToText').mockResolvedValue('     ');

      const result = await service.processImage(mockFile);
      expect(result).toEqual(emptyResult);
    });

    it('devrait appeler extractPaymentData si le texte est suffisamment long', async () => {
      jest
        .spyOn(service, 'imageToText')
        .mockResolvedValue('Virement bancaire 500 DT');

      const extractSpy = jest
        .spyOn(service, 'extractPaymentData')
        .mockResolvedValue(fullPaymentResult);

      await service.processImage(mockFile);

      expect(extractSpy).toHaveBeenCalledWith('Virement bancaire 500 DT');
    });

    it("devrait propager l'erreur si imageToText lève une exception", async () => {
      jest
        .spyOn(service, 'imageToText')
        .mockRejectedValue(
          new InternalServerErrorException('Tesseract OCR failed'),
        );

      await expect(service.processImage(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("devrait propager l'erreur si extractPaymentData lève une exception", async () => {
      jest
        .spyOn(service, 'imageToText')
        .mockResolvedValue('Chèque valide avec assez de texte');

      jest
        .spyOn(service, 'extractPaymentData')
        .mockRejectedValue(
          new InternalServerErrorException('Groq API call failed'),
        );

      await expect(service.processImage(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ─── emptyResult (structure) ────────────────────────────────────────────────

  describe('emptyResult (structure)', () => {
    it('devrait avoir payment_method à "other" et tous les autres champs vides', async () => {
      jest.spyOn(service, 'imageToText').mockResolvedValue('');

      const result = await service.processImage(mockFile);

      expect(result.payment_method).toBe('other');
      expect(result.payment_date).toBe('');
      expect(result.amount).toBe('');
      expect(result.reference).toBe('');
      expect(result.cheque_number).toBe('');
      expect(result.bank_name).toBe('');
      expect(result.notes).toBe('');
    });
  });
});