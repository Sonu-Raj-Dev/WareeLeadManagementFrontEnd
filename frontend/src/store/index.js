import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import leadReducer from './slices/leadSlice';
import userReducer from './slices/userSlice';
import themeReducer from './slices/themeSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadReducer,
    users: userReducer,
    theme: themeReducer,
    dashboard: dashboardReducer,
  },
});
