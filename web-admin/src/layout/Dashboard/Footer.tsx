import { Box, Link, Typography, Stack } from '@mui/material';

const Footer = () => {
  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} ECAR Garage Management System
      </Typography>
      <Stack
        direction="row"
        justifyContent="center"
        spacing={1.5}
        sx={{ mt: 1 }}
      >
        <Typography
          component={Link}
          href="/"
          target="_blank"
          variant="subtitle2"
          color="secondary"
          sx={{ textDecoration: 'none' }}
        >
          Home
        </Typography>
        <Typography color="text.secondary">|</Typography>
        <Typography
          component={Link}
          href="/privacy-policy"
          target="_blank"
          variant="subtitle2"
          color="secondary"
          sx={{ textDecoration: 'none' }}
        >
          Privacy Policy
        </Typography>
        <Typography color="text.secondary">|</Typography>
        <Typography
          component={Link}
          href="/terms-of-service"
          target="_blank"
          variant="subtitle2"
          color="secondary"
          sx={{ textDecoration: 'none' }}
        >
          Terms of Service
        </Typography>
      </Stack>
    </Box>
  );
};

export default Footer; 