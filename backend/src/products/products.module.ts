import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
@Module({
  imports: [PrismaModule, SearchModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}