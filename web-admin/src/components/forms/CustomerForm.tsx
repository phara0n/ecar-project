import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Divider, 
  Grid, 
  TextField, 
  Typography 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Customer input interface
export interface CustomerInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
}

interface CustomerFormProps {
  initialData?: CustomerInput;
  onSubmit: (data: CustomerInput) => Promise<void>;
  isLoading: boolean;
  title: string;
  submitButtonText: string;
}

const initialFormState: CustomerInput = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal_code: ''
};

const CustomerForm = ({ 
  initialData = initialFormState, 
  onSubmit, 
  isLoading, 
  title, 
  submitButtonText 
}: CustomerFormProps) => {
  const [formData, setFormData] = useState<CustomerInput>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInput, string>>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Update form if initialData changes (e.g., when editing and data loads)
    if (initialData !== initialFormState) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name as keyof CustomerInput]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerInput, string>> = {};
    let isValid = true;

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
      isValid = false;
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      navigate('/admin/customers');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Handle API validation errors
      if (error.data && typeof error.data === 'object') {
        const apiErrors: Partial<Record<keyof CustomerInput, string>> = {};
        
        Object.entries(error.data).forEach(([key, value]) => {
          if (key in formData) {
            apiErrors[key as keyof CustomerInput] = Array.isArray(value) 
              ? value[0] as string 
              : value as string;
          }
        });
        
        setErrors(apiErrors);
      }
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="first_name"
                label="First Name"
                value={formData.first_name}
                onChange={handleChange}
                error={!!errors.first_name}
                helperText={errors.first_name}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="last_name"
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                error={!!errors.last_name}
                helperText={errors.last_name}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                name="city"
                label="City"
                value={formData.city}
                onChange={handleChange}
                error={!!errors.city}
                helperText={errors.city}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                name="postal_code"
                label="Postal Code"
                value={formData.postal_code}
                onChange={handleChange}
                error={!!errors.postal_code}
                helperText={errors.postal_code}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/customers')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : null}
                >
                  {submitButtonText}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CustomerForm; 