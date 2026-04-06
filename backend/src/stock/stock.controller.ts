/// <reference types="multer" />
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards,
  UploadedFile, UseInterceptors, Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { StockService } from './stock.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { AssignProductDto } from './dto/assign-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/businesses/:businessId/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ── Warehouses ──────────────────────────────────────────────────
  @Post('warehouses')
  createWarehouse(
    @Body() dto: CreateWarehouseDto,
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.stockService.createWarehouse(dto, businessId);
  }

  @Get('warehouses')
  getWarehouses(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.stockService.getWarehouses(businessId);
  }

  @Patch('warehouses/:id')
  updateWarehouse(
    @Param('id', ParseIntPipe) id: number,
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.stockService.updateWarehouse(id, dto, businessId);
  }

  @Delete('warehouses/:id')
  deleteWarehouse(
    @Param('id', ParseIntPipe) id: number,
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.stockService.deleteWarehouse(id, businessId);
  }

  // ── Assign Product to Warehouse ─────────────────────────────────
  @Post('warehouses/:id/products')
  assignProduct(
    @Param('id', ParseIntPipe) warehouseId: number,
    @Body() dto: AssignProductDto,
  ) {
    return this.stockService.assignProduct(warehouseId, dto);
  }

  @Delete('warehouses/:id/products/:productId')
  removeProduct(
    @Param('id', ParseIntPipe) warehouseId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.stockService.removeProductFromWarehouse(warehouseId, productId);
  }

  // ── Stock Levels ────────────────────────────────────────────────
  @Get('levels')
  getStockLevels(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.stockService.getStockLevels(businessId);
  }

  // ── Stock Movements ─────────────────────────────────────────────
  @Post('movements')
  createMovement(
    @Body() dto: StockMovementDto,
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.stockService.createMovement(dto, businessId);
  }

  @Get('movements')
  getMovementHistory(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.stockService.getMovementHistory(businessId);
  }

  // ── Transfer Stock ──────────────────────────────────────────────
  @Post('transfer')
  transferStock(
    @Body() body: {
      fromWarehouseId: number;
      toWarehouseId: number;
      productId: number;
      quantity: number;
    },
  ) {
    return this.stockService.transferStock(
      body.fromWarehouseId,
      body.toWarehouseId,
      body.productId,
      body.quantity,
    );
  }

  // ── Inventory Sessions ──────────────────────────────────────────
  @Post('inventory/sessions')
  createSession(
    @Body('name') name: string,
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.stockService.createInventorySession(name, businessId);
  }

  @Get('inventory/sessions')
  getSessions(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.stockService.getInventorySessions(businessId);
  }

  @Get('inventory/sessions/:id/counts')
  getSessionCounts(@Param('id', ParseIntPipe) sessionId: number) {
    return this.stockService.getSessionCounts(sessionId);
  }

  @Post('inventory/sessions/:id/counts')
  recordCount(
    @Param('id', ParseIntPipe) sessionId: number,
    @Body() body: { product_id: number; physical_quantity: number },
  ) {
    return this.stockService.recordCount(
      sessionId,
      body.product_id,
      body.physical_quantity,
    );
  }

  @Post('inventory/sessions/:id/adjust')
  adjustInventory(@Param('id', ParseIntPipe) sessionId: number) {
    return this.stockService.adjustInventory(sessionId);
  }

  // ── Adjustment History ──────────────────────────────────────────
  @Get('inventory/history')
  getAdjustmentHistory(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.stockService.getAdjustmentHistory(businessId);
  }

  // ── Variance Report ─────────────────────────────────────────────
  @Get('inventory/sessions/:id/report')
  getVarianceReport(@Param('id', ParseIntPipe) sessionId: number) {
    return this.stockService.getVarianceReport(sessionId);
  }

  // ── Import Excel ────────────────────────────────────────────────
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Param('businessId', ParseIntPipe) businessId: number,
    @Query('userId') userId?: string,
  ) {
    return this.stockService.importFromExcel(
      file,
      businessId,
      userId ? parseInt(userId) : undefined,
    );
  }
}