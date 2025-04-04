import { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent,
  CircularProgress, 
  Container, 
  Grid, 
  IconButton, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TablePagination, 
  TableRow, 
  TextField, 
  Typography 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Search as SearchIcon,
  DirectionsCar as CarIcon 
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useGetVehiclesQuery, useDeleteVehicleMutation } from '../../store/api/vehicleApi';

const VehiclesPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // Query for vehicles data
  const { data, isLoading, isFetching } = useGetVehiclesQuery({ 
    page: page + 1,  // API uses 1-based indexing
    search: searchTerm
  });

  // Delete vehicle mutation
  const [deleteVehicle, { isLoading: isDeleting }] = useDeleteVehicleMutation();

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = () => {
    setSearchTerm(searchValue);
    setPage(0);
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id).unwrap();
      } catch (error) {
        console.error('Failed to delete vehicle:', error);
      }
    }
  };

  return (
    <Container maxWidth={false}>
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Vehicles</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/admin/vehicles/create"
          >
            Add Vehicle
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search vehicles..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={handleSearch}>
                        <SearchIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Current Mileage</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : data?.results && data.results.length > 0 ? (
                  data.results.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.id}</TableCell>
                      <TableCell>{vehicle.customer}</TableCell>
                      <TableCell>{vehicle.brand}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>{vehicle.license_plate}</TableCell>
                      <TableCell>{vehicle.mileage}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          color="primary"
                          component={RouterLink}
                          to={`/admin/vehicles/${vehicle.id}`}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          disabled={isDeleting}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No vehicles found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data?.count || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default VehiclesPage; 