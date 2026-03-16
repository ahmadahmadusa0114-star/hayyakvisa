import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LangProvider } from './contexts/LangContext';

// Page imports
import AdminLogin from './pages/auth/AdminLogin';
import CompanyLogin from './pages/auth/CompanyLogin';
import AdminLayout from './layouts/AdminLayout';
import CompanyLayout from './layouts/CompanyLayout';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCompanies from './pages/admin/Companies';
import AdminApplications from './pages/admin/Applications';
import AdminManifests from './pages/admin/Manifests';
import AdminWallet from './pages/admin/Wallet';

// Company pages
import CompanyDashboard from './pages/company/Dashboard';
import CompanyApplications from './pages/company/Applications';
import SubmitApplication from './pages/company/SubmitApplication';
import CompanyWallet from './pages/company/Wallet';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to={requiredRole === 'ADMIN' ? '/admin/login' : '/company/login'} replace />;
  if (user.role !== requiredRole) return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/company/dashboard'} replace />;
  return children;
};

function ToasterWrapper() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#1e293b',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          fontSize: '14px',
          fontFamily: 'Cairo, Inter, system-ui, sans-serif',
          fontWeight: '600',
          borderRadius: '12px',
          boxShadow: isDark
            ? '0 10px 40px rgba(0,0,0,0.4)'
            : '0 10px 40px rgba(0,0,0,0.1)',
        },
        success: { iconTheme: { primary: '#10b981', secondary: isDark ? '#f1f5f9' : '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: isDark ? '#f1f5f9' : '#fff' } },
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <BrowserRouter>
            <ToasterWrapper />
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/admin/login" replace />} />

              {/* Auth pages */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/company/login" element={<CompanyLogin />} />

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>
              }>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="companies" element={<AdminCompanies />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="manifests" element={<AdminManifests />} />
                <Route path="wallet" element={<AdminWallet />} />
              </Route>

              {/* Company routes */}
              <Route path="/company" element={
                <ProtectedRoute requiredRole="COMPANY"><CompanyLayout /></ProtectedRoute>
              }>
                <Route index element={<Navigate to="/company/dashboard" replace />} />
                <Route path="dashboard" element={<CompanyDashboard />} />
                <Route path="applications" element={<CompanyApplications />} />
                <Route path="submit" element={<SubmitApplication />} />
                <Route path="wallet" element={<CompanyWallet />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
