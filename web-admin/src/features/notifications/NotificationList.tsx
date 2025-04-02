import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  FunctionField,
  BooleanField,
  SearchInput,
  FilterList,
  FilterListItem,
  TextInput,
  BooleanInput,
  DateInput,
  CreateButton,
  ExportButton,
  TopToolbar,
  useListContext,
  EditButton,
  ChipField,
  useTranslate,
  SelectInput,
} from 'react-admin';
import {
  Card,
  CardContent,
  Box,
  Chip,
  Grid,
  Typography,
  useMediaQuery,
  Theme,
  Divider,
  Badge,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

// Define notification filters
const notificationFilters = [
  <SearchInput key="search" source="q" alwaysOn />,
  <SelectInput
    key="notification_type"
    source="notification_type"
    choices={[
      { id: 'service_reminder', name: 'Service Reminder' },
      { id: 'service_update', name: 'Service Update' },
      { id: 'invoice', name: 'Invoice' },
      { id: 'general', name: 'General' },
    ]}
  />,
  <BooleanInput key="is_read" source="is_read" label="Read Status" />,
  <DateInput key="created_at" source="created_at" label="Created After" />,
];

// Custom actions component for the list
const ListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

// Function to determine notification icon based on type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'service_reminder':
      return <WarningIcon sx={{ color: 'warning.main' }} />;
    case 'service_update':
      return <InfoIcon sx={{ color: 'info.main' }} />;
    case 'invoice':
      return <EmailIcon sx={{ color: 'success.main' }} />;
    case 'general':
    default:
      return <NotificationsIcon sx={{ color: 'primary.main' }} />;
  }
};

// Grid layout for notifications - card-based layout for better visual appeal
const NotificationGrid = () => {
  const { data, isLoading } = useListContext();
  const translate = useTranslate();
  
  if (isLoading || !data) return null;
  
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {data.map(notification => (
        <Grid item xs={12} sm={6} md={4} key={notification.id}>
          <Card 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              backgroundColor: notification.is_read ? 'background.paper' : 'primary.dark',
              transition: 'background-color 0.3s',
              '&:hover': {
                backgroundColor: 'primary.main',
              }
            }}
          >
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getNotificationIcon(notification.notification_type)}
                  <Chip 
                    label={translate(`resources.notifications.notification_types.${notification.notification_type}`)} 
                    size="small" 
                    color={
                      notification.notification_type === 'service_reminder' ? 'warning' :
                      notification.notification_type === 'service_update' ? 'info' :
                      notification.notification_type === 'invoice' ? 'success' : 'primary'
                    }
                  />
                </Box>
                <Badge color={notification.is_read ? 'default' : 'error'} variant="dot">
                  <Typography variant="caption">
                    {new Date(notification.created_at).toLocaleString()}
                  </Typography>
                </Badge>
              </Box>
              
              <Typography variant="h6" component="div" gutterBottom>
                {notification.title}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2, flex: 1 }}>
                {notification.message}
              </Typography>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  {notification.customer?.user?.first_name} {notification.customer?.user?.last_name}
                </Typography>
                <EditButton record={notification} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Filter sidebar component
const NotificationFilterSidebar = () => (
  <Box
    sx={{
      display: { xs: 'none', sm: 'block' },
      '& .RaFilterList-root': { mt: 1 },
    }}
  >
    <FilterList label="Status" icon={<NotificationsIcon />}>
      <FilterListItem label="Read" value={{ is_read: true }} />
      <FilterListItem label="Unread" value={{ is_read: false }} />
    </FilterList>
    
    <FilterList label="Type" icon={<InfoIcon />}>
      <FilterListItem label="Service Reminder" value={{ notification_type: 'service_reminder' }} />
      <FilterListItem label="Service Update" value={{ notification_type: 'service_update' }} />
      <FilterListItem label="Invoice" value={{ notification_type: 'invoice' }} />
      <FilterListItem label="General" value={{ notification_type: 'general' }} />
    </FilterList>
  </Box>
);

// Main NotificationList component
export const NotificationList = () => {
  const isSmall = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  
  return (
    <List 
      filters={notificationFilters} 
      actions={<ListActions />}
      aside={<NotificationFilterSidebar />}
      title="Notifications"
    >
      {isSmall ? (
        <NotificationGrid />
      ) : (
        <Datagrid>
          <TextField source="id" />
          <TextField source="title" />
          <FunctionField
            label="Type"
            render={(record) => (
              <Chip
                icon={getNotificationIcon(record.notification_type)}
                label={record.notification_type.replace('_', ' ')}
                size="small"
                color={
                  record.notification_type === 'service_reminder' ? 'warning' :
                  record.notification_type === 'service_update' ? 'info' :
                  record.notification_type === 'invoice' ? 'success' : 'primary'
                }
              />
            )}
          />
          <FunctionField
            label="Customer"
            render={(record) => `${record.customer?.user?.first_name} ${record.customer?.user?.last_name}`}
          />
          <BooleanField source="is_read" />
          <DateField source="created_at" showTime />
          <EditButton />
        </Datagrid>
      )}
    </List>
  );
};