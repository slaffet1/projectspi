import { api } from './api';

export const stockService = {
  // ── Warehouses ──────────────────────────────────────────────────
  getWarehouses: (businessId: number) =>
    api.get(`/api/businesses/${businessId}/stock/warehouses`),

  createWarehouse: (businessId: number, data: any) =>
    api.post(`/api/businesses/${businessId}/stock/warehouses`, data),

  updateWarehouse: (businessId: number, id: number, data: any) =>
    api.patch(`/api/businesses/${businessId}/stock/warehouses/${id}`, data),

  deleteWarehouse: (businessId: number, id: number) =>
    api.delete(`/api/businesses/${businessId}/stock/warehouses/${id}`),

  // ── Assign product to warehouse ─────────────────────────────────
  assignProduct: (businessId: number, warehouseId: number, data: any) =>
    api.post(`/api/businesses/${businessId}/stock/warehouses/${warehouseId}/products`, data),

  removeProduct: (businessId: number, warehouseId: number, productId: number) =>
    api.delete(`/api/businesses/${businessId}/stock/warehouses/${warehouseId}/products/${productId}`),

  // ── Stock Levels ────────────────────────────────────────────────
  getStockLevels: (businessId: number) =>
    api.get(`/api/businesses/${businessId}/stock/levels`),

  // ── Movements ───────────────────────────────────────────────────
  createMovement: (businessId: number, data: any) =>
    api.post(`/api/businesses/${businessId}/stock/movements`, data),

  getMovements: (businessId: number) =>
    api.get(`/api/businesses/${businessId}/stock/movements`),

  // ── Transfer ────────────────────────────────────────────────────
  transferStock: (businessId: number, data: any) =>
    api.post(`/api/businesses/${businessId}/stock/transfer`, data),

  // ── Inventory Sessions ──────────────────────────────────────────
  getSessions: (businessId: number) =>
    api.get(`/api/businesses/${businessId}/stock/inventory/sessions`),

  createSession: (businessId: number, name: string) =>
    api.post(`/api/businesses/${businessId}/stock/inventory/sessions`, { name }),

  getSessionCounts: (businessId: number, sessionId: number) =>
    api.get(`/api/businesses/${businessId}/stock/inventory/sessions/${sessionId}/counts`),

  recordCount: (businessId: number, sessionId: number, data: any) =>
    api.post(`/api/businesses/${businessId}/stock/inventory/sessions/${sessionId}/counts`, data),

  adjustInventory: (businessId: number, sessionId: number) =>
    api.post(`/api/businesses/${businessId}/stock/inventory/sessions/${sessionId}/adjust`, {}),

  getVarianceReport: (businessId: number, sessionId: number) =>
    api.get(`/api/businesses/${businessId}/stock/inventory/sessions/${sessionId}/report`),

  // ── History ─────────────────────────────────────────────────────
  getAdjustmentHistory: (businessId: number) =>
    api.get(`/api/businesses/${businessId}/stock/inventory/history`),
  importFromExcel: (businessId: number, file: File, userId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(
      `/api/businesses/${businessId}/stock/import${userId ? `?userId=${userId}` : ''}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};