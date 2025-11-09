import api from './api';

export const userService = {
  getUsers: async (filters = {}) => {
    const defaultFilters = { page: 1, pageSize: 10, searchText: '' };
    const merged = { ...defaultFilters, ...filters };
    const params = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    );
    debugger;
    const response = await api.get('/users/GetUsers', { params });
    const payload = response.data; // Expect { success, message, data: { items: [...] } }
    const items = payload?.data?.items || payload?.data?.data?.items || payload?.data?.users || payload?.data || [];
    const mapped = items.map(u => ({
      id: u.userId || u.id,
      full_name: u.employeeName || u.fullName || u.full_name || '',
      email: u.email,
      phone: u.phoneNumber || u.phone || '',
      role: (u.role || u.userRole || '').toLowerCase(),
      is_active: u.isActive !== undefined ? u.isActive : true,
    }));
    return mapped;
  },

  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data?.data || response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data?.data || response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data?.data || response.data;
  },
};
