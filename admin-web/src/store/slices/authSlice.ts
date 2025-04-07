import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Define a type for the user info - adjust based on your API response
interface UserInfo {
  id: number | null;
  username: string | null;
  email: string | null;
  // Add other relevant user fields like roles, permissions, etc.
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; user?: UserInfo }>
    ) => {
      const { accessToken, refreshToken, user } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.user = user || null; // Store user info if provided
      state.error = null;
      state.loading = false;

      // Persist tokens and user info to localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.loading = false;

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  // Optional: Add extraReducers for handling async thunks or RTK Query endpoints
});

export const { setCredentials, logout, setLoading, setError } = authSlice.actions;

// Selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;

export default authSlice.reducer; 