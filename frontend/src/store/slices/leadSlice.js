import { createSlice } from '@reduxjs/toolkit';

const leadSlice = createSlice({
  name: 'leads',
  initialState: {
    leads: [],
    currentLead: null,
    loading: false,
    error: null,
    filters: {
      status: '',
      district_id: '',
      assigned_to: '',
      source: '',
    },
  },
  reducers: {
    setLeads: (state, action) => {
      state.leads = action.payload;
      state.loading = false;
    },
    setCurrentLead: (state, action) => {
      state.currentLead = action.payload;
    },
    addLead: (state, action) => {
      state.leads.unshift(action.payload);
    },
    updateLeadInList: (state, action) => {
      const index = state.leads.findIndex((lead) => lead.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = action.payload;
      }
    },
    removeLead: (state, action) => {
      state.leads = state.leads.filter((lead) => lead.id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  setLeads,
  setCurrentLead,
  addLead,
  updateLeadInList,
  removeLead,
  setLoading,
  setError,
  setFilters,
} = leadSlice.actions;
export default leadSlice.reducer;
