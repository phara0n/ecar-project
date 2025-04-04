import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Alert
} from '@mui/material';

// Import API hooks
import { useGetCurrentUserQuery } from '../../store/api/authApi';
import { useGetCustomersQuery } from '../../store/api/customerApi';
import { useGetVehiclesQuery, useGetVehiclesByCustomerQuery } from '../../store/api/vehicleApi';

// Test component to demonstrate backend API integration
const ApiTest: React.FC = () => {
  const [customerId, setCustomerId] = useState<number | null>(null);
  
  // Fetch current user data
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError 
  } = useGetCurrentUserQuery();
  
  // Fetch customers with pagination
  const { 
    data: customersData, 
    isLoading: customersLoading, 
    error: customersError 
  } = useGetCustomersQuery({ page: 1, page_size: 5 });
  
  // Fetch vehicles with pagination
  const { 
    data: vehiclesData, 
    isLoading: vehiclesLoading, 
    error: vehiclesError 
  } = useGetVehiclesQuery({ page: 1, page_size: 5 });
  
  // Fetch vehicles by customer ID (if selected)
  const { 
    data: customerVehicles, 
    isLoading: customerVehiclesLoading, 
    error: customerVehiclesError 
  } = useGetVehiclesByCustomerQuery(customerId || 0, { 
    skip: customerId === null 
  });

  // Handle selecting a customer
  const handleSelectCustomer = (id: number) => {
    setCustomerId(id);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        API Integration Test
      </Typography>
      
      <Grid container spacing={3}>
        {/* Current User Section */}
        <Grid cols={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Current User (JWT Authentication)
            </Typography>
            
            {userLoading ? (
              <CircularProgress size={24} />
            ) : userError ? (
              <Alert severity="error">
                Error loading user data. Please check your authentication.
              </Alert>
            ) : userData ? (
              <Box>
                <Typography>
                  <strong>Username:</strong> {userData.username}
                </Typography>
                <Typography>
                  <strong>Name:</strong> {userData.first_name} {userData.last_name}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {userData.email}
                </Typography>
                <Typography>
                  <strong>Role:</strong> {userData.is_superuser 
                    ? 'Super Admin' 
                    : userData.is_staff 
                      ? 'Staff Member' 
                      : 'Regular User'}
                </Typography>
              </Box>
            ) : (
              <Alert severity="warning">
                No user data available. Please log in.
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Customers Section */}
        <Grid sm={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Customers (First 5)
            </Typography>
            
            {customersLoading ? (
              <CircularProgress size={24} />
            ) : customersError ? (
              <Alert severity="error">
                Error loading customers.
              </Alert>
            ) : customersData ? (
              <Stack spacing={2}>
                <Typography variant="subtitle2">
                  Showing {customersData.results.length} of {customersData.count} customers
                </Typography>
                
                {customersData.results.map(customer => (
                  <Paper key={customer.id} sx={{ p: 1.5 }} variant="outlined">
                    <Stack 
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography variant="subtitle1">
                          {customer.first_name} {customer.last_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {customer.email}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {customer.phone}
                        </Typography>
                      </Box>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleSelectCustomer(customer.id)}
                      >
                        View Vehicles
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">
                No customers available.
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Vehicles Section */}
        <Grid sm={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {customerId 
                ? `Vehicles for Customer #${customerId}` 
                : 'All Vehicles (First 5)'}
            </Typography>
            
            {/* Clear customer selection if any */}
            {customerId && (
              <Button 
                size="small" 
                variant="text" 
                onClick={() => setCustomerId(null)}
                sx={{ mb: 2 }}
              >
                View All Vehicles
              </Button>
            )}
            
            {/* Show loading state */}
            {customerId 
              ? customerVehiclesLoading 
              : vehiclesLoading 
              ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  {/* Show error if any */}
                  {customerId 
                    ? customerVehiclesError 
                    : vehiclesError ? (
                      <Alert severity="error">
                        Error loading vehicles.
                      </Alert>
                    ) : (
                      <>
                        {/* Show vehicles */}
                        {customerId 
                          ? (customerVehicles && customerVehicles.length > 0) 
                          : (vehiclesData && vehiclesData.results.length > 0) ? (
                            <Stack spacing={2}>
                              {/* Show count for all vehicles */}
                              {!customerId && vehiclesData && (
                                <Typography variant="subtitle2">
                                  Showing {vehiclesData.results.length} of {vehiclesData.count} vehicles
                                </Typography>
                              )}
                              
                              {/* Render the appropriate vehicle list */}
                              {(customerId ? customerVehicles : vehiclesData?.results)?.map(vehicle => (
                                <Paper key={vehicle.id} sx={{ p: 1.5 }} variant="outlined">
                                  <Typography variant="subtitle1">
                                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    License: {vehicle.license_plate}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Color: {vehicle.color}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Mileage: {vehicle.mileage} km
                                  </Typography>
                                </Paper>
                              ))}
                            </Stack>
                          ) : (
                            <Alert severity="info">
                              No vehicles available.
                            </Alert>
                          )
                        }
                      </>
                    )
                  }
                </>
              )
            }
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApiTest; 