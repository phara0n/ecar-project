import { ReactNode, useMemo } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Import our theme customizations
import createPalette from './palette';
import typography from './typography';

// Import fonts
import '@fontsource-variable/dm-sans';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';

// Import theme context
import { useThemeContext } from './ThemeContext';

// Theme components
const MINIMAL_SHADOW = {
  card: `0 0 2px 0 rgba(145, 158, 171, 0.08), 0 20px 40px -4px rgba(145, 158, 171, 0.16)`,
  dialog: `0px 8px 16px rgba(0, 0, 0, 0.24)`,
  dropdown: `0px 4px 16px rgba(0, 0, 0, 0.16)`,
};

// Define component props
interface MinimalThemeProviderProps {
  children: ReactNode;
}

// Define customized shape properties
const shape = {
  borderRadius: 8,
  borderRadiusLg: 12,
  borderRadiusSm: 4,
  borderRadiusXs: 2,
};

export default function MinimalThemeProvider({ children }: MinimalThemeProviderProps) {
  // Use theme mode from context
  const { themeMode } = useThemeContext();

  // Create theme object using our configurations
  const theme = useMemo(() => {
    const palette = createPalette(themeMode);

    // Create theme with our custom configurations
    return createTheme({
      palette,
      typography,
      shape,
      shadows: [
        'none',
        '0px 2px 4px rgba(145, 158, 171, 0.16)',
        '0px 4px 8px rgba(145, 158, 171, 0.16)',
        '0px 8px 16px rgba(145, 158, 171, 0.16)',
        '0px 12px 24px -4px rgba(145, 158, 171, 0.16)',
        '0px 16px 32px -4px rgba(145, 158, 171, 0.16)',
        '0px 20px 40px -4px rgba(145, 158, 171, 0.16)',
        '0px 24px 48px rgba(145, 158, 171, 0.16)',
        ...Array(16).fill('none'), // remaining shadows
      ] as unknown as string[],
      customShadows: {
        ...MINIMAL_SHADOW,
        primary: `0 8px 16px 0 ${palette.primary.main}26`,
        info: `0 8px 16px 0 ${palette.info.main}26`,
        success: `0 8px 16px 0 ${palette.success.main}26`,
        warning: `0 8px 16px 0 ${palette.warning.main}26`,
        error: `0 8px 16px 0 ${palette.error.main}26`,
        z1: '0px 1px 2px rgba(145, 158, 171, 0.12)',
        z8: '0px 8px 16px rgba(145, 158, 171, 0.12)',
        z12: '0px 12px 24px -4px rgba(145, 158, 171, 0.12)',
        z16: '0px 16px 32px -4px rgba(145, 158, 171, 0.12)',
        z20: '0px 20px 40px -4px rgba(145, 158, 171, 0.12)',
        z24: '0px 24px 48px rgba(145, 158, 171, 0.12)',
      },
      // Common component overrides
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            '*': {
              boxSizing: 'border-box',
            },
            html: {
              margin: 0,
              padding: 0,
              width: '100%',
              height: '100%',
              WebkitOverflowScrolling: 'touch',
            },
            body: {
              margin: 0,
              padding: 0,
              width: '100%',
              height: '100%',
            },
            '#root': {
              width: '100%',
              height: '100%',
            },
            input: {
              '&[type=number]': {
                MozAppearance: 'textfield',
                '&::-webkit-outer-spin-button': {
                  margin: 0,
                  WebkitAppearance: 'none',
                },
                '&::-webkit-inner-spin-button': {
                  margin: 0,
                  WebkitAppearance: 'none',
                },
              },
            },
            img: {
              display: 'block',
              maxWidth: '100%',
            },
            a: {
              textDecoration: 'none',
              color: palette.primary.main,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'capitalize',
              borderRadius: shape.borderRadius,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            },
            sizeLarge: {
              height: 48,
            },
            sizeMedium: {
              height: 40,
            },
            sizeSmall: {
              height: 32,
            },
            contained: {
              '&:hover': {
                boxShadow: 'none',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: MINIMAL_SHADOW.card,
              borderRadius: shape.borderRadius * 2,
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: shape.borderRadius,
              padding: '8px 12px',
            },
          },
        },
      },
    });
  }, [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

// Add TypeScript augmentation for custom theme properties
declare module '@mui/material/styles' {
  interface Theme {
    customShadows: {
      card: string;
      dialog: string;
      dropdown: string;
      primary: string;
      info: string;
      success: string;
      warning: string;
      error: string;
      z1: string;
      z8: string;
      z12: string;
      z16: string;
      z20: string;
      z24: string;
    };
  }
  
  interface ThemeOptions {
    customShadows?: {
      card?: string;
      dialog?: string;
      dropdown?: string;
      primary?: string;
      info?: string;
      success?: string;
      warning?: string;
      error?: string;
      z1?: string;
      z8?: string;
      z12?: string;
      z16?: string;
      z20?: string;
      z24?: string;
    };
  }
} 