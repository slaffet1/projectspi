import { api } from './api';

export const stockService = {
  // Warehouses
  getWarehouses: () => api.get('/stock/warehouses'),
  createWarehouse: (data: any) => api.post('/stock/warehouses', data),
  updateWarehouse: (id: number, data: any) => api.patch(`/stock/warehouses/${id}`, data),
  deleteWarehouse: (id: number) => api.delete(`/stock/warehouses/${id}`),

  // Assign product to warehouse
  assignProduct: (warehouseId: number, data: any) => api.post(`/stock/warehouses/${warehouseId}/products`, data),
  removeProduct: (warehouseId: number, productId: number) => api.delete(`/stock/warehouses/${warehouseId}/products/${productId}`),

  // Stock levels
  getStockLevels: () => api.get('/stock/levels'),

  // Movements
  createMovement: (data: any) => api.post('/stock/movements', data),
  getMovements: () => api.get('/stock/movements'),

  // Transfer
  transferStock: (data: any) => api.post('/stock/transfer', data),

  // Inventory sessions
  getSessions: () => api.get('/stock/inventory/sessions'),
  createSession: (name: string) => api.post('/stock/inventory/sessions', { name }),
  getSessionCounts: (sessionId: number) => api.get(`/stock/inventory/sessions/${sessionId}/counts`),
  recordCount: (sessionId: number, data: any) => api.post(`/stock/inventory/sessions/${sessionId}/counts`, data),
  adjustInventory: (sessionId: number) => api.post(`/stock/inventory/sessions/${sessionId}/adjust`, {}),
  getVarianceReport: (sessionId: number) => api.get(`/stock/inventory/sessions/${sessionId}/report`),

  // History
  getAdjustmentHistory: () => api.get('/stock/inventory/history'),
};
