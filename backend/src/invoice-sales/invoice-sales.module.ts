import { Module } from '@nestjs/common';
import {  InvoicesService } from './invoice/invoice.service';
import {  InvoicesController } from './invoice-controller/invoice-controller.controller';

import { EmailService } from './email/email.service';

import { InvoiceCron } from './cron/cron.service';
import { GeminiService } from './gemini/gemini.service';

@Module({
  providers: [InvoicesService,  EmailService, InvoiceCron,GeminiService],
  controllers: [InvoicesController]
})
export class InvoiceSalesModule {}
