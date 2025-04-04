import { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  CircularProgress,
  Alert 
} from '@mui/material';
import { 
  Link as RouterLink, 
  useNavigate 
} from 'react-router-dom';
import { 
  Home as HomeIcon, 
  People as PeopleIcon, 
  PersonAdd as PersonAddIcon,
  DirectionsCar as CarIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon
} from '@mui/icons-material';
import CustomerForm, { CustomerInput } from '../../components/forms/CustomerForm';
import VehicleForm, { VehicleInput } from '../../components/forms/VehicleForm';
import { useCreateCustomerMutation } from '../../store/api/customerApi';
import { useCreateVehicleMutation } from '../../store/api/vehicleApi';

const CreateCustomer = () => {
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();
  const [createVehicle, { isLoading: isCreatingVehicle }] = useCreateVehicleMutation();
  const [newCustomerId, setNewCustomerId] = useState<number | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [addVehicleOption, setAddVehicleOption] = useState<'none' | 'now' | 'later'>('none');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCustomerSubmit = async (data: CustomerInput) => {
    try {
      setError(null);
      const response = await createCustomer(data).unwrap();
      setNewCustomerId(response.id);
      setSuccess(`Customer ${response.first_name} ${response.last_name} created successfully!`);
      
      // If user chose to add vehicle now, don't navigate away
      if (addVehicleOption === 'now') {
        setShowAddVehicle(true);
      } else if (addVehicleOption === 'later' || addVehicleOption === 'none') {
        // Wait a moment before navigating to show success message
        setTimeout(() => {
          navigate('/admin/customers');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      setError('Failed to create customer. Please try again.');
      throw error; // Re-throw so the form can handle specific field errors
    }
  };

  const handleVehicleSubmit = async (data: VehicleInput) => {
    try {
      if (!newCustomerId) {
        setError('Customer ID is missing. Please try again.');
        return;
      }
      
      setError(null);
      const vehicleData = {
        ...data,
        customer: newCustomerId
      };
      
      await createVehicle(vehicleData).unwrap();
      setSuccess('Vehicle added successfully!');
      
      // Navigate to customers list after a moment
      setTimeout(() => {
        navigate('/admin/customers');
      }, 1500);
    } catch (error) {
      console.error('Failed to create vehicle:', error);
      setError('Failed to create vehicle. Please try again.');
      throw error;
    }
  };

  const handleCancelAddVehicle = () => {
    setShowAddVehicle(false);
    navigate('/admin/customers');
  };

  const handleVehicleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddVehicleOption(event.target.value as 'none' | 'now' | 'later');
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Add New Customer
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
              to="/admin/customers"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <PeopleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Customers
            </Link>
            <Typography 
              sx={{ display: 'flex', alignItems: 'center' }}
              color="text.primary"
            >
              <PersonAddIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Add New Customer
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

        {!showAddVehicle ? (
          <>
            <CustomerForm
              onSubmit={handleCustomerSubmit}
              isLoading={isCreatingCustomer}
              title="Customer Information"
              submitButtonText="Create Customer"
            />

            <Accordion 
              sx={{ mt: 3 }}
              expanded={addVehicleOption !== 'none'}
              onChange={(e, expanded) => {
                if (!expanded) {
                  setAddVehicleOption('none');
                } else if (addVehicleOption === 'none') {
                  setAddVehicleOption('later');
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="vehicle-options-content"
                id="vehicle-options-header"
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CarIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Vehicle Options</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Would you like to add a vehicle for this customer?</FormLabel>
                  <RadioGroup
                    value={addVehicleOption}
                    onChange={handleVehicleOptionChange}
                  >
                    <FormControlLabel 
                      value="none" 
                      control={<Radio />} 
                      label="Don't add a vehicle" 
                    />
                    <FormControlLabel 
                      value="now" 
                      control={<Radio />} 
                      label="Add a vehicle after creating the customer" 
                    />
                    <FormControlLabel 
                      value="later" 
                      control={<Radio />} 
                      label="Add a vehicle later (You'll be redirected to the customers list)" 
                    />
                  </RadioGroup>
                </FormControl>
              </AccordionDetails>
            </Accordion>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CarIcon sx={{ mr: 1 }} />
              <Typography variant="h5">Add Vehicle for New Customer</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <VehicleForm
              customerId={newCustomerId || 0}
              onSubmit={handleVehicleSubmit}
              onCancel={handleCancelAddVehicle}
              isLoading={isCreatingVehicle}
            />
          </>
        )}
      </Box>
    </Container>
  );
};

export default CreateCustomer; 