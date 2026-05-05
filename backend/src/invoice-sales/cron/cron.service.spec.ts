import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceCron } from './cron.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('InvoiceCron', () => {
  let service: InvoiceCron;

  const mockPrismaService = {
    invoices: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }), // ✅ Mock par défaut
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.invoices.updateMany.mockResolvedValue({ count: 0 }); // ✅ Reset avant chaque test

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceCron,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvoiceCron>(InvoiceCron);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markUnpaidInvoicesAtStartup', () => {
    it('should update invoices to unpaid on startup', async () => {
      mockPrismaService.invoices.updateMany.mockResolvedValue({ count: 3 });

      await service.markUnpaidInvoicesAtStartup();

      expect(mockPrismaService.invoices.updateMany).toHaveBeenCalledWith({
        where: {
          due_date: {
            lt: expect.any(Date),
          },
          status: { notIn: ['paid', 'unpaid', 'late_paid'] },
        },
        data: {
          status: 'unpaid',
        },
      });
    });
  });

  describe('markUnpaidInvoices', () => {
    it('should update invoices to unpaid via cron', async () => {
      mockPrismaService.invoices.updateMany.mockResolvedValue({ count: 5 });

      await service.markUnpaidInvoices();

      expect(mockPrismaService.invoices.updateMany).toHaveBeenCalledWith({
        where: {
          due_date: {
            lt: expect.any(Date),
          },
          status: { notIn: ['paid', 'unpaid'] },
        },
        data: {
          status: 'unpaid',
        },
      });
    });
  });
});