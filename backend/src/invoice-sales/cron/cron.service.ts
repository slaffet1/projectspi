import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InvoiceCron {
  constructor(private prisma: PrismaService) {
    this.markUnpaidInvoicesAtStartup();
  }

  async markUnpaidInvoicesAtStartup() {
    const now = new Date();

    const result = await this.prisma.invoices.updateMany({
      where: {
        due_date: {
          lt: now,
        },
        status: { notIn: ['paid', 'unpaid'] },
      },
      data: {
        status: 'unpaid',
      },
    });

    console.log(`[Startup] ${result.count} factures mises à jour en unpaid`);
  }

  @Cron('0 0 * * *')
  async markUnpaidInvoices() {
    const now = new Date();

    const result = await this.prisma.invoices.updateMany({
      where: {
        due_date: {
          lt: now, 
        },
        status: { notIn: ['paid', 'unpaid'] }
      },
      data: {
        status: 'unpaid',
      },
    });

    console.log(`[Cron] ${result.count} factures mises à jour en unpaid`);
  }
}