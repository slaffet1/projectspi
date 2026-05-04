import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { RequirePermission } from 'src/permissions/permissions/permissions.guard';

@Controller('api/businesses/:businessId/suppliers')
@RequirePermission('products')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() createSupplierDto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(businessId, createSupplierDto);
  }

  @Get()
  findAll(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.suppliersService.findAll(businessId);
  }

  @Get(':id')
  findOne(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.suppliersService.findOne(businessId, id);
  }

  @Patch(':id')
  update(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(businessId, id, updateSupplierDto);
  }

  @Delete(':id')
  remove(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.suppliersService.remove(businessId, id);
  }
}