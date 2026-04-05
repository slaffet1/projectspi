import { api } from "./api";

const base = (businessId) => `/api/businesses/${businessId}/invoices`;

export const invoiceService = {
  getAll: (businessId) =>
    api.get(base(businessId)),

  getOne: (businessId, id) =>
    api.get(`${base(businessId)}/${id}`),

  create: (businessId, data) =>
    api.post(base(businessId), data),

getUnpaid(businessId: number) {
  return api.get(`/businesses/${businessId}/invoices/unpaid`);
},
 sendInvoice: (businessId: number, invoiceId: number) =>
    api.post(`/api/businesses/${businessId}/invoices/${invoiceId}/send`),
  markAsPaid: (invoiceId: number, businessId?: number) => {
    api.patch(`/api/businesses/${businessId}/invoices/${invoiceId}/mark-paid`)
  },
   updateDueDate: (businessId: number, invoiceId: number, dueDate: string) =>
    api.patch(`${base(businessId)}/${invoiceId}/due-date`, { due_date: dueDate }),

  deleteInvoice: (businessId: number, invoiceId: number) =>
    api.delete(`${base(businessId)}/${invoiceId}`),
  getBanksByBusiness: (businessId: number) =>
  api.get(`/api/businesses/${businessId}/invoices/banks`),
};

