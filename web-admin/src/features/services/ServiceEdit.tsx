import {
  Edit,
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  DateTimeInput,
  required,
  useTranslate,
  AutocompleteInput,
  SaveButton,
  DeleteButton,
  Toolbar,
  useNotify,
  useRedirect,
  useGetList,
  Button,
  useRecordContext,
  useDataProvider
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import { useState, useEffect } from 'react';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { Link, useNavigate } from 'react-router-dom';

const statusChoices = [
  { id: 'scheduled', name: 'Scheduled' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'completed', name: 'Completed' },
  { id: 'cancelled', name: 'Cancelled' },
];

// Custom toolbar with styled buttons
const CustomToolbar = (props: any) => {
  return (
    <Toolbar {...props} className="flex justify-between bg-[#16213e] p-2 rounded-md">
      <SaveButton 
        label="Save Service" 
        className="bg-[#3498db] hover:bg-[#2980b9] text-white"
        icon={<BuildIcon />}
      />
      <DeleteButton 
        label="Delete Service" 
        className="bg-[#e74c3c] hover:bg-[#c0392b] text-white"
      />
    </Toolbar>
  );
};

// Service Item display component
const ServiceItems = () => {
  const record = useRecordContext();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dataProvider = useDataProvider();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServiceItems = async () => {
      if (record && record.id) {
        try {
          setLoading(true);
          const { data } = await dataProvider.getList('service-items', {
            pagination: { page: 1, perPage: 100 },
            sort: { field: 'id', order: 'ASC' },
            filter: { service: record.id },
          });
          setItems(data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching service items:', error);
          setLoading(false);
        }
      }
    };

    fetchServiceItems();
  }, [dataProvider, record]);

  const handleAddServiceItem = () => {
    if (record && record.id) {
      navigate('/service-items/create', { state: { service: record.id } });
    }
  };

  if (!record) return null;

  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);

  return (
    <Box>
      <div className="flex justify-between items-center mb-3">
        <Typography variant="subtitle1" className="text-[#3498db] font-medium">
          Service Items
        </Typography>
        <Button
          label="Add Service Item"
          onClick={handleAddServiceItem}
          className="bg-[#3498db] hover:bg-[#2980b9] text-white"
          startIcon={<AddIcon />}
        />
      </div>

      {loading ? (
        <Box className="flex justify-center p-4">
          <CircularProgress size={24} className="text-[#3498db]" />
        </Box>
      ) : items.length > 0 ? (
        <>
          <TableContainer component={Paper} className="bg-[#1a1a2e] border border-[#30475e] mb-3">
            <Table size="small">
              <TableHead className="bg-[#213555]">
                <TableRow>
                  <TableCell className="text-[#e2e2e2]">Type</TableCell>
                  <TableCell className="text-[#e2e2e2]">Name</TableCell>
                  <TableCell className="text-[#e2e2e2]" align="right">Quantity</TableCell>
                  <TableCell className="text-[#e2e2e2]" align="right">Unit Price</TableCell>
                  <TableCell className="text-[#e2e2e2]" align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow 
                    key={item.id} 
                    hover 
                    className="hover:bg-[#30475e]/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/service-items/${item.id}`)}
                  >
                    <TableCell className="text-[#e2e2e2]">
                      <Chip
                        icon={item.item_type === 'part' ? <ShoppingCartIcon fontSize="small" /> : <EngineeringIcon fontSize="small" />}
                        label={item.item_type === 'part' ? 'Part' : 'Labor'}
                        size="small"
                        className={item.item_type === 'part' ? 'bg-[#214681]/20 text-[#4da6ff]' : 'bg-[#814d21]/20 text-[#ffac4d]'}
                      />
                    </TableCell>
                    <TableCell className="text-[#e2e2e2]">{item.name}</TableCell>
                    <TableCell className="text-[#e2e2e2]" align="right">{item.quantity}</TableCell>
                    <TableCell className="text-[#e2e2e2]" align="right">${item.unit_price.toLocaleString()}</TableCell>
                    <TableCell className="text-[#e2e2e2] font-medium" align="right">
                      ${(item.quantity * item.unit_price).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box className="bg-[#213555] p-3 rounded-md flex justify-between items-center">
            <Typography variant="subtitle1" className="text-[#e2e2e2]">
              Total Amount
            </Typography>
            <Typography variant="h6" className="text-[#4caf50] font-bold">
              ${totalAmount.toLocaleString()}
            </Typography>
          </Box>
        </>
      ) : (
        <Box className="p-4 border border-[#30475e] rounded-md bg-[#1a1a2e] text-center mb-3">
          <Typography className="text-[#b3b3b3] mb-2">
            No service items found for this service.
          </Typography>
          <Button
            label="Add First Service Item"
            onClick={handleAddServiceItem}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white"
            startIcon={<AddIcon />}
          />
        </Box>
      )}
    </Box>
  );
};

const ServiceEdit = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const redirect = useRedirect();
  
  const onSuccess = () => {
    notify('Service updated successfully');
    redirect('list', 'services');
  };
  
  return (
    <Edit
      component="div"
      mutationOptions={{ onSuccess }}
      className="bg-[#1a1a2e]"
    >
      <Card className="border border-[#30475e] shadow-md">
        <CardContent>
          <Typography variant="h5" className="text-[#e2e2e2] font-semibold mb-4">
            Edit Service
          </Typography>
          
          <Divider className="my-4 bg-[#30475e]" />
          
          <SimpleForm toolbar={<CustomToolbar />}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box className="bg-[#16213e] p-4 rounded-md border border-[#30475e] h-full">
                  <Typography variant="subtitle1" className="text-[#3498db] font-medium mb-3">
                    Service Details
                  </Typography>
                  
                  <TextInput 
                    source="id" 
                    disabled 
                    helperText="Service ID (auto-generated)"
                    className="mb-4"
                    fullWidth
                    InputProps={{ className: "bg-[#1a1a2e]" }}
                  />
                  
                  <TextInput 
                    source="title" 
                    validate={required()} 
                    fullWidth 
                    helperText="Enter a descriptive title for the service"
                    className="mb-4"
                    InputProps={{ className: "bg-[#1a1a2e]" }}
                  />
                  
                  <TextInput 
                    source="description" 
                    multiline 
                    rows={4} 
                    fullWidth 
                    helperText="Detailed description of service to be performed"
                    className="mb-4"
                    InputLabelProps={{ style: { color: '#aaa' } }}
                    sx={{ "& .MuiInputBase-root": { backgroundColor: "#1a1a2e" } }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box className="bg-[#16213e] p-4 rounded-md border border-[#30475e] h-full">
                  <Typography variant="subtitle1" className="text-[#3498db] font-medium mb-3">
                    Vehicle & Status
                  </Typography>
                  
                  <ReferenceInput source="car_id" reference="vehicles">
                    <AutocompleteInput 
                      optionText={(record) => 
                        record ? `${record.make} ${record.model} (${record.license_plate})` : ''
                      }
                      validate={required()} 
                      fullWidth 
                      helperText="Select the vehicle for this service"
                      className="mb-4"
                      sx={{ "& .MuiInputBase-root": { backgroundColor: "#1a1a2e" } }}
                    />
                  </ReferenceInput>
                  
                  <SelectInput 
                    source="status" 
                    choices={statusChoices} 
                    validate={required()} 
                    fullWidth 
                    helperText="Current status of the service"
                    className="mb-4"
                    sx={{ "& .MuiInputBase-root": { backgroundColor: "#1a1a2e" } }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box className="bg-[#16213e] p-4 rounded-md border border-[#30475e]">
                  <Typography variant="subtitle1" className="text-[#3498db] font-medium mb-3">
                    Scheduling
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <DateTimeInput 
                        source="scheduled_date" 
                        validate={required()} 
                        fullWidth 
                        helperText="When is the service scheduled for?"
                        className="mb-4"
                        sx={{ "& .MuiInputBase-root": { backgroundColor: "#1a1a2e" } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DateTimeInput 
                        source="completed_date" 
                        fullWidth 
                        helperText="When was the service completed? (Leave blank if not completed)"
                        className="mb-4"
                        sx={{ "& .MuiInputBase-root": { backgroundColor: "#1a1a2e" } }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box className="bg-[#16213e] p-4 rounded-md border border-[#30475e]">
                  <Typography variant="subtitle1" className="text-[#3498db] font-medium mb-3">
                    Additional Information
                  </Typography>
                  
                  <TextInput 
                    source="technician_notes" 
                    multiline 
                    rows={4} 
                    fullWidth 
                    helperText="Notes by the technician about this service"
                    sx={{ "& .MuiInputBase-root": { backgroundColor: "#1a1a2e" } }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box className="bg-[#16213e] p-4 rounded-md border border-[#30475e]">
                  <ServiceItems />
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Edit>
  );
};

export default ServiceEdit; 