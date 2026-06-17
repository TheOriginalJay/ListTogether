import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { ShoppingBag, Settings, Home, Plus, StickyNote, AlarmClock, Bell } from 'lucide-react';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import { getUnreadCount, subscribeNotifications } from '@/lib/notifications';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Lists', icon: Home },
  { path: '/notes', label: 'Notes', icon: StickyNote },
  { path: '/reminders', label: 'Reminders', icon: AlarmClock },
  { path: '/notifications', label: 'Alerts', icon: Bell, badge: true },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useReminderNotifications();

  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const refresh = () => { getUnreadCount().then(c => { if (active) setUnread(c); }).catch(() => {}); };
    refresh();
    const ch = subscribeNotifications(user.id, refresh);
    return () => { active = false; ch.unsubscribe(); };
  }, [user?.id, location.pathname]);

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
    const p = location.pathname;
    if (path === '/dashboard') return p === '/dashboard' || p.startsWith('/list');
    if (path === '/notes') return p === '/notes' || p.startsWith('/note');
    if (path === '/reminders') return p === '/reminders';
    if (path === '/settings') return p === '/settings';
    return false;
  };

  // The global "+" creates the right thing for the current section.
  const handleCreate = () => {
    const p = location.pathname;
    if (p.startsWith('/list/')) {
      window.dispatchEvent(new CustomEvent('showCreateItem'));
    } else if (p === '/notes' || p.startsWith('/note')) {
      window.dispatchEvent(new CustomEvent('showCreateNote'));
    } else if (p === '/reminders') {
      window.dispatchEvent(new CustomEvent('showCreateReminder'));
    } else {
      // default: a new list (navigate to dashboard first if needed)
      if (p !== '/dashboard') {
        navigate('/dashboard');
        setTimeout(() => window.dispatchEvent(new CustomEvent('showCreateList')), 120);
      } else {
        window.dispatchEvent(new CustomEvent('showCreateList'));
      }
    }
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
          title="Bagged"
        >
          <ShoppingBag className="w-4 h-4 text-white" />
        </button>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon, badge }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive(path)
                  ? 'bg-[#D97706]/10 text-[#D97706]'
                  : 'text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F5F5F0]'
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
              {badge && unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D97706] text-white text-[9px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            onClick={handleCreate}
            className="w-11 h-11 rounded-xl bg-[#D97706] flex items-center justify-center hover:bg-[#B45309] active:scale-95 transition-all shadow-lg shadow-[#D97706]/20"
            title="Create"
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
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E5E0]/60 flex items-center justify-around z-50 px-1">
        {NAV_ITEMS.slice(0, 2).map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
              isActive(path) ? 'text-[#D97706]' : 'text-[#9CA3AF]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}

        <button
          onClick={handleCreate}
          className="w-12 h-12 rounded-2xl bg-[#D97706] flex items-center justify-center -mt-4 shadow-lg shadow-[#D97706]/25 active:scale-95 transition-all shrink-0"
          aria-label="Create"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>

        {NAV_ITEMS.slice(2).map(({ path, label, icon: Icon, badge }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`relative flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
              isActive(path) ? 'text-[#D97706]' : 'text-[#9CA3AF]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
            {badge && unread > 0 && (
              <span className="absolute top-0.5 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#D97706] text-white text-[9px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        ))}
      </nav>
      </div>
    </div>
  );
}
