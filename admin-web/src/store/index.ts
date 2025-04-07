import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice'; // Import the apiSlice

// Import slices here when they are created
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

const rootReducer = {
  ui: uiReducer,
  auth: authReducer,
  [apiSlice.reducerPath]: apiSlice.reducer, // Add the API reducer
  // Add other reducers here
};

export const store = configureStore({
  reducer: rootReducer,
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production', // Enable DevTools in development
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {ui: UiState, auth: AuthState, api: ...}
export type AppDispatch = typeof store.dispatch; 