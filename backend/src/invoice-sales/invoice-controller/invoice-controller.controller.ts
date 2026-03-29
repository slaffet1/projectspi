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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from '../invoice/invoice.service';
import { EmailService } from '../email/email.service';

@Controller('api/businesses/:businessId/invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService, private readonly emailService: EmailService) {}


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


  @Get(':id')
  findOne(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.invoicesService.findOne(businessId, id);
  }
@Patch(':id/mark-paid')
async markAsPaid(
  @Param('id', ParseIntPipe) id: number,
) {
 
  return this.invoicesService.updateStatus(id, 'paid');
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
  async updateDueDate(@Param('id') id: string, @Body('due_date') dueDate: string) {
    if (!dueDate) throw new BadRequestException('La date d’échéance est obligatoire');

    const dateObj = new Date(dueDate);
    if (isNaN(dateObj.getTime())) throw new BadRequestException('Date invalide');

    return this.invoicesService.updateDueDate(+id, dueDate);
  }


  @Delete(':id')
  async deleteInvoice(@Param('id') id: string) {
    return this.invoicesService.deleteInvoice(+id);
  }
}