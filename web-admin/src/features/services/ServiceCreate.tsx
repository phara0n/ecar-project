import {
  Create,
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  DateTimeInput,
  required,
  useTranslate,
  AutocompleteInput,
  SaveButton,
  Toolbar,
  useNotify,
  useRedirect,
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const statusChoices = [
  { id: 'scheduled', name: 'Scheduled' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'completed', name: 'Completed' },
  { id: 'cancelled', name: 'Cancelled' },
];

// Custom toolbar with styled buttons
const CustomToolbar = (props: any) => {
  return (
    <Toolbar {...props} className="flex justify-end bg-[#16213e] p-2 rounded-md">
      <SaveButton 
        label="Create Service" 
        className="bg-[#3498db] hover:bg-[#2980b9] text-white"
        icon={<AddIcon />}
      />
    </Toolbar>
  );
};

const ServiceCreate = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const redirect = useRedirect();
  
  const onSuccess = () => {
    notify('Service created successfully');
    redirect('list', 'services');
  };
  
  return (
    <Create
      component="div"
      mutationOptions={{ onSuccess }}
      className="bg-[#1a1a2e]"
    >
      <Card className="border border-[#30475e] shadow-md">
        <CardContent>
          <Typography variant="h5" className="text-[#e2e2e2] font-semibold mb-4">
            Create New Service
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
                    source="title" 
                    validate={required()} 
                    fullWidth 
                    placeholder="Oil Change, Brake Repair, etc."
                    helperText="Enter a descriptive title for the service"
                    className="mb-4"
                    InputProps={{ className: "bg-[#1a1a2e]" }}
                  />
                  
                  <TextInput 
                    source="description" 
                    multiline 
                    rows={4} 
                    fullWidth 
                    placeholder="Detailed description of the service to be performed..."
                    helperText="Detailed description of service to be performed"
                    className="mb-4"
                    InputProps={{ className: "bg-[#1a1a2e]" }}
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
                      placeholder="Select a vehicle"
                      helperText="Select the vehicle for this service"
                      className="mb-4"
                      InputProps={{ className: "bg-[#1a1a2e]" }}
                    />
                  </ReferenceInput>
                  
                  <SelectInput 
                    source="status" 
                    choices={statusChoices} 
                    defaultValue="scheduled"
                    validate={required()} 
                    fullWidth 
                    helperText="Current status of the service"
                    className="mb-4"
                    InputProps={{ className: "bg-[#1a1a2e]" }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box className="bg-[#16213e] p-4 rounded-md border border-[#30475e]">
                  <Typography variant="subtitle1" className="text-[#3498db] font-medium mb-3">
                    Scheduling
                  </Typography>
                  
                  <DateTimeInput 
                    source="scheduled_date" 
                    validate={required()} 
                    defaultValue={new Date()}
                    fullWidth 
                    helperText="When is the service scheduled for?"
                    className="mb-4"
                    InputProps={{ className: "bg-[#1a1a2e]" }}
                  />
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
                    placeholder="Additional notes for the technician..."
                    helperText="Notes by the technician about this service"
                    InputProps={{ className: "bg-[#1a1a2e]" }}
                  />
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Create>
  );
};

export default ServiceCreate; 