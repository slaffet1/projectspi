import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import PDFDocument = require('pdfkit');
@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) { }

  async create(businessId: number, dto: any) {
    const { quote_id, issue_date, due_date,bank_id,total:totall } = dto;

    const quote = await this.prisma.quotes.findUnique({
      where: { id: quote_id },
      include: {
        quote_details: {
          include: { products: true },
        },
        clients: true,
      },
    });

    if (!quote) throw new NotFoundException('Quote not found');


    const business = await this.prisma.businesses.findUnique({
      where: { id: businessId },
      select: { invoice_prefix: true },
    });


    let total = 0;
    let tax = 0;

    quote.quote_details.forEach((item) => {
      const price = Number(item.products?.unit_price || 0);
      const tva = Number(item.products?.tax_rate || 0);

      const ht = item.quantity * price;
      total += ht;
      tax += ht * (tva / 100);
    });


    const prefix = business?.invoice_prefix || "INV";


    const now = new Date();

    const year = String(now.getFullYear());



    const todayInvoicesCount = await this.prisma.invoices.count({
      where: {
        invoice_number: { startsWith: `${prefix}-${year}` },
      },
    });
    const sequence = String(todayInvoicesCount + 1).padStart(3, "0");

    const invoiceNumber = `${prefix}-${year}-${sequence}`;
    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoices.create({
        data: {
          invoice_number: invoiceNumber,
          issue_date: new Date(issue_date),
          due_date: new Date(due_date),
          total_amount: totall,
          tax_amount: tax,
          status: 'draft',
          quote_id: quote.id,
          bank_id: bank_id ?? null
        }as any,
      }),
      this.prisma.quotes.update({
        where: { id: quote.id },
        data: { status: 'converted' },
      }),
    ]);
    return invoice;

  }
async getBanksByBusiness(businessId: number) {
  return this.prisma.banks.findMany({
    where: { business_id: businessId },
  });
}
  async findAll(businessId: number) {
    return this.prisma.invoices.findMany({
      where: {
        quotes: {
          clients: {
            business_id: businessId,
          },
        },
      },
      include: {
        quotes: {
          include: {
            clients: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
    async findOne(businessId: number, id: number) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
      include: {
        bank: true, 
        quotes: {
          include: {
            clients: {
              include: {
                businesses: true,
              },
            },
            quote_details: {
              include: {
                products: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

async updateStatus(id: number, status: string) {
  const invoice = await this.prisma.invoices.findUnique({
    where: { id },
  });

  if (!invoice) throw new NotFoundException('Invoice not found');

  if (
    (status === 'paid' || status === 'late_paid') &&
    (invoice.status === 'paid' || invoice.status === 'late_paid')
  ) {
    throw new Error('Facture déjà payée');
  }

  const updatedInvoice = await this.prisma.invoices.update({
    where: { id },
    data: { status },
  });

  if (
    (status === 'paid' || status === 'late_paid') &&
    invoice.bank_id
  ) {
    await this.prisma.banks.update({
      where: { id: invoice.bank_id },
      data: {
        balance: {
          increment: invoice.total_amount,
        },
      },
    });
  }

  return updatedInvoice;
}
  async getUnpaid(businessId: number) {
    return this.prisma.invoices.findMany({
      where: {
        status: 'unpaid',
      },
      orderBy: { due_date: 'desc' },
    });
  }
 

  async deleteInvoice(id: number) {
    const invoice = await this.prisma.invoices.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.prisma.invoices.delete({ where: { id } });
  }

  async updateDueDate(id: number, newDueDate: string | Date) {
    if (!newDueDate) throw new Error("La date d’échéance est obligatoire");

    const dueDateObj = new Date(newDueDate);
    if (isNaN(dueDateObj.getTime())) throw new Error("Date invalide");


    const invoice = await this.prisma.invoices.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException("Invoice not found");


    const updateData: any = { due_date: dueDateObj };


    if (
      invoice.status === "unpaid"
    ) {
      updateData.status = "draft";
    }

    return this.prisma.invoices.update({
      where: { id },
      data: updateData,
    });
  }
  
}