import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  EmailField,
  BooleanInput,
  SelectInput,
  PasswordInput,
  FormDataConsumer,
  Toolbar,
  SaveButton,
  usePermissions,
  useRedirect,
  useNotify
} from 'react-admin';
import { Card, CardContent, Typography, Box } from '@mui/material';

const roleChoices = [
  { id: 'admin', name: 'Admin' },
  { id: 'technician', name: 'Technician' },
];

const UserEditToolbar = (props: any) => {
  const redirect = useRedirect();
  const notify = useNotify();
  
  return (
    <Toolbar {...props}>
      <SaveButton 
        label="Save User" 
        onSuccess={() => {
          notify('User updated successfully');
          redirect('list', 'users');
        }}
      />
    </Toolbar>
  );
};

const UserEdit = () => {
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
    <Edit title="Edit User">
      <SimpleForm toolbar={<UserEditToolbar />}>
        <TextInput source="username" disabled />
        <TextInput source="first_name" />
        <TextInput source="last_name" />
        <TextInput source="email" type="email" />
        <SelectInput 
          source="role" 
          choices={roleChoices} 
        />
        <BooleanInput 
          source="is_active" 
          label="Active Status" 
        />
        <FormDataConsumer>
          {({ formData, ...rest }) => (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Change Password (leave blank to keep current password)
              </Typography>
              <PasswordInput 
                source="password" 
                label="New Password" 
                {...rest}
              />
            </Box>
          )}
        </FormDataConsumer>
      </SimpleForm>
    </Edit>
  );
};

export default UserEdit; 