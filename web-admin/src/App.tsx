import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, ReactElement } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Vehicles } from './pages/Vehicles';
import { VehicleServices } from './pages/VehicleServices';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { authService } from './lib/api';
import { Toaster } from 'sonner';
import './App.css';

// Protected route wrapper
function RequireAuth({ children }: { children: ReactElement }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check for authentication status
    const authStatus = authService.checkAuth();
    setIsAuthenticated(authStatus);
  }, []);

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        
        {/* Customers routes */}
        <Route
          path="/customers"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Customers />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        
        {/* Vehicles routes */}
        <Route
          path="/vehicles"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Vehicles />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        
        <Route
          path="/vehicles/new"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Vehicles />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        
        <Route
          path="/vehicles/:id/edit"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Vehicles />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        
        <Route
          path="/vehicles/:id/services"
          element={
            <RequireAuth>
              <DashboardLayout>
                <VehicleServices />
              </DashboardLayout>
            </RequireAuth>
          }
        />
        
        {/* Placeholder routes for other pages */}
        {['services', 'appointments', 'invoices', 'settings'].map((path) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <RequireAuth>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-3xl font-bold capitalize">{path}</h1>
                    <p className="text-muted-foreground mt-2">
                      This {path} page is under construction. Check back soon!
                    </p>
                  </div>
                </DashboardLayout>
              </RequireAuth>
            }
          />
        ))}
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
