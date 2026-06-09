import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ClipboardList, LayoutGrid, LayoutList, Columns3, Check, Users } from 'lucide-react';
import { getListByShareToken, subscribeToList, joinListByCode } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { ListItem, ShoppingList, LayoutMode } from '@/types';

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
        // If user is already owner, redirect to full list
        if (user && data.owner_id === user.id) {
          navigate(`/list/${data.id}`, { replace: true });
          return;
        }
        
        setList(data as ShoppingList);
        setItems((data as any).items || []);
      }
      setLoading(false);
    });
  }, [token, user, navigate]);

  const handleJoin = async () => {
    if (!list || !isAuthenticated) return;
    setJoining(true);
    try {
      // We use the invite_code from the list we just fetched via token
      await joinListByCode(list.invite_code);
      showToast('Joined list!', 'success');
      navigate(`/list/${list.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to join list', 'error');
    } finally {
      setJoining(false);
    }
  };

  // Realtime subscription for updates
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-warm-600 mb-4">This list is not available or is private.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-warm-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-charcoal">ListTogether</span>
            <span className="px-2 py-0.5 rounded-full bg-warm-100 text-warm-600 text-[10px] font-medium">
              View-Only
            </span>
          </div>
          <div className="flex bg-warm-100 rounded-lg p-0.5">
            {([
              { mode: 'compact' as LayoutMode, icon: LayoutGrid },
              { mode: 'standard' as LayoutMode, icon: LayoutList },
              { mode: 'visual' as LayoutMode, icon: Columns3 },
            ]).map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setLayoutMode(mode)}
                className={`p-1.5 rounded-md transition-all ${
                  layoutMode === mode ? 'bg-amber text-white shadow-sm' : 'text-warm-400 hover:text-charcoal'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-charcoal">{list.name}</h1>
          <p className="text-xs text-warm-400">
            Shared by {list.owner?.full_name || list.owner?.email || 'someone'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-warm-600">This list is empty.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="category-header w-full flex items-center justify-between mb-2"
                >
                  <span>{category} ({catItems.length})</span>
                </button>
                {!collapsedCategories.has(category) && (
                  <div className={layoutMode === 'visual' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-2'}>
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        className={`
                          ${layoutMode === 'compact' ? 'flex items-center gap-3 py-2 px-1 border-b border-warm-100' : ''}
                          ${layoutMode === 'standard' ? 'card-surface p-3 flex items-center gap-3' : ''}
                          ${layoutMode === 'visual' ? 'card-surface p-4 flex flex-col gap-2' : ''}
                          ${item.is_checked ? 'opacity-50' : ''}
                        `}
                      >
                        <div className={`
                          shrink-0 rounded-lg border-2 flex items-center justify-center
                          ${layoutMode === 'compact' ? 'w-5 h-5' : layoutMode === 'visual' ? 'w-7 h-7' : 'w-6 h-6'}
                          ${item.is_checked ? 'bg-amber border-amber' : 'border-warm-200'}
                        `}>
                          {item.is_checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`font-medium ${item.is_checked ? 'line-through text-warm-400' : 'text-charcoal'} ${layoutMode === 'compact' ? 'text-sm' : ''}`}>
                            {item.name}
                          </span>
                          {item.notes && layoutMode !== 'compact' && (
                            <p className="text-xs text-warm-400 mt-0.5">{item.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.quantity > 1 && (
                            <span className={`px-2 py-0.5 rounded-full bg-warm-100 text-warm-600 font-medium ${layoutMode === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                            </span>
                          )}
                          {item.estimated_price_cents && (
                            <span className={`font-semibold text-amber ${layoutMode === 'compact' ? 'text-xs' : 'text-sm'}`}>
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

      {/* Running Total + CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-200 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-warm-600">Est. Total: </span>
            <span className="text-lg font-bold text-amber">${(runningTotal / 100).toFixed(2)}</span>
          </div>
          {isAuthenticated ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-primary text-sm py-2 px-6 flex items-center gap-2"
            >
              {joining ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Join & Edit
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate('/signup')}
              className="btn-primary text-sm py-2 px-4"
            >
              Create Free Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
