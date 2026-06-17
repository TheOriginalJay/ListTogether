import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { ShoppingBag, Settings, Home, Plus } from 'lucide-react';
import { InstallPrompt } from '@/components/InstallPrompt';

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
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-[#E5E5E0] border-t-[#D97706] rounded-full animate-spin" />
          <p className="text-sm text-[#9CA3AF] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isActive = (path: string) => {
    if (path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname.startsWith('/list'))) return true;
    if (path === '/settings' && location.pathname === '/settings') return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <InstallPrompt variant="banner" />
      <div className="flex flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col items-center w-[72px] fixed left-0 top-0 bottom-0 bg-white border-r border-[#E5E5E0]/60 z-50 py-5 gap-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center mb-6 hover:bg-[#333] transition-colors"
        >
          <ShoppingBag className="w-4 h-4 text-white" />
        </button>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isActive('/dashboard') 
                ? 'bg-[#D97706]/10 text-[#D97706]' 
                : 'text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F5F5F0]'
            }`}
            title="My lists"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isActive('/settings') 
                ? 'bg-[#D97706]/10 text-[#D97706]' 
                : 'text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F5F5F0]'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            onClick={() => {
              if (location.pathname.startsWith('/list/')) {
                window.dispatchEvent(new CustomEvent('showCreateItem'));
              } else {
                window.dispatchEvent(new CustomEvent('showCreateList'));
              }
            }}
            className="w-11 h-11 rounded-xl bg-[#D97706] flex items-center justify-center hover:bg-[#B45309] active:scale-95 transition-all shadow-lg shadow-[#D97706]/20"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 sm:ml-[72px] pb-20 sm:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E5E0]/60 flex items-center justify-around z-50 px-4">
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            isActive('/dashboard') ? 'text-[#D97706]' : 'text-[#9CA3AF]'
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
          className="w-12 h-12 rounded-2xl bg-[#D97706] flex items-center justify-center -mt-4 shadow-lg shadow-[#D97706]/25 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            isActive('/settings') ? 'text-[#D97706]' : 'text-[#9CA3AF]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Settings</span>
        </button>
      </nav>
      </div>
    </div>
  );
}
