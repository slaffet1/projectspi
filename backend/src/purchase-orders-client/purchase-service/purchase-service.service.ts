import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft:     ['sent', 'cancelled'],
  sent:      ['confirmed', 'cancelled'],
  confirmed: ['invoiced'],
  invoiced:  [],
  cancelled: [],
};

@Injectable()
export class PurchaseServiceService {
constructor(private prisma: PrismaService) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async generateOrderNumber(businessId: number): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await this.prisma.purchase_orders_client.count({
      where: { clients: { business_id: businessId } },
    });
    return `BC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async assertBelongsToBusiness(id: number, businessId: number) {
    const order = await this.prisma.purchase_orders_client.findFirst({
      where: { id, clients: { business_id: businessId } },
      include: {
        clients:      true,
        order_details: { include: { products: true } },
      },
    });
    if (!order) throw new NotFoundException('Bon de commande introuvable');
    return order;
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(businessId: number, dto: CreatePurchaseOrderDto) {
    const orderNumber = await this.generateOrderNumber(businessId);

    const client = await this.prisma.clients.findFirst({
      where: { id: dto.client_id, business_id: businessId },
    });
    if (!client) throw new NotFoundException('Client introuvable');

    return this.prisma.purchase_orders_client.create({
      data: {
        order_number:    orderNumber,
        issue_date:      new Date(dto.issue_date),
        expiration_date: new Date(dto.expiration_date),
        total_amount:    dto.total_amount,
        status:          dto.status ?? 'draft',
        client_id:       dto.client_id,
        order_details: {
          create: dto.details.map((d) => ({
            product_id: d.product_id,
            quantity:   d.quantity,
          })),
        },
      },
      include: {
        clients:      true,
        order_details: { include: { products: true } },
      },
    });
  }


  async findAll(businessId: number) {
    return this.prisma.purchase_orders_client.findMany({
      where: { clients: { business_id: businessId } },
      include: {
        clients:      { select: { id: true, name: true, email: true } },
        order_details: { include: { products: true } },
        invoices:     { select: { id: true, invoice_number: true, status: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  

  async findOne(businessId: number, id: number) {
    return this.assertBelongsToBusiness(id, businessId);
  }


  async update(businessId: number, id: number, dto: UpdatePurchaseOrderDto) {
    const order = await this.assertBelongsToBusiness(id, businessId);

    if (order.status !== 'draft') {
      throw new ForbiddenException(
        'Seuls les bons de commande en brouillon peuvent être modifiés',
      );
    }

    await this.prisma.purchase_order_client_details.deleteMany({ where: { order_id: id } });

    return this.prisma.purchase_orders_client.update({
      where: { id },
      data: {
        issue_date:      dto.issue_date      ? new Date(dto.issue_date)      : undefined,
        expiration_date: dto.expiration_date ? new Date(dto.expiration_date) : undefined,
        total_amount:    dto.total_amount,
        client_id:       dto.client_id,
        order_details: dto.details
          ? { create: dto.details.map((d) => ({ product_id: d.product_id, quantity: d.quantity })) }
          : undefined,
      },
      include: {
        clients:      true,
        order_details: { include: { products: true } },
      },
    });
  }

  

  async updateStatus(businessId: number, id: number, newStatus: string) {
    const order = await this.assertBelongsToBusiness(id, businessId);

    const currentStatus = order.status ?? 'draft';
    const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(newStatus)) {
      throw new ForbiddenException(
        `Transition "${order.status}" → "${newStatus}" non autorisée`,
      );
    }

    return this.prisma.purchase_orders_client.update({
      where: { id },
      data:  { status: newStatus },
      include: { clients: true, order_details: { include: { products: true } } },
    });
  }

  

  async convertToInvoice(businessId: number, id: number, dto: { issue_date: string; due_date: string; bank_id?: number }) {
    const order = await this.assertBelongsToBusiness(id, businessId);
/*
    if (order.status !== 'confirmed') {
      throw new ForbiddenException(
        'Seuls les bons de commande confirmés peuvent être convertis en facture',
      );
    }
*/
    
    let tax = 0;
    order.order_details.forEach((item) => {
      const price = Number((item.products as any)?.unit_price || 0);
      const tva   = Number((item.products as any)?.tax_rate   || 0);
      const ht    = item.quantity * price;
      tax += ht * (tva / 100);
    });

    const business = await this.prisma.businesses.findUnique({
      where:  { id: businessId },
      select: { invoice_prefix: true },
    });

    const prefix = business?.invoice_prefix ;
    const year   = String(new Date().getFullYear());

    const count = await this.prisma.invoices.count({
      where: { invoice_number: { startsWith: `${prefix}-${year}` } },
    });

    const invoiceNumber = `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;

    const [invoice] = await this.prisma.$transaction([
      this.prisma.invoices.create({
        data: {
          invoice_number:    invoiceNumber,
          issue_date:        new Date(dto.issue_date),
          due_date:          new Date(dto.due_date),
          total_amount:      order.total_amount,
          tax_amount:        tax,
          status:            'draft',
          purchase_order_id: order.id,
          bank_id:           dto.bank_id ?? null,
        } as any,
      }),
      this.prisma.purchase_orders_client.update({
        where: { id: order.id },
        data:  { status: 'invoiced' },
      }),
    ]);

    return invoice;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async remove(businessId: number, id: number) {
    const order = await this.assertBelongsToBusiness(id, businessId);

    if (!['draft', 'cancelled'].includes(order.status ?? 'draft')) {
      throw new ForbiddenException(
        'Seuls les bons de commande en brouillon ou annulés peuvent être supprimés',
      );
    }

    await this.prisma.purchase_order_client_details.deleteMany({ where: { order_id: id } });
    await this.prisma.purchase_orders_client.delete({ where: { id } });

    return { message: 'Bon de commande supprimé avec succès' };
  }
}



