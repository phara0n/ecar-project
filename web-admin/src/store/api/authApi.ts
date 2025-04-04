import { baseApi } from './baseApi';

// Define interfaces for API responses and requests
interface LoginRequest {
  username: string;
  password: string;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

interface RefreshRequest {
  refresh: string;
}

interface UserResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
}

// Create auth API slice extending the baseApi
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login endpoint
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/token/',
        method: 'POST',
        body: credentials,
      }),
      // Save the tokens to localStorage on successful login
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem('token', data.access);
          localStorage.setItem('refreshToken', data.refresh);
        } catch (error) {
          // Handle error
          console.error('Login failed:', error);
        }
      },
    }),

    // Refresh token endpoint
    refreshToken: builder.mutation<TokenResponse, RefreshRequest>({
      query: (refreshData) => ({
        url: 'auth/token/refresh/',
        method: 'POST',
        body: refreshData,
      }),
      // Save the new tokens to localStorage on successful refresh
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          localStorage.setItem('token', data.access);
          localStorage.setItem('refreshToken', data.refresh);
        } catch (error) {
          // Handle error
          console.error('Token refresh failed:', error);
        }
      },
    }),

    // Get current user profile - Parse from JWT token instead of making an API call
    getCurrentUser: builder.query<UserResponse, void>({
      queryFn: () => {
        try {
          // Get token from localStorage
          const token = localStorage.getItem('token');
          
          if (!token) {
            return { error: { status: 401, data: 'No token found' } };
          }
          
          // Extract payload from JWT token (base64 encoded)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          // Return user data from token
          return { 
            data: {
              id: payload.user_id || 0,
              username: payload.username || 'User',
              email: payload.email || '',
              first_name: payload.first_name || '',
              last_name: payload.last_name || '',
              is_staff: payload.is_staff || false,
              is_superuser: payload.is_superuser || false,
              groups: payload.groups || []
            }
          };
        } catch (error) {
          console.error('Error parsing JWT token:', error);
          return { error: { status: 401, data: 'Invalid token' } };
        }
      },
      providesTags: ['User'],
    }),

    // Logout 
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/logout/',
        method: 'POST',
      }),
      // Remove tokens from localStorage on logout
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        } catch (error) {
          // Handle error
          console.error('Logout failed:', error);
        }
      },
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
} = authApi; 