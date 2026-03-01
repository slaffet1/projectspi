import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxSettingsService {
  constructor(private prisma: PrismaService) {}

  // Récupérer toutes les taxes par défaut (Platform Admin)
  async getAllDefaultTaxes() {
    const taxes = await this.prisma.taxes.findMany({
      where: { is_default: true },
    });
    return taxes;
  }

  // Récupérer les taxes d'une entreprise (défaut + personnalisées)
  async getBusinessTaxes(businessId: number) {
    const business = await this.prisma.businesses.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const taxes = await this.prisma.taxes.findMany({
      where: {
        OR: [
          { is_default: true },
          { business_id: businessId },
        ],
      },
    });

    return taxes;
  }

  // Créer une nouvelle taxe
  async createTax(
    name: string,
    rate: number,
    description: string,
    isDefault: boolean,
    businessId?: number,
  ) {
    const tax = await this.prisma.taxes.create({
      data: {
        name,
        rate,
        description,
        is_default: isDefault,
        business_id: businessId || null,
      },
    });

    return {
      message: 'Tax created successfully',
      tax,
    };
  }

  // Modifier une taxe
  async updateTax(
    taxId: number,
    name: string,
    rate: number,
    description: string,
  ) {
    const tax = await this.prisma.taxes.findUnique({
      where: { id: taxId },
    });

    if (!tax) {
      throw new NotFoundException('Tax not found');
    }

    const updated = await this.prisma.taxes.update({
      where: { id: taxId },
      data: { name, rate, description },
    });

    return {
      message: 'Tax updated successfully',
      tax: updated,
    };
  }

  // Supprimer une taxe
  async deleteTax(taxId: number) {
    const tax = await this.prisma.taxes.findUnique({
      where: { id: taxId },
    });

    if (!tax) {
      throw new NotFoundException('Tax not found');
    }

    await this.prisma.taxes.delete({
      where: { id: taxId },
    });

    return {
      message: 'Tax deleted successfully',
    };
  }
}