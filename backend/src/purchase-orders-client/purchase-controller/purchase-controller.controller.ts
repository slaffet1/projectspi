
import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, UseGuards, ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseServiceService } from '../purchase-service/purchase-service.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import { PurchaseOrderEmailService } from '../PurchaseOrderEmailService.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { WhisperService } from '../Whisper.service';

@Controller('api/businesses/:businessId/purchase-orders-client')
@UseGuards(AuthGuard('jwt'))
export class PurchaseControllerController {
    constructor(private readonly purchaseOrdersService: PurchaseServiceService,
      private readonly emailService: PurchaseOrderEmailService,
    private readonly whisperService: WhisperService,) {}

  @Post()
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.create(businessId, dto);
  }

  @Get()
  findAll(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.purchaseOrdersService.findAll(businessId);
  }

  @Get(':id')
  findOne(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseOrdersService.findOne(businessId, id);
  }

  @Put(':id')
  update(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(businessId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.purchaseOrdersService.updateStatus(businessId, id, status);
  }

  // Convertir en facture — body: { issue_date, due_date, bank_id? }
  @Post(':id/convert')
  convertToInvoice(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { issue_date: string; due_date: string; bank_id?: number },
  ) {
    return this.purchaseOrdersService.convertToInvoice(businessId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseOrdersService.remove(businessId, id);
  }
  @Post(':id/send')
async sendByEmail(
  @Param('businessId', ParseIntPipe) businessId: number,
  @Param('id', ParseIntPipe) id: number,
) {
  const order = await this.purchaseOrdersService.findOne(businessId, id);
  const clientEmail = order.clients?.email;
 
  if (!clientEmail) {
    throw new Error('Client has no email address');
  }
 
  await this.emailService.sendPurchaseOrder(clientEmail, order);
 
  // Mark order as "sent"
  await this.purchaseOrdersService.updateStatus(businessId, id, 'sent');
 
  return { message: 'Email sent successfully' };
}
  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ text: string }> {
    const text = await this.whisperService.transcribe(file);
    return { text };
  }
}
