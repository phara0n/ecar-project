import { Card, CardContent, CardHeader, Grid, Typography, Box, Divider, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { useTranslate, Title, useGetList, useDataProvider, DataProviderContext } from 'react-admin';
import { useContext, useEffect, useState } from 'react';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DriveEtaIcon from '@mui/icons-material/DriveEta';

const Dashboard = () => {
  const translate = useTranslate();
  const dataProvider = useContext(DataProviderContext);
  
  const [stats, setStats] = useState({
    pendingServices: 0,
    completedServices: 0,
    revenueThisMonth: 0,
    newCustomers: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get recent services data
  const { data: recentServices, isLoading: loadingRecentServices } = 
    useGetList('services', {
      pagination: { page: 1, perPage: 5 },
      sort: { field: 'scheduled_date', order: 'DESC' }
    });
  
  // Get upcoming appointments data
  const { data: upcomingAppointments, isLoading: loadingAppointments } = 
    useGetList('services', {
      pagination: { page: 1, perPage: 5 },
      sort: { field: 'scheduled_date', order: 'ASC' },
      filter: { status: 'scheduled' }
    });

  // Fetch stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get services count by status
        const pendingServices = await dataProvider.getList('services', {
          pagination: { page: 1, perPage: 1 },
          sort: { field: 'id', order: 'ASC' },
          filter: { status: 'scheduled' }
        });
        
        const inProgressServices = await dataProvider.getList('services', {
          pagination: { page: 1, perPage: 1 },
          sort: { field: 'id', order: 'ASC' },
          filter: { status: 'in_progress' }
        });
        
        const completedServices = await dataProvider.getList('services', {
          pagination: { page: 1, perPage: 1 },
          sort: { field: 'id', order: 'ASC' },
          filter: { status: 'completed' }
        });
        
        // Get paid invoices for revenue calculation
        const paidInvoices = await dataProvider.getList('invoices', {
          pagination: { page: 1, perPage: 1000 }, // Get all to calculate total
          sort: { field: 'id', order: 'ASC' },
          filter: { status: 'paid' }
        });
        
        // Get recent customers for new customer count
        const nowDate = new Date();
        const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
        const customers = await dataProvider.getList('customers', {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: 'id', order: 'ASC' }
        });
        
        // Calculate revenue this month (simple approach, would need refinement based on actual data model)
        const revenueThisMonth = paidInvoices.data
          .filter((invoice: any) => {
            const invoiceDate = invoice.payment_date ? new Date(invoice.payment_date) : null;
            return invoiceDate && invoiceDate >= startOfMonth && invoiceDate <= nowDate;
          })
          .reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0);
        
        // Count new customers this month based on creation date
        const newCustomers = customers.data
          .filter((customer: any) => {
            const creationDate = customer.created_at ? new Date(customer.created_at) : null;
            return creationDate && creationDate >= startOfMonth && creationDate <= nowDate;
          })
          .length;
        
        setStats({
          pendingServices: pendingServices.total + inProgressServices.total,
          completedServices: completedServices.total,
          revenueThisMonth,
          newCustomers
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [dataProvider]);

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    color,
    bgColor
  }: { 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    color: string;
    bgColor: string;
  }) => {
    return (
      <Card className="w-full h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-[#30475e]">
        <CardHeader 
          title={<Typography className="text-[#e2e2e2] font-medium">{title}</Typography>}
          className="pb-0"
        />
        <CardContent>
          <Box className="flex items-center">
            <div 
              className={`mr-4 ${bgColor} rounded-full p-3 flex items-center justify-center`}
            >
              {icon}
            </div>
            {loading ? (
              <CircularProgress size={24} className="text-[#e2e2e2]" />
            ) : (
              <Typography variant="h4" className="text-[#e2e2e2] font-bold">{value}</Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Format date for display
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

  // Get status icon based on service status
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'scheduled':
        return <AccessTimeIcon className="text-blue-500" fontSize="small" />;
      case 'in_progress':
        return <BuildIcon className="text-yellow-500" fontSize="small" />;
      case 'completed':
        return <CheckCircleIcon className="text-green-500" fontSize="small" />;
      case 'cancelled':
        return <BuildIcon className="text-red-500" fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <Title title={translate('menu.dashboard')} />
      <div className="mt-4 mb-8">
        <Typography variant="h4" className="text-[#e2e2e2] font-bold mb-2">
          {translate('dashboard.welcome')}
        </Typography>
        <Typography variant="body1" className="text-[#b3b3b3]">
          {translate('dashboard.welcome_message', { defaultValue: 'Welcome to ECAR Garage Management System' })}
        </Typography>
      </div>
      
      {error && (
        <Typography color="error" className="mb-4 p-2 bg-red-900/20 border border-red-700 rounded">
          {error}
        </Typography>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<BuildIcon className="text-[#f44336]" fontSize="large" />} 
            title={translate('dashboard.pending_services')} 
            value={stats.pendingServices} 
            color="#f44336"
            bgColor="bg-[#f44336]/10"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<CheckCircleIcon className="text-[#4caf50]" fontSize="large" />} 
            title={translate('dashboard.completed_services')} 
            value={stats.completedServices} 
            color="#4caf50"
            bgColor="bg-[#4caf50]/10"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<MonetizationOnIcon className="text-[#ff9800]" fontSize="large" />} 
            title={translate('dashboard.revenue_this_month')} 
            value={`$${stats.revenueThisMonth.toLocaleString()}`} 
            color="#ff9800"
            bgColor="bg-[#ff9800]/10"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PeopleIcon className="text-[#2196f3]" fontSize="large" />} 
            title={translate('dashboard.new_customers')} 
            value={stats.newCustomers} 
            color="#2196f3"
            bgColor="bg-[#2196f3]/10"
          />
        </Grid>
      </Grid>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="w-full h-full border border-[#30475e]">
          <CardHeader 
            title={<Typography className="text-[#e2e2e2] font-medium">Recent Services</Typography>}
          />
          <CardContent>
            {loadingRecentServices ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} className="text-[#e2e2e2]" />
              </Box>
            ) : recentServices && recentServices.length > 0 ? (
              <List disablePadding>
                {recentServices.map((service: any) => (
                  <div key={service.id}>
                    <ListItem className="px-2 py-3 hover:bg-[#30475e]/30 transition-colors duration-150">
                      <div className="mr-3">
                        {getStatusIcon(service.status)}
                      </div>
                      <ListItemText
                        primary={
                          <Typography variant="body1" className="text-[#e2e2e2]">
                            {service.title}
                          </Typography>
                        }
                        secondary={
                          <div className="flex flex-col">
                            <Typography variant="body2" className="text-[#b3b3b3]" component="span">
                              {service.car && `${service.car.make} ${service.car.model}`}
                            </Typography>
                            <Typography variant="caption" className="text-[#b3b3b3]" component="span">
                              {formatDate(service.scheduled_date)}
                            </Typography>
                          </div>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                    <Divider className="bg-[#30475e]/50" />
                  </div>
                ))}
              </List>
            ) : (
              <Typography variant="body2" className="text-[#b3b3b3]">
                No recent services found.
              </Typography>
            )}
          </CardContent>
        </Card>
        
        <Card className="w-full h-full border border-[#30475e]">
          <CardHeader 
            title={<Typography className="text-[#e2e2e2] font-medium">Upcoming Appointments</Typography>}
          />
          <CardContent>
            {loadingAppointments ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} className="text-[#e2e2e2]" />
              </Box>
            ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
              <List disablePadding>
                {upcomingAppointments.map((appointment: any) => (
                  <div key={appointment.id}>
                    <ListItem className="px-2 py-3 hover:bg-[#30475e]/30 transition-colors duration-150">
                      <div className="mr-3">
                        <AccessTimeIcon className="text-blue-500" fontSize="small" />
                      </div>
                      <ListItemText
                        primary={
                          <Typography variant="body1" className="text-[#e2e2e2]">
                            {appointment.title}
                          </Typography>
                        }
                        secondary={
                          <div className="flex flex-col">
                            {appointment.car && (
                              <div className="flex items-center gap-1">
                                <DriveEtaIcon fontSize="small" className="text-[#b3b3b3]" />
                                <Typography variant="body2" className="text-[#b3b3b3]" component="span">
                                  {appointment.car.make} {appointment.car.model}
                                </Typography>
                              </div>
                            )}
                            <Typography variant="caption" className="text-[#b3b3b3]" component="span">
                              {formatDate(appointment.scheduled_date)}
                            </Typography>
                          </div>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                    <Divider className="bg-[#30475e]/50" />
                  </div>
                ))}
              </List>
            ) : (
              <Typography variant="body2" className="text-[#b3b3b3]">
                No upcoming appointments found.
              </Typography>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 