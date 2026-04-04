import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Req, UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StockService } from './stock.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { AssignProductDto } from './dto/assign-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ── Warehouses ──────────────────────────────────────────────────
  @Post('warehouses')
  createWarehouse(@Body() dto: CreateWarehouseDto, @Req() req: any) {
    return this.stockService.createWarehouse(dto, req.user.businessId);
  }

  @Get('warehouses')
  getWarehouses(@Req() req: any) {
    return this.stockService.getWarehouses(req.user.businessId);
  }

  @Patch('warehouses/:id')
  updateWarehouse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateWarehouseDto,
    @Req() req: any,
  ) {
    return this.stockService.updateWarehouse(id, dto, req.user.businessId);
  }

  @Delete('warehouses/:id')
  deleteWarehouse(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.stockService.deleteWarehouse(id, req.user.businessId);
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
  getStockLevels(@Req() req: any) {
    return this.stockService.getStockLevels(req.user.businessId);
  }

  // ── Stock Movements ─────────────────────────────────────────────
  @Post('movements')
  createMovement(@Body() dto: StockMovementDto, @Req() req: any) {
    return this.stockService.createMovement(dto, req.user.businessId);
  }

  @Get('movements')
  getMovementHistory(@Req() req: any) {
    return this.stockService.getMovementHistory(req.user.businessId);
  }

  // ── Transfer Stock ──────────────────────────────────────────────
  @Post('transfer')
  transferStock(
    @Body() body: { fromWarehouseId: number; toWarehouseId: number; productId: number; quantity: number },
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
  createSession(@Body('name') name: string, @Req() req: any) {
    return this.stockService.createInventorySession(name, req.user.businessId);
  }

  @Get('inventory/sessions')
  getSessions(@Req() req: any) {
    return this.stockService.getInventorySessions(req.user.businessId);
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
    return this.stockService.recordCount(sessionId, body.product_id, body.physical_quantity);
  }

  @Post('inventory/sessions/:id/adjust')
  adjustInventory(@Param('id', ParseIntPipe) sessionId: number) {
    return this.stockService.adjustInventory(sessionId);
  }

  // ── Adjustment History ──────────────────────────────────────────
  @Get('inventory/history')
  getAdjustmentHistory(@Req() req: any) {
    return this.stockService.getAdjustmentHistory(req.user.businessId);
  }

  // ── Variance Report ─────────────────────────────────────────────
  @Get('inventory/sessions/:id/report')
  getVarianceReport(@Param('id', ParseIntPipe) sessionId: number) {
    return this.stockService.getVarianceReport(sessionId);
  }
}
