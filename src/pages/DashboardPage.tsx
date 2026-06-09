import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, ClipboardList, ChevronRight, Lock, Users, Link2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getUserLists, createList, joinListByCode } from '@/lib/supabase';
import type { ShoppingList } from '@/lib/supabase';
import { cacheLists, getCachedLists } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';

type PrivacySetting = 'private' | 'invite_only' | 'link_sharing';

const PRIVACY_CONFIGS: Record<PrivacySetting, { icon: typeof Lock; label: string; color: string }> = {
  private: { icon: Lock, label: 'Private', color: 'bg-warm-100 text-warm-600' },
  invite_only: { icon: Users, label: 'Invite-Only', color: 'bg-amber-pale text-amber' },
  link_sharing: { icon: Link2, label: 'Link Sharing', color: 'bg-green-50 text-brand-green' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { trialDaysLeft, subscriptionStatus } = useAuth();
  const { showToast } = useToast();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListPrivacy, setNewListPrivacy] = useState<PrivacySetting>('invite_only');
  const [inviteCode, setInviteCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const data = await getUserLists();
      if (data && data.length > 0) {
        setLists(data as any);
        await cacheLists(data as any);
      } else {
        const cached = await getCachedLists();
        setLists(cached);
      }
    } catch {
      const cached = await getCachedLists();
      setLists(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();

    const handleShowCreate = () => setShowCreate(true);
    window.addEventListener('showCreateList', handleShowCreate);
    return () => window.removeEventListener('showCreateList', handleShowCreate);
  }, [fetchLists]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const list = await createList(newListName.trim(), newListPrivacy);
      showToast('List created!', 'success');
      setShowCreate(false);
      setNewListName('');
      navigate(`/list/${list.id}`);
    } catch {
      showToast('Failed to create list', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.length !== 6) return;
    setJoining(true);
    try {
      const listId = await joinListByCode(inviteCode.toUpperCase());
      showToast('Joined list successfully!', 'success');
      setShowJoin(false);
      setInviteCode('');
      navigate(`/list/${listId}`);
    } catch (err: any) {
      showToast(err.message || 'Invalid invite code', 'error');
    } finally {
      setJoining(false);
    }
  };

  const expired = subscriptionStatus === 'canceled' || (subscriptionStatus === 'trialing' && trialDaysLeft <= 0);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-warm-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-charcoal flex-1">My Lists</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoin(true)}
              className="btn-secondary flex items-center gap-2 text-sm py-2.5 px-4"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Join</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Trial Banner */}
        {subscriptionStatus === 'trialing' && trialDaysLeft > 0 && (
          <div className="bg-amber-pale rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-amber">
              Your trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}
            </p>
            <button className="btn-primary text-xs py-1.5 px-3">Upgrade</button>
          </div>
        )}

        {/* Expired Banner */}
        {expired && (
          <div className="bg-red-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-brand-red">
              Your trial has expired. Upgrade to continue.
            </p>
            <button className="bg-brand-red text-white text-xs font-medium rounded-full py-1.5 px-3 hover:bg-red-600 transition-colors">
              Upgrade Now
            </button>
          </div>
        )}

        {/* Lists */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-warm-100 animate-pulse" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-amber-pale flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-10 h-10 text-amber" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-1">No lists yet</h3>
            <p className="text-sm text-warm-600 mb-6">Create your first shopping list to get started.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create List
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map(list => {
              const privacy = PRIVACY_CONFIGS[list.privacy as PrivacySetting] || PRIVACY_CONFIGS.private;
              const PrivacyIcon = privacy.icon;
              const itemCount = (list as any).items?.count || 0;
              
              return (
                <button
                  key={list.id}
                  onClick={() => navigate(`/list/${list.id}`)}
                  className="w-full card-surface p-4 flex items-center gap-4 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-charcoal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-charcoal truncate">{list.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${privacy.color}`}>
                        <PrivacyIcon className="w-3 h-3" />
                        {privacy.label}
                      </span>
                    </div>
                    <p className="text-xs text-warm-400">
                      {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-warm-400 group-hover:text-amber transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal">Create New List</h2>
              <button onClick={() => setShowCreate(false)} className="text-warm-400 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">List name</label>
                <input
                  type="text"
                  placeholder="e.g., Weekly Groceries"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="w-full input-field"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Privacy</label>
                <div className="space-y-2">
                  {([
                    { value: 'private', label: 'Private', desc: 'Only you can see this list', icon: Lock },
                    { value: 'invite_only', label: 'Invite-Only', desc: 'People you invite can edit', icon: Users },
                    { value: 'link_sharing', label: 'Link Sharing', desc: 'Anyone with the link can view', icon: Link2 },
                  ] as const).map(option => {
                    const OptIcon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewListPrivacy(option.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          newListPrivacy === option.value
                            ? 'border-amber bg-amber-pale'
                            : 'border-warm-200 hover:border-warm-400'
                        }`}
                      >
                        <OptIcon className={`w-5 h-5 ${newListPrivacy === option.value ? 'text-amber' : 'text-warm-400'}`} />
                        <div className="text-left">
                          <p className="text-sm font-medium text-charcoal">{option.label}</p>
                          <p className="text-xs text-warm-400">{option.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim() || creating}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Join List Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal">Join a List</h2>
              <button onClick={() => setShowJoin(false)} className="text-warm-400 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Invite Code</label>
                <input
                  type="text"
                  placeholder="E.g. AB12CD"
                  maxLength={6}
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full input-field text-center text-2xl font-bold tracking-widest uppercase placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
                  autoFocus
                />
                <p className="text-xs text-warm-400 mt-2 text-center">
                  Enter the 6-digit code shared by the list owner.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoin(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteCode.length !== 6 || joining}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Join List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
