import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft, LayoutGrid, LayoutList, Columns3, Share2,
  Check, Plus, X, Trash2, Edit3,
  AlertTriangle, ClipboardList, Settings, ArrowRight,
  Apple, Droplets, Beef, Croissant, Box, IceCream, Coffee, Bath, Cookie,
  MoreHorizontal, Link2, Copy, CheckCircle2, MessageSquare
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
import { VoiceButton } from '@/components/VoiceButton';
import { ChatPanel } from '@/components/ChatPanel';
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

// Premium color system for categories
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  Produce:   { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
  Dairy:     { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', icon: 'text-sky-500' },
  Meat:      { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-500' },
  Bakery:    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
  Pantry:    { bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-700', icon: 'text-stone-500' },
  Frozen:    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'text-cyan-500' },
  Beverages: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500' },
  Household: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: 'text-violet-500' },
  Snacks:    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' },
  Other:     { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-500' },
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
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditItem, setShowEditItem] = useState<ListItem | null>(null);
  const [showDuplicate, setShowDuplicate] = useState<ParsedItem | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<ListItem | null>(null);
  const [duplicateQueue, setDuplicateQueue] = useState<ParsedItem[]>([]);
  const [checkedBehavior] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

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
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          setLayoutMode(prev => {
            const modes: LayoutMode[] = ['compact', 'standard', 'visual'];
            const idx = modes.indexOf(prev);
            if (e.key === 'ArrowLeft') return modes[Math.max(0, idx - 1)];
            return modes[Math.min(2, idx + 1)];
          });
        }
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

  const checkedCount = items.filter(i => i.is_checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

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
      const finalItems = items.filter(i => !i.id.startsWith('temp-')).concat(created as ListItem[]);
      setItems(finalItems);
      await cacheItems(listId, finalItems);
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

  const copyInviteCode = () => {
    if (list?.invite_code) {
      navigator.clipboard.writeText(list.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showToast('Invite code copied', 'success');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-[#E5E5E0] border-t-[#D97706] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#6B6B5F]">Loading list...</p>
        </div>
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-[280px] sm:pb-[240px]">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E0]/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-3 text-[#1A1A1A] hover:text-[#D97706] transition-colors group shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[#E5E5E0] flex items-center justify-center group-hover:border-[#D97706]/30 group-hover:bg-[#D97706]/5 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <div className="hidden sm:block min-w-0">
                <h1 className="text-lg font-semibold tracking-tight truncate max-w-[200px] lg:max-w-xs">{list.name}</h1>
              </div>
            </button>

            {/* Mobile title - centered */}
            <div className="sm:hidden flex-1 text-center min-w-0">
              <h1 className="text-base font-semibold tracking-tight truncate">{list.name}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden sm:flex bg-[#F5F5F0] rounded-xl p-1 border border-[#E5E5E0]/60">
                {([
                  { mode: 'compact' as LayoutMode, icon: LayoutGrid, label: 'Compact' },
                  { mode: 'standard' as LayoutMode, icon: LayoutList, label: 'Standard' },
                  { mode: 'visual' as LayoutMode, icon: Columns3, label: 'Visual' },
                ]).map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setLayoutMode(mode)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      layoutMode === mode 
                        ? 'bg-white text-[#D97706] shadow-sm border border-[#E5E5E0]' 
                        : 'text-[#9CA3AF] hover:text-[#6B6B5F]'
                    }`}
                    title={mode}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowSettings(true)} 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[#E5E5E0] flex items-center justify-center text-[#6B6B5F] hover:text-[#1A1A1A] hover:border-[#1A1A1A]/20 transition-all"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => setShowChat(true)}
                title="List chat"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-[#E5E5E0] flex items-center justify-center text-[#6B6B5F] hover:text-[#1A1A1A] hover:border-[#1A1A1A]/20 transition-all"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => setShowShare(true)}
                className="h-9 sm:h-10 px-4 bg-[#1A1A1A] text-white rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#333] active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Mobile layout toggle */}
          <div className="sm:hidden flex justify-center mt-3">
            <div className="flex bg-[#F5F5F0] rounded-xl p-1 border border-[#E5E5E0]/60">
              {([
                { mode: 'compact' as LayoutMode, icon: LayoutGrid },
                { mode: 'standard' as LayoutMode, icon: LayoutList },
                { mode: 'visual' as LayoutMode, icon: Columns3 },
              ]).map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setLayoutMode(mode)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    layoutMode === mode 
                      ? 'bg-white text-[#D97706] shadow-sm border border-[#E5E5E0]' 
                      : 'text-[#9CA3AF]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-white border-b border-[#E5E5E0]/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[#F5F5F0] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#D97706] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[#6B6B5F] tabular-nums">
                {checkedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {items.length === 0 ? (
          <div className="text-center py-20 sm:py-32">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#F5F5F0] flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 text-[#C4C4BC]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight mb-2">Start your list</h3>
            <p className="text-sm text-[#6B6B5F] max-w-xs mx-auto leading-relaxed">
              Add items below. Try typing "3 apples, milk, sourdough bread"
            </p>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            {Object.entries(groupedItems).map(([category, catItems]) => {
              const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
              const CatIcon = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
              const isCollapsed = collapsedCategories.has(category);
              const checkedInCat = catItems.filter(i => i.is_checked).length;

              return (
                <div key={category} className="category-section">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between mb-3 sm:mb-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center transition-transform group-hover:scale-105`}>
                        <CatIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.icon}`} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm sm:text-base font-semibold text-[#1A1A1A] tracking-tight">{category}</span>
                        <span className="text-xs text-[#9CA3AF] font-medium">
                          {checkedInCat}/{catItems.length}
                        </span>
                      </div>
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'bg-[#F5F5F0]' : ''}`}>
                      <ChevronLeft className={`w-4 h-4 text-[#9CA3AF] transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className={layoutMode === 'visual' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'}>
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          onTouchStart={(e) => { 
                            (e.currentTarget as any)._touchX = e.touches[0].clientX;
                            (e.currentTarget as any)._touchY = e.touches[0].clientY;
                          }}
                          onTouchMove={(e) => {
                            const diffX = e.touches[0].clientX - (e.currentTarget as any)._touchX;
                            const diffY = e.touches[0].clientY - (e.currentTarget as any)._touchY;
                            if (Math.abs(diffX) > Math.abs(diffY) && diffX > 30) {
                              (e.currentTarget as HTMLElement).style.transform = `translateX(${Math.min(diffX * 0.5, 40)}px)`;
                            }
                          }}
                          onTouchEnd={(e) => {
                            const diffX = e.changedTouches[0].clientX - (e.currentTarget as any)._touchX;
                            (e.currentTarget as HTMLElement).style.transform = '';
                            if (diffX > 70) handleCheck(item);
                          }}
                          className={`
                            group relative cursor-pointer transition-all duration-300 ease-out
                            ${layoutMode === 'compact' ? 'flex items-center gap-3 py-3 px-3 -mx-3 hover:bg-white rounded-2xl' : 'bg-white rounded-2xl border border-[#E5E5E0]/60 p-4 sm:p-5 hover:shadow-lg hover:shadow-[#1A1A1A]/[0.03] hover:border-[#D97706]/20'}
                            ${item.is_checked ? 'opacity-40' : ''}
                            ${activeItemId === item.id ? 'scale-[0.98]' : ''}
                          `}
                          onClick={() => handleCheck(item)}
                          onMouseDown={() => setActiveItemId(item.id)}
                          onMouseUp={() => setActiveItemId(null)}
                          onMouseLeave={() => setActiveItemId(null)}
                        >
                          {/* Checkbox */}
                          <div className={`
                            shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-300
                            ${layoutMode === 'compact' ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'}
                            ${item.is_checked 
                              ? 'bg-[#D97706] border-[#D97706]' 
                              : 'border-[#E5E5E0] group-hover:border-[#D97706]/40'}
                          `}>
                            {item.is_checked && (
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                            )}
                          </div>

                          {/* Visual mode icon */}
                          {layoutMode === 'visual' && !item.is_checked && (
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}>
                              <CatIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon}`} />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-[#1A1A1A] tracking-tight truncate ${item.is_checked ? 'line-through text-[#9CA3AF]' : ''} ${layoutMode === 'compact' ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
                              {item.name}
                            </h4>
                            {item.notes && layoutMode !== 'compact' && (
                              <p className="text-xs text-[#9CA3AF] mt-1 truncate">{item.notes}</p>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {item.quantity > 1 && (
                              <span className="px-2.5 py-1 rounded-lg bg-[#F5F5F0] text-[#6B6B5F] text-xs font-semibold">
                                {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                              </span>
                            )}
                            {item.estimated_price_cents && (
                              <span className="font-semibold text-[#D97706] text-sm sm:text-base tabular-nums">
                                {formatPrice(item.estimated_price_cents)}
                              </span>
                            )}

                            {/* Actions - desktop hover */}
                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowEditItem(item); }} 
                                className="p-2 rounded-lg hover:bg-[#F5F5F0] text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item); }} 
                                className="p-2 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Mobile actions menu */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowEditItem(item); }}
                              className="sm:hidden p-2 text-[#C4C4BC]"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Premium Floating Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#E5E5E0]/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          {/* Progress & Total */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-24 sm:w-32 bg-[#F5F5F0] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#D97706] rounded-full transition-all duration-700" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                {checkedCount} of {totalCount} done
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Total</span>
              <span className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight tabular-nums">
                ${(runningTotal / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Input */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isInputFocused ? 'text-[#D97706]' : 'text-[#C4C4BC]'}`}>
                <Plus className="w-5 h-5" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddItems(); }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Add items: 3 apples, milk, bread..."
                className="w-full bg-[#F5F5F0] rounded-2xl pl-12 pr-14 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all duration-200"
              />
              <VoiceButton
                onText={t => setInputText(prev => (prev ? `${prev}, ${t}` : t))}
                title="Add items by voice"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9"
              />
            </div>
            <button 
              onClick={handleAddItems} 
              disabled={!inputText.trim()}
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-[#333] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat */}
      {showChat && listId && (
        <ChatPanel listId={listId} listName={list?.name || 'List'} onClose={() => setShowChat(false)} />
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#1A1A1A]/30 backdrop-blur-sm" onClick={() => setShowShare(false)}>
          <div 
            className="bg-white w-full sm:w-auto sm:min-w-[420px] sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 shadow-2xl shadow-[#1A1A1A]/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">Share List</h2>
              <button 
                onClick={() => setShowShare(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F0] transition-colors"
              >
                <X className="w-5 h-5 text-[#6B6B5F]" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Invite Code */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Invite Code</label>
                <div className="bg-[#F5F5F0] rounded-2xl p-5 sm:p-6 text-center border border-[#E5E5E0]">
                  <span className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-[0.25em] font-mono">{list.invite_code}</span>
                </div>
                <button 
                  onClick={copyInviteCode}
                  className="w-full mt-3 h-12 bg-[#1A1A1A] text-white rounded-xl font-medium text-sm hover:bg-[#333] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? 'Copied!' : 'Copy Invite Code'}
                </button>
              </div>

              {/* Share Link */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Or share link</label>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/l/${list.share_token}`;
                    navigator.clipboard.writeText(url);
                    showToast('Link copied to clipboard', 'success');
                  }}
                  className="w-full h-12 border border-[#E5E5E0] rounded-xl font-medium text-sm text-[#6B6B5F] hover:border-[#1A1A1A]/30 hover:bg-[#F5F5F0] transition-all flex items-center justify-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Copy View-Only Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#1A1A1A]/30 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div 
            className="bg-white w-full sm:w-auto sm:min-w-[420px] sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 shadow-2xl shadow-[#1A1A1A]/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">List Settings</h2>
              <button 
                onClick={() => setShowSettings(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F0] transition-colors"
              >
                <X className="w-5 h-5 text-[#6B6B5F]" />
              </button>
            </div>
            <ListSettingsForm
              list={list}
              onSave={(updates) => { handleUpdateList(updates); setShowSettings(false); }}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#1A1A1A]/30 backdrop-blur-sm" onClick={() => setShowEditItem(null)}>
          <div 
            className="bg-white w-full sm:w-auto sm:min-w-[420px] sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 shadow-2xl shadow-[#1A1A1A]/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">Edit Item</h2>
              <button 
                onClick={() => setShowEditItem(null)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F0] transition-colors"
              >
                <X className="w-5 h-5 text-[#6B6B5F]" />
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

      {/* Duplicate Modal */}
      {showDuplicate && duplicateMatch && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#1A1A1A]/30 backdrop-blur-sm" onClick={() => setShowDuplicate(null)}>
          <div 
            className="bg-white w-full sm:w-auto sm:max-w-sm sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 shadow-2xl shadow-[#1A1A1A]/10 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-[#D97706]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] tracking-tight mb-2">Already in list</h2>
            <p className="text-sm text-[#6B6B5F] mb-8 leading-relaxed">
              "{showDuplicate.name}" is already in your {duplicateMatch.category} category.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => handleDuplicateAction('merge')} 
                className="w-full h-12 bg-[#1A1A1A] text-white rounded-xl font-medium text-sm hover:bg-[#333] active:scale-[0.98] transition-all"
              >
                Merge quantities ({duplicateMatch.quantity} + {showDuplicate.quantity} = {duplicateMatch.quantity + showDuplicate.quantity})
              </button>
              <button 
                onClick={() => handleDuplicateAction('separate')} 
                className="w-full h-12 border border-[#E5E5E0] rounded-xl font-medium text-sm text-[#6B6B5F] hover:bg-[#F5F5F0] transition-all"
              >
                Add as separate item
              </button>
              <button 
                onClick={() => handleDuplicateAction('skip')} 
                className="w-full h-10 text-[#9CA3AF] font-medium text-sm hover:text-[#6B6B5F] transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Form
function ListSettingsForm({ list, onSave, onClose }: {
  list: ShoppingList;
  onSave: (updates: Partial<ShoppingList>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(list.name);
  const [privacy, setPrivacy] = useState(list.privacy);

  const privacyOptions = [
    { value: 'private', label: 'Private', desc: 'Only you can access' },
    { value: 'invite_only', label: 'Invite Only', desc: 'People with the code can edit' },
    { value: 'link_sharing', label: 'Link Sharing', desc: 'Anyone with the link can view' },
  ];

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ name: name.trim(), privacy }); }} className="space-y-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">List Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3.5 text-sm font-medium text-[#1A1A1A] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-3">Privacy</label>
        <div className="space-y-2">
          {privacyOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPrivacy(opt.value as any)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                privacy === opt.value 
                  ? 'border-[#D97706] bg-[#D97706]/5' 
                  : 'border-[#E5E5E0] hover:border-[#1A1A1A]/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                privacy === opt.value ? 'border-[#D97706]' : 'border-[#E5E5E0]'
              }`}>
                {privacy === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">{opt.label}</p>
                <p className="text-xs text-[#9CA3AF]">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 h-12 border border-[#E5E5E0] rounded-xl font-medium text-sm text-[#6B6B5F] hover:bg-[#F5F5F0] transition-all">
          Cancel
        </button>
        <button type="submit" className="flex-1 h-12 bg-[#1A1A1A] text-white rounded-xl font-medium text-sm hover:bg-[#333] active:scale-[0.98] transition-all">
          Save Changes
        </button>
      </div>
    </form>
  );
}

// Edit Item Form
function EditItemForm({ item, onSave, onDelete, onClose }: {
  item: ListItem;
  onSave: (updates: Partial<ListItem>) => void;
  onDelete: (item: ListItem) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [unit, setUnit] = useState(item.unit || '');
  const [category, setCategory] = useState(item.category || 'Other');
  const [price, setPrice] = useState(item.estimated_price_cents ? (item.estimated_price_cents / 100).toFixed(2) : '');
  const [notes, setNotes] = useState(item.notes || '');

  const UNIT_OPTIONS = ['', 'pcs', 'kg', 'g', 'lb', 'oz', 'L', 'ml', 'cup', 'tbsp', 'tsp', 'pack', 'box', 'bag', 'bottle', 'can', 'bunch', 'loaf', 'dozen'];
  const CATEGORY_OPTIONS = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Household', 'Snacks', 'Other'];

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
    }} className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Item Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3.5 text-base font-semibold text-[#1A1A1A] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Quantity</label>
          <input 
            type="number" 
            value={quantity} 
            onChange={e => setQuantity(e.target.value)} 
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3.5 text-sm font-medium text-[#1A1A1A] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Unit</label>
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3.5 text-sm font-medium text-[#1A1A1A] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all appearance-none"
          >
            {UNIT_OPTIONS.map(u => (
              <option key={u} value={u}>{u === '' ? '— none —' : u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3.5 text-sm font-medium text-[#1A1A1A] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all appearance-none"
          >
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Price ($)</label>
          <input 
            type="number" 
            step="0.01"
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3.5 text-sm font-medium text-[#1A1A1A] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Notes</label>
        <textarea 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3.5 text-sm text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all min-h-[100px] resize-none"
          placeholder="Add context..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          type="button" 
          onClick={() => { onDelete(item); onClose(); }} 
          className="w-14 h-14 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button 
          type="submit" 
          className="flex-1 h-14 bg-[#1A1A1A] text-white rounded-xl font-medium text-sm hover:bg-[#333] active:scale-[0.98] transition-all"
        >
          Update Item
        </button>
      </div>
    </form>
  );
}
