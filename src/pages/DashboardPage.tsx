import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, ClipboardList, ChevronRight, Lock, Users, Link2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getUserLists, createList, joinListByCode } from '@/lib/supabase';
import type { ShoppingList } from '@/lib/supabase';
import { cacheLists, getCachedLists } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { gsap } from 'gsap';

type PrivacySetting = 'private' | 'invite_only' | 'link_sharing';

const PRIVACY_CONFIGS: Record<PrivacySetting, { icon: typeof Lock; label: string; color: string }> = {
  private: { icon: Lock, label: 'Private', color: 'bg-warm-100 text-warm-500' },
  invite_only: { icon: Users, label: 'Invite-Only', color: 'bg-amber/10 text-amber' },
  link_sharing: { icon: Link2, label: 'Link Sharing', color: 'bg-green-500/10 text-green-600' },
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
    
    if (!loading) {
      gsap.from('.list-card', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }

    const handleShowCreate = () => setShowCreate(true);
    window.addEventListener('showCreateList', handleShowCreate);
    return () => window.removeEventListener('showCreateList', handleShowCreate);
  }, [fetchLists, loading]);

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-3xl font-display font-extrabold text-charcoal tracking-tight">My Lists</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="btn-secondary flex items-center gap-2 text-xs py-3 px-6"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Join List</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-2 text-xs py-3 px-6"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create New</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {subscriptionStatus === 'trialing' && trialDaysLeft > 0 && (
          <div className="bg-amber/5 border border-amber/20 rounded-2xl px-6 py-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-amber tracking-tight">
              Trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}
            </p>
            <button className="text-xs font-bold uppercase tracking-widest text-amber hover:underline">Upgrade</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-warm-100 animate-pulse" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 rounded-3xl bg-warm-100 flex items-center justify-center mx-auto mb-8">
              <ClipboardList className="w-12 h-12 text-warm-300" />
            </div>
            <h3 className="text-2xl font-display font-bold text-charcoal mb-2">Start your first list</h3>
            <p className="text-sm text-warm-500 mb-8 max-w-xs mx-auto leading-relaxed">
              Organize your household shopping with real-time sync and offline support.
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create List
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {lists.map(list => {
              const privacy = PRIVACY_CONFIGS[list.privacy as PrivacySetting] || PRIVACY_CONFIGS.private;
              const PrivacyIcon = privacy.icon;
              const itemCount = (list as any).items?.count || 0;
              
              return (
                <button
                  key={list.id}
                  onClick={() => navigate(`/list/${list.id}`)}
                  className="list-card group w-full card-premium p-6 flex items-center gap-6 text-left"
                >
                  <div className="w-14 h-14 rounded-2xl bg-warm-50 flex items-center justify-center shrink-0 group-hover:bg-amber/5 transition-colors duration-500">
                    <ClipboardList className="w-7 h-7 text-charcoal group-hover:text-amber transition-colors duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-display font-bold text-charcoal truncate">{list.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${privacy.color}`}>
                        <PrivacyIcon className="w-3 h-3" />
                        {privacy.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-warm-400">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} • Updated {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-warm-200 group-hover:text-amber group-hover:translate-x-1 transition-all duration-500 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showCreate || showJoin) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-charcoal/20 backdrop-blur-sm">
          <div className="glass-panel rounded-[2rem] p-10 w-full max-w-lg relative">
            <button 
              onClick={() => { setShowCreate(false); setShowJoin(false); }} 
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center hover:bg-warm-100 transition-colors"
            >
              <X className="w-5 h-5 text-warm-400" />
            </button>

            {showCreate && (
              <>
                <h2 className="text-3xl font-display font-extrabold text-charcoal mb-8 tracking-tight">Create List</h2>
                <form onSubmit={handleCreateList} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-warm-500 ml-1">List Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Weekly Staples"
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      className="w-full input-field"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-warm-500 ml-1">Privacy</label>
                    <div className="grid gap-3">
                      {(['private', 'invite_only', 'link_sharing'] as const).map(value => {
                        const config = PRIVACY_CONFIGS[value];
                        const Icon = config.icon;
                        const isSelected = newListPrivacy === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setNewListPrivacy(value)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                              isSelected ? 'bg-white border-amber shadow-lg shadow-amber/5' : 'bg-transparent border-black/5 hover:border-black/10'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-amber text-white' : 'bg-warm-100 text-warm-400'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-charcoal capitalize">{value.replace('_', ' ')}</p>
                              <p className="text-[11px] text-warm-400 font-medium">
                                {value === 'private' ? 'Visible only to you' : value === 'invite_only' ? 'Invite-only access' : 'Anyone with link'}
                              </p>
                            </div>
                            {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-amber" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={!newListName.trim() || creating} className="flex-1 btn-primary">
                      {creating ? 'Creating...' : 'Create List'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {showJoin && (
              <>
                <h2 className="text-3xl font-display font-extrabold text-charcoal mb-8 tracking-tight">Join List</h2>
                <form onSubmit={handleJoinList} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-warm-500 ml-1">Invite Code</label>
                    <input
                      type="text"
                      placeholder="ABC 123"
                      maxLength={6}
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full input-field text-center text-3xl font-bold tracking-[0.2em] uppercase"
                      autoFocus
                    />
                  </div>
                  <button type="submit" disabled={inviteCode.length !== 6 || joining} className="w-full btn-primary">
                    {joining ? 'Joining...' : 'Join & Sync'}
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
