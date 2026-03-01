import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceSettingsService {
  constructor(private prisma: PrismaService) {}

  // Récupérer les paramètres de facture
  async getInvoiceSettings(businessId: number) {
    const business = await this.prisma.businesses.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, invoice_prefix: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return {
      business_id: business.id,
      business_name: business.name,
      invoice_prefix: business.invoice_prefix,
    };
  }

  // Modifier les paramètres de facture
  async updateInvoiceSettings(businessId: number, invoicePrefix: string) {
    const business = await this.prisma.businesses.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const updated = await this.prisma.businesses.update({
      where: { id: businessId },
      data: { invoice_prefix: invoicePrefix },
      select: { id: true, name: true, invoice_prefix: true },
    });

    return {
      message: 'Invoice settings updated successfully',
      business_id: updated.id,
      business_name: updated.name,
      invoice_prefix: updated.invoice_prefix,
    };
  }
}