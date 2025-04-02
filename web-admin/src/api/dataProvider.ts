import { DataProvider, fetchUtils } from 'react-admin';
import { stringify } from 'query-string';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Handle file uploads for resources like invoices
const hasFileUpload = (data: any): boolean => {
  if (!data) return false;
  
  // Check if any field contains a File or FileList
  for (const key in data) {
    const value = data[key];
    
    // Direct File object
    if (value instanceof File) {
      console.log(`Found File in field ${key}:`, value.name, value.type, value.size);
      return true;
    }
    
    // FileList object
    if (value instanceof FileList && value.length > 0) {
      console.log(`Found FileList in field ${key} with ${value.length} files`);
      return true;
    }
    
    // Array of files
    if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
      console.log(`Found Array of Files in field ${key} with ${value.length} files`);
      return true;
    }
  }
  
  console.log('No file uploads detected in data');
  return false;
};

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const handleFileUpload = (data: any) => {
  console.log('handleFileUpload received data:', data);
  
  const formData = new FormData();
  
  // Process each field in the data object
  for (const key in data) {
    const value = data[key];
    
    if (value === null || value === undefined) {
      console.log(`Skipping null/undefined field: ${key}`);
      continue;
    }
    
    // Handle File objects
    if (value instanceof File) {
      console.log(`Appending File to FormData - ${key}:`, value.name, value.type, value.size);
      formData.append(key, value, value.name);
      continue;
    }
    
    // Handle FileList objects
    if (value instanceof FileList) {
      console.log(`Processing FileList for ${key} with ${value.length} files`);
      for (let i = 0; i < value.length; i++) {
        const file = value[i];
        console.log(`Appending File from FileList - ${key}[${i}]:`, file.name, file.type, file.size);
        formData.append(`${key}[${i}]`, file, file.name);
      }
      continue;
    }
    
    // Handle arrays of Files
    if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
      console.log(`Processing array of Files for ${key} with ${value.length} files`);
      value.forEach((file, index) => {
        console.log(`Appending File from array - ${key}[${index}]:`, file.name, file.type, file.size);
        formData.append(`${key}[${index}]`, file, file.name);
      });
      continue;
    }
    
    // Handle other array or object values by stringify
    if (typeof value === 'object' && value !== null) {
      console.log(`Appending object/array as JSON string - ${key}:`, value);
      formData.append(key, JSON.stringify(value));
      continue;
    }
    
    // Handle simple values
    console.log(`Appending simple value - ${key}:`, value);
    formData.append(key, value.toString());
  }
  
  // Log FormData entries for debugging
  console.log('FormData entries:');
  for (const pair of formData.entries()) {
    console.log(`  ${pair[0]}: ${pair[1] instanceof File ? `File(${(pair[1] as File).name})` : pair[1]}`);
  }
  
  return formData;
};

// Function to get the authentication token consistently
const getAuthToken = (): string | null => {
  // First try 'token' (what appears to be used elsewhere)
  let token = localStorage.getItem('token');
  
  // If not found, try 'access_token' 
  if (!token) {
    token = localStorage.getItem('access_token');
  }
  
  console.log('Using auth token from localStorage:', token ? 'Token found' : 'No token found');
  return token;
};

const httpClient = (url: string, options: any = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ 
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  } else if (options.headers instanceof Headers) {
    if (!options.headers.has('Content-Type')) {
      options.headers.set('Content-Type', 'application/json');
    }
  }
  
  const token = getAuthToken();
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }
  return fetchUtils.fetchJson(url, options);
};

// Handle resources with special needs like nested fields for create/update
const resourceTransformers: Record<string, (data: any) => any> = {
  customers: (data) => {
    // Handle the nested user object for customers
    const { name, email, ...rest } = data;
    
    // If name is provided, split it into first_name and last_name
    let firstName = '';
    let lastName = '';
    if (name) {
      const nameParts = name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    return {
      ...rest,
      user: {
        first_name: firstName,
        last_name: lastName,
        email: email || '',
        // Since we don't create User directly in the admin interface,
        // we'll use a placeholder username that will be ignored by the backend
        // in favor of the one created by the current admin user
        username: email ? email.split('@')[0] : 'user',
      }
    };
  },
  
  // Handle vehicles (cars) resource - This maps between our frontend "vehicles" resource
  // and the backend "cars" API endpoint
  vehicles: (data) => {
    // The backend expects customer_id as a separate field
    const { customer, ...rest } = data;
    
    return {
      ...rest,
      // customer_id either comes directly or from a nested customer object
      customer_id: customer?.id || data.customer_id
    };
  },
  
  // Handle services resource
  services: (data) => {
    const { vehicle, car, ...rest } = data;
    
    // Format dates for the backend if they exist
    const formattedData = { ...rest };
    
    // Format dates if they're provided as Date objects
    if (data.scheduled_date instanceof Date) {
      formattedData.scheduled_date = data.scheduled_date.toISOString();
    }
    
    if (data.completed_date instanceof Date) {
      formattedData.completed_date = data.completed_date.toISOString();
    }
    
    return {
      ...formattedData,
      // car_id either comes directly or from a nested car/vehicle object
      car_id: car?.id || vehicle?.id || data.car_id || data.vehicle_id
    };
  },
  
  // Handle invoices resource
  invoices: (data) => {
    const { service, ...rest } = data;
    
    // Format dates for the backend if they exist
    const formattedData = { ...rest };
    
    // Format dates if they're provided as Date objects
    if (data.due_date instanceof Date) {
      formattedData.due_date = data.due_date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }
    
    if (data.refund_date instanceof Date) {
      formattedData.refund_date = data.refund_date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }
    
    return {
      ...formattedData,
      // service_id either comes directly or from a nested service object
      service_id: service?.id || data.service_id
    };
  },
  
  // Handle users resource for staff management
  users: (data) => {
    const { password, ...rest } = data;
    
    // Only include password if it's provided (for creating new users or changing passwords)
    if (!password) {
      return rest;
    }
    
    return { ...rest, password };
  }
};

// Map resource names from frontend to backend API
const resourceMap: Record<string, string> = {
  vehicles: 'cars', // Map vehicles resource to cars API endpoint
  users: 'staff', // Map users resource to staff API endpoint
  securitylogs: 'audit/logs', // Map securitylogs resource to audit logs API endpoint
  roles: 'auth/roles', // Map roles resource to auth roles API endpoint
  permissions: 'auth/permissions' // Map permissions resource to auth permissions API endpoint
};

const getResourceUrl = (resource: string): string => {
  // Get the mapped resource name or use the original if no mapping exists
  return resourceMap[resource] || resource;
};

export const dataProvider: DataProvider = {
  getList: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    
    const query = {
      offset: ((page - 1) * perPage).toString(),
      limit: perPage.toString(),
      ordering: `${order === 'ASC' ? '' : '-'}${field}`,
      ...params.filter,
    };
    
    const url = `${apiUrl}/${getResourceUrl(resource)}/?${stringify(query)}`;

    return httpClient(url).then(({ headers, json }) => {
      return {
        data: json.results || [],
        total: json.count || 0,
      };
    });
  },

  getOne: (resource, params) =>
    httpClient(`${apiUrl}/${getResourceUrl(resource)}/${params.id}/`).then(({ json }) => ({
      data: json,
    })),

  getMany: (resource, params) => {
    const query = {
      id__in: params.ids.join(','),
    };
    const url = `${apiUrl}/${getResourceUrl(resource)}/?${stringify(query)}`;
    return httpClient(url).then(({ json }) => ({ 
      data: json.results || json 
    }));
  },

  getManyReference: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    
    const query = {
      offset: ((page - 1) * perPage).toString(),
      limit: perPage.toString(),
      ordering: `${order === 'ASC' ? '' : '-'}${field}`,
      ...params.filter,
      [params.target]: params.id,
    };
    
    const url = `${apiUrl}/${getResourceUrl(resource)}/?${stringify(query)}`;

    return httpClient(url).then(({ headers, json }) => {
      return {
        data: json.results || [],
        total: json.count || 0,
      };
    });
  },

  update: (resource, params) => {
    // Check if there are file uploads
    if (hasFileUpload(params.data)) {
      // Remove Content-Type header, FormData will set it with correct boundary
      const options = {
        method: 'PUT',
        headers: new Headers({
          Accept: 'application/json'
        }),
      };
      
      // Get token for authorization
      const token = getAuthToken();
      if (token) {
        options.headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Apply resource-specific transformations before handling file uploads
      const transformedData = resourceTransformers[resource] 
        ? resourceTransformers[resource](params.data)
        : { ...params.data };
      
      // Handle file upload
      return handleFileUpload(transformedData).then(formData => {
        options.body = formData;
        return fetch(`${apiUrl}/${getResourceUrl(resource)}/${params.id}/`, options)
          .then(response => {
            if (!response.ok) {
              return response.json().then(error => {
                throw new Error(JSON.stringify(error));
              });
            }
            return response.json();
          })
          .then(json => ({ data: json }))
          .catch(error => {
            console.error('Error updating with file:', error);
            throw error;
          });
      });
    }
    
    // No file uploads, use regular API
    // Apply resource-specific transformations
    const data = resourceTransformers[resource] 
      ? resourceTransformers[resource](params.data)
      : { ...params.data };
    
    return httpClient(`${apiUrl}/${getResourceUrl(resource)}/${params.id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(({ json }) => ({ data: json }));
  },

  updateMany: (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };
    return Promise.all(
      params.ids.map(id =>
        httpClient(`${apiUrl}/${getResourceUrl(resource)}/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(params.data),
        })
      )
    ).then(responses => ({ data: responses.map(({ json }) => json.id) }));
  },

  create: async (resource, params) => {
    console.log(`Creating ${resource} with params:`, params);
    
    const url = `${apiUrl}/${getResourceUrl(resource)}/`;
    
    // Check if we need to handle file uploads
    const hasFiles = hasFileUpload(params.data);
    console.log(`${resource} create - File upload detected:`, hasFiles);
    
    if (hasFiles) {
      console.log(`Preparing FormData for ${resource} creation with file upload`);
      
      // Convert data to FormData
      const formData = handleFileUpload(params.data);
      
      // Get the authentication token
      const token = getAuthToken();
      
      // Send request with FormData
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type header, browser will set it with boundary
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error creating ${resource} with file upload:`, response.status, errorText);
        throw new Error(`Error creating ${resource}: ${response.status} ${errorText}`);
      }
      
      // Parse response
      const json = await response.json();
      console.log(`${resource} created successfully with file upload:`, json);
      
      return {
        data: { ...params.data, id: json.id },
      };
    }
    
    // Regular JSON request for non-file data
    const { data } = transformRequestData(resource, params);
    console.log(`Transformed data for ${resource} creation:`, data);
    
    // Get the authentication token
    const token = getAuthToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating ${resource}:`, response.status, errorText);
      throw new Error(`Error creating ${resource}: ${response.status} ${errorText}`);
    }
    
    const json = await response.json();
    console.log(`${resource} created successfully:`, json);
    
    return {
      data: { ...data, id: json.id },
    };
  },

  delete: (resource, params) =>
    httpClient(`${apiUrl}/${getResourceUrl(resource)}/${params.id}/`, {
      method: 'DELETE',
    }).then(({ json }) => ({ data: json })),

  deleteMany: (resource, params) =>
    Promise.all(
      params.ids.map(id =>
        httpClient(`${apiUrl}/${getResourceUrl(resource)}/${id}/`, {
          method: 'DELETE',
        })
      )
    ).then(responses => ({ data: responses.map(({ json }) => json.id) })),
}; 