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
import { UserManagementModule } from './user-management/user-management.module';
import { ProductsModule } from './products/products.module';
import { QuotesModule } from './quotes/quotes.module';
import { ClientsModule } from './clients/clients.module';
import { InvoiceSalesModule } from './invoice-sales/invoice-sales.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DeliveryNotesModule } from './delivery-notes/delivery-notes.module';
import { DeliveryNotesService } from './delivery-notes/delivery-notes.service';
import { BanksModule } from './banks/banks.module';
import { StockModule } from './stock/stock.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CreditNotesModule } from './credit-notes/credit-notes.module';
import { TelegramModule } from './telegram/telegram.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    TaxSettingsModule,
    InviteUsersModule,
    InvoiceSettingsModule,
    UserModule,
    CompanyModule,
    UserManagementModule,
    ProductsModule,
    QuotesModule,
    ClientsModule,
    InvoiceSalesModule,
    DeliveryNotesModule,
    BanksModule,
    StockModule,
    SuppliersModule,
    CreditNotesModule,
    TelegramModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, DeliveryNotesService],
})

export class AppModule { }
