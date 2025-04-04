import { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link, 
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Alert,
  FormHelperText,
  SelectChangeEvent,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Link as RouterLink, 
  useNavigate 
} from 'react-router-dom';
import { 
  Home as HomeIcon, 
  People as PeopleIcon, 
  DirectionsCar as CarIcon,
  AddCircle as AddCircleIcon
} from '@mui/icons-material';
import VehicleForm, { VehicleInput } from '../../components/forms/VehicleForm';
import { useCreateVehicleMutation } from '../../store/api/vehicleApi';
import { useGetCustomersQuery } from '../../store/api/customerApi';

const CreateVehicle = () => {
  const [createVehicle, { isLoading: isCreatingVehicle }] = useCreateVehicleMutation();
  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCustomerChange = (event: SelectChangeEvent<number | ''>) => {
    setSelectedCustomerId(event.target.value as number);
    if (customerError) {
      setCustomerError(null);
    }
  };

  const validateCustomerSelection = (): boolean => {
    if (!selectedCustomerId) {
      setCustomerError('Please select a customer');
      return false;
    }
    return true;
  };

  const handleVehicleSubmit = async (data: VehicleInput) => {
    try {
      if (!validateCustomerSelection()) {
        return;
      }
      
      setError(null);
      await createVehicle(data).unwrap();
      setSuccess('Vehicle added successfully!');
      
      // Navigate to vehicles list after a moment
      setTimeout(() => {
        navigate('/admin/vehicles');
      }, 1500);
    } catch (error) {
      console.error('Failed to create vehicle:', error);
      setError('Failed to create vehicle. Please try again.');
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/admin/vehicles');
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Add New Vehicle
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              component={RouterLink}
              to="/dashboard"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Dashboard
            </Link>
            <Link 
              component={RouterLink}
              to="/admin/vehicles"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <CarIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Vehicles
            </Link>
            <Typography 
              sx={{ display: 'flex', alignItems: 'center' }}
              color="text.primary"
            >
              <AddCircleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Add New Vehicle
            </Typography>
          </Breadcrumbs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Customer
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <FormControl fullWidth error={!!customerError}>
              <InputLabel id="customer-select-label">Customer</InputLabel>
              <Select
                labelId="customer-select-label"
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                label="Customer"
                disabled={isLoadingCustomers}
              >
                {isLoadingCustomers ? (
                  <MenuItem value="">
                    <CircularProgress size={24} />
                  </MenuItem>
                ) : (
                  customersData?.results.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} - {customer.email}
                    </MenuItem>
                  ))
                )}
              </Select>
              {customerError && <FormHelperText>{customerError}</FormHelperText>}
            </FormControl>
            
            <Box sx={{ mt: 2 }}>
              <Link 
                component={RouterLink} 
                to="/admin/customers/create"
                sx={{ display: 'flex', alignItems: 'center', width: 'fit-content' }}
              >
                <AddCircleIcon sx={{ mr: 0.5 }} fontSize="small" />
                Add a new customer
              </Link>
            </Box>
          </CardContent>
        </Card>

        {selectedCustomerId && (
          <VehicleForm
            customerId={selectedCustomerId as number}
            onSubmit={handleVehicleSubmit}
            onCancel={handleCancel}
            isLoading={isCreatingVehicle}
          />
        )}
      </Box>
    </Container>
  );
};

export default CreateVehicle; 