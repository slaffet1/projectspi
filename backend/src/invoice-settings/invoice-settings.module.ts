import { Module } from '@nestjs/common';
import { InvoiceSettingsController } from './invoice-settings.controller';
import { InvoiceSettingsService } from './invoice-settings.service';

@Module({
  controllers: [InvoiceSettingsController],
  providers: [InvoiceSettingsService],
})
export class InvoiceSettingsModule {}