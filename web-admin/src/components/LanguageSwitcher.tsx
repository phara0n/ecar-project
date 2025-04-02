import { useState } from 'react';
import { useTranslate, useSetLocale } from 'react-admin';
import { Typography, Box } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import EmojiFlags from '@mui/icons-material/EmojiFlags';

const LanguageSwitcher = () => {
  const translate = useTranslate();
  const setLocale = useSetLocale();
  const currentLocale = localStorage.getItem('preferredLanguage') || 'en';
  
  // Log current language to help debug
  console.log(`Current language in switcher: ${currentLocale}`);

  const toggleLanguage = () => {
    const newLocale = currentLocale === 'en' ? 'fr' : 'en';
    console.log(`Switching language to: ${newLocale}`);
    setLocale(newLocale);
    localStorage.setItem('preferredLanguage', newLocale);
  };

  return (
    <Box 
      onClick={toggleLanguage} 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        cursor: 'pointer',
        borderRadius: '4px',
        width: '100%',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'scale(1.05)',
        }
      }}
    >
      <Typography 
        variant="button" 
        sx={{ 
          fontWeight: 'bold',
          fontSize: '1rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {currentLocale === 'en' ? (
          <>
            <FlagIcon color="primary" />
            <span>EN</span>
          </>
        ) : (
          <>
            <EmojiFlags color="secondary" />
            <span>FR</span>
          </>
        )}
      </Typography>
    </Box>
  );
};

export default LanguageSwitcher; 