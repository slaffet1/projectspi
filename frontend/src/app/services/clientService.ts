import { api } from './api';

// 🔹 On exporte un objet clientService contenant toutes les fonctions
export const clientService = {
  getClients: () => api.get('/clients'),

  searchClients: (query: string) => api.get(`/clients/search?q=${query}`),

  createClient: (data: any) => api.post('/clients', data),

  updateClient: (id: number, data: any) => api.patch(`/clients/${id}`, data),

  deleteClient: (id: number) => api.delete(`/clients/${id}`),
};