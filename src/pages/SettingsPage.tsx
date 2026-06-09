import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Trash2, User, CreditCard, LayoutGrid, LayoutList, Columns3, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { LayoutMode } from '@/types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, subscriptionStatus, trialDaysLeft, logOut } = useAuth();
  const { showToast } = useToast();
  const [defaultLayout, setDefaultLayout] = useState<LayoutMode>('standard');
  const [moveChecked, setMoveChecked] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [signingOut, setSigningOut] = useState(false);

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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    trialing: { label: 'Free Trial', color: 'text-amber', bg: 'bg-amber-pale' },
    active: { label: 'Active', color: 'text-brand-green', bg: 'bg-green-50' },
    past_due: { label: 'Past Due', color: 'text-brand-red', bg: 'bg-red-50' },
    canceled: { label: 'Canceled', color: 'text-warm-600', bg: 'bg-warm-100' },
    none: { label: 'Free', color: 'text-warm-600', bg: 'bg-warm-100' },
  };

  const status = statusConfig[subscriptionStatus] || statusConfig.none;

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-warm-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-charcoal">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile */}
        <section className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-amber" />
            Profile
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-pale flex items-center justify-center text-xl font-bold text-amber">
              {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-charcoal">{user?.full_name || 'User'}</p>
              <p className="text-sm text-warm-600">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber" />
            Subscription
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                {status.label}
              </span>
              {subscriptionStatus === 'trialing' && trialDaysLeft > 0 && (
                <p className="text-sm text-warm-600 mt-2">
                  {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in your trial
                </p>
              )}
            </div>
            <button className="btn-primary text-sm py-2 px-4">
              {subscriptionStatus === 'active' ? 'Manage' : 'Upgrade'}
            </button>
          </div>
          {(subscriptionStatus === 'trialing' || subscriptionStatus === 'none') && (
            <p className="text-xs text-warm-400">
              Upgrade to unlock unlimited lists, collaborators, and all features.
            </p>
          )}
        </section>

        {/* Preferences */}
        <section className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-charcoal mb-4">Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">Default Layout</label>
              <div className="flex gap-2">
                {([
                  { mode: 'compact' as LayoutMode, icon: LayoutGrid, label: 'Compact' },
                  { mode: 'standard' as LayoutMode, icon: LayoutList, label: 'Standard' },
                  { mode: 'visual' as LayoutMode, icon: Columns3, label: 'Visual' },
                ]).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setDefaultLayout(mode)}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      defaultLayout === mode
                        ? 'border-amber bg-amber-pale text-amber'
                        : 'border-warm-200 text-warm-400 hover:border-warm-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                    {defaultLayout === mode && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-warm-100">
              <div>
                <p className="text-sm font-medium text-charcoal">Move checked to bottom</p>
                <p className="text-xs text-warm-400">Automatically sort checked items below unchecked</p>
              </div>
              <button
                onClick={() => setMoveChecked(!moveChecked)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  moveChecked ? 'bg-amber' : 'bg-warm-200'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                  moveChecked ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* Account */}
        <section className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-charcoal mb-4">Account</h2>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full btn-secondary flex items-center justify-center gap-2 text-brand-red border-brand-red/30 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 text-brand-red text-sm font-medium py-2 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            ) : (
              <div className="border border-brand-red/30 rounded-xl p-4 bg-red-50">
                <p className="text-sm text-brand-red mb-3">
                  This will permanently delete your account and all data. Type DELETE to confirm.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full input-field mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} className="flex-1 btn-secondary text-sm">
                    Cancel
                  </button>
                  <button onClick={handleDeleteAccount} className="flex-1 bg-brand-red text-white rounded-full py-2 text-sm font-medium hover:bg-red-600 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
