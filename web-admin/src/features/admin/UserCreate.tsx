import React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  PasswordInput,
  SelectInput,
  BooleanInput,
  usePermissions,
  Toolbar,
  SaveButton,
  useRedirect,
  useNotify,
  required
} from 'react-admin';
import { Card, CardContent, Typography } from '@mui/material';

const roleChoices = [
  { id: 'admin', name: 'Admin' },
  { id: 'technician', name: 'Technician' },
];

const UserCreateToolbar = (props: any) => {
  const redirect = useRedirect();
  const notify = useNotify();
  
  return (
    <Toolbar {...props}>
      <SaveButton 
        label="Create User" 
        onSuccess={() => {
          notify('User created successfully');
          redirect('list', 'users');
        }}
      />
    </Toolbar>
  );
};

const UserCreate = () => {
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
    <Create title="Create New User">
      <SimpleForm toolbar={<UserCreateToolbar />}>
        <TextInput 
          source="username" 
          validate={[required()]}
        />
        <TextInput 
          source="first_name" 
          validate={[required()]}
        />
        <TextInput 
          source="last_name" 
          validate={[required()]}
        />
        <TextInput 
          source="email" 
          type="email"
          validate={[required()]}
        />
        <PasswordInput 
          source="password" 
          validate={[required()]}
        />
        <SelectInput 
          source="role" 
          choices={roleChoices} 
          defaultValue="technician"
          validate={[required()]}
        />
        <BooleanInput 
          source="is_active" 
          label="Active Status"
          defaultValue={true}
        />
      </SimpleForm>
    </Create>
  );
};

export default UserCreate; 