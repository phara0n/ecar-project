import React, { useEffect, useState } from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  ReferenceInput,
  SelectInput,
  required,
  minValue,
  SaveButton,
  Toolbar,
  useTranslate,
  useNotify,
  useRedirect
} from 'react-admin';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box,
  Divider
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useLocation } from 'react-router-dom';

const CustomToolbar = (props: any) => (
  <Toolbar {...props} className="flex items-center justify-end bg-[#1e293b] p-3 rounded-md shadow-md">
    <SaveButton 
      label="Create Service Item" 
      className="bg-[#4caf50]/80 hover:bg-[#4caf50] text-white"
    />
  </Toolbar>
);

const ServiceItemCreate = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const redirect = useRedirect();
  const location = useLocation();
  const [serviceId, setServiceId] = useState<string | null>(null);

  // Check if we have a service ID from the location state (when navigating from service edit)
  useEffect(() => {
    if (location.state && location.state.service) {
      setServiceId(location.state.service.toString());
    }
  }, [location]);

  const onSuccess = () => {
    notify('Service item created successfully');
    
    // If we came from service edit, go back there
    if (serviceId) {
      redirect('edit', 'services', serviceId);
    } else {
      redirect('list', 'service-items');
    }
  };
  
  const transform = (data: any) => {
    // If we have a serviceId from the state and it's not in the form data, add it
    if (serviceId && !data.service) {
      return {
        ...data,
        service: serviceId
      };
    }
    return data;
  };
  
  return (
    <Create 
      title="Create Service Item" 
      mutationOptions={{ onSuccess }}
      transform={transform}
      redirect={serviceId ? `edit` : "list"}
      resource="service-items"
    >
      <div className="max-w-4xl mx-auto">
        <Card className="border border-[#30475e] shadow-md">
          <CardContent>
            <Typography variant="h5" className="text-[#e2e2e2] font-medium mb-4">
              Create New Service Item
            </Typography>
            
            <SimpleForm 
              toolbar={<CustomToolbar />}
              defaultValues={{ service: serviceId || undefined }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" className="text-[#e2e2e2] mb-3 flex items-center">
                    <Box className="mr-2 p-1 rounded-full bg-[#30475e]">
                      <BuildIcon className="text-[#4caf50]" />
                    </Box>
                    Basic Information
                  </Typography>
                  <Box className="bg-[#1e293b] p-4 rounded-md">
                    <ReferenceInput source="service" reference="services">
                      <SelectInput 
                        label="Service" 
                        optionText="title"
                        fullWidth
                        className="mb-3"
                        validate={[required()]}
                        disabled={!!serviceId}
                      />
                    </ReferenceInput>
                    
                    <SelectInput 
                      source="item_type" 
                      choices={[
                        { id: 'part', name: 'Part' },
                        { id: 'labor', name: 'Labor' },
                      ]}
                      validate={[required()]}
                      fullWidth
                      label="Item Type"
                      className="mb-3"
                      defaultValue="part"
                    />
                    
                    <TextInput 
                      source="name" 
                      validate={[required()]} 
                      fullWidth
                      label="Item Name"
                      className="mb-3"
                    />
                    
                    <TextInput 
                      source="description" 
                      multiline 
                      rows={3} 
                      fullWidth
                      label="Description"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" className="text-[#e2e2e2] mb-3 flex items-center">
                    <Box className="mr-2 p-1 rounded-full bg-[#30475e]">
                      <ShoppingCartIcon className="text-[#ff9800]" />
                    </Box>
                    Pricing Details
                  </Typography>
                  <Box className="bg-[#1e293b] p-4 rounded-md">
                    <NumberInput 
                      source="quantity" 
                      validate={[required(), minValue(1)]} 
                      fullWidth
                      label="Quantity"
                      className="mb-3"
                      defaultValue={1}
                    />
                    
                    <NumberInput 
                      source="unit_price" 
                      validate={[required(), minValue(0)]} 
                      fullWidth
                      label="Unit Price ($)"
                      className="mb-3"
                    />
                    
                    <Divider className="my-3 bg-[#30475e]/50" />
                    
                    <Typography variant="subtitle2" className="text-[#b3b3b3] mb-1">
                      Total Price
                    </Typography>
                    <Typography variant="h6" className="text-[#4caf50]">
                      Calculated based on quantity × unit price
                    </Typography>
                    
                    <Typography variant="caption" className="text-[#b3b3b3] block mt-4 italic">
                      Note: The total price will be calculated automatically and shown after saving.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </SimpleForm>
          </CardContent>
        </Card>
      </div>
    </Create>
  );
};

export default ServiceItemCreate; 