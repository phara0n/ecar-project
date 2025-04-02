import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  usePermissions
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel
} from '@mui/material';

const RESOURCES = [
  { name: 'customers', label: 'Customers' },
  { name: 'vehicles', label: 'Vehicles' },
  { name: 'services', label: 'Services' },
  { name: 'invoices', label: 'Invoices' },
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'reports', label: 'Reports' },
  { name: 'data', label: 'Data Import/Export' },
];

const ACTIONS = [
  { name: 'view', label: 'View' },
  { name: 'create', label: 'Create' },
  { name: 'edit', label: 'Edit' },
  { name: 'delete', label: 'Delete' },
  { name: 'export', label: 'Export' },
];

const ROLES = [
  { name: 'admin', label: 'Admin' },
  { name: 'technician', label: 'Technician' },
];

const PermissionList = () => {
  const { permissions } = usePermissions();
  
  if (permissions !== 'admin') {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" component="div">
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don't have permission to access this section. Only administrators can manage permissions.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  // Create a matrix of permissions where each cell has a combined key
  // like "customers:view:admin" that corresponds to a checkbox state
  const [permissionMatrix, setPermissionMatrix] = React.useState<Record<string, boolean>>({});
  
  // Initialize with some default permissions
  React.useEffect(() => {
    const initialMatrix: Record<string, boolean> = {};
    
    // Admin has all permissions
    RESOURCES.forEach(resource => {
      ACTIONS.forEach(action => {
        // Skip some combinations that don't make sense
        if (
          (resource.name === 'dashboard' && action.name !== 'view') ||
          (resource.name === 'reports' && !['view', 'export'].includes(action.name)) ||
          (resource.name === 'data' && !['export'].includes(action.name))
        ) {
          return;
        }
        
        initialMatrix[`${resource.name}:${action.name}:admin`] = true;
      });
    });
    
    // Technicians can view most things but not edit all
    RESOURCES.forEach(resource => {
      ACTIONS.forEach(action => {
        // Skip some combinations that don't make sense
        if (
          (resource.name === 'dashboard' && action.name !== 'view') ||
          (resource.name === 'reports' && !['view'].includes(action.name)) ||
          (resource.name === 'data' && !['export'].includes(action.name))
        ) {
          return;
        }
        
        // Technicians can view everything, create/edit services and invoices
        const canAccess = 
          action.name === 'view' || 
          (action.name === 'create' && ['services', 'invoices'].includes(resource.name)) ||
          (action.name === 'edit' && ['services', 'invoices'].includes(resource.name));
        
        initialMatrix[`${resource.name}:${action.name}:technician`] = canAccess;
      });
    });
    
    setPermissionMatrix(initialMatrix);
  }, []);
  
  const handleCheckboxChange = (
    resource: string, 
    action: string, 
    role: string, 
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const key = `${resource}:${action}:${role}`;
    setPermissionMatrix(prev => ({ ...prev, [key]: event.target.checked }));
  };
  
  const isChecked = (resource: string, action: string, role: string) => {
    const key = `${resource}:${action}:${role}`;
    return permissionMatrix[key] || false;
  };
  
  const isDisabled = (resource: string, action: string) => {
    // Some combinations don't make sense
    return (
      (resource === 'dashboard' && action !== 'view') ||
      (resource === 'reports' && !['view', 'export'].includes(action)) ||
      (resource === 'data' && !['export'].includes(action))
    );
  };
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Role-Based Permissions
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Configure which roles have access to different actions in the system. Changes made here will affect all users with the specified role.
        </Typography>
        
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Resource</TableCell>
                <TableCell>Action</TableCell>
                {ROLES.map(role => (
                  <TableCell key={role.name} align="center">{role.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {RESOURCES.map(resource => (
                ACTIONS.map(action => {
                  // Skip disabled combinations
                  if (isDisabled(resource.name, action.name)) {
                    return null;
                  }
                  
                  return (
                    <TableRow key={`${resource.name}-${action.name}`}>
                      <TableCell>{resource.label}</TableCell>
                      <TableCell>{action.label}</TableCell>
                      
                      {ROLES.map(role => (
                        <TableCell key={role.name} align="center">
                          <Checkbox
                            checked={isChecked(resource.name, action.name, role.name)}
                            onChange={(e) => handleCheckboxChange(resource.name, action.name, role.name, e)}
                            disabled={role.name === 'admin'} // Admin role always has all permissions
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )).flat().filter(Boolean)}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <FormControlLabel
            control={<Checkbox checked={true} disabled />}
            label="Admin role always has all permissions"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PermissionList; 