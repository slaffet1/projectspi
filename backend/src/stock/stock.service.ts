import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { AssignProductDto } from './dto/assign-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // ── US-80: Warehouses CRUD ──────────────────────────────────────
  createWarehouse(dto: CreateWarehouseDto, businessId: number) {
    return this.prisma.warehouses.create({
      data: { ...dto, business_id: businessId },
    });
  }

  getWarehouses(businessId: number) {
    return this.prisma.warehouses.findMany({
      where: { business_id: businessId },
      include: { warehouse_products: { include: { products: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  updateWarehouse(id: number, dto: CreateWarehouseDto, businessId: number) {
    return this.prisma.warehouses.updateMany({
      where: { id, business_id: businessId },
      data: dto,
    });
  }

  deleteWarehouse(id: number, businessId: number) {
    return this.prisma.warehouses.deleteMany({
      where: { id, business_id: businessId },
    });
  }

  // ── US-81: Assign Product to Warehouse ─────────────────────────
  async assignProduct(warehouseId: number, dto: AssignProductDto) {
    // 1. Upsert dans warehouse_products
    const result = await this.prisma.warehouse_products.upsert({
      where: {
        warehouse_id_product_id: {
          warehouse_id: warehouseId,
          product_id: dto.product_id,
        },
      },
      update: { quantity: dto.quantity },
      create: {
        warehouse_id: warehouseId,
        product_id: dto.product_id,
        quantity: dto.quantity,
      },
    });

    // 2. Agréger la quantité totale sur tous les warehouses du produit
    const totalQty = await this.prisma.warehouse_products.aggregate({
      where: { product_id: dto.product_id },
      _sum: { quantity: true },
    });
    const total = totalQty._sum.quantity ?? 0;

    // 3. Sync inventaires (upsert)
    const existing = await this.prisma.inventaires.findFirst({
      where: { product_id: dto.product_id },
    });

    if (existing) {
      await this.prisma.inventaires.update({
        where: { id: existing.id },
        data: { quantity_available: total, last_updated: new Date() },
      });
    } else {
      await this.prisma.inventaires.create({
        data: {
          product_id: dto.product_id,
          quantity_available: total,
          last_updated: new Date(),
        },
      });
    }

    return result;
  }

  removeProductFromWarehouse(warehouseId: number, productId: number) {
    return this.prisma.warehouse_products.deleteMany({
      where: { warehouse_id: warehouseId, product_id: productId },
    });
  }

  // ── US-82: View Stock Levels ────────────────────────────────────
  getStockLevels(businessId: number) {
    return this.prisma.inventaires.findMany({
      where: { products: { business_id: businessId } },
      include: { products: true },
      orderBy: { last_updated: 'desc' },
    });
  }

  // ── US-83: Manual Stock Movement ───────────────────────────────
  async createMovement(dto: StockMovementDto, businessId: number) {
    // Create movement record
    const movement = await this.prisma.mouvements.create({
      data: {
        product_id: dto.product_id,
        quantity: dto.quantity,
        type: dto.type as any,
        note: dto.note,
        mouvement_date: new Date(),
      },
    });

    // Update inventory
    const existing = await this.prisma.inventaires.findFirst({
      where: { product_id: dto.product_id },
    });

    if (existing) {
      let newQty = existing.quantity_available;
      if (dto.type === 'IN') newQty += dto.quantity;
      else if (dto.type === 'OUT') newQty -= dto.quantity;
      else newQty = dto.quantity;

      await this.prisma.inventaires.update({
        where: { id: existing.id },
        data: { quantity_available: newQty, last_updated: new Date() },
      });
    } else {
      await this.prisma.inventaires.create({
        data: {
          product_id: dto.product_id,
          quantity_available: dto.type === 'IN' ? dto.quantity : 0,
          last_updated: new Date(),
        },
      });
    }

    return movement;
  }

  // ── US-86: Transfer Stock between warehouses ───────────────────
  async transferStock(
    fromWarehouseId: number,
    toWarehouseId: number,
    productId: number,
    quantity: number,
  ) {
    const from = await this.prisma.warehouse_products.findFirst({
      where: { warehouse_id: fromWarehouseId, product_id: productId },
    });

    if (!from || from.quantity < quantity) {
      throw new NotFoundException('Insufficient stock in source warehouse');
    }

    await this.prisma.warehouse_products.updateMany({
      where: { warehouse_id: fromWarehouseId, product_id: productId },
      data: { quantity: from.quantity - quantity },
    });

    await this.prisma.warehouse_products.upsert({
      where: {
        warehouse_id_product_id: {
          warehouse_id: toWarehouseId,
          product_id: productId,
        },
      },
      update: { quantity: { increment: quantity } },
      create: { warehouse_id: toWarehouseId, product_id: productId, quantity },
    });

    return { message: 'Stock transferred successfully' };
  }

  // ── US-88: Stock Movement History ──────────────────────────────
  getMovementHistory(businessId: number) {
    return this.prisma.mouvements.findMany({
      where: { products: { business_id: businessId } },
      include: { products: true },
      orderBy: { created_at: 'desc' },
    });
  }

  // ── US-91: Create Inventory Session ────────────────────────────
  createInventorySession(name: string, businessId: number) {
    return this.prisma.inventory_sessions.create({
      data: { name, business_id: businessId },
    });
  }

  getInventorySessions(businessId: number) {
    return this.prisma.inventory_sessions.findMany({
      where: { business_id: businessId },
      include: { counts: { include: { products: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  // ── US-92: Record Physical Count ───────────────────────────────
  async recordCount(sessionId: number, productId: number, physicalQty: number) {
    const inventory = await this.prisma.inventaires.findFirst({
      where: { product_id: productId },
    });
    const systemQty = inventory?.quantity_available ?? 0;
    const variance = physicalQty - systemQty;

    return this.prisma.inventory_counts.upsert({
      where: {
        id: (await this.prisma.inventory_counts.findFirst({
          where: { session_id: sessionId, product_id: productId },
        }))?.id ?? 0,
      },
      update: { physical_quantity: physicalQty, variance },
      create: {
        session_id: sessionId,
        product_id: productId,
        system_quantity: systemQty,
        physical_quantity: physicalQty,
        variance,
      },
    });
  }

  // ── US-93: Compare Physical vs System ──────────────────────────
  getSessionCounts(sessionId: number) {
    return this.prisma.inventory_counts.findMany({
      where: { session_id: sessionId },
      include: { products: true },
    });
  }

  // ── US-94: Adjust Inventory ────────────────────────────────────
  async adjustInventory(sessionId: number) {
    const counts = await this.prisma.inventory_counts.findMany({
      where: { session_id: sessionId, adjusted: false },
    });

    for (const count of counts) {
      const existing = await this.prisma.inventaires.findFirst({
        where: { product_id: count.product_id },
      });

      if (existing) {
        await this.prisma.inventaires.update({
          where: { id: existing.id },
          data: { quantity_available: count.physical_quantity, last_updated: new Date() },
        });
      }

      await this.prisma.inventory_counts.update({
        where: { id: count.id },
        data: { adjusted: true },
      });
    }

    await this.prisma.inventory_sessions.update({
      where: { id: sessionId },
      data: { status: 'closed', closed_at: new Date() },
    });

    return { message: 'Inventory adjusted successfully' };
  }

  // ── US-95: View Adjustment History ─────────────────────────────
  getAdjustmentHistory(businessId: number) {
    return this.prisma.inventory_sessions.findMany({
      where: { business_id: businessId, status: 'closed' },
      include: { counts: { include: { products: true } } },
      orderBy: { closed_at: 'desc' },
    });
  }

  // ── US-96: Variance Report ─────────────────────────────────────
  async getVarianceReport(sessionId: number) {
    const counts = await this.prisma.inventory_counts.findMany({
      where: { session_id: sessionId },
      include: { products: true },
    });

    return counts.map((c) => ({
      product: c.products?.name,
      system_quantity: c.system_quantity,
      physical_quantity: c.physical_quantity,
      variance: c.variance,
      adjusted: c.adjusted,
    }));
  }
}