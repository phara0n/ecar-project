import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  ButtonBase,
  CardContent,
  ClickAwayListener,
  Grid,
  IconButton,
  Paper,
  Popper,
  Stack,
  Typography
} from '@mui/material';

// project imports
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';

// assets
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';

// RTK query hooks
import { useGetCurrentUserQuery, useLogoutMutation } from '../../../store/api/authApi';

// ==============================|| PROFILE ||============================== //

const Profile = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  // Get current user data from the API
  const { data: user, isLoading, error } = useGetCurrentUserQuery();
  
  // Logout mutation
  const [logout] = useLogoutMutation();

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Call the logout mutation
      await logout().unwrap();
      
      // Navigate to login page
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
      
      // Even if API call fails, clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  };

  // Generate initials from name
  const getInitials = () => {
    if (!user) return '?';
    
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
  };

  // Format full name
  const getFullName = () => {
    if (!user) return 'Loading...';
    
    return `${user.first_name} ${user.last_name}`;
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        sx={{
          p: 0.25,
          bgcolor: open ? 'grey.300' : 'transparent',
          borderRadius: 1,
          '&:hover': { bgcolor: 'grey.200' }
        }}
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 0.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: theme.palette.primary.main
            }}
            aria-label="profile picture"
          >
            {isLoading ? '?' : getInitials()}
          </Avatar>
          <Typography variant="subtitle1">{isLoading ? 'Loading...' : getFullName()}</Typography>
        </Stack>
      </ButtonBase>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Paper
            sx={{
              boxShadow: theme.shadows[4],
              width: 290,
              minWidth: 240,
              maxWidth: 290,
              [theme.breakpoints.down('md')]: {
                maxWidth: 250
              }
            }}
          >
            <ClickAwayListener onClickAway={handleClose}>
              <CardContent sx={{ px: 2.5, pt: 3 }}>
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: theme.palette.primary.main
                        }}
                        aria-label="profile picture"
                      >
                        {isLoading ? '?' : getInitials()}
                      </Avatar>
                      <Stack>
                        <Typography variant="h6">{isLoading ? 'Loading...' : getFullName()}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user?.is_superuser ? 'Super Admin' : (user?.is_staff ? 'Staff Member' : 'User')}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>
                <Divider sx={{ mt: 2 }} />
                <Box sx={{ pt: 2 }}>
                  <Stack spacing={0.5}>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      alignItems="center"
                      sx={{
                        textDecoration: 'none',
                        color: theme.palette.text.primary,
                        py: 1,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.main
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        navigate('/account');
                        setOpen(false);
                      }}
                    >
                      <AccountCircleIcon stroke={1.5} size="1.3rem" />
                      <Typography variant="body2">My Account</Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      alignItems="center"
                      sx={{
                        textDecoration: 'none',
                        color: theme.palette.text.primary,
                        py: 1,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.main
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        navigate('/settings');
                        setOpen(false);
                      }}
                    >
                      <SettingsIcon stroke={1.5} size="1.3rem" />
                      <Typography variant="body2">Settings</Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1.25}
                      alignItems="center"
                      sx={{
                        textDecoration: 'none',
                        color: theme.palette.text.primary,
                        py: 1,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.main
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        navigate('/change-password');
                        setOpen(false);
                      }}
                    >
                      <LockResetIcon stroke={1.5} size="1.3rem" />
                      <Typography variant="body2">Change Password</Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  sx={{
                    textDecoration: 'none',
                    color: theme.palette.error.main,
                    py: 1,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: theme.palette.error.light,
                      color: theme.palette.error.dark
                    },
                    cursor: 'pointer'
                  }}
                  onClick={handleLogout}
                >
                  <LogoutIcon stroke={1.5} size="1.3rem" />
                  <Typography variant="body2">Logout</Typography>
                </Stack>
              </CardContent>
            </ClickAwayListener>
          </Paper>
        )}
      </Popper>
    </Box>
  );
};

export default Profile; 