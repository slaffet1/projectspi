import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { EmbeddingService } from '../search/embedding.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
  ) {}

  private buildProductText(data: {
    name: string;
    description?: string | null;
    category?: string | null;
    reference?: string | null;
  }): string {
    return [data.name, data.description, data.category, data.reference]
      .filter(Boolean)
      .join(' ');
  }

  // ─── Créer un produit ────────────────────────────────────────
  async create(businessId: number, dto: CreateProductDto) {
    const product = await this.prisma.products.create({
      data: {
        ...dto,
        business_id: businessId,
      },
    });

    // Indexation async — ne bloque pas la réponse HTTP
    const text = this.buildProductText(product);
    this.embeddingService.getEmbedding(text).then((embedding) => {
      if (embedding.length) {
        this.prisma.products
          .update({ where: { id: product.id }, data: { embedding } })
          .catch(() => {});
      }
    });

    return product;
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

    const product = await this.prisma.products.update({
      where: { id },
      data: { ...dto, updated_at: new Date() },
    });

    // Re-indexation async si les champs textuels ont changé
    if (dto.name || dto.description || dto.category || dto.reference) {
      const text = this.buildProductText(product);
      this.embeddingService.getEmbedding(text).then((embedding) => {
        if (embedding.length) {
          this.prisma.products
            .update({ where: { id: product.id }, data: { embedding } })
            .catch(() => {});
        }
      });
    }

    return product;
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