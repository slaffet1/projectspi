import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InvoicesController } from './invoice-controller.controller'; 
import { InvoicesService } from '../invoice/invoice.service';
import { EmailService } from '../email/email.service';
import { GeminiService } from '../gemini/gemini.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from 'src/permissions/permissions/permissions.guard';

const mockInvoicesService = {
  getBanksByBusiness: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
  markAsPaidWithTrace: jest.fn(),
  getPaymentTrace: jest.fn(),
  getUnpaid: jest.fn(),
  updateDueDate: jest.fn(),
  deleteInvoice: jest.fn(),
};

const mockEmailService = {
  sendInvoice: jest.fn(),
};

const mockGeminiService = {
  translateInvoiceLabels: jest.fn(),
};

const BUSINESS_ID = 1;

describe('InvoicesController', () => {
  let controller: InvoicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        { provide: InvoicesService, useValue: mockInvoicesService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: GeminiService, useValue: mockGeminiService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InvoicesController>(InvoicesController);
    jest.clearAllMocks();
  });

  describe('translateLabels', () => {
    it('should throw HttpException with INTERNAL_SERVER_ERROR status', async () => {
      mockGeminiService.translateInvoiceLabels.mockRejectedValue(new Error('AI error'));

      try {
        await controller.translateLabels(BUSINESS_ID, 'fr');
      } catch (err) {
        if (err instanceof HttpException) {
          expect(err.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        } else {
          fail('Expected HttpException');
        }
      }
    });
  });
});