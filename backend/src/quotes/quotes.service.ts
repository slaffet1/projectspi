import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

// Allowed status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft:     ['sent', 'cancelled'],
  sent:      ['accepted', 'rejected', 'cancelled'],
  accepted:  ['converted'],
  rejected:  [],
  cancelled: [],
  converted: [],
};

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async generateQuoteId(businessId: number): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await this.prisma.quotes.count({
      where: { clients: { business_id: businessId } },
    });
    const pad = String(count + 1).padStart(4, '0');
    return `QT-${year}-${pad}`;
  }

  private async assertBelongsToBusiness(id: number, businessId: number) {
    const quote = await this.prisma.quotes.findFirst({
      where: { id, clients: { business_id: businessId } },
      include: {
        clients:       true,
        quote_details: {
          include: {
            products: true,
          },
        },
      },
    });
    if (!quote) throw new NotFoundException('Devis introuvable');
    return quote;
  }

  // ─── US-33: Create quote ─────────────────────────────────────────────────

  async create(businessId: number, dto: CreateQuoteDto) {
    const quoteId = await this.generateQuoteId(businessId);

    // Verify client belongs to the business
    const client = await this.prisma.clients.findFirst({
      where: { id: dto.client_id, business_id: businessId },
    });
    if (!client) throw new NotFoundException('Client introuvable');

    return this.prisma.quotes.create({
      data: {
        quote_id:        quoteId,
        issue_date:      new Date(dto.issue_date),
        expiration_date: new Date(dto.expiration_date),
        total_amount:    dto.total_amount,
        status:          dto.status ?? 'draft',
        client_id:       dto.client_id,
        quote_details: {
          create: dto.details.map((d) => ({
            product_id: d.product_id,
            quantity:   d.quantity,
          })),
        },
      },
      include: {
        clients:       true,
        quote_details: { include: { products: true } },
      },
    });
  }

  // ─── US-36: List all quotes for a business ───────────────────────────────

  async findAll(businessId: number) {
    return this.prisma.quotes.findMany({
      where: { clients: { business_id: businessId } },
      include: {
        clients:       { select: { id: true, name: true, email: true } },
        quote_details: { include: { products: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── US-37: Get single quote ─────────────────────────────────────────────

  async findOne(businessId: number, id: number) {
    return this.assertBelongsToBusiness(id, businessId);
  }

  // ─── US-34: Edit draft quote ─────────────────────────────────────────────

  async update(businessId: number, id: number, dto: UpdateQuoteDto) {
    const quote = await this.assertBelongsToBusiness(id, businessId);

    if (quote.status !== 'draft') {
      throw new ForbiddenException(
        'Seuls les devis en brouillon peuvent être modifiés',
      );
    }

    // Delete existing details and recreate
    await this.prisma.quote_details.deleteMany({ where: { quote_id: id } });

    return this.prisma.quotes.update({
      where: { id },
      data: {
        issue_date:      dto.issue_date      ? new Date(dto.issue_date)      : undefined,
        expiration_date: dto.expiration_date ? new Date(dto.expiration_date) : undefined,
        total_amount:    dto.total_amount,
        client_id:       dto.client_id,
        quote_details: dto.details
          ? {
              create: dto.details.map((d) => ({
                product_id: d.product_id,
                quantity:   d.quantity,
              })),
            }
          : undefined,
      },
      include: {
        clients:       true,
        quote_details: { include: { products: true } },
      },
    });
  }

  // ─── US-35: Send quote (mark as sent) ────────────────────────────────────

  async send(businessId: number, id: number) {
    const quote = await this.assertBelongsToBusiness(id, businessId);

    const currentStatus = quote.status ?? 'draft';
    
    if (!STATUS_TRANSITIONS[currentStatus]?.includes('sent')) {
      throw new ForbiddenException(
        `Impossible d'envoyer un devis avec le statut "${quote.status}"`,
      );
    }

    return this.prisma.quotes.update({
      where: { id },
      data:  { status: 'sent' },
      include: { clients: true, quote_details: { include: { products: true } } },
    });
  }

  // ─── Status transition (generic) ─────────────────────────────────────────

  async updateStatus(businessId: number, id: number, newStatus: string) {
    const quote = await this.assertBelongsToBusiness(id, businessId);

    const currentStatus = quote.status ?? 'draft';
    const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(newStatus)) {
      throw new ForbiddenException(
        `Transition "${quote.status}" → "${newStatus}" non autorisée`,
      );
    }

    return this.prisma.quotes.update({
      where: { id },
      data:  { status: newStatus },
      include: { clients: true, quote_details: { include: { products: true } } },
    });
  }

  // ─── US-38: Convert quote to invoice ─────────────────────────────────────

  async convertToInvoice(businessId: number, id: number) {
    const quote = await this.assertBelongsToBusiness(id, businessId);

    if (quote.status !== 'accepted') {
      throw new ForbiddenException(
        'Seuls les devis acceptés peuvent être convertis en facture',
      );
    }

    // Generate invoice number
    const year         = new Date().getFullYear();
    const invoiceCount = await this.prisma.invoices.count();
    const invoiceNum   = `INV-${year}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Due date = 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await this.prisma.invoices.create({
      data: {
        invoice_number: invoiceNum,
        issue_date:     new Date(),
        due_date:       dueDate,
        total_amount:   quote.total_amount,
        tax_amount:     0,
        status:         'draft',
        quote_id:       quote.id,
      },
    });

    // Mark quote as converted
    await this.prisma.quotes.update({
      where: { id },
      data:  { status: 'converted' },
    });

    return invoice;
  }

  // ─── US-39: Delete draft quote ───────────────────────────────────────────

  async remove(businessId: number, id: number) {
    const quote = await this.assertBelongsToBusiness(id, businessId);

    const currentStatus = quote.status ?? 'draft';
    if (!['draft', 'cancelled'].includes(currentStatus)) {
      throw new ForbiddenException(
        'Seuls les devis en brouillon ou annulés peuvent être supprimés',
      );
    }

    // Cascade delete details first
    await this.prisma.quote_details.deleteMany({ where: { quote_id: id } });
    await this.prisma.quotes.delete({ where: { id } });

    return { message: 'Devis supprimé avec succès' };
  }
}