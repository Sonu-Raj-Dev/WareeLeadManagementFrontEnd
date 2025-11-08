import api from './api';

export const leadService = {
  getLeads: async (filters = {}) => {
    const response = await api.get('/leads', { params: filters });
    return response.data;
  },

  getLeadById: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  createLead: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response.data;
  },

  updateLead: async (id, leadData) => {
    const response = await api.put(`/leads/${id}`, leadData);
    return response.data;
  },

  updateLeadStatus: async (id, status, notes) => {
    const response = await api.patch(`/leads/${id}/status`, { status, notes });
    return response.data;
  },

  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  uploadLeads: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/leads/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exportLeads: async (filters = {}) => {
    const response = await api.get('/leads/export/excel', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};
