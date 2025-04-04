import { useState } from 'react';
import { 
  Box, 
  Button, 
  ButtonGroup,
  Card, 
  CardContent, 
  CircularProgress, 
  Divider,
  FormControl,
  FormHelperText,
  Grid, 
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField, 
  Tooltip,
  Typography 
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

// Vehicle input interface
export interface VehicleInput {
  customer: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color: string;
  fuel_type: string;
  mileage: number;
  last_service_date?: string | null;
  last_service_mileage?: number | null;
}

interface VehicleFormProps {
  customerId: number;
  onSubmit: (data: VehicleInput) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const currentYear = new Date().getFullYear();

const fuelTypes = [
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'plugin_hybrid', label: 'Plug-in Hybrid' },
  { value: 'cng', label: 'CNG' },
  { value: 'lpg', label: 'LPG' }
];

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
    fuel_type: 'gasoline',
    mileage: 0,
    last_service_date: null,
    last_service_mileage: null
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleInput, string>>>({});
  const [showServiceHistory, setShowServiceHistory] = useState(true);
  const [showServicePredictions, setShowServicePredictions] = useState(false);
  const [lastServiceDate, setLastServiceDate] = useState<Dayjs | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === 'year' || name === 'mileage' || name === 'last_service_mileage') {
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

  const handleFuelTypeChange = (event: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      fuel_type: event.target.value
    }));
  };

  const handleServiceDateChange = (date: Dayjs | null) => {
    setLastServiceDate(date);
    setFormData(prev => ({
      ...prev,
      last_service_date: date ? date.format('YYYY-MM-DD') : null
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleInput, string>> = {};
    let isValid = true;

    // Required fields
    if (!formData.brand.trim()) {
      newErrors.brand = 'Make is required';
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

    // License plate format validation could be added here
    const licensePlateFormat1 = /^\d{3}[A-Z]{3}\d{3}$/;
    const licensePlateFormat2 = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
    
    if (formData.license_plate && 
        !licensePlateFormat1.test(formData.license_plate) && 
        !licensePlateFormat2.test(formData.license_plate)) {
      newErrors.license_plate = 'License plate format is invalid';
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

    if (formData.last_service_mileage !== null && formData.last_service_mileage < 0) {
      newErrors.last_service_mileage = 'Last service mileage cannot be negative';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent, saveOption: 'save' | 'save_add' | 'save_continue' = 'save') => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        saveOption
      } as any);
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
        
        <Box component="form" onSubmit={(e) => handleSubmit(e)} noValidate>
          <Grid container spacing={3}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="brand"
                label="Make"
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
              <FormControl fullWidth>
                <InputLabel id="fuel-type-label">Fuel Type</InputLabel>
                <Select
                  labelId="fuel-type-label"
                  id="fuel-type"
                  value={formData.fuel_type}
                  label="Fuel Type"
                  onChange={handleFuelTypeChange}
                  disabled={isLoading}
                >
                  {fuelTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                required
                name="license_plate"
                label="License Plate"
                value={formData.license_plate}
                onChange={handleChange}
                error={!!errors.license_plate}
                helperText={errors.license_plate || 'Enter license plate in one of these formats: xxxTUxxx or RSxxxx'}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Format 1: xxxTUxxx - where left x's are exactly 3 digits and right x's are 1-4 digits (e.g., 123TU45, 567TU8901)
                    Format 2: RSxxxx - where x's are 1-6 digits (e.g., RS123, RS456789)">
                      <IconButton edge="end">
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
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
          </Grid>

          {/* Service History Section */}
          <Paper 
            sx={{ mt: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}
            onClick={() => setShowServiceHistory(!showServiceHistory)}
            style={{ cursor: 'pointer' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Service History</Typography>
              <ExpandMoreIcon sx={{ transform: showServiceHistory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </Box>
          </Paper>
          
          {showServiceHistory && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Grid container spacing={3}>
                <Grid xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Last Service Date"
                      value={lastServiceDate}
                      onChange={handleServiceDateChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          disabled: isLoading
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="last_service_mileage"
                    label="Last Service Mileage"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    value={formData.last_service_mileage === null ? '' : formData.last_service_mileage}
                    onChange={handleChange}
                    error={!!errors.last_service_mileage}
                    helperText={errors.last_service_mileage}
                    disabled={isLoading}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Service Predictions Section */}
          <Paper 
            sx={{ mt: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}
            onClick={() => setShowServicePredictions(!showServicePredictions)}
            style={{ cursor: 'pointer' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Service Predictions</Typography>
              <ExpandMoreIcon sx={{ transform: showServicePredictions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </Box>
          </Paper>
          
          {showServicePredictions && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography>
                Service predictions will be available after the vehicle is created.
              </Typography>
            </Box>
          )}

          <Grid xs={12} sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <ButtonGroup variant="contained">
                <Button
                  type="submit"
                  color="primary"
                  disabled={isLoading}
                  onClick={(e) => handleSubmit(e, 'save')}
                  startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : null}
                >
                  SAVE
                </Button>
                <Button
                  color="primary"
                  disabled={isLoading}
                  onClick={(e) => handleSubmit(e, 'save_add')}
                >
                  SAVE & ADD ANOTHER
                </Button>
                <Button
                  color="primary"
                  disabled={isLoading}
                  onClick={(e) => handleSubmit(e, 'save_continue')}
                >
                  SAVE & CONTINUE EDITING
                </Button>
              </ButtonGroup>
            </Box>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VehicleForm; 