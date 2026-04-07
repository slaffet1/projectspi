import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(
    
    @Query('q') q: string,
    @Query('type') type: 'products' | 'clients' = 'products',
    @CurrentBusiness() businessId: number,
  ) {
    if (!q?.trim()) return [];
    if (type === 'clients') {
      return this.searchService.searchClients(q, businessId);
    }
    return this.searchService.searchProducts(q, businessId);
  }
}