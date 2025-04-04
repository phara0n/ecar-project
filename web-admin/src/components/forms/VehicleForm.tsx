import { useState } from 'react';
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

// Vehicle input interface
export interface VehicleInput {
  customer: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color: string;
  mileage: number;
}

interface VehicleFormProps {
  customerId: number;
  onSubmit: (data: VehicleInput) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const currentYear = new Date().getFullYear();

const VehicleForm = ({ 
  customerId, 
  onSubmit, 
  onCancel, 
  isLoading 
}: VehicleFormProps) => {
  const [formData, setFormData] = useState<VehicleInput>({
    customer: customerId,
    brand: '',
    model: '',
    year: currentYear,
    license_plate: '',
    vin: '',
    color: '',
    mileage: 0
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleInput, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === 'year' || name === 'mileage') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when field is edited
    if (errors[name as keyof VehicleInput]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleInput, string>> = {};
    let isValid = true;

    // Required fields
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
      isValid = false;
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
      isValid = false;
    }

    if (!formData.license_plate.trim()) {
      newErrors.license_plate = 'License plate is required';
      isValid = false;
    }

    if (formData.year <= 1900 || formData.year > currentYear + 1) {
      newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
      isValid = false;
    }

    if (formData.mileage < 0) {
      newErrors.mileage = 'Mileage cannot be negative';
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
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Handle API validation errors
      if (error.data && typeof error.data === 'object') {
        const apiErrors: Partial<Record<keyof VehicleInput, string>> = {};
        
        Object.entries(error.data).forEach(([key, value]) => {
          if (key in formData) {
            apiErrors[key as keyof VehicleInput] = Array.isArray(value) 
              ? value[0] as string 
              : value as string;
          }
        });
        
        setErrors(apiErrors);
      }
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Add New Vehicle
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="brand"
                label="Brand"
                value={formData.brand}
                onChange={handleChange}
                error={!!errors.brand}
                helperText={errors.brand}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="model"
                label="Model"
                value={formData.model}
                onChange={handleChange}
                error={!!errors.model}
                helperText={errors.model}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="year"
                label="Year"
                type="number"
                InputProps={{ inputProps: { min: 1900, max: currentYear + 1 } }}
                value={formData.year}
                onChange={handleChange}
                error={!!errors.year}
                helperText={errors.year}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="license_plate"
                label="License Plate"
                value={formData.license_plate}
                onChange={handleChange}
                error={!!errors.license_plate}
                helperText={errors.license_plate}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                name="vin"
                label="VIN"
                value={formData.vin}
                onChange={handleChange}
                error={!!errors.vin}
                helperText={errors.vin}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                name="color"
                label="Color"
                value={formData.color}
                onChange={handleChange}
                error={!!errors.color}
                helperText={errors.color}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                required
                name="mileage"
                label="Current Mileage"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={formData.mileage}
                onChange={handleChange}
                error={!!errors.mileage}
                helperText={errors.mileage}
                disabled={isLoading}
              />
            </Grid>
            <Grid xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={onCancel}
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
                  Add Vehicle
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VehicleForm; 