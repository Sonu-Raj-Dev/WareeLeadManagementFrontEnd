import { createSlice } from '@reduxjs/toolkit';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    setStats: (state, action) => {
      state.stats = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setStats, setLoading, setError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
