import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AppShell } from '@/components/AppShell';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import ListDetailPage from '@/pages/ListDetailPage';
import SettingsPage from '@/pages/SettingsPage';
import PublicViewPage from '@/pages/PublicViewPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/l/:token" element={<PublicViewPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      
      {/* Protected routes within app shell */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/list/:listId" element={<ListDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
