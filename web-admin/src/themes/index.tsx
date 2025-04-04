import React from 'react';

// material-ui
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// project imports
import Typography from './typography';
import componentsOverride from './overrides';

// ==============================|| DEFAULT THEME - MAIN ||============================== //

interface ThemeCustomizationProps {
  children: React.ReactNode;
}

export default function ThemeCustomization({ children }: ThemeCustomizationProps) {
  // Define colors directly to avoid dependencies
  const blue = {
    0: '#e6f7ff',
    1: '#bae7ff',
    2: '#91d5ff',
    3: '#69c0ff',
    4: '#40a9ff',
    5: '#1890ff',
    6: '#096dd9',
    7: '#0050b3',
    8: '#003a8c',
    9: '#002766'
  };

  const grey = {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#262626',
    800: '#141414',
    900: '#000000',
    A50: '#fafafb',
    A100: '#bfbfbf',
    A200: '#434343',
    A400: '#1f1f1f',
    A700: '#333333',
    A800: '#121212'
  };

  const theme = createTheme({
    palette: {
      primary: {
        lighter: blue[0],
        light: blue[3],
        main: blue[5],
        dark: blue[7],
        darker: blue[9],
        contrastText: '#fff'
      },
      secondary: {
        lighter: grey[100],
        light: grey[300],
        main: grey[500],
        dark: grey[700],
        contrastText: '#fff'
      },
      background: {
        default: grey.A50,
        paper: grey[0]
      },
      text: {
        primary: grey[700],
        secondary: grey[500],
        disabled: grey[400]
      },
      grey
    },
    typography: Typography(`'Public Sans', sans-serif`),
    breakpoints: {
      values: {
        xs: 0,
        sm: 768,
        md: 1024,
        lg: 1266,
        xl: 1440
      }
    },
    direction: 'ltr',
    mixins: {
      toolbar: {
        minHeight: 60,
        paddingTop: 8,
        paddingBottom: 8
      }
    },
    customShadows: {
      button: '0 2px #0000000b',
      text: '0 -1px 0 rgb(0 0 0 / 12%)',
      z1: `0px 1px 4px ${alpha(grey[900], 0.08)}`,
      primary: `0 0 0 2px ${alpha(blue[5], 0.2)}`,
      primaryButton: `0 14px 12px ${alpha(blue[5], 0.2)}`,
    }
  } as any);

  // Add component overrides
  theme.components = componentsOverride(theme);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
} 