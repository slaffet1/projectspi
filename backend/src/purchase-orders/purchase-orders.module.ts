import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PurchaseOrdersController } from './purchase-orders.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}