import { baseApi } from './baseApi';

// Define service interface
interface Service {
  id: number;
  car: number;
  service_date: string;
  odometer_reading: number;
  service_type: string;
  description: string;
  technician_notes: string;
  cost: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Define service item interface
interface ServiceItem {
  id: number;
  service: number;
  name: string;
  quantity: number;
  unit_price: number;
  description: string;
}

// Define create/update service payload
interface ServiceInput {
  car: number;
  service_date: string;
  odometer_reading: number;
  service_type: string;
  description: string;
  technician_notes?: string;
  cost: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  service_items?: ServiceItemInput[];
}

// Define create/update service item payload
interface ServiceItemInput {
  id?: number;
  name: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

// Define query params for filtering
interface ServiceQueryParams {
  car?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  min_cost?: number;
  max_cost?: number;
  service_type?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// Define paginated response from backend
interface PaginatedServicesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Service[];
}

// Create service API slice
export const serviceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all services with pagination and filtering
    getServices: builder.query<PaginatedServicesResponse, ServiceQueryParams | void>({
      query: (params = {}) => ({
        url: 'services/',
        params,
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'Services' as const, id })),
              { type: 'Services', id: 'LIST' },
            ]
          : [{ type: 'Services', id: 'LIST' }],
    }),

    // Get a single service by ID
    getServiceById: builder.query<Service, number>({
      query: (id) => `services/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Services', id }],
    }),

    // Get services for a specific car
    getServicesByCar: builder.query<Service[], number>({
      query: (carId) => ({
        url: 'services/',
        params: { car: carId },
      }),
      transformResponse: (response: PaginatedServicesResponse) => response.results,
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Services' as const, id })),
              { type: 'Services', id: 'LIST' },
            ]
          : [{ type: 'Services', id: 'LIST' }],
    }),

    // Create a new service
    createService: builder.mutation<Service, ServiceInput>({
      query: (data) => ({
        url: 'services/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Services', id: 'LIST' },
        { type: 'Vehicles', id: 'LIST' }
      ],
    }),

    // Update an existing service
    updateService: builder.mutation<Service, { id: number; data: ServiceInput }>({
      query: ({ id, data }) => ({
        url: `services/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Services', id },
        { type: 'Services', id: 'LIST' },
        { type: 'Vehicles', id: 'LIST' }
      ],
    }),

    // Delete a service
    deleteService: builder.mutation<void, number>({
      query: (id) => ({
        url: `services/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Services', id },
        { type: 'Services', id: 'LIST' },
        { type: 'Vehicles', id: 'LIST' }
      ],
    }),

    // Get service items
    getServiceItems: builder.query<ServiceItem[], number>({
      query: (serviceId) => ({
        url: 'service-items/',
        params: { service: serviceId },
      }),
      providesTags: (result, error, serviceId) => [
        { type: 'Services', id: serviceId, subtype: 'Items' }
      ],
    }),

    // Create a new service item
    createServiceItem: builder.mutation<ServiceItem, ServiceItemInput & { service: number }>({
      query: (data) => ({
        url: 'service-items/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: 'Services', id: result?.service, subtype: 'Items' },
        { type: 'Services', id: result?.service }
      ],
    }),

    // Update a service item
    updateServiceItem: builder.mutation<ServiceItem, { id: number; data: ServiceItemInput & { service: number } }>({
      query: ({ id, data }) => ({
        url: `service-items/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: 'Services', id: result?.service, subtype: 'Items' },
        { type: 'Services', id: result?.service }
      ],
    }),

    // Delete a service item
    deleteServiceItem: builder.mutation<void, { id: number; serviceId: number }>({
      query: ({ id }) => ({
        url: `service-items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { serviceId }) => [
        { type: 'Services', id: serviceId, subtype: 'Items' },
        { type: 'Services', id: serviceId }
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useGetServicesByCarQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetServiceItemsQuery,
  useCreateServiceItemMutation,
  useUpdateServiceItemMutation,
  useDeleteServiceItemMutation,
} = serviceApi; 