import { api } from './api';

export const employeeService = {
  // Employés
  createEmployee: (data: any) => api.post('/employees', data),
  
  getEmployees: (businessId: number) => api.get(`/employees/business/${businessId}`),
  
  // Fiches de paie
  savePayslip: (data: any) => api.post('/employees/payslip', data),
  
  getPayslips: (employeeId: number) => api.get(`/employees/payslip/${employeeId}`),
};
