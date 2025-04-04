import { useState, useRef, MouseEvent } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  CardActions,
  ClickAwayListener,
  Divider,
  Grid,
  Paper,
  Popper,
  Stack,
  Typography
} from '@mui/material';

// icons
import NotificationsIcon from '@mui/icons-material/Notifications';
import DescriptionIcon from '@mui/icons-material/Description';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';

// types
interface NotificationItemProps {
  avatar: React.ReactNode;
  title: string;
  subtitle: string;
  time: string;
}

// notification item component
const NotificationItem = ({ avatar, title, subtitle, time }: NotificationItemProps) => {
  const theme = useTheme();

  return (
    <Grid container alignItems="center" spacing={1} sx={{ p: 1.5 }}>
      <Grid>{avatar}</Grid>
      <Grid flex={1} minWidth={0}>
        <Stack spacing={0.3}>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {subtitle}
          </Typography>
        </Stack>
      </Grid>
      <Grid>
        <Typography variant="caption" color="textSecondary">
          {time}
        </Typography>
      </Grid>
    </Grid>
  );
};

// ==============================|| NOTIFICATION ||============================== //

const Notification = () => {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent<HTMLElement> | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };

  // Mock notification data
  const notifications = [
    {
      avatar: (
        <Avatar
          sx={{
            bgcolor: theme.palette.success.light,
            color: theme.palette.success.dark
          }}
        >
          <InventoryIcon fontSize="small" />
        </Avatar>
      ),
      title: 'New order received',
      subtitle: 'Order #2458 from John Doe',
      time: '2 min ago'
    },
    {
      avatar: (
        <Avatar
          sx={{
            bgcolor: theme.palette.warning.light,
            color: theme.palette.warning.dark
          }}
        >
          <BuildIcon fontSize="small" />
        </Avatar>
      ),
      title: 'Service completed',
      subtitle: 'Vehicle #VH124 service completed',
      time: '1 hour ago'
    },
    {
      avatar: (
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.light,
            color: theme.palette.primary.dark
          }}
        >
          <DescriptionIcon fontSize="small" />
        </Avatar>
      ),
      title: 'Invoice generated',
      subtitle: 'Invoice #INV-2547 has been generated',
      time: 'Yesterday'
    }
  ];

  return (
    <>
      <Box sx={{ flexShrink: 0, ml: 0.75 }}>
        <ButtonBase
          sx={{
            p: 0.25,
            bgcolor: open ? theme.palette.primary.light : 'transparent',
            borderRadius: '50%',
            '&:hover': { bgcolor: theme.palette.primary.light }
          }}
          aria-label="open notification"
          ref={anchorRef}
          aria-controls={open ? 'notification-list' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <NotificationsIcon fontSize="small" />
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
                offset: [0, 14]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Paper
            sx={{
              boxShadow: theme.shadows[1],
              width: 360,
              minWidth: 290,
              maxWidth: 360,
              [theme.breakpoints.down('md')]: {
                maxWidth: 290
              }
            }}
          >
            <ClickAwayListener onClickAway={handleClose}>
              <Box>
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="h6">Notifications</Typography>
                    <Typography variant="subtitle2" sx={{ ml: 1 }}>
                      ({notifications.length})
                    </Typography>
                  </Stack>
                </Box>
                <Divider />
                <Box sx={{ height: '100%', maxHeight: 'calc(100vh - 205px)', overflow: 'auto' }}>
                  {notifications.map((item, index) => (
                    <Box key={index}>
                      <NotificationItem
                        avatar={item.avatar}
                        title={item.title}
                        subtitle={item.subtitle}
                        time={item.time}
                      />
                      <Divider />
                    </Box>
                  ))}
                </Box>
                <CardActions sx={{ justifyContent: 'center', p: 1.25 }}>
                  <Button size="small" variant="contained">
                    View All
                  </Button>
                </CardActions>
              </Box>
            </ClickAwayListener>
          </Paper>
        )}
      </Popper>
    </>
  );
};

export default Notification; 