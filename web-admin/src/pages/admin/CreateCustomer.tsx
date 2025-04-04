import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Home as HomeIcon, People as PeopleIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import CustomerForm, { CustomerInput } from '../../components/forms/CustomerForm';
import { useCreateCustomerMutation } from '../../store/api/customerApi';

const CreateCustomer = () => {
  const [createCustomer, { isLoading }] = useCreateCustomerMutation();

  const handleSubmit = async (data: CustomerInput) => {
    await createCustomer(data).unwrap();
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

        <CustomerForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          title="Customer Information"
          submitButtonText="Create Customer"
        />
      </Box>
    </Container>
  );
};

export default CreateCustomer; 