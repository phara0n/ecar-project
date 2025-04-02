import { useState } from 'react';
import { useTranslate, useSetLocale } from 'react-admin';
import { Button, Menu, MenuItem } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';

const LanguageSwitcher = () => {
  const translate = useTranslate();
  const setLocale = useSetLocale();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (locale: string) => {
    setLocale(locale);
    handleClose();
  };

  return (
    <>
      <Button
        color="inherit"
        startIcon={<LanguageIcon />}
        onClick={handleClick}
        sx={{ marginLeft: 2 }}
      >
        {translate('language.current')}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleLanguageChange('en')}>
          {translate('language.english')}
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('fr')}>
          {translate('language.french')}
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('ar')}>
          {translate('language.arabic')}
        </MenuItem>
      </Menu>
    </>
  );
};

export default LanguageSwitcher; 