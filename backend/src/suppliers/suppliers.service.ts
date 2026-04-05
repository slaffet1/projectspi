import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajustez le chemin si besoin
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: number, createSupplierDto: CreateSupplierDto) {
    return this.prisma.fournisseurs.create({
      data: {
        ...createSupplierDto,
        business_id: businessId,
      },
    });
  }

  async findAll(businessId: number) {
    return this.prisma.fournisseurs.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }
  async findOne(businessId: number, id: number) {
    const supplier = await this.prisma.fournisseurs.findFirst({
      where: { id, business_id: businessId },
    });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable');
    return supplier;
  }

  async update(businessId: number, id: number, updateSupplierDto: UpdateSupplierDto) {
    await this.findOne(businessId, id); // Vérifie que le fournisseur existe
    return this.prisma.fournisseurs.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(businessId: number, id: number) {
    await this.findOne(businessId, id);
    return this.prisma.fournisseurs.delete({
      where: { id },
    });
  }
}