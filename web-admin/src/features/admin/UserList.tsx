import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  BooleanField,
  EditButton,
  TextInput,
  SearchInput,
  SelectInput,
  FilterButton,
  FilterForm,
  FunctionField,
  ChipField,
  usePermissions
} from 'react-admin';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import { Card, CardContent, Typography, Box } from '@mui/material';

const userFilters = [
  <SearchInput source="search" alwaysOn />,
  <SelectInput 
    source="role" 
    choices={[
      { id: 'admin', name: 'Admin' },
      { id: 'technician', name: 'Technician' },
    ]} 
  />,
  <SelectInput 
    source="is_active" 
    choices={[
      { id: 'true', name: 'Active' },
      { id: 'false', name: 'Inactive' },
    ]} 
  />,
];

const UserStatusField = ({ record }: { record?: any }) => {
  if (!record) return null;
  
  return record.is_active ? (
    <ChipField 
      record={record} 
      source="is_active" 
      label="Active" 
      color="success" 
      style={{ backgroundColor: '#e6f7e6', color: '#2e7d32' }}
    />
  ) : (
    <ChipField 
      record={record} 
      source="is_active" 
      label="Inactive" 
      color="error" 
      style={{ backgroundColor: '#ffebee', color: '#d32f2f' }}
    />
  );
};

const UserList = () => {
  const { permissions } = usePermissions();
  
  if (permissions !== 'admin') {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" component="div">
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don't have permission to access this section. Only administrators can manage users.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <List 
      filters={userFilters}
      sort={{ field: 'last_login', order: 'DESC' }}
      actions={
        <Box display="flex" gap={1}>
          <FilterButton />
        </Box>
      }
    >
      <Datagrid>
        <TextField source="username" label="Username" />
        <TextField source="first_name" label="First Name" />
        <TextField source="last_name" label="Last Name" />
        <EmailField source="email" label="Email" />
        <FunctionField
          label="Role"
          render={(record: any) => record.role || 'User'}
        />
        <UserStatusField label="Status" />
        <DateField source="last_login" label="Last Login" showTime />
        <DateField source="date_joined" label="Joined" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export default UserList; 