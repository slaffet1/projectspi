import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { DeliveryNotesService } from './delivery-notes.service';
import { CreateDeliveryNoteDto } from './dto/createdelivery-notes.dto';
import { UpdateDeliveryNoteDto } from './dto/updatedelivery-note.dto';
import { DeliveryStatus } from '@prisma/client';

@Controller('api/businesses/:businessId/delivery-notes')
export class DeliveryNotesController {
  constructor(private readonly deliveryNotesService: DeliveryNotesService) { }


  @Get()
  getAll(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.deliveryNotesService.getAll(businessId);
  }


  @Get('quotes-not-invoiced')
  getQuotesNotInvoiced(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.deliveryNotesService.getQuotesNotInvoiced(businessId);
  }


  @Get('invoices-without-bl')
  getInvoicesWithoutDeliveryNote(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.deliveryNotesService.getInvoicesWithoutDeliveryNote(businessId);
  }


  @Get(':id')
  getOne(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deliveryNotesService.getOne(businessId, id);
  }

  @Post()
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: CreateDeliveryNoteDto,
  ) {
    return this.deliveryNotesService.create(businessId, dto);
  }

  @Patch(':id')
  update(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeliveryNoteDto,
  ) {
    return this.deliveryNotesService.update(businessId, id, dto);
  }
  @Patch(':id/status')
  changeStatus(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: DeliveryStatus,
  ) {
    return this.deliveryNotesService.changeStatus(
      businessId,
      id,
      status,
    );
  }

  @Delete(':id')
  delete(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deliveryNotesService.delete(businessId, id);
  }
}