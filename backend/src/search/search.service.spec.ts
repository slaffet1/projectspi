import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

// ── Helpers ────────────────────────────────────────────────────────────────
const makeProduct = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: 'Product A',
  description: 'Description A',
  unit_price: 100,
  category: 'Category A',
  reference: 'REF-001',
  business_id: 1,
  is_active: true,
  embedding: [0.1, 0.2, 0.3],
  ...overrides,
});

const makeClient = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: 'Client A',
  email: 'client@example.com',
  phone: '1234567890',
  city: 'Paris',
  business_id: 1,
  embedding: [0.1, 0.2, 0.3],
  ...overrides,
});

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockPrisma = {
  products: { findMany: jest.fn() },
  clients: { findMany: jest.fn() },
};

const mockEmbeddingService = {
  getEmbedding: jest.fn(),
};

// ══════════════════════════════════════════════════════════════════════════
describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  // ── cosineSimilarity (via searchProducts) ─────────────────────────────────
  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', async () => {
      const vec = [1, 0, 0];
      mockEmbeddingService.getEmbedding.mockResolvedValue(vec);
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({ embedding: [1, 0, 0] }),
      ]);

      const result = await service.searchProducts('test', 1);

      expect(result[0].score).toBeCloseTo(1);
    });

    it('should return 0 for orthogonal vectors', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({ embedding: [0, 1, 0] }),
      ]);

      const result = await service.searchProducts('test', 1);

      expect(result[0].score).toBeCloseTo(0);
    });

    it('should return 0 when query vector is empty', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([]);
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({ embedding: [0.1, 0.2, 0.3] }),
      ]);

      const result = await service.searchProducts('test', 1);

      expect(result[0].score).toBe(0);
    });

    it('should return 0 when product embedding is empty', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({ embedding: [] }),
      ]);

      const result = await service.searchProducts('test', 1);

      expect(result).toHaveLength(0);
    });
  });

  // ── searchProducts ────────────────────────────────────────────────────────
  describe('searchProducts', () => {
    it('should return products sorted by score descending', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({ id: 1, name: 'Low', embedding: [0, 1, 0] }),
        makeProduct({ id: 2, name: 'High', embedding: [1, 0, 0] }),
      ]);

      const result = await service.searchProducts('test', 1);

      expect(result[0].name).toBe('High');
      expect(result[1].name).toBe('Low');
    });

    it('should query only active products for the business', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.products.findMany.mockResolvedValue([]);

      await service.searchProducts('test', 42);

      expect(mockPrisma.products.findMany).toHaveBeenCalledWith({
        where: { business_id: 42, is_active: true },
      });
    });

    it('should filter out products without embedding', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({ id: 1, embedding: null }),
        makeProduct({ id: 2, embedding: [0.1, 0.2, 0.3] }),
      ]);

      const result = await service.searchProducts('test', 1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should limit results to topK', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.products.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) =>
          makeProduct({ id: i + 1, embedding: [1, 0, 0] }),
        ),
      );

      const result = await service.searchProducts('test', 1, 5);

      expect(result).toHaveLength(5);
    });

    it('should default topK to 10', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.products.findMany.mockResolvedValue(
        Array.from({ length: 15 }, (_, i) =>
          makeProduct({ id: i + 1, embedding: [1, 0, 0] }),
        ),
      );

      const result = await service.searchProducts('test', 1);

      expect(result).toHaveLength(10);
    });

    it('should return correct shape for each product', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({
          id: 1,
          name: 'Product A',
          description: 'Desc A',
          unit_price: 99,
          category: 'Cat A',
          reference: 'REF-001',
          embedding: [1, 0, 0],
        }),
      ]);

      const result = await service.searchProducts('test', 1);

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Product A',
          description: 'Desc A',
          unit_price: 99,
          category: 'Cat A',
          reference: 'REF-001',
          score: expect.any(Number),
        }),
      );
    });

    it('should return empty array when no products exist', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.products.findMany.mockResolvedValue([]);

      const result = await service.searchProducts('test', 1);

      expect(result).toEqual([]);
    });

    it('should call getEmbedding with the query', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.products.findMany.mockResolvedValue([]);

      await service.searchProducts('my query', 1);

      expect(mockEmbeddingService.getEmbedding).toHaveBeenCalledWith('my query');
    });
  });

  // ── searchClients ─────────────────────────────────────────────────────────
  describe('searchClients', () => {
    it('should return clients sorted by score descending', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.clients.findMany.mockResolvedValue([
        makeClient({ id: 1, name: 'Low', embedding: [0, 1, 0] }),
        makeClient({ id: 2, name: 'High', embedding: [1, 0, 0] }),
      ]);

      const result = await service.searchClients('test', 1);

      expect(result[0].name).toBe('High');
      expect(result[1].name).toBe('Low');
    });

    it('should query clients for the correct business', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.clients.findMany.mockResolvedValue([]);

      await service.searchClients('test', 42);

      expect(mockPrisma.clients.findMany).toHaveBeenCalledWith({
        where: { business_id: 42 },
      });
    });

    it('should filter out clients without embedding', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.clients.findMany.mockResolvedValue([
        makeClient({ id: 1, embedding: null }),
        makeClient({ id: 2, embedding: [0.1, 0.2, 0.3] }),
      ]);

      const result = await service.searchClients('test', 1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should limit results to topK', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.clients.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) =>
          makeClient({ id: i + 1, embedding: [1, 0, 0] }),
        ),
      );

      const result = await service.searchClients('test', 1, 3);

      expect(result).toHaveLength(3);
    });

    it('should default topK to 10', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.clients.findMany.mockResolvedValue(
        Array.from({ length: 15 }, (_, i) =>
          makeClient({ id: i + 1, embedding: [1, 0, 0] }),
        ),
      );

      const result = await service.searchClients('test', 1);

      expect(result).toHaveLength(10);
    });

    it('should return correct shape for each client', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([1, 0, 0]);
      mockPrisma.clients.findMany.mockResolvedValue([
        makeClient({
          id: 1,
          name: 'Client A',
          email: 'client@test.com',
          phone: '0612345678',
          city: 'Lyon',
          embedding: [1, 0, 0],
        }),
      ]);

      const result = await service.searchClients('test', 1);

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Client A',
          email: 'client@test.com',
          phone: '0612345678',
          city: 'Lyon',
          score: expect.any(Number),
        }),
      );
    });

    it('should return empty array when no clients exist', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.clients.findMany.mockResolvedValue([]);

      const result = await service.searchClients('test', 1);

      expect(result).toEqual([]);
    });

    it('should call getEmbedding with the query', async () => {
      mockEmbeddingService.getEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockPrisma.clients.findMany.mockResolvedValue([]);

      await service.searchClients('my client query', 1);

      expect(mockEmbeddingService.getEmbedding).toHaveBeenCalledWith('my client query');
    });
  });
});