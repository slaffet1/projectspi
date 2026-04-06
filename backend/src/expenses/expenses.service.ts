import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  // 🔒 Vérifier appartenance business
  private async assertBelongsToBusiness(id: number, businessId: number) {
    const expense = await this.prisma.expenses.findFirst({
      where: { id, business_id: businessId },
      include: { category: true },
    });

    if (!expense) throw new NotFoundException('Dépense introuvable');
    return expense;
  }

  // ✅ CREATE
  async create(businessId: number, dto: CreateExpenseDto) {
    // Vérifier catégorie
    const category = await this.prisma.expense_categories.findFirst({
      where: { id: dto.category_id, business_id: businessId },
    });

    if (!category) throw new NotFoundException('Catégorie introuvable');

    return this.prisma.expenses.create({
      data: {
        label: dto.label,
        amount: dto.amount,
        expense_date: new Date(dto.expense_date),
        payment_method: dto.payment_method,
        business_id: businessId,
        category_id: dto.category_id,
      },
      include: { category: true },
    });
  }

  // ✅ GET ALL
  async findAll(businessId: number) {
    return this.prisma.expenses.findMany({
      where: { business_id: businessId },
      include: { category: true },
      orderBy: { expense_date: 'desc' },
    });
  }

  // ✅ GET ONE
  async findOne(businessId: number, id: number) {
    return this.assertBelongsToBusiness(id, businessId);
  }

  // ✅ UPDATE
  async update(businessId: number, id: number, dto: UpdateExpenseDto) {
    await this.assertBelongsToBusiness(id, businessId);

    return this.prisma.expenses.update({
  where: { id },
  data: {
    label: dto.label,
    amount: dto.amount,
    expense_date: dto.expense_date
      ? new Date(dto.expense_date)
      : undefined,
    payment_method: dto.payment_method,
    category_id: dto.category_id,
    status: dto.status, // ✅ AJOUT
  },
  include: { category: true },
});
  }

  // ✅ DELETE
  async remove(businessId: number, id: number) {
    await this.assertBelongsToBusiness(id, businessId);

    await this.prisma.expenses.delete({ where: { id } });

    return { message: 'Dépense supprimée avec succès' };
  }
}