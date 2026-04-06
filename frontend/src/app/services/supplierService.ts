import { api } from './api';

export const supplierService = {
    // US-66: View Supplier List
    getAll: (businessId: number) =>
        api.get(`/api/businesses/${businessId}/suppliers`),

    // US-69: Search/Filter Suppliers
    search: (businessId: number, query: string) =>
        api.get(`/api/businesses/${businessId}/suppliers/search?q=${query}`),

    // US-65: Create Supplier
    create: (businessId: number, data: any) =>
        api.post(`/api/businesses/${businessId}/suppliers`, data),

    getById: (bId: number, id: number) =>
        api.get(`/api/businesses/${bId}/suppliers/${id}`),
    
    // US-67: Edit Supplier
    update: (businessId: number, id: number, data: any) =>
        api.patch(`/api/businesses/${businessId}/suppliers/${id}`, data),

    // US-68: Delete Supplier
    delete: (businessId: number, id: number) =>
        api.delete(`/api/businesses/${businessId}/suppliers/${id}`),
};