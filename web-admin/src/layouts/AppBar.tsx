import { AppBar as RaAppBar, UserMenu, useTranslate, Logout, ToggleThemeButton } from 'react-admin';
import { Typography, Box } from '@mui/material';
import LanguageSwitcher from '../components/LanguageSwitcher';

export const AppBar = () => {
  const translate = useTranslate();

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
      <Box flex={1} display="flex" alignItems="center">
        <Typography
          variant="h6"
          noWrap
          sx={{
            flex: 1,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {translate('app.title')}
        </Typography>
        <LanguageSwitcher />
      </Box>
    </RaAppBar>
  );
}; 