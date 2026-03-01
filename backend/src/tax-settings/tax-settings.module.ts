import { Module } from '@nestjs/common';
import { TaxSettingsController } from './tax-settings.controller';
import { TaxSettingsService } from './tax-settings.service';

@Module({
  controllers: [TaxSettingsController],
  providers: [TaxSettingsService],
})
export class TaxSettingsModule {}