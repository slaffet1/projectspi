import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TaxSettingsController } from './tax-settings/tax-settings.controller';
import { TaxSettingsModule } from './tax-settings/tax-settings.module';
import { InviteUsersModule } from './invite-users/invite-users.module';
import { InvoiceSettingsModule } from './invoice-settings/invoice-settings.module';

@Module({
  imports: [
    PrismaModule,
    TaxSettingsModule,
    InviteUsersModule,
    InvoiceSettingsModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
