import { api } from "./api";

const base = (businessId: number) => `/api/businesses/${businessId}/invoices`;

export const invoiceService = {
  getAll: (businessId: number) =>
    api.get(base(businessId)),

  getOne: (businessId: number, id: number) =>
    api.get(`${base(businessId)}/${id}`),

  create: (businessId: number, data: any) =>
    api.post(base(businessId), data),

  getUnpaid: (businessId: number) =>
    api.get(`${base(businessId)}/unpaid`),

  /**
   * Send invoice by email.
   * The backend (NestJS) calls GeminiService to translate labels, then sends via Nodemailer.
   * @param language  ISO language code ("fr", "en", "ar", …). Defaults to "fr" (no translation).
   */
  sendInvoice: (businessId: number, invoiceId: number, language: string = "fr") =>
    api.post(`${base(businessId)}/${invoiceId}/send`, { language }),

  /**
   * Translate invoice labels via backend (NestJS → Gemini).
   * Avoids calling Anthropic/Gemini directly from the browser (CORS issue).
   * @param language  ISO language code ("en", "ar", "it", …)
   */
  translateLabels: (businessId: number, language: string) =>
    api.get(`${base(businessId)}/translate-labels?language=${encodeURIComponent(language)}`),

   markAsPaid: (invoiceId: number, businessId?: number) => {
    api.patch(`/api/businesses/${businessId}/invoices/${invoiceId}/mark-paid`)
  },

  markLatePaid: (invoiceId: number, businessId: number) =>
    api.patch(`${base(businessId)}/${invoiceId}/mark-late-paid`),

  updateDueDate: (businessId: number, invoiceId: number, dueDate: string) =>
    api.patch(`${base(businessId)}/${invoiceId}/due-date`, { due_date: dueDate }),

  deleteInvoice: (businessId: number, invoiceId: number) =>
    api.delete(`${base(businessId)}/${invoiceId}`),

  getBanksByBusiness: (businessId: number) =>
    api.get(`${base(businessId)}/banks`),
  
};
