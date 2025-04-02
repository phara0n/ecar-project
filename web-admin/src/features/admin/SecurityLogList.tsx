import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  SearchInput,
  SelectInput,
  FilterButton,
  FunctionField,
  usePermissions
} from 'react-admin';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';

const logFilters = [
  <SearchInput source="search" alwaysOn />,
  <SelectInput 
    source="action" 
    choices={[
      { id: 'login', name: 'Login' },
      { id: 'logout', name: 'Logout' },
      { id: 'failed_login', name: 'Failed Login' },
      { id: 'role_change', name: 'Role Change' },
      { id: 'permission_change', name: 'Permission Change' },
    ]} 
  />,
  <SelectInput 
    source="severity" 
    choices={[
      { id: 'info', name: 'Info' },
      { id: 'warning', name: 'Warning' },
      { id: 'error', name: 'Error' },
    ]} 
  />,
];

const ActionField = ({ record }: { record?: any }) => {
  if (!record) return null;
  
  const action = record.action;
  let icon = <SecurityIcon />;
  let color = 'default';
  
  if (action === 'login') {
    icon = <LoginIcon />;
    color = 'success';
  } else if (action === 'logout') {
    icon = <LogoutIcon />;
    color = 'info';
  } else if (action === 'failed_login') {
    icon = <WarningIcon />;
    color = 'error';
  } else if (action === 'role_change' || action === 'permission_change') {
    icon = <EditIcon />;
    color = 'warning';
  }
  
  return (
    <Chip 
      icon={icon} 
      label={record.action} 
      // @ts-ignore
      color={color}
      size="small"
    />
  );
};

const SecurityLogList = () => {
  const { permissions } = usePermissions();
  
  if (permissions !== 'admin') {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" component="div">
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don't have permission to access this section. Only administrators can view security logs.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <List 
      filters={logFilters}
      sort={{ field: 'timestamp', order: 'DESC' }}
      actions={
        <Box display="flex" gap={1}>
          <FilterButton />
        </Box>
      }
    >
      <Datagrid bulkActionButtons={false}>
        <DateField source="timestamp" label="Time" showTime />
        <TextField source="user" label="User" />
        <TextField source="ip_address" label="IP Address" />
        <ActionField label="Action" />
        <TextField source="details" label="Details" />
        <FunctionField
          label="Severity"
          render={(record: any) => {
            if (!record) return null;
            
            let color = 'primary';
            if (record.severity === 'warning') color = 'warning';
            if (record.severity === 'error') color = 'error';
            
            return (
              <Chip 
                label={record.severity || 'info'} 
                // @ts-ignore
                color={color}
                size="small"
              />
            );
          }}
        />
      </Datagrid>
    </List>
  );
};

export default SecurityLogList; 