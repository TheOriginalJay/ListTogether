import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, ChevronRight, Lock, Users, Globe, X, Plus, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getUserLists, createList, joinListByCode } from '@/lib/supabase';
import type { ShoppingList } from '@/lib/supabase';
import { cacheLists, getCachedLists } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';

type PrivacySetting = 'private' | 'invite_only' | 'link_sharing';

const PRIVACY_CONFIGS: Record<PrivacySetting, { icon: typeof Lock; label: string; bg: string; text: string }> = {
  private:       { icon: Lock,  label: 'Private',      bg: 'bg-warm-100',       text: 'text-warm-500' },
  invite_only:   { icon: Users, label: 'Invite only',  bg: 'bg-amber/10',       text: 'text-amber-deep' },
  link_sharing:  { icon: Globe, label: 'Link sharing', bg: 'bg-green-50',        text: 'text-green-600' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { trialDaysLeft, subscriptionStatus } = useAuth();
  const { showToast } = useToast();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'join' | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListPrivacy, setNewListPrivacy] = useState<PrivacySetting>('invite_only');
  const [inviteCode, setInviteCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const data = await getUserLists();
      if (data && data.length > 0) {
        setLists(data);
        await cacheLists(data);
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
    const handleShowCreate = () => setModal('create');
    window.addEventListener('showCreateList', handleShowCreate);
    return () => window.removeEventListener('showCreateList', handleShowCreate);
  }, [fetchLists]);

  const closeModal = () => {
    setModal(null);
    setNewListName('');
    setInviteCode('');
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const list = await createList(newListName.trim(), newListPrivacy);
      showToast('List created!', 'success');
      closeModal();
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
      showToast('Joined list!', 'success');
      closeModal();
      await fetchLists();
      navigate(`/list/${listId}`);
    } catch (err: any) {
      showToast(err.message || 'Invalid invite code', 'error');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-black/5">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-extrabold text-charcoal tracking-tight">My lists</h1>
            <p className="text-xs text-warm-400 font-medium mt-0.5">Your household shopping hub</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setModal('join')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/8 text-sm font-bold text-warm-700 hover:bg-warm-50 transition-colors">
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Join list</span>
            </button>
            <button onClick={() => setModal('create')} className="flex items-center gap-2 btn-primary py-2.5 px-5 text-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New list</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Trial banner */}
        {subscriptionStatus === 'trialing' && trialDaysLeft > 0 && (
          <div className="flex items-center justify-between gap-4 bg-amber/8 border border-amber/15 rounded-2xl px-6 py-4">
            <div>
              <p className="text-sm font-bold text-amber-deep">Trial active</p>
              <p className="text-xs text-amber/70 mt-0.5">{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-amber text-white text-xs font-bold hover:bg-amber-deep transition-colors">
              Upgrade
            </button>
          </div>
        )}

        {/* Lists */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-warm-50 animate-pulse" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl bg-warm-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-10 h-10 text-warm-300" />
            </div>
            <h3 className="text-xl font-display font-extrabold text-charcoal mb-2">No lists yet</h3>
            <p className="text-sm text-warm-500 mb-8 max-w-xs mx-auto">Create your first list or join one with an invite code.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => setModal('create')} className="btn-primary py-3 px-8 text-sm">
                Create a list
              </button>
              <button onClick={() => setModal('join')} className="btn-secondary py-3 px-8 text-sm">
                Join with code
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {lists.map(list => {
              const priv = PRIVACY_CONFIGS[(list.privacy as PrivacySetting)] || PRIVACY_CONFIGS.private;
              const PrivacyIcon = priv.icon;
              const itemCount = (list as any).items?.count ?? 0;

              return (
                <button
                  key={list.id}
                  onClick={() => navigate(`/list/${list.id}`)}
                  className="group w-full bg-white rounded-2xl border border-black/5 px-6 py-5 flex items-center gap-5 text-left hover:border-amber/30 hover:shadow-[0_4px_20px_rgba(217,119,6,0.08)] transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-2xl bg-warm-50 flex items-center justify-center shrink-0 group-hover:bg-amber/8 transition-colors">
                    <ShoppingCart className="w-5 h-5 text-warm-400 group-hover:text-amber transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-extrabold text-charcoal truncate text-base">{list.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${priv.bg} ${priv.text}`}>
                        <PrivacyIcon className="w-2.5 h-2.5" />
                        {priv.label}
                      </span>
                    </div>
                    <p className="text-xs text-warm-400 font-medium">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} · Updated {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-warm-300 group-hover:text-amber group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal backdrop */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-8 bg-charcoal/30 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-[0_32px_80px_rgba(17,24,39,0.2)] relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={closeModal} className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center hover:bg-warm-100 transition-colors text-warm-400">
              <X className="w-4 h-4" />
            </button>

            {modal === 'create' && (
              <>
                <h2 className="text-2xl font-display font-extrabold text-charcoal tracking-tight mb-1">New list</h2>
                <p className="text-sm text-warm-500 mb-8">Give your shopping list a name</p>

                <form onSubmit={handleCreateList} className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-warm-500 mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Weekly shop, Costco run…"
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      className="w-full input-field"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-warm-500 mb-3">Privacy</label>
                    <div className="space-y-2">
                      {(['private', 'invite_only', 'link_sharing'] as const).map(value => {
                        const cfg = PRIVACY_CONFIGS[value];
                        const Icon = cfg.icon;
                        const isSelected = newListPrivacy === value;
                        const descriptions: Record<PrivacySetting, string> = {
                          private: 'Only you can see this list',
                          invite_only: 'Share a 6-digit code with collaborators',
                          link_sharing: 'Anyone with the link can view it',
                        };
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setNewListPrivacy(value)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                              isSelected
                                ? 'border-amber bg-amber/5'
                                : 'border-black/5 hover:border-black/10 bg-warm-50'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber' : 'bg-white border border-black/8'}`}>
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-warm-400'}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-charcoal capitalize">{value.replace('_', ' ')}</p>
                              <p className="text-xs text-warm-500 mt-0.5">{descriptions[value]}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-amber' : 'bg-warm-200'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button type="submit" disabled={!newListName.trim() || creating} className="w-full btn-primary">
                    {creating ? 'Creating…' : 'Create list'}
                  </button>
                </form>
              </>
            )}

            {modal === 'join' && (
              <>
                <h2 className="text-2xl font-display font-extrabold text-charcoal tracking-tight mb-1">Join a list</h2>
                <p className="text-sm text-warm-500 mb-8">Enter the 6-character invite code</p>

                <form onSubmit={handleJoinList} className="space-y-6">
                  <input
                    type="text"
                    placeholder="e.g., K7MN2P"
                    maxLength={6}
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="w-full bg-warm-50 rounded-2xl border-2 border-dashed border-warm-200 p-6 text-center text-4xl font-display font-extrabold tracking-[0.4em] text-charcoal focus:border-amber focus:bg-white focus:outline-none transition-all"
                    autoFocus
                  />
                  <button type="submit" disabled={inviteCode.length !== 6 || joining} className="w-full btn-primary">
                    {joining ? 'Joining…' : 'Join list'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
