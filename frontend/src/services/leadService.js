import api from './api';

export const leadService = {
  getLeads: async (filters = {}) => {
    const defaultFilters = { page: 1, pageSize: 10, searchText: '' };
    const merged = { ...defaultFilters, ...filters };

    const params = Object.fromEntries(
      Object.entries(merged).filter(
        ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
      )
    );
    const response = await api.get('/leads/GetLeads', { params });
    const apiPayload = response.data; // shape: { success, message, data: { items, totalCount, page, pageSize }, errors }
    const items = apiPayload?.data?.data?.items || apiPayload?.data?.items || [];
    // Normalize backend lead shape to existing frontend expectations
    const normalized = items.map(item => ({
      id: item.leadId,
      name: item.customerName,
      company: item.customerCompany || '',
      phone: item.mobileNumber,
      email: item.email,
      location: item.location,
      district: item.district,
      state: item.state,
      source: (item.leadSource || '').toLowerCase(),
      status: (item.leadStage || '').toLowerCase(),
      finalStatus: item.finalStatus || '',
      assignedTo: item.assignedTo,
      createdBy: item.createdBy,
      createdDate: item.createdDate,
      lastContactDate: item.lastContactDate,
      nextFollowUpDate: item.nextFollowUpDate,
      notes: item.remarks,
      budget: item.orderValue,
      isActive: item.isActive,
    }));
    return normalized;
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
    // Controller expects PUT for status update
    const response = await api.put(`/leads/${id}/status`, { status, notes });
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
  assignLead: async (id, assignToUserId) => {
    const response = await api.post(`/leads/${id}/assign`, { assignToUserId });
    return response.data;
  },

  exportLeads: async (filters = {}) => {
    // Controller exposes /leads/export
    const response = await api.get('/leads/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};
