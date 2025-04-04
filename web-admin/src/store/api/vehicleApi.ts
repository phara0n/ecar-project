import { baseApi } from './baseApi';

// Define vehicle interface matching backend model
interface Vehicle {
  id: number;
  customer: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color: string;
  mileage: number;
  created_at: string;
  updated_at: string;
}

// Define create/update vehicle payload
interface VehicleInput {
  customer: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color: string;
  mileage: number;
}

// Define query params for filtering
interface VehicleQueryParams {
  customer?: number;
  search?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

// Define paginated response from backend
interface PaginatedVehiclesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Vehicle[];
}

// Create vehicle API slice extending the baseApi
export const vehicleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all vehicles with pagination and filtering
    getVehicles: builder.query<PaginatedVehiclesResponse, VehicleQueryParams | void>({
      query: (params = {}) => ({
        url: 'cars/',
        params,
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'Vehicles' as const, id })),
              { type: 'Vehicles', id: 'LIST' },
            ]
          : [{ type: 'Vehicles', id: 'LIST' }],
    }),

    // Get a single vehicle by ID
    getVehicleById: builder.query<Vehicle, number>({
      query: (id) => `cars/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Vehicles', id }],
    }),

    // Get vehicles by customer ID
    getVehiclesByCustomer: builder.query<Vehicle[], number>({
      query: (customerId) => ({
        url: 'cars/',
        params: { customer: customerId },
      }),
      transformResponse: (response: PaginatedVehiclesResponse) => response.results,
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Vehicles' as const, id })),
              { type: 'Vehicles', id: 'LIST' },
            ]
          : [{ type: 'Vehicles', id: 'LIST' }],
    }),

    // Create a new vehicle
    createVehicle: builder.mutation<Vehicle, VehicleInput>({
      query: (vehicle) => ({
        url: 'cars/',
        method: 'POST',
        body: vehicle,
      }),
      invalidatesTags: [{ type: 'Vehicles', id: 'LIST' }],
    }),

    // Update an existing vehicle
    updateVehicle: builder.mutation<Vehicle, { id: number; data: VehicleInput }>({
      query: ({ id, data }) => ({
        url: `cars/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Vehicles', id },
        { type: 'Vehicles', id: 'LIST' },
      ],
    }),

    // Delete a vehicle
    deleteVehicle: builder.mutation<void, number>({
      query: (id) => ({
        url: `cars/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Vehicles', id },
        { type: 'Vehicles', id: 'LIST' },
      ],
    }),

    // Add endpoint for getting vehicle mileage history
    getVehicleMileageHistory: builder.query<any[], number>({
      query: (id) => `cars/${id}/mileage_history/`,
      providesTags: (result, error, id) => [
        { type: 'Vehicles', id, subtype: 'MileageHistory' }
      ],
    }),

    // Add endpoint for getting next service prediction
    getVehicleNextServicePrediction: builder.query<any, number>({
      query: (id) => `cars/${id}/next_service_prediction/`,
      providesTags: (result, error, id) => [
        { type: 'Vehicles', id, subtype: 'ServicePrediction' }
      ],
    }),

    // Add endpoint for reporting new mileage
    reportVehicleMileage: builder.mutation<any, { id: number; mileage: number; notes?: string }>({
      query: ({ id, ...data }) => ({
        url: `cars/${id}/report_mileage/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Vehicles', id },
        { type: 'Vehicles', id, subtype: 'MileageHistory' },
        { type: 'Vehicles', id, subtype: 'ServicePrediction' }
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetVehiclesQuery,
  useGetVehicleByIdQuery,
  useGetVehiclesByCustomerQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useGetVehicleMileageHistoryQuery,
  useGetVehicleNextServicePredictionQuery,
  useReportVehicleMileageMutation,
} = vehicleApi; 