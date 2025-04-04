import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import MinimalLayout from './layouts/MinimalLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import CustomersPage from './pages/admin/Customers';
import CreateCustomer from './pages/admin/CreateCustomer';
import VehiclesPage from './pages/admin/Vehicles';
import CreateVehicle from './pages/admin/CreateVehicle';
import ApiTest from './pages/test/ApiTest';
import { ThemeContextProvider } from './theme/ThemeContext';
import MinimalThemeProvider from './theme/MinimalThemeProvider';

// Create a route that checks for authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <ThemeContextProvider>
      <MinimalThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with MinimalLayout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MinimalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Admin routes */}
            <Route path="admin">
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/create" element={<CreateCustomer />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="vehicles/create" element={<CreateVehicle />} />
              {/* Add more admin routes here */}
            </Route>
            
            {/* Other routes */}
            <Route path="api-test" element={<ApiTest />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MinimalThemeProvider>
    </ThemeContextProvider>
  );
};

export default App;
