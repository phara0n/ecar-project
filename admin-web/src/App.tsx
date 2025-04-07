import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import VehiclesPage from '@/pages/VehiclesPage';
import { CustomersPage } from '@/pages/CustomersPage';
import MainLayout from '@/components/layout/MainLayout';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { Toaster } from "@/components/ui/sonner";

// Wrapper for protected routes
const ProtectedRoutes = () => {
  const isAuthenticated = useSelector((state: RootState) => selectIsAuthenticated(state));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Outlet /> {/* Child routes (like HomePage) will render here */}
    </MainLayout>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes wrapped by MainLayout */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          {/* Add other protected routes here */}
          {/* Example: <Route path="/customers" element={<CustomersPage />} /> */}
        </Route>

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors />
    </Router>
  );
}

export default App;
