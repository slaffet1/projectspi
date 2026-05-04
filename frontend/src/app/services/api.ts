import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://charikty.swedencentral.cloudapp.azure.com/apicharikty.swedencentral.cloudapp.azure.com',
   //baseURL: 'http://localhost:3001'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
