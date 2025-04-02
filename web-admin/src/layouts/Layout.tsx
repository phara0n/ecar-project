import { Layout as RaLayout, Menu, Sidebar } from 'react-admin';
import { createTheme, Theme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AppBar } from './AppBar';

// Define custom dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3498db',
    },
    secondary: {
      main: '#2c3e50',
    },
    background: {
      default: '#1a1a2e',
      paper: '#16213e',
    },
    text: {
      primary: '#e2e2e2',
      secondary: '#b3b3b3',
    },
    error: {
      main: '#e74c3c',
    },
    warning: {
      main: '#f39c12',
    },
    info: {
      main: '#3498db',
    },
    success: {
      main: '#2ecc71',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#16213e',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#16213e',
          borderRight: '1px solid #30475e',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.RaMenuItemLink-active': {
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
          },
          '&:hover': {
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#3498db',
          '&:hover': {
            backgroundColor: '#2980b9',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#30475e',
        },
        head: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
  },
});

const CustomSidebar = (props: any) => (
  <Sidebar
    {...props}
    className="bg-[#16213e] border-r border-[#30475e]"
  />
);

const CustomMenu = (props: any) => (
  <Menu
    {...props}
    className="bg-[#16213e] text-white"
  />
);

export const Layout = (props: any) => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <RaLayout
      {...props}
      appBar={AppBar}
      sidebar={CustomSidebar}
      menu={CustomMenu}
      className="bg-[#1a1a2e]"
    />
  </ThemeProvider>
); 