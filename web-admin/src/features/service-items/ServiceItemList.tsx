import React, { useState, useEffect } from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  ReferenceField,
  EditButton,
  DeleteButton,
  TextInput,
  SelectInput,
  ReferenceInput,
  TopToolbar,
  CreateButton,
  ExportButton,
  FilterButton,
  FilterForm,
  useListContext,
  FunctionField,
  useTranslate
} from 'react-admin';
import { Box, Card, CardContent, Typography, Chip, Grid } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const ServiceItemFilters = [
  <TextInput source="name" label="Search by name" alwaysOn />,
  <SelectInput 
    source="item_type" 
    label="Type" 
    choices={[
      { id: 'part', name: 'Part' },
      { id: 'labor', name: 'Labor' },
    ]}
  />,
  <ReferenceInput source="service" reference="services">
    <SelectInput label="Service" optionText="title" />
  </ReferenceInput>,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

const ServiceItemTypeIcon = ({ record }: { record?: any }) => {
  if (!record) return null;
  
  return record.item_type === 'part' ? (
    <ShoppingCartIcon className="text-blue-500" />
  ) : (
    <BuildIcon className="text-orange-500" />
  );
};

const ServiceItemTypeField = ({ record }: { record?: any }) => {
  if (!record) return null;
  
  const type = record.item_type === 'part' ? 'Part' : 'Labor';
  const color = record.item_type === 'part' ? 'primary' : 'warning';
  
  return (
    <Chip 
      icon={record.item_type === 'part' ? <ShoppingCartIcon /> : <BuildIcon />} 
      label={type} 
      color={color} 
      size="small" 
      variant="outlined"
      className="mr-2"
    />
  );
};

const ServiceItemCard = ({ record }: { record?: any }) => {
  const translate = useTranslate();
  
  if (!record) return null;
  
  return (
    <Card className="mb-4 border border-[#30475e] hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-4">
        <Grid container spacing={2}>
          <Grid item xs={12} className="flex items-center mb-2">
            <ServiceItemTypeIcon record={record} />
            <Typography variant="h6" className="ml-2 text-[#e2e2e2] font-medium">
              {record.name}
            </Typography>
            <Box className="ml-auto">
              <ServiceItemTypeField record={record} />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} className="flex flex-col">
            <Typography variant="body2" className="text-[#b3b3b3]">
              {translate('resources.service-items.fields.description')}:
            </Typography>
            <Typography variant="body1" className="text-[#e2e2e2]">
              {record.description || '—'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} className="flex flex-col">
            <Typography variant="body2" className="text-[#b3b3b3]">
              {translate('resources.service-items.fields.service')}:
            </Typography>
            <Typography variant="body1" className="text-[#e2e2e2]">
              {record.service?.title || 'Unknown Service'}
            </Typography>
          </Grid>
          
          <Grid item xs={6} sm={3} className="flex flex-col">
            <Typography variant="body2" className="text-[#b3b3b3]">
              {translate('resources.service-items.fields.quantity')}:
            </Typography>
            <Typography variant="body1" className="text-[#e2e2e2]">
              {record.quantity}
            </Typography>
          </Grid>
          
          <Grid item xs={6} sm={3} className="flex flex-col">
            <Typography variant="body2" className="text-[#b3b3b3]">
              {translate('resources.service-items.fields.unit_price')}:
            </Typography>
            <Typography variant="body1" className="text-[#e2e2e2]">
              ${record.unit_price?.toLocaleString() || '0'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} className="flex flex-col">
            <Typography variant="body2" className="text-[#b3b3b3]">
              {translate('resources.service-items.fields.total_price')}:
            </Typography>
            <Typography variant="h6" className="text-[#4caf50] font-medium">
              ${record.total_price?.toLocaleString() || (record.quantity * record.unit_price).toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} className="flex justify-end mt-2">
            <EditButton 
              className="mr-2 bg-[#30475e]/80 hover:bg-[#30475e] text-white" 
              label="Edit" 
            />
            <DeleteButton 
              className="bg-[#f44336]/80 hover:bg-[#f44336] text-white" 
              label="Delete" 
              confirmationTitle="Delete Service Item"
              confirmationContent="Are you sure you want to delete this service item?"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const ServiceItemGrid = () => {
  const { data, isLoading } = useListContext();
  
  if (isLoading || !data) return null;
  
  return (
    <div className="mt-2">
      {data.map(record => (
        <ServiceItemCard key={record.id} record={record} />
      ))}
    </div>
  );
};

const ServiceItemList = () => {
  const [isSmall, setIsSmall] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsSmall(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <List 
      filters={ServiceItemFilters}
      actions={<ListActions />}
      title="Service Items"
      sort={{ field: 'id', order: 'DESC' }}
    >
      {isSmall ? (
        <ServiceItemGrid />
      ) : (
        <Datagrid rowClick="edit">
          <TextField source="id" />
          <ReferenceField source="service" reference="services" link="show">
            <TextField source="title" />
          </ReferenceField>
          <FunctionField
            label="Type"
            render={(record: any) => <ServiceItemTypeField record={record} />}
          />
          <TextField source="name" />
          <NumberField source="quantity" />
          <NumberField source="unit_price" options={{ style: 'currency', currency: 'USD' }} />
          <FunctionField
            label="Total Price"
            render={(record: any) => 
              `$${(record.total_price || (record.quantity * record.unit_price)).toLocaleString()}`
            }
          />
          <EditButton />
          <DeleteButton 
            confirmationTitle="Delete Service Item"
            confirmationContent="Are you sure you want to delete this service item?"
          />
        </Datagrid>
      )}
    </List>
  );
};

export default ServiceItemList; 