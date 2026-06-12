import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { ShoppingCart, Settings, Home, Plus } from 'lucide-react';

export function AppShell() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/settings' && location.pathname === '/settings') return true;
    if (path === '/dashboard' && location.pathname.startsWith('/list')) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar — slim */}
      <aside className="hidden sm:flex flex-col items-center w-14 fixed left-0 top-0 bottom-0 bg-white border-r border-black/5 z-50 py-4 gap-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-9 h-9 rounded-xl bg-charcoal flex items-center justify-center mb-4"
        >
          <ShoppingCart className="w-4 h-4 text-white" />
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isActive('/dashboard') ? 'bg-amber/10 text-amber' : 'text-warm-400 hover:text-charcoal hover:bg-warm-50'
          }`}
          title="My lists"
        >
          <Home className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isActive('/settings') ? 'bg-amber/10 text-amber' : 'text-warm-400 hover:text-charcoal hover:bg-warm-50'
          }`}
          title="Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 sm:ml-14 pb-16 sm:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-black/5 flex items-center justify-around z-50 px-4">
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
            isActive('/dashboard') ? 'text-amber' : 'text-warm-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Lists</span>
        </button>
        <button
          onClick={() => {
            if (location.pathname.startsWith('/list/')) {
              window.dispatchEvent(new CustomEvent('showCreateItem'));
            } else {
              navigate('/dashboard');
              setTimeout(() => window.dispatchEvent(new CustomEvent('showCreateList')), 100);
            }
          }}
          className="w-12 h-12 rounded-2xl bg-amber text-white flex items-center justify-center -mt-4 shadow-[0_4px_16px_rgba(217,119,6,0.35)]"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
            isActive('/settings') ? 'text-amber' : 'text-warm-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Settings</span>
        </button>
      </nav>
    </div>
  );
}
