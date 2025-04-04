import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import API slices
import { baseApi } from './api/baseApi';
import { authApi } from './api/authApi';

// Import reducers from slices once they're created
// import themeReducer from './slices/themeSlice';

// We'll add specific slices as we implement features
// For now, we'll create a simple store structure

// Import slices (to be created)
// import authReducer from './slices/authSlice';
// import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    // Add API reducers
    [baseApi.reducerPath]: baseApi.reducer,
    
    // Add other reducers as we create them
    // theme: themeReducer,
  },
  // Adding middleware for RTK Query
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(baseApi.middleware),
});

// Optional: Set up listeners for RTK Query
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 