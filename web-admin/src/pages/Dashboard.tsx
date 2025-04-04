import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { baseApi } from '../store/api/baseApi';

// Create a dedicated API endpoint for dashboard stats
const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<{
      customerCount: number;
      vehicleCount: number;
      activeServiceCount: number;
      monthlyRevenue: number;
    }, void>({
      query: () => 'dashboard/stats/',
      // In case the endpoint doesn't exist yet, handle the error gracefully
      transformErrorResponse: (response) => {
        console.error('Dashboard stats error:', response);
        return { status: response.status };
      },
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;

// We'll integrate Toolpad Core components for advanced functionality
// as we build out the dashboard
const Dashboard = () => {
  // Fallback stats in case the API call fails
  const [stats, setStats] = useState({
    customerCount: 0,
    vehicleCount: 0,
    activeServiceCount: 0,
    monthlyRevenue: 0,
  });

  // Use the query hook to fetch dashboard stats
  const { data, isLoading, error } = useGetDashboardStatsQuery();

  // If we successfully get data from the API, update our stats
  useEffect(() => {
    if (data) {
      setStats(data);
    }
  }, [data]);

  // If the API call fails, we can try to fetch individual counts
  useEffect(() => {
    if (error) {
      // This is a fallback solution to manually count items from other endpoints
      // You would need to implement similar API calls for other resources
      console.log('Fallback to individual resource counting');
      // Example: fetch customers count separately
      fetch('http://localhost:8000/api/customers/')
        .then(response => response.json())
        .then(data => {
          if (data.results && Array.isArray(data.results)) {
            setStats(prev => ({ ...prev, customerCount: data.results.length }));
          }
        })
        .catch(err => console.error('Error fetching customers:', err));
    }
  }, [error]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid xs={12} style={{ gridColumn: { sm: 'span 6', lg: 'span 3' } }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary">
              Total Customers
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, pt: 1 }}>
                {stats.customerCount}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid xs={12} style={{ gridColumn: { sm: 'span 6', lg: 'span 3' } }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary">
              Total Vehicles
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, pt: 1 }}>
                {stats.vehicleCount}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid xs={12} style={{ gridColumn: { sm: 'span 6', lg: 'span 3' } }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary">
              Active Services
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, pt: 1 }}>
                {stats.activeServiceCount}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid xs={12} style={{ gridColumn: { sm: 'span 6', lg: 'span 3' } }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="text.secondary">
              Revenue (This Month)
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, pt: 1 }}>
                ${stats.monthlyRevenue.toFixed(2)}
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Charts and other data will be added here */}
        <Grid xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent activity to display.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 