import { api } from "./api";

const base = (businessId: number) => `/api/businesses/${businessId}/purchase-orders-client`;

export const purchaseOrderclientService = {
  getAll: (businessId: number) =>
    api.get(base(businessId)),

  getOne: (businessId: number, id: number) =>
    api.get(`${base(businessId)}/${id}`),

  create: (businessId: number, data: any) =>
    api.post(base(businessId), data),

  update: (businessId: number, id: number, data: any) =>
    api.put(`${base(businessId)}/${id}`, data),

  updateStatus: (businessId: number, id: number, status: string) =>
    api.patch(`${base(businessId)}/${id}/status`, { status }),

  convertToInvoice: (businessId: number, id: number, data: { issue_date: string; due_date: string; bank_id?: number }) =>
    api.post(`${base(businessId)}/${id}/convert`, data),

  remove: (businessId: number, id: number) =>
    api.delete(`${base(businessId)}/${id}`),

  sendByEmail: (businessId: number, id: number, language = "fr") =>
    api.post(`${base(businessId)}/${id}/send`, { language }),

  downloadPdf: (businessId: number, id: number, language = "fr") =>
    api.post(`${base(businessId)}/${id}/download-pdf`, { language }, { responseType: "blob" }),
};