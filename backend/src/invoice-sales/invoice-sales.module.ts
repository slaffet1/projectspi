import { Module } from '@nestjs/common';
import {  InvoicesService } from './invoice/invoice.service';
import {  InvoicesController } from './invoice-controller/invoice-controller.controller';

import { EmailService } from './email/email.service';
import { PdfService } from './invoice-pdf-service/pdf.service';
import { InvoiceCron } from './cron/cron.service';
import { GeminiService } from './gemini/gemini.service';

@Module({
  providers: [InvoicesService, PdfService, EmailService, InvoiceCron,GeminiService],
  controllers: [InvoicesController]
})
export class InvoiceSalesModule {}
