import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  BooleanInput,
  SelectInput,
  ReferenceInput,
  required,
  Toolbar,
  SaveButton,
  DeleteButton,
  useNotify,
  useRedirect,
  FormDataConsumer,
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
} from '@mui/material';

// Custom toolbar with styled buttons
const CustomToolbar = (props: any) => (
  <Toolbar 
    {...props} 
    sx={{ 
      backgroundColor: 'primary.dark', 
      borderRadius: 1,
      justifyContent: 'space-between',
      marginTop: 2
    }}
  >
    <SaveButton />
    <DeleteButton />
  </Toolbar>
);

export const NotificationEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify('Notification updated successfully');
    redirect('list', 'notifications');
  };

  return (
    <Edit 
      title="Edit Notification" 
      mutationOptions={{ onSuccess }}
    >
      <Card sx={{ 
        bgcolor: 'background.paper',
        boxShadow: 3,
        borderRadius: 2,
        p: 0,
      }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Notification Details
            </Typography>
            <Divider />
          </Box>

          <SimpleForm 
            toolbar={<CustomToolbar />}
            sx={{ 
              '& .RaSimpleFormIterator-form': {
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                mt: 2,
              }
            }}
          >
            <Grid container spacing={2}>
              {/* Notification Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Notification Info
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <TextInput 
                    source="title" 
                    fullWidth 
                    validate={required()}
                    label="Title"
                    helperText="Enter the notification title"
                  />
                  
                  <TextInput
                    source="message"
                    fullWidth
                    multiline
                    rows={4}
                    validate={required()}
                    label="Message"
                    helperText="Enter the notification message"
                  />
                </Box>
              </Grid>

              {/* Type and Status */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Type and Status
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <SelectInput
                    source="notification_type"
                    choices={[
                      { id: 'service_reminder', name: 'Service Reminder' },
                      { id: 'service_update', name: 'Service Update' },
                      { id: 'invoice', name: 'Invoice' },
                      { id: 'general', name: 'General' },
                    ]}
                    validate={required()}
                    fullWidth
                  />
                  
                  <BooleanInput
                    source="is_read"
                    label="Mark as Read"
                    helperText="Toggle to mark notification as read/unread"
                  />
                  
                  <ReferenceInput 
                    source="customer" 
                    reference="customers"
                    fullWidth
                  >
                    <SelectInput 
                      label="Customer" 
                      fullWidth
                      validate={required()}
                      optionText={(record) => 
                        record ? 
                          `${record.user?.first_name || ''} ${record.user?.last_name || ''}` 
                        : ''
                      }
                    />
                  </ReferenceInput>
                </Box>
              </Grid>
            </Grid>
          </SimpleForm>
        </CardContent>
      </Card>
    </Edit>
  );
}; 