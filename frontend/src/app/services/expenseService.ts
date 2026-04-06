import { api } from "./api";

const base = (businessId: number) =>
  `/api/businesses/${businessId}/expenses`;

const categoryBase = (businessId: number) =>
  `/api/businesses/${businessId}/categories`;

export const expenseService = {
  getAll: (businessId: number) =>
    api.get(base(businessId)),

  create: (businessId: number, data: any) =>
    api.post(base(businessId), data),

  remove: (businessId: number, id: number) =>
    api.delete(`${base(businessId)}/${id}`),

  update: (businessId: number, id: number, data: any) =>
  api.put(`${base(businessId)}/${id}`, data),
};

export const categoryService = {
  getAll: (businessId: number) =>
    api.get(categoryBase(businessId)),

  create: (businessId: number, data: any) =>
    api.post(categoryBase(businessId), data),

  delete: (businessId: number, id: number) =>
  api.delete(`/api/businesses/${businessId}/categories/${id}`),
};

