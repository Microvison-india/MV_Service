import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ResetPassword from './pages/auth/ResetPassword';

// ProtectedRoute: blocks access if no token
function ProtectedRoute({ children, allowedRole }) {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to correct dashboard based on actual role
    return <Navigate to={user.role === 'admin' ? '/admin' : '/sc'} replace />;
  }

  return children;
}

// RoleRedirect: after login, send to correct dashboard
function RoleRedirect() {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/sc'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin routes — placeholder, built in later phases */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRole="admin">
            <div>Admin Dashboard — Phase 5+</div>
          </ProtectedRoute>
        }
      />

      {/* SC routes — placeholder, built in later phases */}
      <Route
        path="/sc/*"
        element={
          <ProtectedRoute allowedRole="service_centre">
            <div>SC Dashboard — Phase 8+</div>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
