import { api } from './api';

export type QuoteDetail = {
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_rate: number;
};

export type CreateQuotePayload = {
  client_id: number;
  issue_date: string;
  expiration_date: string;
  total_amount: number;
  status?: string;
  details: QuoteDetail[];
};

const base = (businessId: number) =>
  `/api/businesses/${businessId}/quotes`;

export const quoteService = {
  getAll:          (businessId: number) =>
    api.get(base(businessId)),

  getOne:          (businessId: number, id: number) =>
    api.get(`${base(businessId)}/${id}`),

  create:          (businessId: number, data: CreateQuotePayload) =>
    api.post(base(businessId), data),

  update:          (businessId: number, id: number, data: Partial<CreateQuotePayload>) =>
    api.put(`${base(businessId)}/${id}`, data),

  send:            (businessId: number, id: number) =>
    api.patch(`${base(businessId)}/${id}/send`),

  updateStatus:    (businessId: number, id: number, status: string) =>
    api.patch(`${base(businessId)}/${id}/status`, { status }),

  convertToInvoice:(businessId: number, id: number) =>
    api.post(`${base(businessId)}/${id}/convert`),

  remove:          (businessId: number, id: number) =>
    api.delete(`${base(businessId)}/${id}`),
};

export const clientService = {
  getAll: (businessId: number) =>
    api.get(`/api/businesses/${businessId}/clients`),
};