import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define a base URL for our API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // Production: relative path to the same domain
  : 'http://localhost:8000/api'; // Development: direct to Django backend

// Setup the baseQuery with auth header injection
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If we have a token, add it to the headers
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
  // Don't include credentials - we're using token auth
  credentials: 'same-origin',
});

// Create our base API with shared configurations
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Customers', 
    'Vehicles', 
    'Services', 
    'Invoices', 
    'User',
    'ServiceIntervals',
    'MileageUpdates',
    'Notifications'
  ],
  endpoints: () => ({}),
});

// Export hooks for usage in functional components
export const {
  util: { getRunningQueriesThunk },
} = baseApi; 