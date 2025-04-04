import { baseApi } from './baseApi';

// Define customer interface matching backend model
interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
}

// Define create/update customer payload
interface CustomerInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
}

// Define query params for filtering
interface CustomerQueryParams {
  search?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

// Define paginated response from backend
interface PaginatedCustomersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

// Create customer API slice extending the baseApi
export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all customers with pagination and filtering
    getCustomers: builder.query<PaginatedCustomersResponse, CustomerQueryParams | void>({
      query: (params = {}) => ({
        url: 'customers/',
        params,
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'Customers' as const, id })),
              { type: 'Customers', id: 'LIST' },
            ]
          : [{ type: 'Customers', id: 'LIST' }],
    }),

    // Get a single customer by ID
    getCustomerById: builder.query<Customer, number>({
      query: (id) => `customers/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Customers', id }],
    }),

    // Create a new customer
    createCustomer: builder.mutation<Customer, CustomerInput>({
      query: (customer) => ({
        url: 'customers/',
        method: 'POST',
        body: customer,
      }),
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
    }),

    // Update an existing customer
    updateCustomer: builder.mutation<Customer, { id: number; data: CustomerInput }>({
      query: ({ id, data }) => ({
        url: `customers/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customers', id },
        { type: 'Customers', id: 'LIST' },
      ],
    }),

    // Delete a customer
    deleteCustomer: builder.mutation<void, number>({
      query: (id) => ({
        url: `customers/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Customers', id },
        { type: 'Customers', id: 'LIST' },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi; 