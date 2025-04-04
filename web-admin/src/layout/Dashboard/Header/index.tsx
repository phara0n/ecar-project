import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  useMediaQuery,
  Badge,
  ButtonBase,
  Avatar,
  Stack,
  Tooltip
} from '@mui/material';

// project imports
import Profile from './Profile';
import Notification from './Notification';
import MobileSection from './MobileSection';

// assets
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

// types
import { ThemeMode } from '../../../types/theme';

interface HeaderProps {
  handleDrawerToggle: () => void;
  open: boolean;
}

// ==============================|| HEADER ||============================== //

const Header = ({ handleDrawerToggle, open }: HeaderProps) => {
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down('md'));

  const [openNotification, setOpenNotification] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  // handle notification popup
  const handleNotification = () => {
    setOpenNotification((prev) => !prev);
  };

  // handle profile dropdown
  const handleProfile = () => {
    setOpenProfile((prev) => !prev);
  };

  return (
    <AppBar 
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: theme.palette.background.default,
        transition: theme.transitions.create('width'),
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)'
      }}
    >
      <Toolbar>
        <Box sx={{ width: 228, display: 'flex', [theme.breakpoints.down('md')]: { width: 'auto' } }}>
          <ButtonBase sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Avatar
              variant="rounded"
              sx={{
                ...theme.typography.commonAvatar,
                ...theme.typography.mediumAvatar,
                transition: 'all .2s ease-in-out',
                background: theme.palette.primary.light,
                color: theme.palette.primary.dark,
                '&:hover': {
                  background: theme.palette.primary.dark,
                  color: theme.palette.primary.light
                }
              }}
              onClick={handleDrawerToggle}
              color="inherit"
            >
              <MenuIcon />
            </Avatar>
          </ButtonBase>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Header items aligned to the right */}
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Search button */}
          <IconButton
            size="large"
            sx={{
              color: theme.palette.text.primary,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '50%',
              width: 36,
              height: 36
            }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>

          {/* Theme toggle */}
          <IconButton
            size="large"
            sx={{
              color: theme.palette.text.primary,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '50%',
              width: 36,
              height: 36
            }}
          >
            {theme.palette.mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>

          {/* Notification */}
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              color="inherit"
              sx={{
                color: theme.palette.text.primary,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '50%',
                width: 36,
                height: 36
              }}
              onClick={handleNotification}
            >
              <Badge badgeContent={4} color="primary">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {!matchDownMD && <Profile />}
          {matchDownMD && <MobileSection />}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 