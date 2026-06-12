import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, ChevronRight, Lock, Users, Globe, X, Plus, LogIn, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getUserLists, createList, joinListByCode } from '@/lib/supabase';
import type { ShoppingList } from '@/lib/supabase';
import { cacheLists, getCachedLists } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';

type PrivacySetting = 'private' | 'invite_only' | 'link_sharing';

const PRIVACY_CONFIGS: Record<PrivacySetting, { icon: typeof Lock; label: string; color: string; bg: string }> = {
  private:       { icon: Lock,  label: 'Private',      color: 'text-slate-600', bg: 'bg-slate-50' },
  invite_only:   { icon: Users, label: 'Invite only',  color: 'text-amber-700', bg: 'bg-amber-50' },
  link_sharing:  { icon: Globe, label: 'Link sharing', color: 'text-emerald-700', bg: 'bg-emerald-50' },
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
  const [searchQuery, setSearchQuery] = useState('');

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
      showToast('List created', 'success');
      closeModal();
      navigate(`/list/${list.id}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create list', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.length !== 6) {
      showToast('Invite code must be 6 characters', 'error');
      return;
    }
    setJoining(true);
    try {
      const listId = await joinListByCode(inviteCode.toUpperCase());
      showToast('Joined list!', 'success');
      closeModal();
      await fetchLists();
      navigate(`/list/${listId}`);
    } catch (err: any) {
      showToast(err?.message || 'Invalid invite code', 'error');
    } finally {
      setJoining(false);
    }
  };

  const filteredLists = lists.filter(list => 
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E0]/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">My lists</h1>
              <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">
                {lists.length} {lists.length === 1 ? 'list' : 'lists'}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setModal('join')} 
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-[#E5E5E0] text-sm font-medium text-[#6B6B5F] hover:bg-[#F5F5F0] hover:text-[#1A1A1A] transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Join</span>
              </button>
              <button 
                onClick={() => setModal('create')} 
                className="flex items-center gap-2 h-10 sm:h-11 px-4 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New list</span>
              </button>
            </div>
          </div>

          {/* Search */}
          {lists.length > 3 && (
            <div className="mt-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BC]" />
              <input
                type="text"
                placeholder="Search lists..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
              />
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Trial banner */}
        {subscriptionStatus === 'trialing' && trialDaysLeft > 0 && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200/60 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Trial active</p>
                <p className="text-xs text-amber-600/70">{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl bg-[#D97706] text-white text-xs font-semibold hover:bg-[#B45309] active:scale-95 transition-all shrink-0">
              Upgrade
            </button>
          </div>
        )}

        {/* Lists */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 sm:h-24 rounded-2xl bg-[#F5F5F0] animate-pulse" />
            ))}
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#F5F5F0] flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-[#C4C4BC]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight mb-2">
              {searchQuery ? 'No lists found' : 'No lists yet'}
            </h3>
            <p className="text-sm text-[#6B6B5F] mb-8 max-w-xs mx-auto leading-relaxed">
              {searchQuery ? 'Try a different search term' : 'Create your first list or join one with an invite code.'}
            </p>
            {!searchQuery && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => setModal('create')} className="h-12 px-8 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-95 transition-all">
                  Create a list
                </button>
                <button onClick={() => setModal('join')} className="h-12 px-8 border border-[#E5E5E0] rounded-xl text-sm font-medium text-[#6B6B5F] hover:bg-[#F5F5F0] hover:text-[#1A1A1A] transition-all">
                  Join with code
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLists.map(list => {
              const priv = PRIVACY_CONFIGS[(list.privacy as PrivacySetting)] || PRIVACY_CONFIGS.private;
              const PrivacyIcon = priv.icon;
              const itemCount = (list as any).items?.count ?? 0;

              return (
                <button
                  key={list.id}
                  onClick={() => navigate(`/list/${list.id}`)}
                  className="group w-full bg-white rounded-2xl border border-[#E5E5E0]/60 px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-4 text-left hover:border-[#D97706]/30 hover:shadow-lg hover:shadow-[#1A1A1A]/[0.03] active:scale-[0.995] transition-all duration-200"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#F5F5F0] flex items-center justify-center shrink-0 group-hover:bg-[#D97706]/5 transition-colors">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-[#9CA3AF] group-hover:text-[#D97706] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#1A1A1A] truncate text-sm sm:text-base">{list.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider shrink-0 ${priv.bg} ${priv.color}`}>
                        <PrivacyIcon className="w-2.5 h-2.5" />
                        {priv.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] font-medium">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} · Updated {formatDistanceToNow(new Date(list.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#C4C4BC] group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal - Mobile optimized */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1A1A1A]/30 backdrop-blur-sm" onClick={closeModal}>
          <div 
            className="bg-white w-full sm:w-auto sm:min-w-[420px] sm:max-w-lg sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 shadow-2xl shadow-[#1A1A1A]/10 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">
                {modal === 'create' ? 'New list' : 'Join a list'}
              </h2>
              <button 
                onClick={closeModal} 
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F0] transition-colors"
              >
                <X className="w-5 h-5 text-[#6B6B5F]" />
              </button>
            </div>

            {modal === 'create' && (
              <form onSubmit={handleCreateList} className="space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Weekly groceries"
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3.5 text-sm font-medium text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-3">Privacy</label>
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
                              ? 'border-[#D97706] bg-[#D97706]/[0.03]'
                              : 'border-[#E5E5E0] hover:border-[#1A1A1A]/20'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-[#D97706]' : 'bg-[#F5F5F0]'
                          }`}>
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#9CA3AF]'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#1A1A1A]">{cfg.label}</p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{descriptions[value]}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-[#D97706]' : 'border-[#E5E5E0]'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={!newListName.trim() || creating} 
                  className="w-full h-12 bg-[#1A1A1A] text-white rounded-xl font-medium text-sm hover:bg-[#333] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create list'}
                </button>
              </form>
            )}

            {modal === 'join' && (
              <form onSubmit={handleJoinList} className="space-y-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Invite Code</label>
                  <input
                    type="text"
                    placeholder="e.g., K7MN2P"
                    maxLength={6}
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="w-full bg-[#F5F5F0] rounded-xl border-2 border-dashed border-[#E5E5E0] p-6 text-center text-3xl sm:text-4xl font-bold tracking-[0.3em] text-[#1A1A1A] focus:border-[#D97706] focus:bg-white focus:outline-none transition-all font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-[#9CA3AF] text-center mt-3">Enter the 6-character code from the list owner</p>
                </div>
                <button 
                  type="submit" 
                  disabled={inviteCode.length !== 6 || joining} 
                  className="w-full h-12 bg-[#1A1A1A] text-white rounded-xl font-medium text-sm hover:bg-[#333] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {joining ? 'Joining...' : 'Join list'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
