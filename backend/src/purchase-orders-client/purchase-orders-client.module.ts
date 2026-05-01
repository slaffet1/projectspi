import { Module } from '@nestjs/common';
import { PurchaseServiceService } from './purchase-service/purchase-service.service';
import { PurchaseControllerController } from './purchase-controller/purchase-controller.controller';
import { PurchaseOrderEmailService } from './PurchaseOrderEmailService.service';
import { PublicPurchaseOrderController } from './purchaseResponse.controller';
import { WhisperService } from './Whisper.service';

@Module({
  providers: [PurchaseServiceService,PurchaseOrderEmailService,WhisperService],
  controllers: [PurchaseControllerController,PublicPurchaseOrderController]
})
export class PurchaseOrdersClientModule {}
