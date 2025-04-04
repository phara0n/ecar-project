import { baseApi } from './baseApi';

// Define service interval interface
interface ServiceInterval {
  id: number;
  name: string;
  description: string;
  interval_type: 'mileage' | 'time' | 'both';
  mileage_interval: number;
  time_interval_days: number;
  car_make?: string;
  car_model?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Define create/update service interval payload
interface ServiceIntervalInput {
  name: string;
  description: string;
  interval_type: 'mileage' | 'time' | 'both';
  mileage_interval: number;
  time_interval_days: number;
  car_make?: string;
  car_model?: string;
  is_active: boolean;
}

// Define query params for filtering
interface ServiceIntervalQueryParams {
  make?: string;
  model?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

// Define paginated response from backend
interface PaginatedServiceIntervalsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ServiceInterval[];
}

// Create service interval API slice
export const serviceIntervalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all service intervals with pagination and filtering
    getServiceIntervals: builder.query<PaginatedServiceIntervalsResponse, ServiceIntervalQueryParams | void>({
      query: (params = {}) => ({
        url: 'service-intervals/',
        params,
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'ServiceIntervals' as const, id })),
              { type: 'ServiceIntervals', id: 'LIST' },
            ]
          : [{ type: 'ServiceIntervals', id: 'LIST' }],
    }),

    // Get a single service interval by ID
    getServiceIntervalById: builder.query<ServiceInterval, number>({
      query: (id) => `service-intervals/${id}/`,
      providesTags: (result, error, id) => [{ type: 'ServiceIntervals', id }],
    }),

    // Get service intervals for a specific vehicle make/model
    getServiceIntervalsForVehicle: builder.query<ServiceInterval[], { make: string; model?: string }>({
      query: (params) => ({
        url: 'service-intervals/for_vehicle/',
        params,
      }),
      providesTags: [{ type: 'ServiceIntervals', id: 'FOR_VEHICLE' }],
    }),

    // Create a new service interval (admin only)
    createServiceInterval: builder.mutation<ServiceInterval, ServiceIntervalInput>({
      query: (data) => ({
        url: 'service-intervals/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'ServiceIntervals', id: 'LIST' },
        { type: 'ServiceIntervals', id: 'FOR_VEHICLE' }
      ],
    }),

    // Update an existing service interval (admin only)
    updateServiceInterval: builder.mutation<ServiceInterval, { id: number; data: ServiceIntervalInput }>({
      query: ({ id, data }) => ({
        url: `service-intervals/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ServiceIntervals', id },
        { type: 'ServiceIntervals', id: 'LIST' },
        { type: 'ServiceIntervals', id: 'FOR_VEHICLE' }
      ],
    }),

    // Delete a service interval (admin only)
    deleteServiceInterval: builder.mutation<void, number>({
      query: (id) => ({
        url: `service-intervals/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ServiceIntervals', id },
        { type: 'ServiceIntervals', id: 'LIST' },
        { type: 'ServiceIntervals', id: 'FOR_VEHICLE' }
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetServiceIntervalsQuery,
  useGetServiceIntervalByIdQuery,
  useGetServiceIntervalsForVehicleQuery,
  useCreateServiceIntervalMutation,
  useUpdateServiceIntervalMutation,
  useDeleteServiceIntervalMutation,
} = serviceIntervalApi; 