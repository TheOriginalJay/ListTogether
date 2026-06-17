import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ClipboardList, LayoutGrid, LayoutList, Columns3, Check, Users, Lock, ChevronLeft,
  Apple, Droplets, Beef, Croissant, Box, IceCream, Coffee, Bath, Cookie
} from 'lucide-react';
import { getListByShareToken, subscribeToList, joinListByCode } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { ListItem, ShoppingList, LayoutMode } from '@/types';

const CATEGORY_ICONS: Record<string, typeof Apple> = {
  Produce: Apple,
  Dairy: Droplets,
  Meat: Beef,
  Bakery: Croissant,
  Pantry: Box,
  Frozen: IceCream,
  Beverages: Coffee,
  Household: Bath,
  Snacks: Cookie,
  Other: ClipboardList,
};

export default function PublicViewPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('standard');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;
    
    getListByShareToken(token).then(data => {
      if (data) {
        if (user && data.owner_id === user.id) {
          navigate(`/list/${data.id}`, { replace: true });
          return;
        }
        
        setList(data as ShoppingList);
        setItems((data as ShoppingList & { items?: ListItem[] }).items || []);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch shared list:', err);
      setLoading(false);
    });
  }, [token, user, navigate]);

  const handleJoin = async () => {
    if (!list || !isAuthenticated) return;
    setJoining(true);
    try {
      await joinListByCode(list.invite_code);
      showToast('Joined household!', 'success');
      navigate(`/list/${list.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to join', 'error');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!list?.id) return;
    const subscription = subscribeToList(list.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setItems(prev => [...prev, payload.new as ListItem]);
      } else if (payload.eventType === 'UPDATE') {
        setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as ListItem : i));
      } else if (payload.eventType === 'DELETE') {
        setItems(prev => prev.filter(i => i.id !== payload.old.id));
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [list?.id]);

  const groupedItems = (() => {
    const groups: Record<string, ListItem[]> = {};
    for (const item of items) {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  })();

  const runningTotal = items
    .filter(i => !i.is_checked)
    .reduce((sum, i) => sum + (i.quantity || 1) * (i.estimated_price_cents || 0), 0);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return '';
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-8">
        <div className="text-center space-y-8">
          <div className="w-24 h-24 rounded-3xl bg-warm-50 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-12 h-12 text-warm-200" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-extrabold text-charcoal tracking-tight">Access Denied</h3>
            <p className="text-warm-400 max-w-xs mx-auto leading-relaxed">
              This list is private or no longer available.
            </p>
          </div>
          <button onClick={() => navigate('/')} className="btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-56">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border py-8 px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-display font-extrabold tracking-tight text-charcoal">{list.name}</h1>
              <span className="inline-flex px-2 py-0.5 rounded bg-warm-100 text-warm-400 text-[9px] font-black uppercase tracking-widest">View Only</span>
            </div>
          </div>
          
          <div className="flex bg-warm-50 border border-warm-100 rounded-2xl p-1.5">
            {([
              { mode: 'compact' as LayoutMode, icon: LayoutGrid },
              { mode: 'standard' as LayoutMode, icon: LayoutList },
              { mode: 'visual' as LayoutMode, icon: Columns3 },
            ]).map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setLayoutMode(mode)}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  layoutMode === mode ? 'bg-white text-amber shadow-md' : 'text-warm-400 hover:text-charcoal'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="mb-12 space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber">Authorized Househould</p>
          <p className="text-sm font-semibold text-warm-400">
            Established by {list.owner?.full_name || list.owner?.email || 'Authorized User'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <p className="text-lg text-warm-400">Empty list</p>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category} className="space-y-8">
                <button
                  onClick={() => toggleCategory(category)}
                  className="category-header w-full flex items-center justify-between mb-2 group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber" />
                    <span className="font-display tracking-[0.2em]">{category}</span>
                    <span className="text-warm-300 font-bold ml-2">[{catItems.length}]</span>
                  </div>
                  <ChevronLeft className={`w-5 h-5 text-warm-300 transition-transform duration-500 ${collapsedCategories.has(category) ? '-rotate-90' : ''}`} />
                </button>

                {!collapsedCategories.has(category) && (
                  <div className={layoutMode === 'visual' ? 'grid grid-cols-1 sm:grid-cols-2 gap-6' : 'space-y-4'}>
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        className={`
                          transition-all duration-500
                          ${layoutMode === 'compact' ? 'flex items-center gap-6 py-4 px-4 border-b border-black/5' : 'card-premium p-8 flex items-center gap-8'}
                          ${item.is_checked ? 'opacity-30 grayscale' : ''}
                        `}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`
                            shrink-0 rounded-[1rem] border-2 flex items-center justify-center transition-all duration-300
                            ${layoutMode === 'compact' ? 'w-8 h-8' : 'w-10 h-10'}
                            ${item.is_checked ? 'bg-amber border-amber' : 'border-warm-200'}
                          `}>
                            {item.is_checked && <Check className="w-5 h-5 text-white" strokeWidth={5} />}
                          </div>

                          {layoutMode === 'visual' && !item.is_checked && (
                            <div className="w-16 h-16 rounded-2xl bg-amber/5 flex items-center justify-center shrink-0">
                              {(() => {
                                const Icon = CATEGORY_ICONS[item.category || 'Other'] || CATEGORY_ICONS.Other;
                                return <Icon className="w-8 h-8 text-amber" />;
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className={`font-display font-extrabold text-charcoal tracking-tight ${item.is_checked ? 'line-through text-warm-400' : ''} ${layoutMode === 'compact' ? 'text-lg' : 'text-xl'}`}>
                            {item.name}
                          </h4>
                          {item.notes && layoutMode !== 'compact' && (
                            <p className="text-sm font-medium text-warm-400 truncate">{item.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          {item.quantity > 1 && (
                            <span className="px-4 py-1.5 rounded-full bg-warm-100 text-warm-600 text-[10px] font-bold uppercase tracking-widest">
                              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                            </span>
                          )}
                          {item.estimated_price_cents && (
                            <span className="font-display font-black text-2xl text-amber tracking-tighter">
                              {formatPrice(item.estimated_price_cents)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Join/CTA Bar */}
      <div className="fixed bottom-12 left-0 right-0 z-50 px-8 pointer-events-none">
        <div className="max-w-4xl mx-auto glass-panel rounded-[3rem] p-6 flex items-center justify-between pointer-events-auto shadow-[0_32px_80px_rgba(17,24,39,0.15)] border-white/40">
          <div className="flex items-baseline gap-4 ml-4">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-warm-300 italic">Total Value</span>
            <span className="text-4xl font-display font-black text-charcoal tracking-tighter leading-none">${(runningTotal / 100).toFixed(2)}</span>
          </div>
          {isAuthenticated ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-primary py-5 px-12 flex items-center gap-3"
            >
              {joining ? (
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Join & Edit Household
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate('/signup')}
              className="btn-primary py-5 px-12"
            >
              Initialize My Household
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
