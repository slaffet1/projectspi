import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { RequirePermission } from 'src/permissions/permissions/permissions.guard';

const mockEmployeeService = {
  createEmployee: jest.fn(),
  getEmployeesByBusiness: jest.fn(),
  createPayslip: jest.fn(),
  getEmployeePayslips: jest.fn(),
};

describe('EmployeeController', () => {
  let controller: EmployeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: EmployeeService, useValue: mockEmployeeService },
      ],
    })
      .overrideGuard(RequirePermission)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmployeeController>(EmployeeController);
    jest.clearAllMocks();
  });

  // ── createEmployee ──────────────────────────────────────────────
  describe('createEmployee', () => {
    it('should call employeeService.createEmployee and return success with data', async () => {
      const dto = {
        firstName: 'Ali',
        lastName: 'Ben Salem',
        baseSalary: 2000,
        businessId: 1,
      };
      const created = { id: 1, ...dto };

      mockEmployeeService.createEmployee.mockResolvedValue(created);

      const result = await controller.createEmployee(dto);

      expect(mockEmployeeService.createEmployee).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true, data: created });
    });

    it('should return success true wrapped around service data', async () => {
      const dto = { firstName: 'Sarra', lastName: 'Trabelsi', baseSalary: 1500, businessId: 2 };
      mockEmployeeService.createEmployee.mockResolvedValue({ id: 2, ...dto });

      const result = await controller.createEmployee(dto);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });

    it('should propagate errors thrown by the service', async () => {
      mockEmployeeService.createEmployee.mockRejectedValue(new Error('Business not found'));

      await expect(
        controller.createEmployee({ businessId: 999 }),
      ).rejects.toThrow('Business not found');
    });
  });

  // ── getEmployees ─────────────────────────────────────────────────
  describe('getEmployees', () => {
    it('should call employeeService.getEmployeesByBusiness with converted businessId', async () => {
      const employees = [
        { id: 1, firstName: 'Ali', businessId: 1 },
        { id: 2, firstName: 'Sarra', businessId: 1 },
      ];

      mockEmployeeService.getEmployeesByBusiness.mockResolvedValue(employees);

      const result = await controller.getEmployees('1');

      // Verifie la conversion string -> number via +businessId
      expect(mockEmployeeService.getEmployeesByBusiness).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true, data: employees });
    });

    it('should convert businessId string to number', async () => {
      mockEmployeeService.getEmployeesByBusiness.mockResolvedValue([]);

      await controller.getEmployees('42');

      expect(mockEmployeeService.getEmployeesByBusiness).toHaveBeenCalledWith(42);
    });

    it('should return empty data array when no employees exist', async () => {
      mockEmployeeService.getEmployeesByBusiness.mockResolvedValue([]);

      const result = await controller.getEmployees('99');

      expect(result).toEqual({ success: true, data: [] });
    });

    it('should propagate errors thrown by the service', async () => {
      mockEmployeeService.getEmployeesByBusiness.mockRejectedValue(new Error('Business not found'));

      await expect(
        controller.getEmployees('999'),
      ).rejects.toThrow('Business not found');
    });
  });

  // ── createPayslip ───────────────────────────────────────────────
  describe('createPayslip', () => {
    it('should call employeeService.createPayslip and return success with data', async () => {
      const dto = {
        employeeId: 1,
        month: 5,
        year: 2025,
        salaireBrut: 2000,
      };
      const created = { id: 1, ...dto, salaireNet: 1750 };

      mockEmployeeService.createPayslip.mockResolvedValue(created);

      const result = await controller.createPayslip(dto);

      expect(mockEmployeeService.createPayslip).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true, data: created });
    });

    it('should return success true wrapped around service data', async () => {
      const dto = { employeeId: 2, month: 6, year: 2025, salaireBrut: 1500 };
      mockEmployeeService.createPayslip.mockResolvedValue({ id: 2, ...dto });

      const result = await controller.createPayslip(dto);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });

    it('should propagate errors thrown by the service', async () => {
      mockEmployeeService.createPayslip.mockRejectedValue(new Error('Employee not found'));

      await expect(
        controller.createPayslip({ employeeId: 999 }),
      ).rejects.toThrow('Employee not found');
    });
  });

  // ── getEmployeePayslips ─────────────────────────────────────────
  describe('getEmployeePayslips', () => {
    it('should call employeeService.getEmployeePayslips with converted employeeId', async () => {
      const payslips = [
        { id: 1, employeeId: 1, month: 5, year: 2025, salaireNet: 1750 },
        { id: 2, employeeId: 1, month: 6, year: 2025, salaireNet: 1750 },
      ];

      mockEmployeeService.getEmployeePayslips.mockResolvedValue(payslips);

      const result = await controller.getEmployeePayslips('1');

      // Verifie la conversion string -> number via +employeeId
      expect(mockEmployeeService.getEmployeePayslips).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true, data: payslips });
    });

    it('should convert employeeId string to number', async () => {
      mockEmployeeService.getEmployeePayslips.mockResolvedValue([]);

      await controller.getEmployeePayslips('42');

      expect(mockEmployeeService.getEmployeePayslips).toHaveBeenCalledWith(42);
    });

    it('should return empty data array when no payslips exist', async () => {
      mockEmployeeService.getEmployeePayslips.mockResolvedValue([]);

      const result = await controller.getEmployeePayslips('99');

      expect(result).toEqual({ success: true, data: [] });
    });

    it('should propagate errors thrown by the service', async () => {
      mockEmployeeService.getEmployeePayslips.mockRejectedValue(new Error('Employee not found'));

      await expect(
        controller.getEmployeePayslips('999'),
      ).rejects.toThrow('Employee not found');
    });
  });
});