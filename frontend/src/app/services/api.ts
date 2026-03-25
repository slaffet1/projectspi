import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const businessId = localStorage.getItem('businessId'); // ✅ IMPORTANT

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (businessId) {
    config.headers['X-Business-Id'] = businessId; // ✅ MULTI-TENANT
  }

  return config;
});