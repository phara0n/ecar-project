import React, { useState } from 'react';
import {
  List,
  Datagrid,
  TextField,
  EditButton,
  CreateButton,
  TopToolbar,
  usePermissions,
  useRecordContext,
  useDataProvider,
  useNotify
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField as MuiTextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Checkbox,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

const PERMISSIONS = [
  'view_customers',
  'edit_customers',
  'create_customers',
  'delete_customers',
  'view_vehicles',
  'edit_vehicles',
  'create_vehicles',
  'delete_vehicles',
  'view_services',
  'edit_services',
  'create_services',
  'delete_services',
  'view_invoices',
  'edit_invoices',
  'create_invoices',
  'delete_invoices',
  'access_dashboard',
  'export_data',
  'view_reports'
];

const RoleListActions = () => {
  const [open, setOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const handleClose = () => {
    setOpen(false);
    setNewRole('');
    setSelectedPermissions([]);
  };

  const handleCreateRole = async () => {
    if (!newRole) return;

    try {
      await dataProvider.create('roles', {
        data: { name: newRole, permissions: selectedPermissions }
      });
      notify('Role created successfully');
      handleClose();
    } catch (error) {
      notify('Error creating role', { type: 'error' });
    }
  };

  const handlePermissionChange = (event: SelectChangeEvent<typeof selectedPermissions>) => {
    const {
      target: { value },
    } = event;
    setSelectedPermissions(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <TopToolbar>
      <Button 
        variant="contained" 
        startIcon={<SecurityIcon />}
        onClick={() => setOpen(true)}
      >
        Create Role
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <MuiTextField
              autoFocus
              margin="dense"
              id="name"
              label="Role Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
          </Box>
          <Box mt={2}>
            <FormControl fullWidth>
              <InputLabel id="permissions-label">Permissions</InputLabel>
              <Select
                labelId="permissions-label"
                id="permissions"
                multiple
                value={selectedPermissions}
                onChange={handlePermissionChange}
                input={<OutlinedInput label="Permissions" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {PERMISSIONS.map((permission) => (
                  <MenuItem key={permission} value={permission}>
                    <Checkbox checked={selectedPermissions.indexOf(permission) > -1} />
                    <ListItemText primary={permission} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </TopToolbar>
  );
};

const PermissionsList = () => {
  const record = useRecordContext();
  
  if (!record || !record.permissions) return null;
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {record.permissions.map((permission: string) => (
        <Chip 
          key={permission}
          label={permission}
          size="small"
          color="primary"
          variant="outlined"
        />
      ))}
    </Box>
  );
};

const RoleList = () => {
  const { permissions } = usePermissions();
  
  if (permissions !== 'admin') {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" component="div">
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don't have permission to access this section. Only administrators can manage roles.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <List 
      actions={<RoleListActions />}
      sort={{ field: 'name', order: 'ASC' }}
    >
      <Datagrid>
        <TextField source="name" label="Role Name" />
        <PermissionsList label="Permissions" />
        <EditButton />
      </Datagrid>
    </List>
  );
};

export default RoleList; 