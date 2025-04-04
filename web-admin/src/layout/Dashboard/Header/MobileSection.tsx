import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  ButtonBase,
  ClickAwayListener,
  Grid,
  Paper,
  Popper,
  Stack,
  Typography
} from '@mui/material';

// assets
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptIcon from '@mui/icons-material/Receipt';

// Mobile Section component for the Header
const MobileSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  // Menu items that correspond to backend resources
  const menuItems = [
    { icon: <DashboardIcon sx={{ fontSize: '1.1rem' }} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <PersonIcon sx={{ fontSize: '1.1rem' }} />, label: 'Customers', path: '/customers' },
    { icon: <DirectionsCarIcon sx={{ fontSize: '1.1rem' }} />, label: 'Vehicles', path: '/vehicles' },
    { icon: <BuildIcon sx={{ fontSize: '1.1rem' }} />, label: 'Services', path: '/services' },
    { icon: <ReceiptIcon sx={{ fontSize: '1.1rem' }} />, label: 'Invoices', path: '/invoices' }
  ];

  return (
    <>
      <Box sx={{ flexShrink: 0, ml: 0.75 }}>
        <ButtonBase
          sx={{
            p: 0.25,
            bgcolor: open ? 'grey.300' : 'transparent',
            borderRadius: 1,
            '&:hover': { bgcolor: 'grey.200' }
          }}
          aria-label="open mobile menu"
          ref={anchorRef}
          aria-controls={open ? 'mobile-menu' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <MenuIcon />
        </ButtonBase>
      </Box>
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
              width: 240,
              minWidth: 240,
              maxWidth: 240
            }}
          >
            <ClickAwayListener onClickAway={handleClose}>
              <Box>
                <Grid container direction="column" spacing={1.5} p={2}>
                  {menuItems.map((item) => (
                    <Grid item key={item.path}>
                      <Stack
                        direction="row"
                        spacing={1.25}
                        alignItems="center"
                        sx={{
                          textDecoration: 'none',
                          color: theme.palette.text.primary,
                          py: 0.75,
                          px: 1,
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: theme.palette.primary.light,
                            color: theme.palette.primary.main
                          }
                        }}
                        onClick={() => handleMenuItemClick(item.path)}
                      >
                        {item.icon}
                        <Typography variant="body1">{item.label}</Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </ClickAwayListener>
          </Paper>
        )}
      </Popper>
    </>
  );
};

export default MobileSection; 