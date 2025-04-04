import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Divider, 
  useTheme, 
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
  ListItemButton,
  Stack,
  Tooltip,
  Badge,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as VehiclesIcon,
  Build as ServicesIcon,
  Receipt as InvoicesIcon,
  Settings as SettingsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Api as ApiIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useGetCurrentUserQuery, useLogoutMutation } from '../store/api/authApi';
import CustomScrollbar from '../components/scrollbar/CustomScrollbar';
import { useThemeContext } from '../theme/ThemeContext';

const drawerWidth = 280;

const MinimalLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  
  // Use theme context for toggling mode
  const { themeMode, toggleThemeMode } = useThemeContext();
  
  // Use the current user query to check authentication
  const { data: user, isLoading, error } = useGetCurrentUserQuery();
  
  // Use the logout mutation
  const [logout] = useLogoutMutation();

  useEffect(() => {
    // Check if user is authenticated using JWT
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // If there's an authentication error, redirect to login
  useEffect(() => {
    if (error) {
      console.error('Authentication error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  }, [error, navigate]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call the logout API
      await logout().unwrap();
      
      // Remove tokens from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Navigate to login page
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      
      // Even if the API call fails, clear tokens and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/admin/customers' },
    { text: 'Vehicles', icon: <VehiclesIcon />, path: '/admin/vehicles' },
    { text: 'Services', icon: <ServicesIcon />, path: '/admin/services' },
    { text: 'Invoices', icon: <InvoicesIcon />, path: '/admin/invoices' },
    { text: 'API Test', icon: <ApiIcon />, path: '/api-test' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          boxShadow: theme.shadows[2],
          width: { md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { md: `${open ? drawerWidth : 0}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: 'background.paper',
          color: 'text.primary',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ height: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2,
              display: { md: 'none' }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Theme Mode Toggle */}
            <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton color="inherit" onClick={toggleThemeMode}>
                {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Notification Icon */}
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit"
                onClick={handleNotificationMenuOpen}
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* User Profile */}
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.5,
                ml: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText'
                }}
              >
                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>
      
      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
            },
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ p: 2, fontWeight: 600 }}>
          Notifications
        </Typography>
        <Divider />
        <MenuItem>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" color="text.primary">
              <strong>New vehicle added</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              A new BMW 320i has been added to the database
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" color="text.primary">
              <strong>Service completed</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Oil change for Audi A6 completed
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" color="text.primary">
              <strong>Invoice paid</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Invoice #1234 has been paid
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary">
            View All
          </Typography>
        </MenuItem>
      </Menu>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 200,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" noWrap>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {user?.email}
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <MenuItem component={RouterLink} to="/profile" onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px dashed rgba(145, 158, 171, 0.2)',
            boxShadow: 'none',
          },
        }}
      >
        <Box sx={{ py: 2, px: 2.5, display: 'flex', alignItems: 'center' }}>
          <Box component="img" src="/logo.png" sx={{ width: 32, height: 32, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ECAR Management
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ borderStyle: 'dashed' }} />
        
        <CustomScrollbar>
          <List sx={{ px: 2, pt: 2 }}>
            {menuItems.map((item) => (
              <ListItem 
                key={item.text} 
                disablePadding 
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 1.5,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: 'primary.main',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                      },
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'primary.main' : 'inherit',
                      minWidth: 36,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: location.pathname === item.path ? 600 : 400 
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </CustomScrollbar>
      </Drawer>
      
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ py: 2, px: 2.5, display: 'flex', alignItems: 'center' }}>
          <Box component="img" src="/logo.png" sx={{ width: 32, height: 32, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ECAR Management
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ borderStyle: 'dashed' }} />
        
        <CustomScrollbar>
          <List sx={{ px: 2, pt: 2 }}>
            {menuItems.map((item) => (
              <ListItem 
                key={item.text} 
                disablePadding 
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={location.pathname === item.path}
                  onClick={handleDrawerToggle}
                  sx={{
                    borderRadius: 1.5,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: 'primary.main',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                      },
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'primary.main' : 'inherit',
                      minWidth: 36,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: location.pathname === item.path ? 600 : 400 
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </CustomScrollbar>
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { md: `${open ? drawerWidth : 0}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: '64px', // AppBar height
          minHeight: 'calc(100vh - 64px)',
          bgcolor: (theme) => 
            theme.palette.mode === 'light' 
              ? alpha(theme.palette.grey[100], 0.5) 
              : theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MinimalLayout; 