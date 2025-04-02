import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  ReferenceInput,
  SelectInput,
  required,
  minValue,
  SaveButton,
  DeleteButton,
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

const CustomToolbar = (props: any) => (
  <Toolbar {...props} className="flex justify-between bg-[#1e293b] p-3 rounded-md shadow-md">
    <SaveButton 
      label="Save Service Item" 
      className="bg-[#4caf50]/80 hover:bg-[#4caf50] text-white"
    />
    <DeleteButton 
      label="Delete Service Item" 
      className="bg-[#f44336]/80 hover:bg-[#f44336] text-white"
      confirmationTitle="Delete Service Item"
      confirmationContent="Are you sure you want to delete this service item? This action cannot be undone."
    />
  </Toolbar>
);

const ServiceItemEdit = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify('Service item updated successfully');
    redirect('list', 'service-items');
  };
  
  return (
    <Edit 
      title="Edit Service Item" 
      mutationOptions={{ onSuccess }}
    >
      <div className="max-w-4xl mx-auto">
        <Card className="border border-[#30475e] shadow-md">
          <CardContent>
            <Typography variant="h5" className="text-[#e2e2e2] font-medium mb-4">
              Edit Service Item
            </Typography>
            
            <SimpleForm 
              toolbar={<CustomToolbar />}
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
                  </Box>
                </Grid>
              </Grid>
            </SimpleForm>
          </CardContent>
        </Card>
      </div>
    </Edit>
  );
};

export default ServiceItemEdit; 