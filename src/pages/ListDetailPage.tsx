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
      // Fallback to cache
      const cached = await getCachedItems(listId);
      setItems(cached);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    
    // Sort categories and items
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

    // Check for duplicates
    const existingItems = items.map(i => ({ name: i.name, category: i.category }));
    const duplicates = findDuplicates(parsed, existingItems);
    
    if (duplicates.length > 0) {
      const remainingParsed = parsed.filter(p => !duplicates.some(d => normalizeItemName(d.name) === normalizeItemName(p.name)));
      
      // Add non-duplicates first
      if (remainingParsed.length > 0) {
        await createItemsFromParsed(remainingParsed);
      }
      
      // Start duplicate resolution queue
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

    // Optimistic update
    const tempItems: ListItem[] = newItems.map((ni, idx) => ({
      ...ni,
      id: `temp-${Date.now()}-${idx}`,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    setItems(prev => [...prev, ...tempItems]);

    if (!getOnlineStatus()) {
      // Queue for later
      for (const ni of newItems) {
        await queueMutation({ type: 'create_item', payload: ni });
        await addCachedItem(tempItems[newItems.indexOf(ni)]);
      }
      showToast('Items saved locally. Will sync when online.', 'info');
      return;
    }

    try {
      const created = await batchCreateItems(newItems);
      setItems(prev => prev.filter(i => !i.id.startsWith('temp-')).concat(created as ListItem[]));
      await cacheItems(listId, items.filter(i => !i.id.startsWith('temp-')).concat(created as ListItem[]));
      showToast(`${created.length} item${created.length !== 1 ? 's' : ''} added`, 'success');
    } catch {
      showToast('Failed to add items', 'error');
      setItems(prev => prev.filter(i => !i.id.startsWith('temp-')));
    }
  };

  // Toggle check
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

  // Delete item
  const handleDelete = async (item: ListItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    
    if (!getOnlineStatus()) {
      await queueMutation({ type: 'delete_item', payload: { id: item.id } });
      await deleteCachedItem(item.id);
      return;
    }

    try {
      await deleteItem(item.id);
      showToast('Item deleted', 'info');
    } catch {
      setItems(prev => [...prev, item]);
    }
  };

  // Handle duplicate resolution
  const handleDuplicateAction = async (action: 'merge' | 'separate' | 'skip') => {
    if (!showDuplicate || !duplicateMatch) {
      setShowDuplicate(null);
      return;
    }
    
    if (action === 'merge') {
      const newQty = duplicateMatch.quantity + showDuplicate.quantity;
      setItems(prev => prev.map(i => 
        i.id === duplicateMatch.id ? { ...i, quantity: newQty } : i
      ));
      await updateItem(duplicateMatch.id, { quantity: newQty });
      showToast('Quantities merged', 'success');
    } else if (action === 'separate') {
      await createItemsFromParsed([showDuplicate]);
    }
    
    // Process next in queue
    if (duplicateQueue.length > 0) {
      const nextDup = duplicateQueue[0];
      const match = items.find(i => normalizeItemName(i.name) === normalizeItemName(nextDup.name));
      if (match) {
        setShowDuplicate(nextDup);
        setDuplicateMatch(match);
        setDuplicateQueue(prev => prev.slice(1));
      } else {
        // Match not found (shouldn't happen but for safety)
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

  // Save edited item
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
      showToast('Item updated', 'success');
    } catch {
      setItems(prev => prev.map(i => i.id === showEditItem.id ? showEditItem : i));
    }
  };

  // Toggle category collapse
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
          <p className="text-warm-600 mb-4">List not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalDollars = (runningTotal / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-cream pb-40 sm:pb-28">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-warm-200 shadow-[0_1px_4px_rgba(45,42,38,0.04)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-charcoal hover:text-amber transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold text-base truncate max-w-[150px] sm:max-w-[250px]">{list.name}</span>
          </button>
          
          <div className="flex items-center gap-2">
            {/* Layout toggle */}
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
                  title={`${mode} layout`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-warm-100 text-warm-400 hover:text-charcoal transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="p-2 rounded-lg hover:bg-warm-100 text-warm-400 hover:text-charcoal transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* List Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-pale flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-amber" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-1">This list is empty</h3>
            <p className="text-sm text-warm-600">Add items using the input bar below</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="category-header w-full flex items-center justify-between mb-2 cursor-pointer hover:bg-warm-200/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-warm-400 cursor-grab" />
                    <span>{category}</span>
                    <span className="text-warm-400">({catItems.length})</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 text-warm-400 transition-transform ${collapsedCategories.has(category) ? '-rotate-90' : ''}`} />
                </button>

                {/* Items */}
                {!collapsedCategories.has(category) && (
                  <div className={layoutMode === 'visual' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-2'}>
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          (e.currentTarget as any)._touchX = touch.clientX;
                        }}
                        onTouchMove={(e) => {
                          const touch = e.touches[0];
                          const startX = (e.currentTarget as any)._touchX || 0;
                          const diff = touch.clientX - startX;
                          if (diff > 50) {
                            (e.currentTarget as HTMLElement).style.transform = `translateX(${Math.min(diff, 100)}px)`;
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                          }
                        }}
                        onTouchEnd={(e) => {
                          const touch = e.changedTouches[0];
                          const startX = (e.currentTarget as any)._touchX || 0;
                          const diff = touch.clientX - startX;
                          (e.currentTarget as HTMLElement).style.transform = '';
                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                          if (diff > 80) {
                            handleCheck(item);
                          }
                          (e.currentTarget as any)._touchX = 0;
                        }}
                        className={`
                          transition-transform duration-200
                          ${layoutMode === 'compact' ? 'flex items-center gap-3 py-2 px-1 border-b border-warm-100' : ''}
                          ${layoutMode === 'standard' ? 'card-surface p-3 flex items-center gap-3' : ''}
                          ${layoutMode === 'visual' ? 'card-surface p-4 flex flex-col gap-2' : ''}
                          ${item.is_checked ? 'opacity-60' : ''}
                          group cursor-pointer
                        `}
                        onClick={() => handleCheck(item)}
                      >
                        {/* Checkbox */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCheck(item); }}
                            className={`
                              shrink-0 rounded-lg border-2 flex items-center justify-center transition-all
                              ${layoutMode === 'compact' ? 'w-5 h-5' : layoutMode === 'visual' ? 'w-7 h-7' : 'w-6 h-6'}
                              ${item.is_checked ? 'bg-amber border-amber animate-check-pulse' : 'border-warm-200 hover:border-amber'}
                            `}
                          >
                            {item.is_checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </button>

                          {layoutMode === 'visual' && !item.is_checked && (
                            <div className="w-8 h-8 rounded-lg bg-amber-pale flex items-center justify-center">
                              {(() => {
                                const Icon = CATEGORY_ICONS[item.category || 'Other'] || CATEGORY_ICONS.Other;
                                return <Icon className="w-4 h-4 text-amber" />;
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 min-w-0 ${layoutMode === 'visual' ? '' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-charcoal ${item.is_checked ? 'line-through text-warm-400' : ''} ${layoutMode === 'compact' ? 'text-sm' : layoutMode === 'visual' ? 'text-base' : ''}`}>
                              {item.name}
                            </span>
                          </div>
                          {item.notes && layoutMode !== 'compact' && (
                            <p className="text-xs text-warm-400 mt-0.5 truncate">{item.notes}</p>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.quantity > 1 && (
                            <span className={`px-2 py-0.5 rounded-full bg-warm-100 text-warm-600 font-medium ${layoutMode === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                            </span>
                          )}
                          {item.estimated_price_cents ? (
                            <span className={`font-semibold text-amber ${layoutMode === 'compact' ? 'text-xs' : 'text-sm'}`}>
                              {formatPrice(item.estimated_price_cents)}
                            </span>
                          ) : null}
                          
                          {/* Actions (hover) */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowEditItem(item); }}
                              className="p-1 rounded hover:bg-warm-100 text-warm-400 hover:text-charcoal"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                              className="p-1 rounded hover:bg-red-50 text-warm-400 hover:text-brand-red"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Natural Language Input Bar + Running Total */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-16 bg-white border-t border-warm-200 z-50 shadow-[0_-2px_8px_rgba(45,42,38,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Input */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddItems(); }}
                placeholder="Type items: 3 apples, 2% milk, bread..."
                className="w-full input-field pr-10"
              />
              {inputText && (
                <button
                  onClick={() => setInputText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-charcoal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleAddItems}
              disabled={!inputText.trim()}
              className="btn-primary py-2.5 px-4 text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
          
          {/* Running Total */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-warm-600">
              {items.filter(i => i.is_checked).length}/{items.length} checked
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-warm-600">Est. Total:</span>
              <span className="text-lg font-bold text-amber" aria-live="polite">
                ${totalDollars}
              </span>
            </div>
          </div>
        </div>
        {/* Mobile bottom nav spacer */}
        <div className="sm:hidden h-14" />
      </div>

      {/* Share Modal */}
      {showShare && list && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal">Share List</h2>
              <button onClick={() => setShowShare(false)} className="text-warm-400 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {list.privacy === 'private' ? (
                <div className="bg-amber-pale border border-amber/20 rounded-xl p-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-amber" />
                  </div>
                  <h3 className="font-bold text-charcoal mb-1">Sharing is Disabled</h3>
                  <p className="text-xs text-warm-600 mb-4">
                    This list is Private. To share it with others, you need to change the privacy setting.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpdateList({ privacy: 'invite_only' })}
                      className="w-full btn-primary text-xs py-2.5"
                    >
                      Switch to Invite-Only
                    </button>
                    <button
                      onClick={() => handleUpdateList({ privacy: 'link_sharing' })}
                      className="w-full btn-secondary text-xs py-2.5"
                    >
                      Switch to Link Sharing
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {list.privacy === 'invite_only' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold text-xs">Invite-Only Mode</span>
                      </div>
                      <p className="text-[11px] text-blue-600/80 mb-2">
                        Only people with the code can join. The public link below is disabled.
                      </p>
                      <button
                        onClick={() => handleUpdateList({ privacy: 'link_sharing' })}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Enable public link sharing instead?
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-charcoal mb-2 block">6-Digit Invite Code</label>
                    <div className="bg-warm-100 rounded-xl p-4 text-center">
                      <span className="text-3xl font-bold text-charcoal tracking-[0.1em]">{list.invite_code}</span>
                    </div>
                    <p className="text-xs text-warm-400 mt-1">Co-shoppers enter this code to join</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(list.invite_code); showToast('Code copied!', 'success'); }}
                      className="btn-secondary text-xs mt-2 w-full"
                    >
                      Copy Code
                    </button>
                  </div>
                  
                  <div className={list.privacy === 'invite_only' ? 'opacity-40 grayscale pointer-events-none' : ''}>
                    <label className="text-sm font-semibold text-charcoal mb-2 block">Public View Link</label>
                    <div className="bg-warm-100 rounded-xl p-3 text-sm text-warm-600 truncate">
                      {window.location.origin}/l/{list.share_token}
                    </div>
                    <p className="text-xs text-warm-400 mt-1">Anyone with this link can view without signing in</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/l/${list.share_token}`); showToast('Link copied!', 'success'); }}
                      className="btn-secondary text-xs mt-2 w-full"
                    >
                      Copy Link
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && list && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal">List Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-warm-400 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <ListSettingsForm
              list={list}
              onSave={(updates) => {
                handleUpdateList(updates);
                setShowSettings(false);
              }}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-charcoal">Edit Item</h2>
              <button onClick={() => setShowEditItem(null)} className="text-warm-400 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            <EditItemForm
              item={showEditItem}
              onSave={handleSaveEdit}
              onDelete={handleDelete}
              onClose={() => setShowEditItem(null)}
            />
          </div>
        </div>
      )}

      {/* Duplicate Detection Modal */}
      {showDuplicate && duplicateMatch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-modal text-center">
            <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-brand-orange" />
            </div>
            <h2 className="text-lg font-bold text-charcoal mb-2">Already on your list</h2>
            <p className="text-sm text-warm-600 mb-6">
              "{showDuplicate.name}" is already in the {duplicateMatch.category} category with quantity {duplicateMatch.quantity}.
            </p>
            <div className="space-y-2">
              <button onClick={() => handleDuplicateAction('merge')} className="w-full btn-primary">
                Merge quantities
              </button>
              <button onClick={() => handleDuplicateAction('separate')} className="w-full btn-secondary">
                Add as separate item
              </button>
              <button onClick={() => handleDuplicateAction('skip')} className="w-full text-warm-600 text-sm py-2 hover:text-charcoal">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// List Settings Form Component
function ListSettingsForm({ list, onSave, onClose }: {
  list: ShoppingList;
  onSave: (updates: Partial<ShoppingList>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(list.name);
  const [privacy, setPrivacy] = useState(list.privacy);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || list.name,
      privacy,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium text-charcoal mb-1.5 block">List Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full input-field"
          placeholder="Enter list name..."
        />
      </div>

      <div>
        <label className="text-sm font-medium text-charcoal mb-3 block">Privacy Settings</label>
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
                onClick={() => setPrivacy(option.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  privacy === option.value
                    ? 'border-amber bg-amber-pale'
                    : 'border-warm-200 hover:border-warm-400'
                }`}
              >
                <OptIcon className={`w-5 h-5 ${privacy === option.value ? 'text-amber' : 'text-warm-400'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-charcoal">{option.label}</p>
                  <p className="text-xs text-warm-400">{option.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 btn-secondary">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 btn-primary"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

// Edit Item Form Component
function EditItemForm({ item, onSave, onDelete, onClose }: {
  item: ListItem;
  onSave: (updates: Partial<ListItem>) => void;
  onDelete: (item: ListItem) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [unit, setUnit] = useState(item.unit || '');
  const [category, setCategory] = useState(item.category);
  const [price, setPrice] = useState(item.estimated_price_cents ? (item.estimated_price_cents / 100).toFixed(2) : '');
  const [notes, setNotes] = useState(item.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const units = ['', 'ea', 'lb', 'oz', 'gal', 'qt', 'pt', 'kg', 'g', 'ml', 'L', 'pack', 'bunch', 'dozen', 'box', 'bag', 'can', 'bottle', 'jar', 'loaf'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || item.name,
      quantity: parseFloat(quantity) || 1,
      unit: unit || null,
      category: category.trim() || item.category,
      estimated_price_cents: price ? Math.round(parseFloat(price) * 100) : null,
      notes: notes.trim() || null,
    });
  };

  if (showDeleteConfirm) {
    return (
      <div className="text-center">
        <p className="text-charcoal mb-2">Delete "{item.name}"?</p>
        <p className="text-sm text-warm-600 mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={() => { onDelete(item); onClose(); }} className="flex-1 bg-brand-red text-white rounded-full py-3 font-medium hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-charcoal mb-1 block">Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full input-field" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-charcoal mb-1 block">Quantity</label>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full input-field" min="0.1" step="0.1" />
        </div>
        <div className="w-28">
          <label className="text-sm font-medium text-charcoal mb-1 block">Unit</label>
          <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full input-field">
            {units.map(u => <option key={u} value={u}>{u || '—'}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-charcoal mb-1 block">Category</label>
        <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full input-field" />
      </div>
      <div>
        <label className="text-sm font-medium text-charcoal mb-1 block">Price ($)</label>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full input-field" min="0" step="0.01" placeholder="0.00" />
      </div>
      <div>
        <label className="text-sm font-medium text-charcoal mb-1 block">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full input-field min-h-[60px] resize-none" placeholder="Optional notes..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-4 py-3 text-brand-red font-medium hover:bg-red-50 rounded-full transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
        <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
        <button type="submit" className="flex-1 btn-primary">Save</button>
      </div>
    </form>
  );
}


