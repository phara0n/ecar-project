import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import CustomersPage from './pages/admin/Customers';
import ApiTest from './pages/test/ApiTest';
import ThemeCustomization from './themes';

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
    <ThemeCustomization>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes with MainLayout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Admin routes */}
          <Route path="admin">
            <Route path="customers" element={<CustomersPage />} />
            {/* Add more admin routes here */}
          </Route>
          
          {/* Other routes */}
          <Route path="api-test" element={<ApiTest />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeCustomization>
  );
};

export default App;
