import { Module } from '@nestjs/common';
import { PurchaseServiceService } from './purchase-service/purchase-service.service';
import { PurchaseControllerController } from './purchase-controller/purchase-controller.controller';
import { PurchaseOrderEmailService } from './PurchaseOrderEmailService.service';
import { PublicPurchaseOrderController } from './purchaseResponse.controller';

@Module({
  providers: [PurchaseServiceService,PurchaseOrderEmailService],
  controllers: [PurchaseControllerController,PublicPurchaseOrderController]
})
export class PurchaseOrdersClientModule {}
