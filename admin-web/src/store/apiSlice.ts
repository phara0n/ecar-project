import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from './index'; // Adjust the path as needed
import { setCredentials, logout } from './slices/authSlice'; // Import logout action

// Define the expected response type for the login endpoint
interface LoginResponse {
  access: string;
  refresh: string;
  // Include user details if your API returns them upon login
}

// Define the expected request body type for the login endpoint
interface LoginRequest {
  username: string;
  password: string;
}

// Define the User structure based on typical registration/detail endpoints
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

// Request body for user registration
export type RegisterUserRequest = Required<Pick<User, 'username' | 'email'>> & 
                                   Pick<User, 'first_name' | 'last_name'> & {
                                     password: string; 
                                     password_confirm: string;
                                   };

// Response from user registration (adjust based on your actual API)
// It likely returns the full User object or just relevant parts like id/email.
export type RegisterUserResponse = User; // Assuming it returns the created User object

// Define Customer type based on actual API response
export interface Customer {
  id: number;
  user: {
    id: number; // User ID might be different from Customer ID in some systems
    username?: string; // Add if needed
    email?: string;
    first_name: string;
    last_name: string;
  };
  phone?: string; // Changed from phone_number
  address?: string;
  created_at?: string; // Add timestamps if needed
  updated_at?: string;
  vehicle_count?: number; // Add optional vehicle count field
}

// Define Vehicle type
export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  // Customer field should match the structure defined above
  customer: Customer; 
  mileage?: number;
}

// Define Paginated Response type for Vehicles
export interface PaginatedVehicleResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vehicle[]; // The array is nested here
}

// Define the detailed User structure, potentially returned by /auth/users/me/
export interface UserDetail extends User {
  is_staff?: boolean;
  is_superuser?: boolean; // Include if your backend provides this
  // Add other fields returned by your /me endpoint if needed
}

// Define type for creating a vehicle (omit id, customer should be number ID)
export type CreateVehicleRequest = Omit<Vehicle, 'id' | 'customer'> & {
    customer_id: number; // Renamed from customer for clarity matching backend expectation
    initial_mileage?: number; // Ensure initial_mileage is part of the type if sent on creation
};

// Define type for updating a vehicle (most fields optional, customer_id maybe too)
export type UpdateVehicleRequest = Partial<Omit<CreateVehicleRequest, 'customer_id'>> & { 
    id: number; 
    customer_id?: number; // Customer might be changeable or not, adjust as needed
};

// Define Paginated Response type for Customers
export interface PaginatedCustomerResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

// Type for creating Customer - Now expects user_id
export type CreateCustomerRequest = {
  user_id: number; // Changed from nested user
  phone?: string;
  address?: string;
};

// Type for updating Customer (adjust if needed, likely still uses nested patching? Check API)
export type UpdateCustomerRequest = Partial<Omit<Customer, 'id' | 'user'> & { user?: Partial<User> }> & { id: number };

// Original baseQuery
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Define the expected response type for the refresh endpoint
interface RefreshResponse {
  access: string;
  // Potentially refresh if your backend rotates refresh tokens
  // refresh?: string; 
}

// Wrapper around baseQuery to handle re-authentication
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Check if the request failed with a 401 Unauthorized error
  if (result.error && result.error.status === 401) {
    console.log('Received 401, attempting token refresh...');
    // Try to get a new token using the refresh token
    const refresh = (api.getState() as RootState).auth.refreshToken;

    if (refresh) {
      // Send refresh token request
      const refreshResult = await baseQuery(
        {
          url: '/auth/token/refresh/', // Your refresh token endpoint
          method: 'POST',
          body: { refresh },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const refreshData = refreshResult.data as RefreshResponse;
        console.log('Token refresh successful, retrying original request...');
        // Store the new token
        api.dispatch(setCredentials({ accessToken: refreshData.access, refreshToken: refresh })); // Assuming refresh token doesn't change
        
        // Retry the original request with the new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed - dispatch logout
        console.error('Token refresh failed:', refreshResult.error);
        api.dispatch(logout());
      }
    } else {
      // No refresh token available - dispatch logout
       console.log('No refresh token available, logging out.');
       api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api', 
  // Use the wrapper with re-authentication logic
  baseQuery: baseQueryWithReauth, 
  tagTypes: ['User', 'Customer', 'Vehicle', 'Service'], 
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/token/',
        method: 'POST',
        body: credentials,
      }),
    }),
    registerUser: builder.mutation<RegisterUserResponse, RegisterUserRequest>({
      query: (userData) => ({
        url: '/auth/register/', // Standard DRF registration endpoint
        method: 'POST',
        body: userData,
      }),
       // No cache invalidation needed typically for registration
       // unless it affects a list of users you display elsewhere.
       // providesTags: [], 
    }),
    getCars: builder.query<PaginatedVehicleResponse, void>({
      query: () => '/cars/',
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: 'Vehicle' as const, id })),
              { type: 'Vehicle', id: 'LIST' },
            ]
          : [{ type: 'Vehicle', id: 'LIST' }],
    }),
    getCustomerVehicles: builder.query<PaginatedVehicleResponse, number>({
      query: (customerId) => `/customers/${customerId}/cars/`,
      providesTags: (result, error, customerId) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: 'Vehicle' as const, id })),
              { type: 'CustomerVehicleList', id: customerId },
            ]
          : [{ type: 'CustomerVehicleList', id: customerId }],
    }),
    createCar: builder.mutation<Vehicle, CreateVehicleRequest>({
      query: (newVehicle) => ({
        url: '/cars/',
        method: 'POST',
        body: newVehicle,
      }),
      invalidatesTags: (result, error, { customer }) => [
        { type: 'Vehicle', id: 'LIST' },
        { type: 'CustomerVehicleList', id: customer },
      ],
    }),
    getCustomers: builder.query<PaginatedCustomerResponse, void>({
      query: () => '/customers/',
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: 'Customer' as const, id })),
              { type: 'Customer', id: 'LIST' },
            ]
          : [{ type: 'Customer', id: 'LIST' }],
    }),
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (newCustomerData) => ({
        url: '/customers/',
        method: 'POST',
        body: newCustomerData, // Should now contain { user_id, phone, address }
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),
    updateCustomer: builder.mutation<Customer, UpdateCustomerRequest>({
      query: ({ id, ...patch }) => ({
        url: `/customers/${id}/`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),
    deleteCustomer: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `/customers/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id: 'LIST' }],
    }),
    // --- Get Current User Details ---
    getMe: builder.query<UserDetail, void>({
        query: () => '/auth/users/me/', // Standard DRF endpoint
        providesTags: ['User'],
    }),
    // --- Vehicle CRUD ---
    getCar: builder.query<Vehicle, number>({
        query: (id) => `/cars/${id}/`,
        providesTags: (result, error, id) => [{ type: 'Vehicle', id }],
    }),
    updateCar: builder.mutation<Vehicle, UpdateVehicleRequest>({
        query: ({ id, ...patch }) => ({
          url: `/cars/${id}/`,
          method: 'PATCH',
          body: patch,
        }),
        invalidatesTags: (result, error, { id }) => [
            { type: 'Vehicle', id }, 
            { type: 'Vehicle', id: 'LIST' },
            // Invalidate specific customer list if customer association changes?
            // { type: 'CustomerVehicleList', id: result?.customer?.id } 
        ],
      }),
  }),
});

// Export hooks for usage in components
// Hooks are automatically generated based on the endpoints defined above
export const { 
    useLoginMutation,
    useRegisterUserMutation,
    useGetCarsQuery,
    useGetCustomerVehiclesQuery,
    useCreateCarMutation,
    useGetCustomersQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
    useGetMeQuery,
    useGetCarQuery,
    useUpdateCarMutation,
} = apiSlice; 