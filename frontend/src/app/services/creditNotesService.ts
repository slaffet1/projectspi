import { api } from "./api";

const base = (businessId: number) =>
  `/api/businesses/${businessId}/credit-notes`;

export const creditNoteService = {
 
  getAll: (businessId: number) =>
    api.get(base(businessId)),

  getOne: (businessId: number, id: number) =>
    api.get(`${base(businessId)}/${id}`),

  searchInvoices: (businessId: number, q: string) =>
    api.get(`${base(businessId)}/search/invoices`, { params: { q } }),

  
  searchDeliveryNotes: (businessId: number, q: string) =>
    api.get(`${base(businessId)}/search/delivery-notes`, { params: { q } }),

  
  create: (
    businessId: number,
    data: {
      return_date: string;
      reason: string;
      note?: string;
      invoice_id?: number;
      delivery_note_id?: number;
      items?: {
        product_id: number;
        quantity: number;
        unit_price: number;
      }[];
    },
  ) => api.post(base(businessId), data),

  remove: (businessId: number, id: number) =>
    api.delete(`${base(businessId)}/${id}`),
};