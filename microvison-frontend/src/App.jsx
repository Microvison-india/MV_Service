import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Presets from './pages/admin/Presets';
import ActionCentre from './pages/admin/ActionCentre';
import ServiceCentres from './pages/admin/ServiceCentres';
import SCDetail from './pages/admin/SCDetail';
import NewComplaint from './pages/admin/NewComplaint';
import AllComplaints from './pages/admin/AllComplaints';
import Billing from './pages/admin/Billing';

// SC Pages
import SCLayout from './pages/sc/SCLayout';
import NewRequests from './pages/sc/NewRequests';
import MyComplaints from './pages/sc/MyComplaints';
import SCBilling from './pages/sc/SCBilling';

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

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Index: Action Centre (GRD 11.1) */}
        <Route index element={<ActionCentre />} />

        {/* Tab 3 — All Complaints (GRD 11.3 / Phase 10) */}
        <Route path="complaints" element={<AllComplaints />} />

        {/* Presets management (GRD 4.2) */}
        <Route path="presets" element={<Presets />} />

        {/* Tab 2 — Service Centres (GRD 11.2) */}
        <Route path="service-centres" element={<ServiceCentres />} />
        <Route path="service-centres/:id" element={<SCDetail />} />

        {/* Tab 4 — Billing (Phase 11) */}
        <Route path="billing" element={<Billing />} />

        {/* New Complaint Wizard (GRD Section 6) */}
        <Route path="new-complaint" element={<NewComplaint />} />
      </Route>

      {/* SC routes — GRD Section 10 */}
      <Route
        path="/sc"
        element={
          <ProtectedRoute allowedRole="service_centre">
            <SCLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect to new requests */}
        <Route index element={<Navigate to="/sc/new-requests" replace />} />
        {/* Tab 1 — New Requests (GRD 10.1) */}
        <Route path="new-requests" element={<NewRequests />} />
        {/* Tab 2 — My Complaints (GRD 10.2) */}
        <Route path="my-complaints" element={<MyComplaints />} />
        {/* Tab 3 — Billing (GRD 10.3, built Phase 11) */}
        <Route path="billing" element={<SCBilling />} />
      </Route>

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
