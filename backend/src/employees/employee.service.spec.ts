import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

// ── Mock axios ─────────────────────────────────────────────────────────────
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockPrisma = {
  employee: {
    create:     jest.fn(),
    update:     jest.fn(),
    findMany:   jest.fn(),
    findUnique: jest.fn(),
  },
  expenses: {
    create: jest.fn(),
  },
  payslip: {
    create:    jest.fn(),
    findFirst: jest.fn(),
    findMany:  jest.fn(),
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const makeEmployeeData = (overrides: Partial<any> = {}) => ({
  businessId:               1,
  firstName:                'Ali',
  lastName:                 'Ben Salah',
  isHeadOfFamily:           true,
  childrenCount:            2,
  baseSalary:               2000,
  salaryType:               'BRUT',
  age:                      30,
  gender:                   'Male',
  maritalStatus:            'Married',
  department:               'Engineering',
  jobRole:                  'Developer',
  jobLevel:                 2,
  yearsAtCompany:           3,
  yearsInCurrentRole:       2,
  yearsSinceLastPromotion:  1,
  jobSatisfaction:          3,
  workLifeBalance:          3,
  performanceRating:        4,
  jobInvolvement:           3,
  projectCount:             4,
  averageHoursPerWeek:      40,
  absenteeism:              2,
  distanceFromHome:         10,
  ...overrides,
});

const makeEmployee = (overrides: Partial<any> = {}) => ({
  id:                       1,
  businessId:               1,
  firstName:                'Ali',
  lastName:                 'Ben Salah',
  baseSalary:               2000,
  overtime:                 'Yes',
  age:                      30,
  gender:                   'Male',
  maritalStatus:            'Married',
  department:               'Engineering',
  jobRole:                  'Developer',
  jobLevel:                 2,
  yearsAtCompany:           3,
  yearsInCurrentRole:       2,
  yearsSinceLastPromotion:  1,
  jobSatisfaction:          3,
  workLifeBalance:          3,
  performanceRating:        4,
  jobInvolvement:           3,
  projectCount:             4,
  averageHoursPerWeek:      40,
  absenteeism:              2,
  distanceFromHome:         10,
  attritionProbability:     null,
  attritionRisk:            null,
  ...overrides,
});

const makeMlResult = (overrides: Partial<any> = {}) => ({
  prediction:     1,
  probability:    0.85,
  attrition_risk: 'High',
  ...overrides,
});

const makePayslipData = (overrides: Partial<any> = {}) => ({
  employeeId:       1,
  month:            5,
  year:             2025,
  salaireBrut:      2000,
  retenueCnss:      180,
  salaireImposable: 1820,
  retenueIrpp:      200,
  retenueCss:       20,
  salaireNet:       1600,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════
describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    jest.clearAllMocks();
  });

  // ── createEmployee ────────────────────────────────────────────────────────
  describe('createEmployee', () => {
    it('should create an employee and a salary expense', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockPrisma.employee.update.mockResolvedValue(employee);
      mockedAxios.post.mockResolvedValue({ data: makeMlResult() });

      const result = await service.createEmployee(makeEmployeeData());

      expect(mockPrisma.employee.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.expenses.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount:         employee.baseSalary,
            business_id:    employee.businessId,
            payment_method: 'Virement',
          }),
        }),
      );
      expect(result.employee).toEqual(employee);
    });

    it('should include employee name in the expense label', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: makeMlResult() });
      mockPrisma.employee.update.mockResolvedValue(employee);

      await service.createEmployee(makeEmployeeData());

      const label: string = mockPrisma.expenses.create.mock.calls[0][0].data.label;
      expect(label).toContain(employee.firstName);
      expect(label).toContain(employee.lastName);
    });

    it('should set overtime to "Yes" regardless of input', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: makeMlResult() });
      mockPrisma.employee.update.mockResolvedValue(employee);

      await service.createEmployee(makeEmployeeData());

      expect(mockPrisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ overtime: 'Yes' }),
        }),
      );
    });

    it('should default isHeadOfFamily to false when not provided', async () => {
      const data = makeEmployeeData({ isHeadOfFamily: undefined });
      const employee = makeEmployee({ isHeadOfFamily: false });
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: makeMlResult() });
      mockPrisma.employee.update.mockResolvedValue(employee);

      await service.createEmployee(data);

      expect(mockPrisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isHeadOfFamily: false }),
        }),
      );
    });

    it('should default childrenCount to 0 when not provided', async () => {
      const data = makeEmployeeData({ childrenCount: undefined });
      const employee = makeEmployee({ childrenCount: 0 });
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: makeMlResult() });
      mockPrisma.employee.update.mockResolvedValue(employee);

      await service.createEmployee(data);

      expect(mockPrisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ childrenCount: 0 }),
        }),
      );
    });

    it('should call ML API with correct payload fields', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: makeMlResult() });
      mockPrisma.employee.update.mockResolvedValue(employee);

      await service.createEmployee(makeEmployeeData());

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://predicitonapi.onrender.com/predict',
        expect.objectContaining({
          Age:            employee.age,
          Monthly_Income: employee.baseSalary,
          Overtime:       'Yes',
        }),
      );
    });

    it('should update employee attrition data when ML returns High risk', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: makeMlResult({ attrition_risk: 'High', probability: 0.9 }) });
      mockPrisma.employee.update.mockResolvedValue(employee);

      await service.createEmployee(makeEmployeeData());

      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: employee.id },
          data:  expect.objectContaining({
            attritionProbability: 0.9,
            attritionRisk:        'HIGH_RISK',
          }),
        }),
      );
    });

    it('should set attritionRisk to LOW_RISK when ML returns non-High risk', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockResolvedValue({ data: makeMlResult({ attrition_risk: 'Low', probability: 0.2 }) });
      mockPrisma.employee.update.mockResolvedValue(employee);

      await service.createEmployee(makeEmployeeData());

      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ attritionRisk: 'LOW_RISK' }),
        }),
      );
    });

    it('should not throw when ML API call fails', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockRejectedValue(new Error('ML service unavailable'));

      await expect(
        service.createEmployee(makeEmployeeData()),
      ).resolves.not.toThrow();
    });

    it('should still return employee even when ML API fails', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockRejectedValue(new Error('timeout'));

      const result = await service.createEmployee(makeEmployeeData());

      expect(result.employee).toEqual(employee);
    });

    it('should not call employee.update when ML API fails', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockRejectedValue(new Error('timeout'));

      await service.createEmployee(makeEmployeeData());

      expect(mockPrisma.employee.update).not.toHaveBeenCalled();
    });

    it('should return mlResult as null when ML API fails', async () => {
      const employee = makeEmployee();
      mockPrisma.employee.create.mockResolvedValue(employee);
      mockPrisma.expenses.create.mockResolvedValue({});
      mockedAxios.post.mockRejectedValue(new Error('timeout'));

      const result = await service.createEmployee(makeEmployeeData());

      expect(result.mlResult).toBeNull();
    });
  });

  // ── getAttritionPrediction ────────────────────────────────────────────────
  describe('getAttritionPrediction', () => {
    it('should return ML API response data', async () => {
      const mlResult = makeMlResult();
      mockedAxios.post.mockResolvedValue({ data: mlResult });

      const result = await service.getAttritionPrediction({ Age: 30 });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://predicitonapi.onrender.com/predict',
        { Age: 30 },
      );
      expect(result).toEqual(mlResult);
    });

    it('should throw a generic error when ML API fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(
        service.getAttritionPrediction({ Age: 30 }),
      ).rejects.toThrow('Failed to get prediction');
    });
  });

  // ── updateEmployee ────────────────────────────────────────────────────────
  describe('updateEmployee', () => {
    it('should update the employee and return the updated record', async () => {
      const updated = makeEmployee({ firstName: 'Mohamed' });
      mockPrisma.employee.update.mockResolvedValue(updated);

      const result = await service.updateEmployee(1, { firstName: 'Mohamed' });

      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data:  { firstName: 'Mohamed' },
      });
      expect(result).toEqual(updated);
    });

    it('should pass the correct id to prisma update', async () => {
      mockPrisma.employee.update.mockResolvedValue(makeEmployee());

      await service.updateEmployee(42, { baseSalary: 3000 });

      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 42 } }),
      );
    });
  });

  // ── getEmployeesByBusiness ────────────────────────────────────────────────
  describe('getEmployeesByBusiness', () => {
    it('should return employees for a given business ordered by lastName asc', async () => {
      const employees = [makeEmployee(), makeEmployee({ id: 2, lastName: 'Zouari' })];
      mockPrisma.employee.findMany.mockResolvedValue(employees);

      const result = await service.getEmployeesByBusiness(1);

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith({
        where:   { businessId: 1 },
        orderBy: { lastName: 'asc' },
        include: { _count: { select: { payslips: true } } },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no employees exist', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      const result = await service.getEmployeesByBusiness(99);

      expect(result).toEqual([]);
    });

    it('should filter by the correct businessId', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      await service.getEmployeesByBusiness(7);

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { businessId: 7 } }),
      );
    });
  });

  // ── createPayslip ─────────────────────────────────────────────────────────
  describe('createPayslip', () => {
    it('should create a payslip and return it', async () => {
      mockPrisma.payslip.findFirst.mockResolvedValue(null);
      const created = { id: 1, ...makePayslipData() };
      mockPrisma.payslip.create.mockResolvedValue(created);

      const result = await service.createPayslip(makePayslipData());

      expect(mockPrisma.payslip.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(created);
    });

    it('should throw BadRequestException when payslip already exists for same month/year', async () => {
      mockPrisma.payslip.findFirst.mockResolvedValue({ id: 99 });

      await expect(
        service.createPayslip(makePayslipData()),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.payslip.create).not.toHaveBeenCalled();
    });

    it('should check for duplicate using employeeId, month, and year', async () => {
      mockPrisma.payslip.findFirst.mockResolvedValue(null);
      mockPrisma.payslip.create.mockResolvedValue({});

      await service.createPayslip(makePayslipData({ employeeId: 3, month: 6, year: 2024 }));

      expect(mockPrisma.payslip.findFirst).toHaveBeenCalledWith({
        where: { employeeId: 3, month: 6, year: 2024 },
      });
    });

    it('should compute salaireImposable as salaireBrut - retenueCnss when not provided', async () => {
      mockPrisma.payslip.findFirst.mockResolvedValue(null);
      mockPrisma.payslip.create.mockResolvedValue({});

      await service.createPayslip(makePayslipData({ salaireImposable: NaN }));

      expect(mockPrisma.payslip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            salaireImposable: 2000 - 180, // salaireBrut - retenueCnss
          }),
        }),
      );
    });

    it('should use provided salaireImposable when it is a valid number', async () => {
      mockPrisma.payslip.findFirst.mockResolvedValue(null);
      mockPrisma.payslip.create.mockResolvedValue({});

      await service.createPayslip(makePayslipData({ salaireImposable: 1500 }));

      expect(mockPrisma.payslip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ salaireImposable: 1500 }),
        }),
      );
    });

    it('should coerce string numbers to numbers', async () => {
      mockPrisma.payslip.findFirst.mockResolvedValue(null);
      mockPrisma.payslip.create.mockResolvedValue({});

      await service.createPayslip({
        ...makePayslipData(),
        salaireBrut:  '2000',
        retenueCnss:  '180',
        retenueIrpp:  '200',
        retenueCss:   '20',
        salaireNet:   '1600',
        employeeId:   '1',
        month:        '5',
        year:         '2025',
      });

      expect(mockPrisma.payslip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            salaireBrut: 2000,
            month:       5,
            year:        2025,
          }),
        }),
      );
    });

    it('should connect employee by id when creating payslip', async () => {
      mockPrisma.payslip.findFirst.mockResolvedValue(null);
      mockPrisma.payslip.create.mockResolvedValue({});

      await service.createPayslip(makePayslipData({ employeeId: 5 }));

      expect(mockPrisma.payslip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employee: { connect: { id: 5 } },
          }),
        }),
      );
    });

    it('should default numeric fields to 0 when not provided', async () => {
      mockPrisma.payslip.findFirst.mockResolvedValue(null);
      mockPrisma.payslip.create.mockResolvedValue({});

      await service.createPayslip({
        employeeId: 1, month: 1, year: 2025,
        salaireBrut: undefined, retenueCnss: undefined,
        retenueIrpp: undefined, retenueCss: undefined, salaireNet: undefined,
      });

      expect(mockPrisma.payslip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            salaireBrut: 0,
            retenueCnss: 0,
            retenueIrpp: 0,
            retenueCss:  0,
            salaireNet:  0,
          }),
        }),
      );
    });
  });

  // ── getEmployeePayslips ───────────────────────────────────────────────────
  describe('getEmployeePayslips', () => {
    it('should return payslips for an employee ordered by year and month desc', async () => {
      const payslips = [
        { id: 1, employeeId: 1, month: 5, year: 2025 },
        { id: 2, employeeId: 1, month: 4, year: 2025 },
      ];
      mockPrisma.payslip.findMany.mockResolvedValue(payslips);

      const result = await service.getEmployeePayslips(1);

      expect(mockPrisma.payslip.findMany).toHaveBeenCalledWith({
        where:   { employeeId: 1 },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when employee has no payslips', async () => {
      mockPrisma.payslip.findMany.mockResolvedValue([]);

      const result = await service.getEmployeePayslips(99);

      expect(result).toEqual([]);
    });

    it('should filter by the correct employeeId', async () => {
      mockPrisma.payslip.findMany.mockResolvedValue([]);

      await service.getEmployeePayslips(7);

      expect(mockPrisma.payslip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { employeeId: 7 } }),
      );
    });
  });
});