import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: number, dto: CreateCategoryDto) {
    return this.prisma.expense_categories.create({
      data: {
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        business_id: businessId,
      },
    });
  }

  async findAll(businessId: number) {
    return this.prisma.expense_categories.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(businessId: number, id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.expense_categories.findFirst({
      where: { id, business_id: businessId },
    });

    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.expense_categories.update({
      where: { id },
      data: dto,
    });
  }

  async remove(businessId: number, id: number) {
    const category = await this.prisma.expense_categories.findFirst({
      where: { id, business_id: businessId },
    });

    if (!category) throw new NotFoundException('Category not found');

    await this.prisma.expense_categories.delete({
      where: { id },
    });

    return { message: 'Category deleted' };
  }
}