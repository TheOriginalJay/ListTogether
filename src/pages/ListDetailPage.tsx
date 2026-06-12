import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft, LayoutGrid, LayoutList, Columns3, Share2,
  GripVertical, Check, Plus, X, Trash2, Edit3,
  AlertTriangle, ClipboardList, Settings, Lock, Users, Link2,
  Apple, Droplets, Beef, Croissant, Box, IceCream, Coffee, Bath, Cookie
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  parseNaturalLanguage, findDuplicates, normalizeItemName, deduplicateParsedItems
} from '@/lib/parser';
import {
  getListItems, updateItem, deleteItem, batchCreateItems,
  getListById, subscribeToList, updateList
} from '@/lib/supabase';
import {
  cacheItems, getCachedItems, updateCachedItem, deleteCachedItem,
  addCachedItem, queueMutation, getOnlineStatus
} from '@/lib/db';
import type { ListItem, ShoppingList, LayoutMode, ParsedItem } from '@/types';
import { gsap } from 'gsap';

const CATEGORY_ICONS: Record<string, any> = {
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

export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('standard');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditItem, setShowEditItem] = useState<ListItem | null>(null);
  const [showDuplicate, setShowDuplicate] = useState<ParsedItem | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<ListItem | null>(null);
  const [duplicateQueue, setDuplicateQueue] = useState<ParsedItem[]>([]);
  const [checkedBehavior] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Update list metadata
  const handleUpdateList = async (updates: Partial<ShoppingList>) => {
    if (!listId) return;
    try {
      const updated = await updateList(listId, updates);
      setList(updated);
      showToast('List updated', 'success');
    } catch {
      showToast('Failed to update list', 'error');
    }
  };

  // Fetch list and items
  const fetchData = useCallback(async () => {
    if (!listId) return;
    try {
      const [listData, itemsData] = await Promise.all([
        getListById(listId),
        getListItems(listId),
      ]);
      setList(listData as ShoppingList);
      setItems(itemsData);
      await cacheItems(listId, itemsData);
      if ((listData as ShoppingList)?.layout_preference) {
        setLayoutMode((listData as ShoppingList).layout_preference as LayoutMode);
      }
    } catch {
      const cached = await getCachedItems(listId);
      setItems(cached);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading) {
      gsap.from('.category-section', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }
  }, [loading]);

  // Realtime subscription
  useEffect(() => {
    if (!listId) return;
    const subscription = subscribeToList(listId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setItems(prev => {
          if (prev.some(i => i.id === payload.new.id)) return prev;
          return [...prev, payload.new as ListItem];
        });
      } else if (payload.eventType === 'UPDATE') {
        setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as ListItem : i));
      } else if (payload.eventType === 'DELETE') {
        setItems(prev => prev.filter(i => i.id !== payload.old.id));
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [listId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setLayoutMode(prev => {
          const modes: LayoutMode[] = ['compact', 'standard', 'visual'];
          const idx = modes.indexOf(prev);
          if (e.key === 'ArrowLeft') return modes[Math.max(0, idx - 1)];
          return modes[Math.min(2, idx + 1)];
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ListItem[]> = {};
    for (const item of items) {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    
    const sorted: Record<string, ListItem[]> = {};
    const categories = Object.keys(groups).sort((a, b) => {
      const aOrder = groups[a][0]?.category_sort_order || 0;
      const bOrder = groups[b][0]?.category_sort_order || 0;
      return aOrder - bOrder;
    });
    
    for (const cat of categories) {
      sorted[cat] = groups[cat].sort((a, b) => {
        if (checkedBehavior) {
          if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
        }
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
    }
    return sorted;
  }, [items, checkedBehavior]);

  // Running total
  const runningTotal = useMemo(() => {
    return items
      .filter(i => !i.is_checked)
      .reduce((sum, i) => sum + (i.quantity || 1) * (i.estimated_price_cents || 0), 0);
  }, [items]);

  // Handle natural language input
  const handleAddItems = async () => {
    if (!inputText.trim() || !listId) return;
    const parsed = deduplicateParsedItems(parseNaturalLanguage(inputText));
    if (parsed.length === 0) {
      showToast('Could not parse. Try: "3 apples, milk, bread"', 'error');
      return;
    }

    const existingItems = items.map(i => ({ name: i.name, category: i.category }));
    const duplicates = findDuplicates(parsed, existingItems);
    
    if (duplicates.length > 0) {
      const remainingParsed = parsed.filter(p => !duplicates.some(d => normalizeItemName(d.name) === normalizeItemName(p.name)));
      
      if (remainingParsed.length > 0) {
        await createItemsFromParsed(remainingParsed);
      }
      
      const firstDup = duplicates[0];
      const match = items.find(i => normalizeItemName(i.name) === normalizeItemName(firstDup.name));
      if (match) {
        setShowDuplicate(firstDup);
        setDuplicateMatch(match);
        setDuplicateQueue(duplicates.slice(1));
        setInputText('');
      }
      return;
    }

    await createItemsFromParsed(parsed);
    setInputText('');
  };

  const createItemsFromParsed = async (parsedItems: ParsedItem[]) => {
    if (!listId || !user) return;
    
    const newItems = parsedItems.map((p, idx) => ({
      list_id: listId,
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      category: p.category,
      notes: null as string | null,
      estimated_price_cents: p.estimated_price_cents,
      is_checked: false,
      sort_order: items.length + idx,
      category_sort_order: 0,
      added_by: user.id,
    }));

    const tempItems: ListItem[] = newItems.map((ni, idx) => ({
      ...ni,
      id: `temp-${Date.now()}-${idx}`,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    setItems(prev => [...prev, ...tempItems]);

    if (!getOnlineStatus()) {
      for (const ni of newItems) {
        await queueMutation({ type: 'create_item', payload: ni });
        await addCachedItem(tempItems[newItems.indexOf(ni)]);
      }
      showToast('Items saved locally', 'info');
      return;
    }

    try {
      const created = await batchCreateItems(newItems);
      setItems(prev => prev.filter(i => !i.id.startsWith('temp-')).concat(created as ListItem[]));
      await cacheItems(listId, items.filter(i => !i.id.startsWith('temp-')).concat(created as ListItem[]));
    } catch {
      showToast('Failed to add items', 'error');
      setItems(prev => prev.filter(i => !i.id.startsWith('temp-')));
    }
  };

  const handleCheck = async (item: ListItem) => {
    const newChecked = !item.is_checked;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_checked: newChecked } : i));
    
    if (!getOnlineStatus()) {
      await queueMutation({ type: 'check_item', payload: { id: item.id, is_checked: newChecked } });
      await updateCachedItem(item.id, { is_checked: newChecked });
      return;
    }

    try {
      await updateItem(item.id, { is_checked: newChecked });
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_checked: item.is_checked } : i));
    }
  };

  const handleDelete = async (item: ListItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    
    if (!getOnlineStatus()) {
      await queueMutation({ type: 'delete_item', payload: { id: item.id } });
      await deleteCachedItem(item.id);
      return;
    }

    try {
      await deleteItem(item.id);
    } catch {
      setItems(prev => [...prev, item]);
    }
  };

  const handleDuplicateAction = async (action: 'merge' | 'separate' | 'skip') => {
    if (!showDuplicate || !duplicateMatch) {
      setShowDuplicate(null);
      return;
    }
    
    if (action === 'merge') {
      const newQty = duplicateMatch.quantity + showDuplicate.quantity;
      setItems(prev => prev.map(i => i.id === duplicateMatch.id ? { ...i, quantity: newQty } : i));
      await updateItem(duplicateMatch.id, { quantity: newQty });
      showToast('Quantities merged', 'success');
    } else if (action === 'separate') {
      await createItemsFromParsed([showDuplicate]);
    }
    
    if (duplicateQueue.length > 0) {
      const nextDup = duplicateQueue[0];
      const match = items.find(i => normalizeItemName(i.name) === normalizeItemName(nextDup.name));
      if (match) {
        setShowDuplicate(nextDup);
        setDuplicateMatch(match);
        setDuplicateQueue(prev => prev.slice(1));
      } else {
        await createItemsFromParsed([nextDup]);
        setDuplicateQueue(prev => prev.slice(1));
        setShowDuplicate(null);
        setDuplicateMatch(null);
      }
    } else {
      setShowDuplicate(null);
      setDuplicateMatch(null);
    }
  };

  const handleSaveEdit = async (updates: Partial<ListItem>) => {
    if (!showEditItem) return;
    setItems(prev => prev.map(i => i.id === showEditItem.id ? { ...i, ...updates } : i));
    setShowEditItem(null);
    
    if (!getOnlineStatus()) {
      await queueMutation({ type: 'update_item', payload: { id: showEditItem.id, ...updates } });
      await updateCachedItem(showEditItem.id, updates);
      return;
    }

    try {
      await updateItem(showEditItem.id, updates);
    } catch {
      setItems(prev => prev.map(i => i.id === showEditItem.id ? showEditItem : i));
    }
  };

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
        <div className="w-10 h-10 border-3 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="min-h-screen bg-background pb-56 sm:pb-40">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border py-6 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-charcoal hover:text-amber transition-colors">
            <ChevronLeft className="w-6 h-6" />
            <h1 className="text-2xl font-display font-extrabold tracking-tight truncate max-w-[200px] sm:max-w-md">{list.name}</h1>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-warm-100/50 rounded-xl p-1">
              {([
                { mode: 'compact' as LayoutMode, icon: LayoutGrid },
                { mode: 'standard' as LayoutMode, icon: LayoutList },
                { mode: 'visual' as LayoutMode, icon: Columns3 },
              ]).map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setLayoutMode(mode)}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    layoutMode === mode ? 'bg-white text-amber shadow-sm' : 'text-warm-400 hover:text-charcoal'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button onClick={() => setShowSettings(true)} className="p-3 rounded-xl hover:bg-warm-100 text-warm-400 hover:text-charcoal transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setShowShare(true)} className="p-3 rounded-xl hover:bg-warm-100 text-warm-400 hover:text-charcoal transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {items.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-24 h-24 rounded-3xl bg-warm-100 flex items-center justify-center mx-auto mb-8">
              <ClipboardList className="w-12 h-12 text-warm-300" />
            </div>
            <h3 className="text-2xl font-display font-bold text-charcoal mb-2">Empty list</h3>
            <p className="text-sm text-warm-500">Start adding items using the bar below.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category} className="category-section">
                <button
                  onClick={() => toggleCategory(category)}
                  className="category-header w-full flex items-center justify-between mb-6 group"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-warm-300" />
                    <span className="font-display tracking-widest">{category}</span>
                    <span className="text-warm-300 text-[10px] font-bold">[{catItems.length}]</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 text-warm-300 transition-transform duration-500 ${collapsedCategories.has(category) ? '-rotate-90' : ''}`} />
                </button>

                {!collapsedCategories.has(category) && (
                  <div className={layoutMode === 'visual' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
                        onTouchMove={(e) => {
                          const diff = e.touches[0].clientX - (e.currentTarget as any)._touchX;
                          if (diff > 50) {
                            (e.currentTarget as HTMLElement).style.transform = `translateX(${Math.min(diff, 80)}px)`;
                          }
                        }}
                        onTouchEnd={(e) => {
                          const diff = e.changedTouches[0].clientX - (e.currentTarget as any)._touchX;
                          (e.currentTarget as HTMLElement).style.transform = '';
                          if (diff > 70) handleCheck(item);
                        }}
                        className={`
                          group cursor-pointer transition-all duration-500
                          ${layoutMode === 'compact' ? 'flex items-center gap-4 py-3 px-2 border-b border-black/5' : 'card-premium p-5 flex items-center gap-5'}
                          ${item.is_checked ? 'opacity-40 grayscale scale-[0.98]' : ''}
                        `}
                        onClick={() => handleCheck(item)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`
                            shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-300
                            ${layoutMode === 'compact' ? 'w-6 h-6' : 'w-8 h-8'}
                            ${item.is_checked ? 'bg-amber border-amber' : 'border-warm-200 group-hover:border-amber'}
                          `}>
                            {item.is_checked && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
                          </div>

                          {layoutMode === 'visual' && !item.is_checked && (
                            <div className="w-12 h-12 rounded-2xl bg-amber/5 flex items-center justify-center shrink-0">
                              {(() => {
                                const Icon = CATEGORY_ICONS[item.category || 'Other'] || CATEGORY_ICONS.Other;
                                return <Icon className="w-6 h-6 text-amber" />;
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-charcoal tracking-tight ${item.is_checked ? 'line-through text-warm-400' : ''} ${layoutMode === 'compact' ? 'text-base' : 'text-lg'}`}>
                            {item.name}
                          </h4>
                          {item.notes && layoutMode !== 'compact' && (
                            <p className="text-xs font-medium text-warm-400 mt-1 truncate">{item.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {item.quantity > 1 && (
                            <span className="px-3 py-1 rounded-full bg-warm-100 text-warm-600 text-[10px] font-bold uppercase tracking-wider">
                              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                            </span>
                          )}
                          {item.estimated_price_cents && (
                            <span className="font-display font-extrabold text-amber tracking-tighter">
                              {formatPrice(item.estimated_price_cents)}
                            </span>
                          )}
                          
                          <div className="hidden group-hover:flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setShowEditItem(item); }} className="p-2 rounded-lg hover:bg-warm-100 text-warm-400">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="p-2 rounded-lg hover:bg-red-50 text-warm-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 sm:p-10 pointer-events-none">
        <div className="max-w-3xl mx-auto glass-panel rounded-[2.5rem] p-4 sm:p-6 flex flex-col gap-4 pointer-events-auto shadow-2xl shadow-charcoal/10">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddItems(); }}
                placeholder="3 honey crisp apples, whole milk..."
                className="w-full bg-warm-50 border-none rounded-2xl px-6 py-5 text-lg font-medium placeholder:text-warm-300 focus:ring-0"
              />
              {inputText && (
                <button onClick={() => setInputText('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-300 hover:text-charcoal">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button onClick={handleAddItems} disabled={!inputText.trim()} className="w-16 h-16 rounded-2xl bg-charcoal text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
              <Plus className="w-7 h-7" />
            </button>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-400">
                {items.filter(i => i.is_checked).length} of {items.length} secured
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-400 italic">Estimated Total</span>
              <span className="text-3xl font-display font-extrabold text-charcoal tracking-tighter">${(runningTotal / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals - using glass-panel */}
      {showShare && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-charcoal/20 backdrop-blur-sm">
          <div className="glass-panel rounded-[2rem] p-10 w-full max-w-lg relative">
            <h2 className="text-3xl font-display font-extrabold text-charcoal mb-8 tracking-tight">Share List</h2>
            <button onClick={() => setShowShare(false)} className="absolute top-6 right-6 p-2 text-warm-400 hover:text-charcoal"><X className="w-5 h-5" /></button>
            <div className="space-y-8">
              <div className="bg-warm-50 rounded-[1.5rem] p-8 text-center border border-black/5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-warm-400 block mb-4">Invite Code</span>
                <span className="text-5xl font-display font-extrabold text-charcoal tracking-[0.2em]">{list.invite_code}</span>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(list.invite_code); showToast('Code copied!', 'success'); }}
                className="w-full btn-primary"
              >
                Copy Invite Code
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-charcoal/20 backdrop-blur-sm">
          <div className="glass-panel rounded-[2rem] p-10 w-full max-w-lg relative">
            <h2 className="text-3xl font-display font-extrabold text-charcoal mb-8 tracking-tight">List Settings</h2>
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 text-warm-400 hover:text-charcoal"><X className="w-5 h-5" /></button>
            <ListSettingsForm
              list={list}
              onSave={(updates) => { handleUpdateList(updates); setShowSettings(false); }}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}

      {showEditItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-charcoal/20 backdrop-blur-sm">
          <div className="glass-panel rounded-[2rem] p-10 w-full max-w-lg relative">
            <h2 className="text-3xl font-display font-extrabold text-charcoal mb-8 tracking-tight">Edit Item</h2>
            <button onClick={() => setShowEditItem(null)} className="absolute top-6 right-6 p-2 text-warm-400 hover:text-charcoal"><X className="w-5 h-5" /></button>
            <EditItemForm
              item={showEditItem}
              onSave={handleSaveEdit}
              onDelete={handleDelete}
              onClose={() => setShowEditItem(null)}
            />
          </div>
        </div>
      )}

      {showDuplicate && duplicateMatch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-charcoal/20 backdrop-blur-sm">
          <div className="glass-panel rounded-[2.5rem] p-10 w-full max-w-sm text-center">
            <div className="w-20 h-20 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-8 animate-bounce">
              <AlertTriangle className="w-10 h-10 text-amber" />
            </div>
            <h2 className="text-2xl font-display font-bold text-charcoal mb-4 tracking-tight">Already in list</h2>
            <p className="text-sm text-warm-500 mb-10 leading-relaxed">
              "{showDuplicate.name}" is already in your {duplicateMatch.category} category.
            </p>
            <div className="space-y-3">
              <button onClick={() => handleDuplicateAction('merge')} className="w-full btn-primary">Merge quantities</button>
              <button onClick={() => handleDuplicateAction('separate')} className="w-full btn-secondary">Add as separate</button>
              <button onClick={() => handleDuplicateAction('skip')} className="w-full text-warm-400 font-bold uppercase tracking-widest text-[10px] pt-4">Skip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal refactors for forms to match style
function ListSettingsForm({ list, onSave, onClose }: {
  list: ShoppingList;
  onSave: (updates: Partial<ShoppingList>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(list.name);
  const privacy = list.privacy;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ name: name.trim(), privacy }); }} className="space-y-8">
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-warm-500 ml-1">Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full input-field" />
      </div>
      <div className="flex gap-4">
        <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
        <button type="submit" className="flex-1 btn-primary">Save</button>
      </div>
    </form>
  );
}

function EditItemForm({ item, onSave, onDelete, onClose }: {
  item: ListItem;
  onSave: (updates: Partial<ListItem>) => void;
  onDelete: (item: ListItem) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const unit = item.unit || '';
  const category = item.category;
  const [price, setPrice] = useState(item.estimated_price_cents ? (item.estimated_price_cents / 100).toFixed(2) : '');
  const [notes, setNotes] = useState(item.notes || '');

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSave({
        name: name.trim(),
        quantity: parseFloat(quantity) || 1,
        unit: unit || null,
        category: category.trim(),
        estimated_price_cents: price ? Math.round(parseFloat(price) * 100) : null,
        notes: notes.trim() || null,
      });
    }} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-warm-500 ml-1">Item Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full input-field font-bold text-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-warm-500 ml-1">Qty</label>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full input-field" />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-warm-500 ml-1">Price ($)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full input-field" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-warm-500 ml-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full input-field min-h-[100px]" placeholder="Add context..." />
      </div>
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={() => { onDelete(item); onClose(); }} className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
          <Trash2 className="w-6 h-6" />
        </button>
        <button type="submit" className="flex-1 btn-primary">Update Item</button>
      </div>
    </form>
  );
}


}


