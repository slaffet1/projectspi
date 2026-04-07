import axios from 'axios';

const API_URL = 'http://localhost:3000/employees';

export const employeeService = {
    // Employés
    createEmployee: (data: any) => axios.post(API_URL, data),
    getEmployees: (businessId: number) => axios.get(`${API_URL}/business/${businessId}`),
    
    // Fiches de paie
    savePayslip: (data: any) => axios.post(`${API_URL}/payslip`, data),
    getPayslips: (employeeId: number) => axios.get(`${API_URL}/payslip/${employeeId}`)
};