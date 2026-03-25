import { api } from './api';

export const bankService = {
  getBanks: () => api.get('/banks'),

  createBank: (data: any) => api.post('/banks', data),

  updateBank: (id: number, data: any) =>
    api.patch(`/banks/${id}`, data),

  deleteBank: (id: number) =>
    api.delete(`/banks/${id}`),

   searchBanks: (query: string) => api.get(`/banks/search?q=${query}`),
};