import { Module } from '@nestjs/common';
import {  InvoicesService } from './invoice/invoice.service';
import {  InvoicesController } from './invoice-controller/invoice-controller.controller';

import { EmailService } from './email/email.service';

import { InvoiceCron } from './cron/cron.service';
import { GeminiService } from './gemini/gemini.service';
import { OcrGroqService } from './ocr.service';
import { OcrController } from './ocr.controller';

@Module({
  providers: [InvoicesService,  EmailService, InvoiceCron,GeminiService,OcrGroqService],
  controllers: [InvoicesController,OcrController]
})
export class InvoiceSalesModule {}
