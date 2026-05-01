import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajustez le chemin selon votre projet
import axios from 'axios';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) { }

  private readonly pythonUrl = 'http://127.0.0.1:8000/predict';



  async createEmployee(data: any) {
    // 1. CREATE EMPLOYEE
    const employee = await this.prisma.employee.create({
      data: {
        businessId: data.businessId,

        firstName: data.firstName,
        lastName: data.lastName,

        isHeadOfFamily: data.isHeadOfFamily ?? false,
        childrenCount: data.childrenCount ?? 0,
        baseSalary: data.baseSalary,
        salaryType: data.salaryType ?? 'BRUT',

        // HR ATTRITION DATA
        age: data.age,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        department: data.department,
        jobRole: data.jobRole,
        jobLevel: data.jobLevel,

        yearsAtCompany: data.yearsAtCompany,
        yearsInCurrentRole: data.yearsInCurrentRole,
        yearsSinceLastPromotion: data.yearsSinceLastPromotion,

        jobSatisfaction: data.jobSatisfaction,
        workLifeBalance: data.workLifeBalance,
        performanceRating: data.performanceRating,
        jobInvolvement: data.jobInvolvement,

        overtime: "Yes",
        projectCount: data.projectCount,
        averageHoursPerWeek: data.averageHoursPerWeek,
        absenteeism: data.absenteeism,
        distanceFromHome: data.distanceFromHome,
      },
    });

    // 2. CREATE EXPENSE
    await this.prisma.expenses.create({
      data: {
        label: `Salaire (Mois en cours) - ${employee.firstName} ${employee.lastName}`,
        amount: employee.baseSalary,
        expense_date: new Date(),
        payment_method: 'Virement',
        business_id: employee.businessId,
      },
    });


    const mlPayload = {
      Age: employee.age,
      Gender: employee.gender,
      Marital_Status: employee.maritalStatus,
      Department: employee.department,
      Job_Role: employee.jobRole,
      Job_Level: employee.jobLevel,

      Monthly_Income: employee.baseSalary,
      Hourly_Rate: 8,

      Years_at_Company: employee.yearsAtCompany,
      Years_in_Current_Role: employee.yearsInCurrentRole,
      Years_Since_Last_Promotion: employee.yearsSinceLastPromotion,

      Work_Life_Balance: employee.workLifeBalance,
      Job_Satisfaction: employee.jobSatisfaction,
      Performance_Rating: employee.performanceRating,

      Training_Hours_Last_Year: 0,

      Overtime: employee.overtime,

      Project_Count: employee.projectCount,
      Average_Hours_Worked_Per_Week: 65,
      Absenteeism: employee.absenteeism,

      Work_Environment_Satisfaction: 1,
      Relationship_with_Manager: 1,
      Job_Involvement: employee.jobInvolvement,

      Distance_From_Home: employee.distanceFromHome,
      Number_of_Companies_Worked: 4,
    };
    let mlResult = null;

    try {

      type MlResult = {
        prediction: number;
        probability: number;
        attrition_risk: string;
      };

      let mlResult: MlResult | null = null;
      const response = await axios.post(this.pythonUrl, mlPayload);
      mlResult = response.data;
      try {
        const response = await axios.post<MlResult>(this.pythonUrl, mlPayload);
        mlResult = response.data;
      } catch (error) {
        console.error('ML error:', error);
      }

      if (mlResult) {
        await this.prisma.employee.update({
          where: { id: employee.id },
          data: {
            attritionProbability: mlResult.probability,
            attritionRisk:
              mlResult.attrition_risk === "High"
                ? "HIGH_RISK"
                : "LOW_RISK",
          },
        });
      }
    } catch (error) {
      //console.error('ML prediction failed:', error.message);
    }

    // 6. RETURN EVERYTHING
    return {
      employee,
      mlResult,
    };
  }
  async getAttritionPrediction(employeeData: any) {
    try {
      const response = await axios.post(this.pythonUrl, employeeData);
      return response.data;
    } catch (error) {
      //console.error('ML API error:', error.message);
      throw new Error('Failed to get prediction');
    }
  }
  // ─────────────────────────────────────────
  // UPDATE EMPLOYEE
  // ─────────────────────────────────────────
  async updateEmployee(id: number, data: any) {

    const employee = await this.prisma.employee.update({
      where: { id },
      data,
    });

    // recompute prediction after update
    // await this.updateAttritionPrediction(id);

    return employee;
  }

  // ─────────────────────────────────────────
  // GET EMPLOYEES BY BUSINESS
  // ─────────────────────────────────────────
  async getEmployeesByBusiness(businessId: number) {
    return this.prisma.employee.findMany({
      where: { businessId },
      orderBy: { lastName: 'asc' },
      include: {
        _count: { select: { payslips: true } },
      },
    });
  }

  // ─────────────────────────────────────────
  // ATTRITION PREDICTION
  // ─────────────────────────────────────────
  /*async updateAttritionPrediction(employeeId: number) {

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) return;

    const prediction = await this.attritionService.predict(employee);

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        attritionProbability: prediction.probability,
        attritionRisk: prediction.risk,
      },
    });
  }

  // predict all employees (useful for cron job)
  async predictAllEmployees(businessId: number) {

    const employees = await this.prisma.employee.findMany({
      where: { businessId },
    });

    for (const emp of employees) {
      await this.updateAttritionPrediction(emp.id);
    }

    return { message: 'Attrition predictions updated' };
  }
*/
  // ─────────────────────────────────────────
  // PAYSLIPS
  // ─────────────────────────────────────────
  async createPayslip(data: any) {

    const existingPayslip = await this.prisma.payslip.findFirst({
      where: {
        employeeId: Number(data.employeeId),
        month: Number(data.month),
        year: Number(data.year),
      },
    });

    if (existingPayslip) {
      throw new BadRequestException(
        'Une fiche de paie existe déjà pour ce mois et cet employé.',
      );
    }

    const salaireBrut = Number(data.salaireBrut) || 0;
    const retenueCnss = Number(data.retenueCnss) || 0;

    let salaireImposable = Number(data.salaireImposable);
    if (isNaN(salaireImposable)) {
      salaireImposable = salaireBrut - retenueCnss;
    }

    const retenueIrpp = Number(data.retenueIrpp) || 0;
    const retenueCss = Number(data.retenueCss) || 0;
    const salaireNet = Number(data.salaireNet) || 0;

    return this.prisma.payslip.create({
      data: {
        employee: {
          connect: { id: Number(data.employeeId) },
        },
        month: Number(data.month),
        year: Number(data.year),
        salaireBrut,
        retenueCnss,
        salaireImposable,
        retenueIrpp,
        retenueCss,
        salaireNet,
      },
    });
  }

  async getEmployeePayslips(employeeId: number) {
    return this.prisma.payslip.findMany({
      where: { employeeId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });
  }
}