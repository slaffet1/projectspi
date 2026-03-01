import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { TaxSettingsModule } from './tax-settings/tax-settings.module';
import { InviteUsersModule } from './invite-users/invite-users.module';
import { InvoiceSettingsModule } from './invoice-settings/invoice-settings.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';

@Module({
  imports: [
    PrismaModule,
    TaxSettingsModule,
    InviteUsersModule,
    InvoiceSettingsModule,
    UserModule,
    CompanyModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
