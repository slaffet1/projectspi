import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajustez le chemin selon votre projet

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  // ─── GESTION DES EMPLOYÉS ──────────────────────────────────────

  async createEmployee(data: any) {
    // 1. On crée l'employé
    const newEmployee = await this.prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        isHeadOfFamily: data.isHeadOfFamily,
        childrenCount: data.childrenCount,
        baseSalary: data.baseSalary,
        salaryType: data.salaryType,
        businesses: { connect: { id: data.businessId } }
      }
    });

    // 2. ✨ AUTOMATISATION : On crée la dépense initiale
    await this.prisma.expenses.create({
      data: {
        label: `Salaire (Mois en cours) - ${newEmployee.firstName} ${newEmployee.lastName}`,
        amount: newEmployee.baseSalary,
        expense_date: new Date(),
        payment_method: 'Virement',
        business_id: newEmployee.businessId,
      }
    });

    return newEmployee;
  }

  async getEmployeesByBusiness(businessId: number) {
    return this.prisma.employee.findMany({
      where: { businessId },
      orderBy: { lastName: 'asc' },
      include: {
        // Inclut le compte des fiches de paie générées
        _count: { select: { payslips: true } },
      },
    });
  }

  // ─── GESTION DES FICHES DE PAIE (HISTORIQUE) ────────────────────

  async createPayslip(data: any) {
    // Vérifier si une fiche existe déjà pour ce mois et cette année
    const existingPayslip = await this.prisma.payslip.findFirst({
      where: {
        employeeId: Number(data.employeeId),
        month: Number(data.month),
        year: Number(data.year),
      },
    });

    if (existingPayslip) {
      // NestJS gère très bien les exceptions HTTP
      throw new BadRequestException('Une fiche de paie existe déjà pour ce mois et cet employé.');
    }

    // Calculer les valeurs avec gestion des NaN
    const salaireBrut = Number(data.salaireBrut) || 0;
    const retenueCnss = Number(data.retenueCnss) || 0;
    let salaireImposable = Number(data.salaireImposable);
    
    // Si salaireImposable est NaN, on le calcule
    if (isNaN(salaireImposable)) {
      salaireImposable = salaireBrut - retenueCnss;
    }
    
    const retenueIrpp = Number(data.retenueIrpp) || 0;
    const retenueCss = Number(data.retenueCss) || 0;
    const salaireNet = Number(data.salaireNet) || 0;

    return this.prisma.payslip.create({
      data: {
        employee: {
          connect: { id: Number(data.employeeId) }
        },
        month: Number(data.month),
        year: Number(data.year),
        salaireBrut: salaireBrut,
        retenueCnss: retenueCnss,
        salaireImposable: salaireImposable,
        retenueIrpp: retenueIrpp,
        retenueCss: retenueCss,
        salaireNet: salaireNet,
      },
    });
  }

  async getEmployeePayslips(employeeId: number) {
    return this.prisma.payslip.findMany({
      where: {
        employeeId: employeeId,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });
  }
}