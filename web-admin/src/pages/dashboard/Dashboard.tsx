import { Card, CardContent, CardHeader, Grid, Typography, Box } from '@mui/material';
import { useTranslate, Title } from 'react-admin';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

const Dashboard = () => {
  const translate = useTranslate();

  // In a real app, these would be fetched from the API
  const stats = {
    pendingServices: 12,
    completedServices: 48,
    revenueThisMonth: 8750,
    newCustomers: 15,
  };

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    color 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    color: string;
  }) => {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader 
          title={title} 
          titleTypographyProps={{ variant: 'h6' }} 
          sx={{ pb: 0 }}
        />
        <CardContent>
          <Box display="flex" alignItems="center">
            <Box 
              sx={{ 
                mr: 2, 
                backgroundColor: `${color}20`, 
                borderRadius: '50%',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {icon}
            </Box>
            <Typography variant="h4">{value}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Title title={translate('menu.dashboard')} />
      <Box sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {translate('dashboard.welcome')}
        </Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<BuildIcon sx={{ color: '#f44336' }} />} 
            title={translate('dashboard.pending_services')} 
            value={stats.pendingServices} 
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<CheckCircleIcon sx={{ color: '#4caf50' }} />} 
            title={translate('dashboard.completed_services')} 
            value={stats.completedServices} 
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<MonetizationOnIcon sx={{ color: '#ff9800' }} />} 
            title={translate('dashboard.revenue_this_month')} 
            value={`$${stats.revenueThisMonth}`} 
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PeopleIcon sx={{ color: '#2196f3' }} />} 
            title={translate('dashboard.new_customers')} 
            value={stats.newCustomers} 
            color="#2196f3"
          />
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard; 