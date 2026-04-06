import { api } from './api';

export const purchaseOrdersService = {
  getPurchaseOrders: (businessId: number) =>
    api.get(`/api/businesses/${businessId}/purchase-orders`),

  createPurchaseOrder: (businessId: number, data: any) =>
    api.post(`/api/businesses/${businessId}/purchase-orders`, data),

  validateOrder: (businessId: number, id: number) =>
    api.patch(`/api/businesses/${businessId}/purchase-orders/${id}/validate`),
};