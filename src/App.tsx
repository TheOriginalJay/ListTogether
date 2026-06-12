import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SmoothScroll } from '@/components/SmoothScroll';
import { AppShell } from '@/components/AppShell';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import ListDetailPage from '@/pages/ListDetailPage';
import SettingsPage from '@/pages/SettingsPage';
import PublicViewPage from '@/pages/PublicViewPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';

const isMissingKeys = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

function AppRoutes() {
  if (isMissingKeys) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-modal border border-red-100">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-charcoal mb-2">Configuration Missing</h1>
          <p className="text-sm text-warm-600 mb-6">
            Supabase environment variables are missing. If you are on Vercel, make sure you've added VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your project settings.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

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
        <SmoothScroll>
          <AppRoutes />
        </SmoothScroll>
      </ToastProvider>
    </AuthProvider>
  );
}
