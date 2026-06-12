import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ClipboardList, ChevronRight, Lock, Users, Link2, X } from 'lucide-react';
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
        y: 10,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
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
      // Force refresh lists to ensure it persists
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border py-10 px-8">
        <div className="max-w-4xl mx-auto flex items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-display font-extrabold text-charcoal tracking-tight">My Lists</h1>
            <p className="text-sm font-medium text-warm-400">Manage your household rhythm</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowJoin(true)}
              className="btn-secondary py-3 px-8 text-sm"
            >
              Join
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary py-3 px-8 text-sm"
            >
              Create New
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-16 space-y-12">
        {subscriptionStatus === 'trialing' && trialDaysLeft > 0 && (
          <div className="bg-amber/5 border border-amber/10 rounded-3xl p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-lg font-bold text-amber tracking-tight">
                Premium trial is active
              </p>
              <p className="text-sm font-medium text-amber/60">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
              </p>
            </div>
            <button className="px-6 py-2.5 rounded-xl bg-amber text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform">Upgrade</button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-3xl bg-warm-50 animate-pulse" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-32 space-y-8">
            <div className="w-32 h-32 rounded-[2.5rem] bg-warm-50 flex items-center justify-center mx-auto shadow-inner">
              <ClipboardList className="w-16 h-16 text-warm-200" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-display font-extrabold text-charcoal tracking-tight">Start your first list</h3>
              <p className="text-lg text-warm-400 max-w-sm mx-auto leading-relaxed">
                The perfect shopping rhythm begins with a single list.
              </p>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create My First List
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {lists.map(list => {
              const privacy = PRIVACY_CONFIGS[list.privacy as PrivacySetting] || PRIVACY_CONFIGS.private;
              const PrivacyIcon = privacy.icon;
              const itemCount = (list as any).items?.count || 0;
              
              return (
                <button
                  key={list.id}
                  onClick={() => navigate(`/list/${list.id}`)}
                  className="list-card group w-full card-premium p-8 flex items-center gap-8 text-left"
                >
                  <div className="w-16 h-16 rounded-[1.25rem] bg-warm-50 flex items-center justify-center shrink-0 group-hover:bg-amber/5 group-hover:scale-110 transition-all duration-500">
                    <ClipboardList className="w-8 h-8 text-charcoal group-hover:text-amber transition-all duration-500" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-display font-extrabold text-charcoal truncate tracking-tight">{list.name}</h3>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${privacy.color}`}>
                        <PrivacyIcon className="w-3.5 h-3.5" />
                        {privacy.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-warm-400 flex items-center gap-2">
                      <span className="text-amber">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      <span className="w-1 h-1 rounded-full bg-warm-200" />
                      <span>Updated {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true })}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-warm-100 flex items-center justify-center group-hover:border-amber group-hover:bg-amber group-hover:text-white transition-all duration-500">
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals - Glassmorphism refine */}
      {(showCreate || showJoin) && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-charcoal/30 backdrop-blur-md">
          <div className="glass-panel rounded-[3rem] p-12 w-full max-w-xl relative overflow-hidden">
            {/* Ambient decorative element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber/5 rounded-full blur-3xl pointer-events-none" />

            <button 
              onClick={() => { setShowCreate(false); setShowJoin(false); }} 
              className="absolute top-8 right-8 w-12 h-12 rounded-full flex items-center justify-center hover:bg-warm-100 transition-colors z-10"
            >
              <X className="w-6 h-6 text-warm-400" />
            </button>

            {showCreate && (
              <div className="relative z-10 space-y-10">
                <div className="space-y-2">
                  <h2 className="text-4xl font-display font-extrabold text-charcoal tracking-tight">New List</h2>
                  <p className="text-sm font-medium text-warm-400">Give your rhythm a name</p>
                </div>
                
                <form onSubmit={handleCreateList} className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-warm-500 ml-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Weekly Essentials"
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      className="w-full input-field text-xl"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-warm-500 ml-1">Privacy Level</label>
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
                            className={`w-full flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 ${
                              isSelected ? 'bg-white border-amber shadow-2xl shadow-amber/5' : 'bg-transparent border-black/5 hover:border-black/10'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-amber text-white' : 'bg-warm-100 text-warm-400'}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="text-left space-y-0.5">
                              <p className="text-base font-bold text-charcoal capitalize">{value.replace('_', ' ')}</p>
                              <p className="text-xs text-warm-400 font-medium">
                                {value === 'private' ? 'Visible only to you' : value === 'invite_only' ? 'Authorized household only' : 'Public viewable link'}
                              </p>
                            </div>
                            {isSelected && <div className="ml-auto w-2.5 h-2.5 rounded-full bg-amber" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button type="submit" disabled={!newListName.trim() || creating} className="w-full btn-primary py-5">
                    {creating ? 'Creating...' : 'Establish List'}
                  </button>
                </form>
              </div>
            )}

            {showJoin && (
              <div className="relative z-10 space-y-10">
                <div className="space-y-2 text-center">
                  <h2 className="text-4xl font-display font-extrabold text-charcoal tracking-tight">Join List</h2>
                  <p className="text-sm font-medium text-warm-400">Enter the authorized code</p>
                </div>
                
                <form onSubmit={handleJoinList} className="space-y-10">
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="••••••"
                      maxLength={6}
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full bg-warm-50/50 rounded-3xl border-2 border-dashed border-warm-200 p-8 text-center text-5xl font-display font-extrabold tracking-[0.4em] uppercase text-charcoal focus:border-amber focus:bg-white focus:outline-none transition-all"
                      autoFocus
                    />
                  </div>
                  <button type="submit" disabled={inviteCode.length !== 6 || joining} className="w-full btn-primary py-5">
                    {joining ? 'Syncing...' : 'Join Household'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
