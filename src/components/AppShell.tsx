import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { ClipboardList, Settings, Home, Plus } from 'lucide-react';

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
        <div className="w-8 h-8 border-3 border-amber border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-cream flex">
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex flex-col items-center w-16 fixed left-0 top-0 bottom-0 bg-white border-r border-warm-200 z-50 py-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-xl bg-amber flex items-center justify-center mb-8"
        >
          <ClipboardList className="w-5 h-5 text-white" />
        </button>

        <nav className="flex flex-col items-center gap-2 flex-1">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isActive('/dashboard') ? 'bg-warm-100 text-amber' : 'text-warm-400 hover:text-charcoal hover:bg-warm-100'
            }`}
            title="My Lists"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isActive('/settings') ? 'bg-warm-100 text-amber' : 'text-warm-400 hover:text-charcoal hover:bg-warm-100'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 sm:ml-16 pb-16 sm:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-warm-200 flex items-center justify-around z-50 shadow-[0_-2px_8px_rgba(45,42,38,0.06)]">
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center gap-0.5 ${isActive('/dashboard') ? 'text-amber' : 'text-warm-400'}`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-medium">Lists</span>
        </button>
        <button
          onClick={() => {
            if (location.pathname.startsWith('/list/')) {
              const event = new CustomEvent('showCreateItem');
              window.dispatchEvent(event);
            } else {
              navigate('/dashboard');
              setTimeout(() => {
                const event = new CustomEvent('showCreateList');
                window.dispatchEvent(event);
              }, 100);
            }
          }}
          className="w-14 h-14 rounded-full bg-amber text-white flex items-center justify-center -mt-6 shadow-fab"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center gap-0.5 ${isActive('/settings') ? 'text-amber' : 'text-warm-400'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>
    </div>
  );
}
