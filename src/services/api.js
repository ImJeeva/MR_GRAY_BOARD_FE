import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const clientService = {
  getAll: () => api.get('/clients').then(res => res.data),
  getById: (id) => api.get(`/clients/${id}`).then(res => res.data),
  create: (client) => api.post('/clients', client).then(res => res.data),
  update: (id, client) => api.put(`/clients/${id}`, client).then(res => res.data),
  delete: (id) => api.delete(`/clients/${id}`),
  search: (query) => api.get(`/clients/search?query=${query}`).then(res => res.data),
};

export const companyService = {
  getAll: () => api.get('/companies').then(res => res.data),
  getById: (id) => api.get(`/companies/${id}`).then(res => res.data),
  create: (company) => api.post('/companies', company).then(res => res.data),
  update: (id, company) => api.put(`/companies/${id}`, company).then(res => res.data),
  delete: (id) => api.delete(`/companies/${id}`),
};

export const invoiceService = {
  getAll: () => api.get('/invoices').then(res => {
    console.log('Invoices response:', res.data);
    return res.data;
  }).catch(err => {
    console.error('Error fetching invoices:', err);
    return [];
  }),
  getById: (id) => api.get(`/invoices/${id}`).then(res => res.data),
  create: (invoice) => api.post('/invoices', invoice).then(res => res.data),
  update: (id, invoice) => api.put(`/invoices/${id}`, invoice).then(res => res.data),
  delete: (id) => api.delete(`/invoices/${id}`),
  search: (query) => api.get(`/invoices/search?query=${query}`).then(res => res.data),
  getByStatus: (status) => api.get(`/invoices/status/${status}`).then(res => res.data),
};

export default api;
