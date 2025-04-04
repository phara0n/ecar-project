import { baseApi } from './baseApi';

// Define mileage update interface
interface MileageUpdate {
  id: number;
  car: number;
  mileage: number;
  reported_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Define create/update mileage update payload
interface MileageUpdateInput {
  car: number;
  mileage: number;
  reported_date?: string;
  notes?: string;
}

// Define query params for filtering
interface MileageUpdateQueryParams {
  car?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

// Define paginated response from backend
interface PaginatedMileageUpdatesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MileageUpdate[];
}

// Create mileage update API slice
export const mileageUpdateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all mileage updates with pagination and filtering
    getMileageUpdates: builder.query<PaginatedMileageUpdatesResponse, MileageUpdateQueryParams | void>({
      query: (params = {}) => ({
        url: 'mileage-updates/',
        params,
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'MileageUpdates' as const, id })),
              { type: 'MileageUpdates', id: 'LIST' },
            ]
          : [{ type: 'MileageUpdates', id: 'LIST' }],
    }),

    // Get a single mileage update by ID
    getMileageUpdateById: builder.query<MileageUpdate, number>({
      query: (id) => `mileage-updates/${id}/`,
      providesTags: (result, error, id) => [{ type: 'MileageUpdates', id }],
    }),

    // Create a new mileage update
    createMileageUpdate: builder.mutation<MileageUpdate, MileageUpdateInput>({
      query: (data) => ({
        url: 'mileage-updates/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: 'MileageUpdates', id: 'LIST' },
        result ? { type: 'Vehicles', id: result.car } : null,
        result ? { type: 'Vehicles', id: result.car, subtype: 'MileageHistory' } : null,
        result ? { type: 'Vehicles', id: result.car, subtype: 'ServicePrediction' } : null
      ].filter(Boolean),
    }),

    // Update an existing mileage update (admin only)
    updateMileageUpdate: builder.mutation<MileageUpdate, { id: number; data: MileageUpdateInput }>({
      query: ({ id, data }) => ({
        url: `mileage-updates/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MileageUpdates', id },
        { type: 'MileageUpdates', id: 'LIST' },
        result ? { type: 'Vehicles', id: result.car } : null,
        result ? { type: 'Vehicles', id: result.car, subtype: 'MileageHistory' } : null,
        result ? { type: 'Vehicles', id: result.car, subtype: 'ServicePrediction' } : null
      ].filter(Boolean),
    }),

    // Delete a mileage update (admin only)
    deleteMileageUpdate: builder.mutation<void, number>({
      query: (id) => ({
        url: `mileage-updates/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'MileageUpdates', id },
        { type: 'MileageUpdates', id: 'LIST' }
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetMileageUpdatesQuery,
  useGetMileageUpdateByIdQuery,
  useCreateMileageUpdateMutation,
  useUpdateMileageUpdateMutation,
  useDeleteMileageUpdateMutation,
} = mileageUpdateApi; 