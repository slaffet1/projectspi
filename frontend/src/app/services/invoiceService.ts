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

 
  sendInvoice: (businessId: number, invoiceId: number, language: string = "fr") =>
    api.post(`${base(businessId)}/${invoiceId}/send`, { language }),

 
  translateLabels: (businessId: number, language: string) =>
    api.get(`${base(businessId)}/translate-labels?language=${encodeURIComponent(language)}`),

  markAsPaid: (invoiceId: number, businessId?: number) =>
    api.patch(`/api/businesses/${businessId}/invoices/${invoiceId}/mark-paid`),

  markLatePaid: (invoiceId: number, businessId: number) =>
    api.patch(`${base(businessId)}/${invoiceId}/mark-late-paid`),

  markAsPaidWithTrace: (
    invoiceId: number,
    businessId: number,
    status: "paid" | "late_paid",
    trace: {
      payment_method: string;
      payment_date: string;
      amount: number;
      reference?: string | null;
      cheque_number?: string | null;
      bank_name?: string | null;
      notes?: string | null;
      proof_image_url?: string | null;
    }
  ) =>
    api.post(`${base(businessId)}/${invoiceId}/mark-paid-with-trace`, {
      status,
      ...trace,
    }),

  /**
   * Get payment trace for a specific invoice.
   */
  getPaymentTrace: (businessId: number, invoiceId: number) =>
    api.get(`${base(businessId)}/${invoiceId}/payment-trace`),

  /**
   * Upload proof of payment image for an invoice.
   */
  uploadPaymentProof: (businessId: number, invoiceId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(
      `${base(businessId)}/${invoiceId}/payment-proof`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  updateDueDate: (businessId: number, invoiceId: number, dueDate: string) =>
    api.patch(`${base(businessId)}/${invoiceId}/due-date`, { due_date: dueDate }),

  deleteInvoice: (businessId: number, invoiceId: number) =>
    api.delete(`${base(businessId)}/${invoiceId}`),

  getBanksByBusiness: (businessId: number) =>
    api.get(`${base(businessId)}/banks`),
};
