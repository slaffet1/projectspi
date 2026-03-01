import { api } from './api';

export type CreateBusinessData = {
  name: string;
  legal_name?: string;
  matricule_fiscale?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  logo?: string;
  invoice_prefix?: string;
};

export const businessService = {
  // Get all businesses for current user
  getMyBusinesses: () => api.get('/businesses/my'),

  // Get single business
  getBusiness: (id: number) => api.get(`/businesses/${id}`),

  // Create a new business
  createBusiness: (data: CreateBusinessData) => api.post('/businesses', data),

  // Update business profile (OWNER only)
  updateBusiness: (id: number, data: Partial<CreateBusinessData>) =>
    api.patch(`/businesses/${id}`, data),

  // Delete business (OWNER only)
  deleteBusiness: (id: number) => api.delete(`/businesses/${id}`),

  // Switch active business
  switchBusiness: (id: number) => api.post(`/businesses/${id}/switch`),

  // Get members of a business
  getMembers: (id: number) => api.get(`/businesses/${id}/members`),

  // Remove a member (OWNER/ADMIN only)
  removeMember: (businessId: number, userId: number) =>
    api.delete(`/businesses/${businessId}/members/${userId}`),
};