import axios from 'axios';
import { mockCustomerService, mockVehicleService } from './mockApi';

// Configuration flag to use mock API or real API
// Set to false to use real backend API
const USE_MOCK_API = false;

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials to handle CORS with credentials
  withCredentials: false,
});

// Log the API base URL for debugging
console.log('API Base URL:', api.defaults.baseURL);
console.log('Using Mock API:', USE_MOCK_API ? 'Yes' : 'No');

// Add request interceptor to attach auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests for debugging
    console.log(`API Request [${config.method?.toUpperCase()}] ${config.url}`, 
      config.params || config.data || '');
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`API Response [${response.status}] ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error responses
    if (error.response) {
      console.error(`API Error [${error.response.status}] ${originalRequest.url}:`, 
        error.response.data);
    } else if (error.request) {
      console.error(`API Request Error (No Response) ${originalRequest?.url || ''}:`, 
        error.request);
    } else {
      console.error('API Error:', error.message);
    }
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('Attempting to refresh token...');
          
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/token/refresh/`,
            { refresh: refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              withCredentials: false,
            }
          );
          
          if (response.data.access) {
            console.log('Token refreshed successfully');
            localStorage.setItem('token', response.data.access);
            api.defaults.headers.common.Authorization = `Bearer ${response.data.access}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, log out the user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/token/', { username, password });
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('isAuthenticated', 'true');
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isAuthenticated');
  },
  
  checkAuth: () => {
    return localStorage.getItem('token') !== null;
  }
};

// Customer services
export const customerService = USE_MOCK_API 
  ? mockCustomerService 
  : {
    getAll: () => api.get('/customers/'),
    getById: (id: number) => api.get(`/customers/${id}/`),
    create: (data: any) => {
      console.log('Creating customer with data:', JSON.stringify(data, null, 2));
      return api.post('/customers/', data);
    },
    update: (id: number, data: any) => {
      console.log('Updating customer', id, 'with data:', JSON.stringify(data, null, 2));
      // Try PATCH instead of PUT for updates
      return api.patch(`/customers/${id}/`, data);
    },
    delete: (id: number) => api.delete(`/customers/${id}/`)
  };

// Vehicle services
export const vehicleService = USE_MOCK_API
  ? mockVehicleService
  : {
    getAll: () => api.get('/cars/'),
    getById: (id: number) => api.get(`/cars/${id}/`),
    getByCustomer: (customerId: number) => {
      console.log(`Fetching vehicles for customer ID: ${customerId}`);
      return api.get(`/cars/?customer=${customerId}`);
    },
    create: (data: any) => {
      // Transform the data to use customer_id instead of customer
      const transformedData = { 
        ...data,
        customer_id: data.customer,
      };
      // Remove the original customer field to avoid conflicts
      delete transformedData.customer;
      
      console.log('Creating vehicle with transformed data:', JSON.stringify(transformedData, null, 2));
      return api.post('/cars/', transformedData);
    },
    update: (id: number, data: any) => {
      // Transform the data to use customer_id instead of customer
      const transformedData = { 
        ...data,
        customer_id: data.customer,
      };
      // Remove the original customer field to avoid conflicts
      delete transformedData.customer;
      
      console.log('Updating vehicle', id, 'with transformed data:', JSON.stringify(transformedData, null, 2));
      return api.patch(`/cars/${id}/`, transformedData);
    },
    delete: (id: number) => api.delete(`/cars/${id}/`)
  };

// Service services
export const serviceService = {
  getAll: () => api.get('/services/'),
  getById: (id: number) => api.get(`/services/${id}/`),
  getByVehicle: (vehicleId: number) => api.get(`/services/?car_id=${vehicleId}`),
  create: (data: any) => {
    console.log('Creating service with data:', JSON.stringify(data, null, 2));
    return api.post('/services/', data);
  },
  update: (id: number, data: any) => {
    console.log('Updating service', id, 'with data:', JSON.stringify(data, null, 2));
    return api.patch(`/services/${id}/`, data);
  },
  delete: (id: number) => api.delete(`/services/${id}/`)
};

export default api; 