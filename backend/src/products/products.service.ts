import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── Créer un produit ────────────────────────────────────────
  async create(businessId: number, dto: CreateProductDto) {
    return this.prisma.products.create({
      data: {
        ...dto,
        business_id: businessId,
      },
    });
  }

  // ─── Liste des produits d'un business ────────────────────────
  async findAll(businessId: number) {
    return this.prisma.products.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }

  // ─── Détail d'un produit ─────────────────────────────────────
  async findOne(businessId: number, id: number) {
    const product = await this.prisma.products.findFirst({
      where: { id, business_id: businessId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ─── Modifier un produit ─────────────────────────────────────
  async update(businessId: number, id: number, dto: UpdateProductDto) {
    await this.findOne(businessId, id);
    return this.prisma.products.update({
      where: { id },
      data: { ...dto, updated_at: new Date() },
    });
  }

  // ─── Supprimer un produit ────────────────────────────────────
  async remove(businessId: number, id: number) {
    await this.findOne(businessId, id);
    return this.prisma.products.delete({
      where: { id },
    });
  }

  // ─── Activer / Désactiver ────────────────────────────────────
  async toggleActive(businessId: number, id: number) {
    const product = await this.findOne(businessId, id);
    return this.prisma.products.update({
      where: { id },
      data: { is_active: !product.is_active },
    });
  }
}