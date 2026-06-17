import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Trash2, User, Sparkles, LayoutGrid, LayoutList, Columns3, Bell, AlertTriangle, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { LayoutMode } from '@/types';
import { InstallPrompt } from '@/components/InstallPrompt';

// Whop checkout/support link — same platform used for payments.
// Set VITE_WHOP_SUPPORT_URL in the environment to your real Whop link.
const SUPPORT_URL = import.meta.env.VITE_WHOP_SUPPORT_URL || 'https://whop.com';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const { showToast } = useToast();
  const [defaultLayout, setDefaultLayout] = useState<LayoutMode>('standard');
  const [moveChecked, setMoveChecked] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const notifSupported = typeof Notification !== 'undefined';
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    notifSupported ? Notification.permission : 'denied'
  );

  const toggleNotifications = async () => {
    if (!notifSupported) { showToast('Notifications aren’t supported on this browser', 'error'); return; }
    if (notifPerm === 'granted') {
      showToast('Turn notifications off in your browser settings', 'info');
      return;
    }
    if (notifPerm === 'denied') {
      showToast('Notifications are blocked — enable them in your browser settings', 'error');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    showToast(perm === 'granted' ? 'Reminder notifications on' : 'Notifications not enabled', perm === 'granted' ? 'success' : 'info');
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await logOut();
    showToast('Signed out', 'info');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Type DELETE to confirm', 'error');
      return;
    }
    showToast('Account deleted', 'info');
    navigate('/');
  };

  const layoutOptions = [
    { mode: 'compact' as LayoutMode, icon: LayoutGrid, label: 'Compact', desc: 'Dense, minimal' },
    { mode: 'standard' as LayoutMode, icon: LayoutList, label: 'Standard', desc: 'Balanced view' },
    { mode: 'visual' as LayoutMode, icon: Columns3, label: 'Visual', desc: 'Cards with icons' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E0]/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">Settings</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Profile */}
        <section className="bg-white rounded-2xl border border-[#E5E5E0]/60 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-xl font-semibold text-[#1A1A1A]">
              {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A1A] truncate">{user?.full_name || 'User'}</p>
              <p className="text-sm text-[#9CA3AF] truncate">{user?.email}</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-[#F5F5F0] transition-colors text-[#9CA3AF]">
              <User className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Install (only shows when installable and not already installed) */}
        <InstallPrompt variant="card" />

        {/* Plan */}
        <section className="bg-white rounded-2xl border border-[#E5E5E0]/60 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#D97706]/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-[#D97706]" />
            </div>
            <h2 className="font-semibold text-[#1A1A1A]">Plan</h2>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
              Free
            </span>
            <p className="text-sm text-[#6B6B5F]">All features unlocked</p>
          </div>

          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Every feature is free to use, no card required. If you find this useful,
            you can support the developer below.
          </p>
        </section>

        {/* Support the developer */}
        <section className="bg-white rounded-2xl border border-[#E5E5E0]/60 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-rose-500" />
            </div>
            <h2 className="font-semibold text-[#1A1A1A]">Support the developer</h2>
          </div>
          <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4">
            Bagged is free and built by one person. If it saves you time, a small
            contribution helps keep it running and improving.
          </p>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-[0.98] transition-all"
          >
            <Heart className="w-4 h-4" />
            Support Bagged
          </a>
        </section>

        {/* Preferences */}
        <section className="bg-white rounded-2xl border border-[#E5E5E0]/60 p-5 sm:p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Preferences</h2>

          <div className="space-y-5">
            {/* Layout */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-3">Default Layout</label>
              <div className="grid grid-cols-3 gap-2">
                {layoutOptions.map(({ mode, icon: Icon, label, desc }) => (
                  <button
                    key={mode}
                    onClick={() => setDefaultLayout(mode)}
                    className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                      defaultLayout === mode
                        ? 'border-[#D97706] bg-[#D97706]/[0.03]'
                        : 'border-[#E5E5E0] hover:border-[#1A1A1A]/20'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${defaultLayout === mode ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`} />
                    <span className={`text-xs font-medium ${defaultLayout === mode ? 'text-[#1A1A1A]' : 'text-[#6B6B5F]'}`}>{label}</span>
                    <span className="text-[10px] text-[#9CA3AF] hidden sm:block">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle: Move checked to bottom */}
            <div className="flex items-center justify-between py-4 border-t border-[#E5E5E0]/60">
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Move checked to bottom</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Auto-sort checked items below unchecked</p>
              </div>
              <button
                onClick={() => setMoveChecked(!moveChecked)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  moveChecked ? 'bg-[#D97706]' : 'bg-[#E5E5E0]'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  moveChecked ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle: Notifications */}
            <div className="flex items-center justify-between py-4 border-t border-[#E5E5E0]/60">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#9CA3AF]" />
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Reminder notifications</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Get notified when a reminder is due</p>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  notifPerm === 'granted' ? 'bg-[#D97706]' : 'bg-[#E5E5E0]'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  notifPerm === 'granted' ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="bg-white rounded-2xl border border-[#E5E5E0]/60 p-5 sm:p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Account</h2>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full h-11 flex items-center justify-center gap-2 border border-[#E5E5E0] rounded-xl text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F5F0] active:scale-[0.98] transition-all"
            >
              <LogOut className="w-4 h-4" />
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full h-11 flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            ) : (
              <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 leading-relaxed">
                    This will permanently delete your account and all data. Type <span className="font-semibold">DELETE</span> to confirm.
                  </p>
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full bg-white rounded-xl px-4 py-3 text-sm text-[#1A1A1A] border border-red-200 focus:ring-2 focus:ring-red-200 focus:outline-none transition-all mb-3"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} 
                    className="flex-1 h-10 border border-[#E5E5E0] rounded-xl text-sm font-medium text-[#6B6B5F] hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteAccount} 
                    className="flex-1 h-10 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 active:scale-[0.98] transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center py-6">
          <p className="text-xs text-[#C4C4BC]">Bagged v1.0</p>
        </div>
      </div>
    </div>
  );
}
