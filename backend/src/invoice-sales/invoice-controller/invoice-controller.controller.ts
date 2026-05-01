import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Patch,
  BadRequestException,
  Delete,
  Query,
  HttpException,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from '../invoice/invoice.service';
import { EmailService } from '../email/email.service';
import { GeminiService } from '../gemini/gemini.service';

@Controller('api/businesses/:businessId/invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly emailService: EmailService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get('banks')
  getBanks(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.invoicesService.getBanksByBusiness(businessId);
  }

  @Post()
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: any,
  ) {
    return this.invoicesService.create(businessId, dto);
  }

  @Get()
  findAll(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.invoicesService.findAll(businessId);
  }

  @Get('translate-labels')
  async translateLabels(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Query('language') language: string = 'fr',
  ) {
    try {
      return await this.geminiService.translateInvoiceLabels(language);
    } catch (err) {
      throw new HttpException(
        'Erreur lors de la traduction des labels',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  findOne(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.invoicesService.findOne(businessId, id);
  }

  @Patch(':id/mark-paid')
  async markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.updateStatus(id, 'paid');
  }

  @Patch(':id/mark-late-paid')
  async markLatePaid(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.updateStatus(id, 'late_paid');
  }

  /**
   * NEW: Mark as paid WITH a full payment trace.
   * Body: { status, payment_method, payment_date, amount, reference?, cheque_number?, bank_name?, notes?, proof_image_url? }
   */
  @Post(':id/mark-paid-with-trace')
  async markAsPaidWithTrace(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const { status = 'paid', ...traceDto } = body;

    if (!traceDto.payment_method) {
      throw new BadRequestException('Le mode de paiement est obligatoire');
    }
    if (!traceDto.payment_date) {
      throw new BadRequestException('La date de paiement est obligatoire');
    }
    if (!traceDto.amount) {
      throw new BadRequestException('Le montant est obligatoire');
    }

    return this.invoicesService.markAsPaidWithTrace(id, status, traceDto);
  }

  /**
   * NEW: Get the payment trace for a specific invoice.
   */
  @Get(':id/payment-trace')
  async getPaymentTrace(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.invoicesService.getPaymentTrace(id);
  }

  /**
   * NEW: Upload proof of payment image (multipart/form-data).
   * Returns { url: string } — store in payment_traces.proof_image_url.
   * Wire up your own storage (S3, Cloudinary, local disk, etc.) here.
   */
  @Post(':id/payment-proof')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentProof(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');

    // TODO: replace with your actual storage logic (S3, Cloudinary, local, etc.)
    // Example returning a placeholder URL:
    const fileName = `payment-proof-${id}-${Date.now()}-${file.originalname}`;
    const url = `/uploads/payment-proofs/${fileName}`;

    // If using local disk (already configured via multer diskStorage):
    // const url = `/uploads/payment-proofs/${file.filename}`;

    return { url };
  }

  @Get('unpaid')
  getUnpaid(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.invoicesService.getUnpaid(businessId);
  }

  @Post(':id/send')
  async sendInvoice(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const invoice = await this.invoicesService.findOne(businessId, id);
    if (!invoice) throw new Error('Invoice not found');

    const clientEmail = invoice.quotes?.clients?.email;
    if (!clientEmail) throw new Error('Email client introuvable');

    await this.emailService.sendInvoice(clientEmail, invoice);
    await this.invoicesService.updateStatus(id, 'sent');

    return { success: true, message: 'Facture envoyée !' };
  }

  @Patch(':id/due-date')
  async updateDueDate(
    @Param('id') id: string,
    @Body('due_date') dueDate: string,
  ) {
    if (!dueDate)
      throw new BadRequestException("La date d'échéance est obligatoire");

    const dateObj = new Date(dueDate);
    if (isNaN(dateObj.getTime()))
      throw new BadRequestException('Date invalide');

    return this.invoicesService.updateDueDate(+id, dueDate);
  }

  @Delete(':id')
  async deleteInvoice(@Param('id') id: string) {
    return this.invoicesService.deleteInvoice(+id);
  }
}