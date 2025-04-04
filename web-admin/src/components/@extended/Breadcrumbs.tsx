import { ReactElement, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// material-ui
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import { Box, Card, Divider, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// icons
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// types
interface ItemType {
  icon?: ReactElement;
  href?: string;
  title: string;
  type?: string;
}

// ==============================|| BREADCRUMBS ||============================== //

export default function Breadcrumbs({ 
  title = false,
  titleBottom = false
}: {
  title?: boolean;
  titleBottom?: boolean;
}) {
  const theme = useTheme();
  const location = useLocation();
  const [main, setMain] = useState<ItemType | null>(null);
  const [item, setItem] = useState<ItemType[]>([]);

  // set active item state
  const getCollapse = (path: string) => {
    if (path.includes('dashboard')) {
      return 'Dashboard';
    }
    if (path.includes('customers')) {
      return 'Customers';
    }
    if (path.includes('vehicles')) {
      return 'Vehicles';
    }
    if (path.includes('services')) {
      return 'Services';
    }
    if (path.includes('invoices')) {
      return 'Invoices';
    }
    return 'Dashboard';
  };

  useEffect(() => {
    const path = location.pathname;

    const getItem = (path: string) => {
      const parts = path.split('/').filter(part => part);
      const items: ItemType[] = [];

      // Add Home as the first item
      items.push({
        icon: <HomeIcon fontSize="small" />,
        href: '/',
        title: 'Home'
      });

      // Add the rest of the path as breadcrumb items
      let currentPath = '';
      parts.forEach(part => {
        currentPath += `/${part}`;
        // Convert path segments to readable titles (e.g., 'dashboard' -> 'Dashboard')
        const title = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
        items.push({
          href: currentPath,
          title
        });
      });

      setMain(items[items.length - 1]);
      setItem(items);
    };

    getItem(path);
  }, [location]);

  let mainContent;
  let breadcrumbContent = <Typography />;

  if (main && main.title) {
    mainContent = (
      <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
        {main.title}
      </Typography>
    );

    breadcrumbContent = (
      <Card
        sx={{
          mb: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
          border: '1px solid',
          borderColor: theme.palette.divider,
          borderRadius: 1
        }}
      >
        <Box sx={{ p: 2, pl: 2 }}>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Grid item>
              <MuiBreadcrumbs
                aria-label="breadcrumb"
                separator={<NavigateNextIcon fontSize="small" />}
                sx={{ '& .MuiBreadcrumbs-separator': { width: 16, ml: 0.5, mr: 0.5 } }}
              >
                {item.map((data: ItemType, index: number) => (
                  <Typography
                    key={index}
                    component={Link}
                    to={data.href ?? '#'}
                    variant="subtitle1"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: index === item.length - 1 ? 'text.primary' : 'text.secondary',
                      fontWeight: index === item.length - 1 ? 600 : 400,
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    {data.icon && <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>{data.icon}</Box>}
                    {data.title}
                  </Typography>
                ))}
              </MuiBreadcrumbs>
            </Grid>
            {title && <Grid item>{mainContent}</Grid>}
          </Grid>
        </Box>
        {titleBottom && (
          <>
            <Divider />
            <Box sx={{ p: 2, pl: 2 }}>{mainContent}</Box>
          </>
        )}
      </Card>
    );
  }

  return breadcrumbContent;
} 