
import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { AuthGuard } from '@nestjs/passport';

const mockSearchService = {
  searchProducts: jest.fn(),
  searchClients: jest.fn(),
};

describe('SearchController', () => {
  let controller: SearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SearchController>(SearchController);
    jest.clearAllMocks();
  });

  const BUSINESS_ID = 1;

  // ───────── BASIC SEARCH ─────────
  describe('search', () => {
    it('should return empty array if query is empty', async () => {
      const result = await controller.search('', 'products', BUSINESS_ID);

      expect(result).toEqual([]);
      expect(mockSearchService.searchProducts).not.toHaveBeenCalled();
      expect(mockSearchService.searchClients).not.toHaveBeenCalled();
    });

    it('should search products by default type', async () => {
      const expected = [{ id: 1, name: 'Product A' }];

      mockSearchService.searchProducts.mockResolvedValue(expected);

      const result = await controller.search('prod', 'products', BUSINESS_ID);

      expect(mockSearchService.searchProducts).toHaveBeenCalledWith(
        'prod',
        BUSINESS_ID,
      );
      expect(result).toEqual(expected);
    });

    it('should search clients when type is clients', async () => {
      const expected = [{ id: 1, name: 'Client A' }];

      mockSearchService.searchClients.mockResolvedValue(expected);

      const result = await controller.search('cli', 'clients', BUSINESS_ID);

      expect(mockSearchService.searchClients).toHaveBeenCalledWith(
        'cli',
        BUSINESS_ID,
      );
      expect(result).toEqual(expected);
    });

    it('should trim query before searching', async () => {
      mockSearchService.searchProducts.mockResolvedValue([]);

      await controller.search('   test   ', 'products', BUSINESS_ID);

      expect(mockSearchService.searchProducts).toHaveBeenCalledWith(
        '   test   ',
        BUSINESS_ID,
      );
    });

    it('should propagate errors from service', async () => {
      mockSearchService.searchProducts.mockRejectedValue(
        new Error('Search failed'),
      );

      await expect(
        controller.search('test', 'products', BUSINESS_ID),
      ).rejects.toThrow('Search failed');
    });
  });
});
