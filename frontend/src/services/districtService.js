import api from './api';

export const districtService = {
  getDistricts: async () => {
    const response = await api.get('/districts');
    return response.data;
  },

  getDistrictById: async (id) => {
    const response = await api.get(`/districts/${id}`);
    return response.data;
  },

  createDistrict: async (districtData) => {
    const response = await api.post('/districts', districtData);
    return response.data;
  },

  deleteDistrict: async (id) => {
    const response = await api.delete(`/districts/${id}`);
    return response.data;
  },
};
