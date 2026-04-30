import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  expenses: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  expense_categories: {
    findFirst: jest.fn(),
  },
};

describe('ExpensesService', () => {
  let service: ExpensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should create expense', async () => {
    mockPrisma.expense_categories.findFirst.mockResolvedValue({ id: 1 });

    mockPrisma.expenses.create.mockResolvedValue({
      id: 1,
      amount: 100,
    });

    const result = await service.create(1, {
      label: 'test',
      amount: 100,
      expense_date: new Date(),
      payment_method: 'cash',
      category_id: 1,
    } as any);

    expect(result.amount).toBe(100);
  });

  it('should throw error if category not found', async () => {
    mockPrisma.expense_categories.findFirst.mockResolvedValue(null);

    await expect(
      service.create(1, { category_id: 1 } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return all expenses', async () => {
    mockPrisma.expenses.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.findAll(1);

    expect(result.length).toBe(1);
  });

  it('should get one expense', async () => {
    mockPrisma.expenses.findFirst.mockResolvedValue({ id: 1 });

    const result = await service.findOne(1, 1);

    expect(result.id).toBe(1);
  });

  it('should throw if expense not found', async () => {
    mockPrisma.expenses.findFirst.mockResolvedValue(null);

    await expect(service.findOne(1, 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update expense', async () => {
    mockPrisma.expenses.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.expenses.update.mockResolvedValue({ id: 1 });

    const result = await service.update(1, 1, { label: 'new' });

    expect(result.id).toBe(1);
  });

  it('should delete expense', async () => {
    mockPrisma.expenses.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.expenses.delete.mockResolvedValue({});

    const result = await service.remove(1, 1);

    expect(result.message).toContain('supprimée');
  });
});