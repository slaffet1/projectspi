import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditNoteDto } from './credit-notes-dto.dto';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class CreditNotesService {
    constructor(private readonly prisma: PrismaService) { }

    // ─────────────────────────────────────────────
    // GET ALL credit notes for a business
    // ─────────────────────────────────────────────
    async getAll(businessId: number) {
        return this.prisma.credit_notes.findMany({
            where: { business_id: businessId },
            include: {
                clients: true,
                invoices: {
                    select: { id: true, invoice_number: true },
                },
                delivery_notes: {
                    select: { id: true, delivery_number: true },
                },
                credit_note_items: {
                    include: { products: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }


    async getOne(businessId: number, id: number) {
        const note = await this.prisma.credit_notes.findFirst({
            where: { id, business_id: businessId },
            include: {
                clients: true,
                invoices: {
                    select: { id: true, invoice_number: true },
                },
                delivery_notes: {
                    select: { id: true, delivery_number: true },
                },
                credit_note_items: {
                    include: { products: true },
                },
            },
        });
        if (!note) throw new NotFoundException(`Credit note #${id} not found`);
        return note;
    }

    async searchInvoices(businessId: number, query: string) {

        const creditedInvoiceIds = (
            await this.prisma.credit_notes.findMany({
                where: {
                    business_id: businessId,
                    invoice_id: { not: null },

                    status: { not: 'CANCELLED' },
                },

                select: { invoice_id: true },
            })
        )
            .map((cn) => cn.invoice_id)
            .filter(Boolean) as number[];

        return this.prisma.invoices.findMany({
            where: {
                quotes: { clients: { business_id: businessId } },
                invoice_number: { contains: query, mode: 'insensitive' },
                status: "paid",

                id: { notIn: creditedInvoiceIds.length ? creditedInvoiceIds : [-1] },
            },
            include: {
                quotes: {
                    include: {
                        clients: true,
                        quote_details: { include: { products: true } },
                    },
                },
            },
            take: 10,
            orderBy: { issue_date: 'desc' },
        });
    }



    async searchDeliveryNotes(businessId: number, query: string) {
        // (a) Delivery note IDs directly credited
        const creditedDeliveryNoteIds = (
            await this.prisma.credit_notes.findMany({
                where: {
                    business_id: businessId,
                    delivery_note_id: { not: null },
                    status: { not: 'CANCELLED' },
                },
                select: { delivery_note_id: true },
            })
        )
            .map((cn) => cn.delivery_note_id)
            .filter(Boolean) as number[];


        const creditedInvoiceIds = (
            await this.prisma.credit_notes.findMany({
                where: {
                    business_id: businessId,
                    invoice_id: { not: null },
                    status: { not: 'CANCELLED' },
                },
                select: { invoice_id: true },
            })
        )
            .map((cn) => cn.invoice_id)
            .filter(Boolean) as number[];

        
        const deliveryNotesWithCreditedInvoice = creditedInvoiceIds.length
            ? (
                await this.prisma.delivery_notes.findMany({
                    where: {
                        quotes: {
                            invoices: { some: { id: { in: creditedInvoiceIds } } },
                        },
                        
                    },
                    select: { id: true },
                })
            ).map((dn) => dn.id)
            : [];

        const excludedIds = [
            ...new Set([...creditedDeliveryNoteIds, ...deliveryNotesWithCreditedInvoice]),
        ];

        return this.prisma.delivery_notes.findMany({
            where: {
                quotes: { clients: { business_id: businessId } },
                delivery_number: { contains: query, mode: 'insensitive' },
                status: DeliveryStatus.DELIVERED,
                id: { notIn: excludedIds.length ? excludedIds : [-1] },
            },
            include: {
                quotes: {
                    include: {
                        clients: true,
                        quote_details: { include: { products: true } },
                    },
                },
            },
            take: 10,
            orderBy: { delivery_date: 'desc' },
        });
    }

    // ─────────────────────────────────────────────
    // CREATE credit note
    // ─────────────────────────────────────────────
    async create(businessId: number, dto: CreateCreditNoteDto) {
        const { invoice_id, delivery_note_id, items, return_date, reason, note } =
            dto;

        if (!invoice_id && !delivery_note_id)
            throw new BadRequestException(
                "Must provide either invoice_id or delivery_note_id",
            );

        if (invoice_id && delivery_note_id)
            throw new BadRequestException(
                "Cannot link to both invoice and delivery note",
            );

        const today = new Date();

        // =====================================================
        // ✅ CASE 1 — CREDIT NOTE FROM INVOICE
        // =====================================================
        if (invoice_id) {
            if (!items || items.length === 0)
                throw new BadRequestException(
                    "Must provide items when creating from an invoice",
                );

            // Prevent duplicate credit note
            const existingCN = await this.prisma.credit_notes.findFirst({
                where: {
                    invoice_id,
                    status: { not: "CANCELLED" },
                },
            });

            if (existingCN)
                throw new BadRequestException(
                    "This invoice already has a credit note",
                );

            const invoice = await this.prisma.invoices.findFirst({
                where: {
                    id: invoice_id,
                    quotes: { clients: { business_id: businessId } },
                },
                include: {
                    quotes: {
                        include: {
                            clients: true,
                            quote_details: true,
                        },
                    },
                },
            });

            if (!invoice)
                throw new NotFoundException(`Invoice #${invoice_id} not found`);

            // ===== Quantity Validation =====
            for (const item of items) {
                const original = invoice.quotes?.quote_details.find(
                    (d) => d.product_id === item.product_id,
                );

                if (!original)
                    throw new BadRequestException(
                        `Product #${item.product_id} not found in invoice`,
                    );

                if (item.quantity > original.quantity)
                    throw new BadRequestException(
                        `Cannot return more than sold quantity`,
                    );
            }

            const clientId = invoice.quotes?.clients?.id;

            const totalAmount = items.reduce(
                (sum, i) => sum + i.quantity * i.unit_price,
                0,
            );

            const creditNumber = await this.generateCreditNumber(businessId);

            return this.prisma.$transaction(async (tx) => {
                const creditNote = await tx.credit_notes.create({
                    data: {
                        credit_number: creditNumber,
                        return_date: new Date(return_date),
                        reason,
                        note,
                        total_amount: totalAmount,
                        status: "DRAFT",
                        invoice_id,
                        client_id: clientId,
                        business_id: businessId,
                        credit_note_items: {
                            create: items.map((i) => ({
                                product_id: i.product_id,
                                quantity: i.quantity,
                                unit_price: i.unit_price,
                                total: i.quantity * i.unit_price,
                            })),
                        },
                    },
                    include: {
                        credit_note_items: true,
                        clients: true,
                    },
                });

                // ===== STOCK RETURN =====
                for (const item of items) {
                    await tx.mouvements.create({
                        data: {
                            mouvement_date: today,
                            quantity: item.quantity,
                            type: "IN",
                            product_id: item.product_id,
                            note: `Credit note return — ${creditNumber}`,
                        },
                    });

                    await tx.inventaires.updateMany({
                        where: { product_id: item.product_id },
                        data: {
                            quantity_available: { increment: item.quantity },
                            last_updated: today,
                        },
                    });

                    await tx.warehouse_products.updateMany({
                        where: {
                            product_id: item.product_id,
                            warehouses: { business_id: businessId },
                        },
                        data: {
                            quantity: { increment: item.quantity },
                        },
                    });
                }

                return creditNote;
            });
        }

        // =====================================================
        // ✅ CASE 2 — CREDIT NOTE FROM DELIVERY NOTE
        // =====================================================

        const existingCN = await this.prisma.credit_notes.findFirst({
            where: {
                delivery_note_id,
                status: { not: "CANCELLED" },
            },
        });

        if (existingCN)
            throw new BadRequestException(
                "This delivery note already has a credit note",
            );

        const deliveryNote = await this.prisma.delivery_notes.findFirst({
            where: {
                id: delivery_note_id,
                quotes: { clients: { business_id: businessId } },
            },
            include: {
                quotes: {
                    include: {
                        clients: true,
                        quote_details: {
                            include: { products: true },
                        },
                    },
                },
            },
        });

        if (!deliveryNote)
            throw new NotFoundException(
                `Delivery note #${delivery_note_id} not found`,
            );

        const details = deliveryNote.quotes?.quote_details ?? [];

        const clientId = deliveryNote.quotes?.clients?.id;

        const totalAmount = details.reduce(
            (sum, d) =>
                sum + d.quantity * Number(d.products?.unit_price ?? 0),
            0,
        );

        const creditNumber = await this.generateCreditNumber(businessId);

        return this.prisma.$transaction(async (tx) => {
            const creditNote = await tx.credit_notes.create({
                data: {
                    credit_number: creditNumber,
                    return_date: new Date(return_date),
                    reason,
                    note,
                    total_amount: totalAmount,
                    status: "DRAFT",
                    delivery_note_id,
                    client_id: clientId,
                    business_id: businessId,
                    credit_note_items: {
                        create: details.map((d) => ({
                            product_id: d.product_id!,
                            quantity: d.quantity,
                            unit_price: d.products?.unit_price ?? 0,
                            total:
                                d.quantity *
                                Number(d.products?.unit_price ?? 0),
                        })),
                    },
                },
                include: {
                    credit_note_items: true,
                    clients: true,
                },
            });

            for (const d of details) {
                await tx.mouvements.create({
                    data: {
                        mouvement_date: today,
                        quantity: d.quantity,
                        type: "IN",
                        product_id: d.product_id!,
                        note: `Credit note return — ${creditNumber}`,
                    },
                });
            }

            return creditNote;
        });
    }

    async remove(businessId: number, id: number) {
        await this.getOne(businessId, id);
        return this.prisma.credit_notes.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }


    private async generateCreditNumber(businessId: number): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.prisma.credit_notes.count({
            where: {
                business_id: businessId,
                credit_number: { startsWith: `CN-${year}` },
            },
        });
        const seq = String(count + 1).padStart(4, '0');
        return `CN-${year}-${seq}`;
    }
}
