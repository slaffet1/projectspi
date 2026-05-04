import { Controller, Get, Post, Param, Body, ParseIntPipe, Patch } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { RequirePermission } from 'src/permissions/permissions/permissions.guard';

@Controller('api/businesses/:businessId/purchase-orders')
@RequirePermission('expenses')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() data: any
  ) {
    return this.poService.create(businessId, data);
  }

  @Get()
  findAll(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.poService.findAll(businessId);
  }

  @Patch(':id/validate')
  validate(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.poService.validateOrder(businessId, id);
  }
}