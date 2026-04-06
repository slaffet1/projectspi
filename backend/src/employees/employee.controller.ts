import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EmployeeService } from './employee.service';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  async createEmployee(@Body() createEmployeeDto: any) {
    const data = await this.employeeService.createEmployee(createEmployeeDto);
    return { success: true, data };
  }

  @Get('business/:businessId')
  async getEmployees(@Param('businessId') businessId: string) {
    const data = await this.employeeService.getEmployeesByBusiness(+businessId);
    return { success: true, data };
  }

  @Post('payslip')
  async createPayslip(@Body() createPayslipDto: any) {
    const data = await this.employeeService.createPayslip(createPayslipDto);
    return { success: true, data };
  }

  @Get('payslip/:employeeId')
  async getEmployeePayslips(@Param('employeeId') employeeId: string) {
    const data = await this.employeeService.getEmployeePayslips(+employeeId);
    return { success: true, data };
  }
}