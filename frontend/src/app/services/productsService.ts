import { api } from './api';

export type CreateProductData = {
  name: string;
  description?: string;
  reference?: string;
  barcode?: string;
  unit_price: number;
  cost_price?: number;
  tax_rate?: number;
  category?: string;
  unit?: string;
  is_active?: boolean;
  fournisseur_id?: number;
};

export const productsService = {
  getProducts: (businessId: number) =>
    api.get(`/api/businesses/${businessId}/products`),

  getProduct: (businessId: number, id: number) =>
    api.get(`/api/businesses/${businessId}/products/${id}`),

  createProduct: (businessId: number, data: CreateProductData) =>
    api.post(`/api/businesses/${businessId}/products`, data),

  updateProduct: (businessId: number, id: number, data: Partial<CreateProductData>) =>
    api.put(`/api/businesses/${businessId}/products/${id}`, data),

  deleteProduct: (businessId: number, id: number) =>
    api.delete(`/api/businesses/${businessId}/products/${id}`),

  toggleProduct: (businessId: number, id: number) =>
    api.patch(`/api/businesses/${businessId}/products/${id}/toggle`),
};