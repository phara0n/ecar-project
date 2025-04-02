import { AppBar as RaAppBar, UserMenu, useTranslate, Logout, ToggleThemeButton } from 'react-admin';
import { Typography, Box, useTheme, useMediaQuery, Button } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import LanguageSwitcher from '../components/LanguageSwitcher';

export const AppBar = () => {
  const translate = useTranslate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <RaAppBar
      color="primary"
      userMenu={
        <UserMenu>
          <ToggleThemeButton />
          <Logout />
        </UserMenu>
      }
    >
      <Box 
        flex={1} 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        position="relative"
      >
        <Typography
          variant="h6"
          noWrap
          sx={{
            flex: isSmall ? 0 : 1,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {translate('app.title')}
        </Typography>

        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#1e3a5f',
            borderRadius: 1,
            padding: '6px 12px',
            boxShadow: '0 0 8px rgba(0,0,0,0.3)',
            border: '1px solid #2c4d76',
            '&:hover': {
              bgcolor: '#2a4a74',
              boxShadow: '0 0 12px rgba(0,0,0,0.5)',
            },
            transition: 'all 0.2s ease-in-out',
            zIndex: 1200,
            minWidth: '80px',
            justifyContent: 'center'
          }}
        >
          <LanguageSwitcher />
        </Box>
      </Box>
    </RaAppBar>
  );
}; 