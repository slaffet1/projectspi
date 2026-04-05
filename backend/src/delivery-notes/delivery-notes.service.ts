
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryNoteDto } from './dto/createdelivery-notes.dto';
import { UpdateDeliveryNoteDto } from './dto/updatedelivery-note.dto';

import { DeliveryStatus } from '@prisma/client';
@Injectable()
export class DeliveryNotesService {
    constructor(private readonly prisma: PrismaService) { }


    async changeStatus(businessId: number, id: number, status: DeliveryStatus) {
        const delivery = await this.prisma.delivery_notes.findFirst({
            where: {
                id,
                quotes: { clients: { business_id: businessId } },
            },
            include: {
                quotes: {
                    include: {
                        clients: true,
                        invoices: true,
                        quote_details: { include: { products: true } },
                    },
                },
            },
        });

        if (!delivery)
            throw new NotFoundException('Delivery note not found');

        if (delivery.status === 'DELIVERED')
            throw new BadRequestException('Delivered delivery note cannot be modified');

        // Only run stock logic when transitioning TO DELIVERED
        if (status === DeliveryStatus.DELIVERED) {
            const quoteDetails = delivery.quotes?.quote_details ?? [];
            const today = new Date();

            for (const detail of quoteDetails) {
                const productId = detail.product_id;
                const qty = detail.quantity;

                if (!productId || qty <= 0) continue;

                // 1. Create mouvement OUT
                await this.prisma.mouvements.create({
                    data: {
                        mouvement_date: today,
                        quantity: qty,
                        type: 'OUT',
                        product_id: productId,
                        note: `Delivery note #${delivery.delivery_number} — auto stock-out on delivery confirmation`,
                    },
                });

                
                const warehouseProduct = await this.prisma.warehouse_products.findFirst({
                    where: {
                        product_id: productId,
                        warehouses: { business_id: businessId },
                        quantity: { gt: 0 },
                    },
                    orderBy: { quantity: 'desc' }, 
                });

                if (warehouseProduct) {
                    await this.prisma.warehouse_products.update({
                        where: { id: warehouseProduct.id },
                        data: { quantity: { decrement: qty } },
                    });
                }

                // 3. Decrease inventaires.quantity_available
                const inventaire = await this.prisma.inventaires.findFirst({
                    where: { product_id: productId },
                });

                if (inventaire) {
                    await this.prisma.inventaires.update({
                        where: { id: inventaire.id },
                        data: { quantity_available: { decrement: qty }, last_updated: today },
                    });
                }
            }
        }

        // Finally update the status
        return this.prisma.delivery_notes.update({
            where: { id },
            data: { status },
            include: {
                quotes: { include: { clients: true, invoices: true } },
            },
        });
    }
    async getAll(businessId: number) {
        return this.prisma.delivery_notes.findMany({
            where: {
                quotes: {
                    clients: { business_id: businessId },
                },
            },
            include: {
                quotes: {
                    include: {
                        clients: true,
                        invoices: true,
                    },
                },
            },
            orderBy: { delivery_date: 'desc' },
        });
    }

    async getOne(businessId: number, id: number) {
        const note = await this.prisma.delivery_notes.findFirst({
            where: {
                id,
                quotes: { clients: { business_id: businessId } },
            },
            include: {
                quotes: {
                    include: {
                        clients: true,
                        invoices: true,
                        quote_details: { include: { products: true } },
                    },
                },
            },
        });
        if (!note) throw new NotFoundException(`Delivery note #${id} not found`);
        return note;
    }


    async getQuotesNotInvoiced(businessId: number) {
        return this.prisma.quotes.findMany({
            where: {
                clients: { business_id: businessId },
                status: 'draft',
                invoices: { none: {} },        // no invoice linked to this quote
            },
            include: {
                clients: true,
                delivery_notes: true,          // show if a BL already exists
                quote_details: { include: { products: true } },
            },
            orderBy: { issue_date: 'desc' },
        });
    }


    async getInvoicesWithoutDeliveryNote(businessId: number) {
        return this.prisma.invoices.findMany({
            where: {
                quotes: {
                    clients: { business_id: businessId },
                    delivery_notes: { none: {} },  // no delivery note on the quote
                },
            },
            include: {
                quotes: {
                    include: {
                        clients: true,
                        delivery_notes: true,
                        quote_details: { include: { products: true } },
                    },
                },
            },
            orderBy: { issue_date: 'desc' },
        });
    }


    async create(businessId: number, dto: CreateDeliveryNoteDto) {
        // Verify the quote exists and belongs to this business
        const quote = await this.prisma.quotes.findFirst({
            where: {
                id: dto.quote_id,
                clients: { business_id: businessId },
            },
            include: { delivery_notes: true },
        });

        if (!quote) {
            throw new NotFoundException(`Quote #${dto.quote_id} not found for this business`);
        }



        if (quote.delivery_notes.length > 0) {
            throw new BadRequestException(
                `A delivery note already exists for quote #${dto.quote_id}`,
            );
        }

        return this.prisma.delivery_notes.create({
            data: {
                delivery_number: dto.delivery_number,
                delivery_date: new Date(dto.delivery_date),
                quote_id: dto.quote_id,
            },
            include: {
                quotes: {
                    include: { clients: true, invoices: true },
                },
            },
        });
    }

    async update(businessId: number, id: number, dto: UpdateDeliveryNoteDto) {
        await this.getOne(businessId, id);
        return this.prisma.delivery_notes.update({
            where: { id },
            data: {
                ...(dto.delivery_number && { delivery_number: dto.delivery_number }),
                ...(dto.delivery_date && { delivery_date: new Date(dto.delivery_date) }),
            },
            include: {
                quotes: { include: { clients: true, invoices: true } },
            },
        });
    }

    async delete(businessId: number, id: number) {
        await this.getOne(businessId, id);
        await this.prisma.delivery_notes.delete({ where: { id } });
        return { message: `Delivery note #${id} deleted` };
    }
}