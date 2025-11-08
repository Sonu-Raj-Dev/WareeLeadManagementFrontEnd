import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
      state.loading = false;
    },
    addUser: (state, action) => {
      state.users.push(action.payload);
    },
    updateUserInList: (state, action) => {
      const index = state.users.findIndex((user) => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    removeUser: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
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

export const { setUsers, addUser, updateUserInList, removeUser, setLoading, setError } =
  userSlice.actions;
export default userSlice.reducer;
