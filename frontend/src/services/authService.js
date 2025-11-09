import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const apiData = response.data;
    // Map backend response to expected frontend structure
    const mapped = {
      access_token: apiData.data.token,
      user: {
        userId: apiData.data.userId,
        employeeCode: apiData.data.employeeCode,
        employeeName: apiData.data.employeeName,
        email: apiData.data.email,
        role: apiData.data.role,
        tokenExpiry: apiData.data.tokenExpiry,
        refreshToken: apiData.data.refreshToken
      }
    };
    // Store auth data in localStorage
    localStorage.setItem('authToken', mapped.access_token);
    localStorage.setItem('user', JSON.stringify(mapped.user));
    return mapped;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};
