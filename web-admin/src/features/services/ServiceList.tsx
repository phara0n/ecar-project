import {
  List,
  Datagrid,
  TextField,
  DateField,
  SearchInput,
  EditButton,
  useTranslate,
  ChipField,
  FunctionField,
  FilterList,
  FilterListItem,
  TopToolbar,
  CreateButton,
  ExportButton,
  useListContext,
  useDataProvider,
  useGetList
} from 'react-admin';
import { useState, useEffect } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BuildIcon from '@mui/icons-material/Build';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Card, CardContent, Chip, Typography, Box, Grid, Badge, CircularProgress } from '@mui/material';
import { useMediaQuery } from '@mui/material';

const ListActions = () => (
  <TopToolbar className="flex gap-2">
    <CreateButton 
      label="Create Service" 
      className="bg-blue-600 hover:bg-blue-700"
    />
    <ExportButton 
      label="Export Services" 
      className="bg-gray-700 hover:bg-gray-800"
    />
  </TopToolbar>
);

// Hook to get service item counts
const useServiceItemCounts = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const dataProvider = useDataProvider();
  
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data } = await dataProvider.getList('service-items', {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: 'id', order: 'ASC' },
          filter: {},
        });
        
        // Group items by service and count them
        const countsByService = data.reduce((acc: Record<string, number>, item: any) => {
          const serviceId = item.service.toString();
          acc[serviceId] = (acc[serviceId] || 0) + 1;
          return acc;
        }, {});
        
        setCounts(countsByService);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching service item counts:', error);
        setLoading(false);
      }
    };
    
    fetchCounts();
  }, [dataProvider]);
  
  return { counts, loading };
};

// Custom grid layout for service items
const ServiceGrid = () => {
  const { data, isLoading } = useListContext();
  const { counts, loading: countsLoading } = useServiceItemCounts();
  
  if (isLoading || !data) return null;
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'scheduled': return <AccessTimeIcon className="text-blue-700" />;
      case 'in_progress': return <BuildIcon className="text-yellow-700" />;
      case 'completed': return <CheckCircleIcon className="text-green-700" />;
      case 'cancelled': return <CancelIcon className="text-red-700" />;
      default: return null;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <Grid container spacing={2} className="mt-2">
      {data.map((service: any) => (
        <Grid item xs={12} sm={6} md={4} key={service.id}>
          <Card className="h-full border border-[#30475e] hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Typography variant="h6" className="text-[#e2e2e2] font-semibold">
                  {service.title}
                </Typography>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(service.status)}
                    <span>
                      {service.status?.charAt(0).toUpperCase() + service.status?.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              
              {service.car && (
                <div className="mb-3 p-2 bg-[#1a1a2e] rounded-md">
                  <Typography variant="body2" className="text-[#b3b3b3] mb-1">
                    Vehicle
                  </Typography>
                  <Typography variant="body1" className="text-[#e2e2e2] flex items-center">
                    {service.car.make} {service.car.model} 
                    <Chip 
                      label={service.car.license_plate} 
                      size="small" 
                      className="ml-2 bg-[#2c3e50] text-[#e2e2e2]"
                    />
                  </Typography>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <Typography variant="body2" className="text-[#b3b3b3] mb-1">
                    Scheduled
                  </Typography>
                  <Typography variant="body2" className="text-[#e2e2e2]">
                    {formatDate(service.scheduled_date)}
                  </Typography>
                </div>
                <div>
                  <Typography variant="body2" className="text-[#b3b3b3] mb-1">
                    Completed
                  </Typography>
                  <Typography variant="body2" className="text-[#e2e2e2]">
                    {formatDate(service.completed_date) || '-'}
                  </Typography>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <Badge 
                  badgeContent={counts[service.id] || 0} 
                  color="info"
                  className="mr-2"
                >
                  <Chip
                    icon={<ListAltIcon fontSize="small" />}
                    label="Service Items"
                    size="small"
                    className="bg-[#1a1a2e] text-[#e2e2e2] border border-[#30475e]"
                  />
                </Badge>
                
                <EditButton 
                  record={service}
                  label="Edit" 
                  className="bg-[#3498db] hover:bg-[#2980b9] text-white"
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const ServiceList = () => {
  const translate = useTranslate();
  const isSmall = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));
  const { counts, loading: countsLoading } = useServiceItemCounts();
  
  const filters = [
    <SearchInput source="q" placeholder="Search services..." alwaysOn />,
    <FilterList label="Status" icon={<BuildIcon />}>
      <FilterListItem label="Scheduled" value={{ status: 'scheduled' }} />
      <FilterListItem label="In Progress" value={{ status: 'in_progress' }} />
      <FilterListItem label="Completed" value={{ status: 'completed' }} />
      <FilterListItem label="Cancelled" value={{ status: 'cancelled' }} />
    </FilterList>
  ];

  const getStatusChip = (status: string) => {
    let color, bgColor, icon;
    
    switch(status) {
      case 'scheduled':
        color = 'text-blue-800';
        bgColor = 'bg-blue-100';
        icon = <AccessTimeIcon fontSize="small" className="text-blue-700" />;
        break;
      case 'in_progress':
        color = 'text-yellow-800';
        bgColor = 'bg-yellow-100';
        icon = <BuildIcon fontSize="small" className="text-yellow-700" />;
        break;
      case 'completed':
        color = 'text-green-800';
        bgColor = 'bg-green-100';
        icon = <CheckCircleIcon fontSize="small" className="text-green-700" />;
        break;
      case 'cancelled':
        color = 'text-red-800';
        bgColor = 'bg-red-100';
        icon = <CancelIcon fontSize="small" className="text-red-700" />;
        break;
      default:
        color = 'text-gray-800';
        bgColor = 'bg-gray-100';
        break;
    }
    
    return (
      <div className={`px-3 py-1 rounded-full inline-flex items-center gap-1 ${bgColor} ${color}`}>
        {icon}
        <span>
          {status?.charAt(0).toUpperCase() + status?.slice(1).replace('_', ' ')}
        </span>
      </div>
    );
  };
  
  // Function to render service item count for a service
  const renderServiceItemCount = (record: any) => {
    if (countsLoading) {
      return <CircularProgress size={16} />;
    }
    
    const count = counts[record.id] || 0;
    return (
      <Badge 
        badgeContent={count} 
        color="info"
        max={99}
      >
        <ListAltIcon fontSize="small" className="text-[#b3b3b3]" />
      </Badge>
    );
  };
  
  return (
    <List 
      filters={filters}
      actions={<ListActions />}
      sort={{ field: 'scheduled_date', order: 'DESC' }}
      component="div"
      className="bg-[#1a1a2e]"
    >
      {isSmall ? (
        <ServiceGrid />
      ) : (
        <Datagrid
          bulkActionButtons={false}
          className="border border-[#30475e] rounded-md overflow-hidden"
        >
          <TextField source="id" />
          <TextField source="title" />
          <FunctionField
            label="Vehicle"
            render={(record: any) => 
              record?.car ? (
                <div className="flex items-center gap-1">
                  <span>{record.car.make} {record.car.model}</span>
                  <Chip 
                    label={record.car.license_plate} 
                    size="small" 
                    className="bg-[#2c3e50] text-[#e2e2e2]"
                  />
                </div>
              ) : '-'
            }
          />
          <FunctionField
            label="Status"
            render={(record: any) => getStatusChip(record.status)}
          />
          <DateField source="scheduled_date" showTime />
          <DateField source="completed_date" showTime />
          <FunctionField
            label="Items"
            render={(record: any) => renderServiceItemCount(record)}
          />
          <EditButton className="bg-[#3498db] hover:bg-[#2980b9] text-white" />
        </Datagrid>
      )}
    </List>
  );
};

export default ServiceList; 