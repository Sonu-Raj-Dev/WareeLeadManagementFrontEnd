import api from './api';

// District service handles both REST-style and action-named .NET endpoints.
// It also applies optional filters matching expected DistrictFilterDto properties.
export const districtService = {
  getDistricts: async (filters = {}) => {
    const defaultFilters = { page: 1, pageSize: 10, searchText: '' };
    const merged = { ...defaultFilters, ...filters };
    const params = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    );

    let response;
    try {
      response = await api.get('/Districts/GetDistricts', { params });
    } catch (e) {
      // If action route fails (404 or similar), attempt lowercase or REST fallback.
      try {
        response = await api.get('/districts/GetDistricts', { params });
      } catch (e2) {
        response = await api.get('/districts', { params });
      }
    }

    const payload = response.data;
    const raw = payload?.data?.items || payload?.data?.districts || payload?.data || payload;
    if (!Array.isArray(raw)) {
      // Dev-only shape warning
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[districtService] Unexpected districts payload shape', payload);
      }
      return [];
    }

    const mapped = raw.map(d => ({
      id: d.districtId || d.id,
      name: d.name || d.districtName || '',
      code: d.code || d.districtCode || '',
      state: d.state || d.stateName || '',
      region: d.region || d.regionName || '',
      is_active: d.isActive !== undefined ? d.isActive : true,
    }));
    return mapped;
  },

  getDistrictById: async (id) => {
    const response = await api.get(`/districts/${id}`);
    return response.data;
  },

  createDistrict: async (districtData) => {
    const response = await api.post('/districts', districtData);
    return response.data?.data || response.data;
  },

  deleteDistrict: async (id) => {
    const response = await api.delete(`/districts/${id}`);
    return response.data?.data || response.data;
  },
};
