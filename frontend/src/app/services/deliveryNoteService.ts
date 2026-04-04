import { api } from "./api";

const base = (businessId: number) => `/api/businesses/${businessId}/delivery-notes`;

export const deliveryNoteService = {
    getAll: (businessId: number) =>
        api.get(base(businessId)),

    getOne: (businessId: number, id: number) =>
        api.get(`${base(businessId)}/${id}`),

    // TAB 2 — accepted quotes with NO invoice yet (→ create delivery note)
    getQuotesNotInvoiced: (businessId: number) =>
        api.get(`${base(businessId)}/quotes-not-invoiced`),

    // TAB 3 — invoices whose quote has NO delivery note yet (→ create delivery note)
    getInvoicesWithoutBL: (businessId: number) =>
        api.get(`${base(businessId)}/invoices-without-bl`),

    // Create a delivery note from a quote_id (works for both tab 2 and tab 3)
    create: (businessId: number, data: {
        delivery_number: string;
        delivery_date: string;
        quote_id: number;
    }) => api.post(base(businessId), data),

    update: (businessId: number, id: number, data: {
        delivery_number?: string;
        delivery_date?: string;
    }) => api.patch(`${base(businessId)}/${id}`, data),

    delete: (businessId: number, id: number) =>
        api.delete(`${base(businessId)}/${id}`),
    changeStatus: (
        businessId: number,
        id: number,
        status: "PENDING" | "DELIVERED" | "CANCELLED"
    ) =>
        api.patch(`${base(businessId)}/${id}/status`, {
            status,
        }),
};