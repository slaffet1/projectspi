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
import { SuppliersModule } from './suppliers/suppliers.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Rend les variables d'environnement accessibles partout
    }),
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
    SuppliersModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
