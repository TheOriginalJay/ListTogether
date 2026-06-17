import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Check, Trash2, UserPlus, MessageSquare, Info, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  getNotifications, markRead, markAllRead, deleteNotification, clearAllNotifications,
  subscribeNotifications, type AppNotification,
} from '@/lib/notifications';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

const ICONS: Record<string, typeof Bell> = {
  join: UserPlus,
  message: MessageSquare,
  info: Info,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems(await getNotifications()); }
    catch { showToast('Could not load notifications', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    const ch = subscribeNotifications(user.id, load);
    return () => { ch.unsubscribe(); };
  }, [user?.id, load]);

  const open = async (n: AppNotification) => {
    if (!n.is_read) {
      setItems(prev => prev.map(x => (x.id === n.id ? { ...x, is_read: true } : x)));
      try { await markRead(n.id); } catch { /* ignore */ }
    }
    if (n.link) navigate(n.link);
  };

  const remove = async (id: string) => {
    const prev = items;
    setItems(p => p.filter(x => x.id !== id));
    try { await deleteNotification(id); } catch { setItems(prev); showToast('Could not delete', 'error'); }
  };

  const handleMarkAll = async () => {
    setItems(prev => prev.map(x => ({ ...x, is_read: true })));
    try { await markAllRead(); } catch { showToast('Could not update', 'error'); }
  };

  const handleClearAll = async () => {
    const prev = items;
    setItems([]);
    try { await clearAllNotifications(); showToast('Notifications cleared', 'info'); }
    catch { setItems(prev); showToast('Could not clear', 'error'); }
  };

  const hasUnread = items.some(i => !i.is_read);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E0]/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">Notifications</h1>
          <div className="flex-1" />
          {hasUnread && (
            <button onClick={handleMarkAll} className="flex items-center gap-1.5 text-xs font-medium text-[#6B6B5F] hover:text-[#1A1A1A] transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button onClick={handleClearAll} className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors">
              Clear all
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-[#E5E5E0] border-t-[#D97706] rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F5F0] flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-[#C4C4BC]" />
            </div>
            <p className="font-semibold text-[#1A1A1A] mb-1">You’re all caught up</p>
            <p className="text-sm text-[#9CA3AF]">Activity on your lists shows up here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(n => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <div key={n.id} className={`group flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all ${n.is_read ? 'bg-white border-[#E5E5E0]/60' : 'bg-[#FFFBEB] border-[#FCD34D]/40'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.is_read ? 'bg-[#F5F5F0] text-[#9CA3AF]' : 'bg-[#D97706]/10 text-[#D97706]'}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <button onClick={() => open(n)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />}
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{n.title}</p>
                    </div>
                    {n.body && <p className="text-xs text-[#6B6B5F] mt-0.5 leading-relaxed">{n.body}</p>}
                    <p className="text-[10px] text-[#9CA3AF] mt-1">{relativeTime(n.created_at)}</p>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.is_read && (
                      <button onClick={() => open(n)} title="Mark read" className="p-1.5 rounded-lg text-[#C4C4BC] hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-colors opacity-0 group-hover:opacity-100">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => remove(n.id)} title="Delete" className="p-1.5 rounded-lg text-[#C4C4BC] hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
