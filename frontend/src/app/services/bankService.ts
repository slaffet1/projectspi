import { api } from './api';

export const bankService = {
 getBanks: () => {
  const activeBusiness = JSON.parse(localStorage.getItem('activeBusiness') || '{}');

  return api.get('/banks', {
    params: {
      businessId: activeBusiness.id,
    },
  });
},

   createBank: (data: any) => {
    const activeBusiness = JSON.parse(localStorage.getItem('activeBusiness') || '{}');

    return api.post('/banks', data, {
      params: {
        businessId: activeBusiness.id,
      },
    });
  },

  updateBank: (id: number, data: any) =>
    api.patch(`/banks/${id}`, data),

  deleteBank: (id: number) =>
    api.delete(`/banks/${id}`),

   searchBanks: (query: string) => api.get(`/banks/search?q=${query}`),
};