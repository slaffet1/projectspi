import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/businesses/:businessId/products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // POST /api/businesses/:businessId/products
  @Post()
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(+businessId, dto);
  }

  // GET /api/businesses/:businessId/products
  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.productsService.findAll(+businessId);
  }

  // GET /api/businesses/:businessId/products/:id
  @Get(':id')
  findOne(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(+businessId, +id);
  }

  // PUT /api/businesses/:businessId/products/:id
  @Put(':id')
  update(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(+businessId, +id, dto);
  }

  // DELETE /api/businesses/:businessId/products/:id
  @Delete(':id')
  remove(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(+businessId, +id);
  }

  // PATCH /api/businesses/:businessId/products/:id/toggle
  @Patch(':id/toggle')
  toggleActive(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.toggleActive(+businessId, +id);
  }
}