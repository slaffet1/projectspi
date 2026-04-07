import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
  ) {}

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length) return 0;
    const dot = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
    const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return magA && magB ? dot / (magA * magB) : 0;
  }

  async searchProducts(query: string, businessId: number, topK = 10) {
    const queryVec = await this.embeddingService.getEmbedding(query);

    const products = await this.prisma.products.findMany({
      where: { business_id: businessId, is_active: true },
    });

    return products
      .filter((p) => p.embedding?.length)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        unit_price: p.unit_price,
        category: p.category,
        reference: p.reference,
        score: this.cosineSimilarity(queryVec, p.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async searchClients(query: string, businessId: number, topK = 10) {
    const queryVec = await this.embeddingService.getEmbedding(query);

    const clients = await this.prisma.clients.findMany({
      where: { business_id: businessId },
    });

    return clients
      .filter((c) => c.embedding?.length)
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        score: this.cosineSimilarity(queryVec, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}