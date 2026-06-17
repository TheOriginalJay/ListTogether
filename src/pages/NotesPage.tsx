import { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Search, Pin, PinOff, Trash2, X, StickyNote, Lock, LockOpen } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { getNotes, createNote, updateNote, deleteNote, NOTE_COLORS, noteColorBg } from '@/lib/notes';
import { RichTextEditor } from '@/components/RichTextEditor';
import { PinDialog } from '@/components/PinDialog';
import { htmlToText } from '@/lib/html';
import { hasPin, setPin, verifyPin, isUnlocked, unlockSecret, lockSecret } from '@/lib/secret';
import type { Note, NoteColor } from '@/types';

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotesPage() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Note | null>(null);
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [pinDialog, setPinDialog] = useState<{ mode: 'set' | 'enter'; purpose: 'unlock' | 'mark'; note?: Note } | null>(null);

  const load = useCallback(async () => {
    try {
      setNotes(await getNotes());
    } catch {
      showToast('Could not load notes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = useCallback(async () => {
    try {
      const note = await createNote();
      setNotes(prev => [note, ...prev]);
      setActive(note);
    } catch {
      showToast('Could not create note', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    const onCreate = () => handleCreate();
    window.addEventListener('showCreateNote', onCreate);
    return () => window.removeEventListener('showCreateNote', onCreate);
  }, [handleCreate]);

  const applyLocal = (updated: Note) =>
    setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));

  const handleSaved = (updated: Note) => {
    applyLocal(updated);
    // re-sort: pinned first, then most-recently updated
    setNotes(prev =>
      [...prev].sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
    );
  };

  const handleDelete = async (id: string) => {
    const prev = notes;
    setNotes(p => p.filter(n => n.id !== id));
    setActive(null);
    try {
      await deleteNote(id);
      showToast('Note deleted', 'info');
    } catch {
      setNotes(prev);
      showToast('Could not delete note', 'error');
    }
  };

  const togglePin = async (note: Note) => {
    const optimistic = { ...note, is_pinned: !note.is_pinned };
    handleSaved(optimistic);
    try {
      const saved = await updateNote(note.id, { is_pinned: optimistic.is_pinned });
      handleSaved(saved);
    } catch {
      handleSaved(note);
      showToast('Could not update note', 'error');
    }
  };

  const markSecret = async (note: Note, secret: boolean) => {
    handleSaved({ ...note, is_secret: secret });
    setActive(prev => (prev && prev.id === note.id ? { ...prev, is_secret: secret } : prev));
    try {
      const saved = await updateNote(note.id, { is_secret: secret });
      handleSaved(saved);
    } catch {
      handleSaved(note);
      showToast('Could not update note', 'error');
    }
  };

  const toggleSecret = (note: Note) => {
    const target = !note.is_secret;
    if (target && !hasPin()) {
      setPinDialog({ mode: 'set', purpose: 'mark', note });
    } else {
      markSecret(note, target);
    }
  };

  const handlePinSubmit = async (pin: string): Promise<string | null> => {
    if (!pinDialog) return null;
    if (pinDialog.mode === 'set') {
      await setPin(pin);
      unlockSecret();
      setUnlocked(true);
      if (pinDialog.purpose === 'mark' && pinDialog.note) markSecret(pinDialog.note, true);
      setPinDialog(null);
      return null;
    }
    // enter / unlock
    if (await verifyPin(pin)) {
      unlockSecret();
      setUnlocked(true);
      setPinDialog(null);
      return null;
    }
    return 'Wrong PIN';
  };

  const toggleLock = () => {
    if (unlocked) { lockSecret(); setUnlocked(false); }
    else setPinDialog({ mode: 'enter', purpose: 'unlock' });
  };

  const q = query.trim().toLowerCase();
  const base = unlocked ? notes : notes.filter(n => !n.is_secret);
  const hasSecret = notes.some(n => n.is_secret);
  const filtered = q
    ? base.filter(n => n.title.toLowerCase().includes(q) || htmlToText(n.body).toLowerCase().includes(q))
    : base;
  const pinned = filtered.filter(n => n.is_pinned);
  const others = filtered.filter(n => !n.is_pinned);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E0]/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">Notes</h1>
          <div className="flex-1" />
          {(hasPin() || hasSecret) && (
            <button
              onClick={toggleLock}
              title={unlocked ? 'Lock secret notes' : 'Unlock secret notes'}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
                unlocked ? 'border-[#D97706]/40 text-[#D97706] bg-[#D97706]/[0.05]' : 'border-[#E5E5E0] text-[#6B6B5F] hover:text-[#1A1A1A] hover:bg-[#F5F5F0]'
              }`}
            >
              {unlocked ? <LockOpen className="w-4.5 h-4.5" /> : <Lock className="w-4.5 h-4.5" />}
            </button>
          )}
          <button
            onClick={handleCreate}
            className="hidden sm:flex items-center gap-2 h-10 px-4 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> New note
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4BC]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search notes"
              className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
            />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-[#E5E5E0] border-t-[#D97706] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F5F0] flex items-center justify-center mx-auto mb-4">
              <StickyNote className="w-6 h-6 text-[#C4C4BC]" />
            </div>
            <p className="font-semibold text-[#1A1A1A] mb-1">{q ? 'No matching notes' : 'No notes yet'}</p>
            <p className="text-sm text-[#9CA3AF] mb-5">{q ? 'Try a different search.' : 'Capture a thought, list, or idea.'}</p>
            {!q && (
              <button onClick={handleCreate} className="inline-flex items-center gap-2 h-10 px-4 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-all">
                <Plus className="w-4 h-4" /> New note
              </button>
            )}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">Pinned</p>
                <NoteGrid notes={pinned} onOpen={setActive} onTogglePin={togglePin} onToggleSecret={toggleSecret} />
                {others.length > 0 && <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mt-8 mb-3">Others</p>}
              </>
            )}
            <NoteGrid notes={others} onOpen={setActive} onTogglePin={togglePin} onToggleSecret={toggleSecret} />
          </>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={handleCreate}
        className="sm:hidden fixed right-5 bottom-20 z-30 w-14 h-14 rounded-2xl bg-[#D97706] flex items-center justify-center shadow-lg shadow-[#D97706]/30 active:scale-95 transition-all"
        aria-label="New note"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {active && (
        <NoteEditor
          key={active.id}
          note={active}
          onClose={() => setActive(null)}
          onSaved={handleSaved}
          onDelete={handleDelete}
        />
      )}

      {pinDialog && (
        <PinDialog
          mode={pinDialog.mode}
          title={pinDialog.mode === 'set' ? 'Create a PIN' : 'Unlock secret notes'}
          onSubmit={handlePinSubmit}
          onClose={() => setPinDialog(null)}
        />
      )}
    </div>
  );
}

function NoteGrid({ notes, onOpen, onTogglePin, onToggleSecret }: {
  notes: Note[];
  onOpen: (n: Note) => void;
  onTogglePin: (n: Note) => void;
  onToggleSecret: (n: Note) => void;
}) {
  return (
    <div className="columns-2 lg:columns-3 gap-3 sm:gap-4 [column-fill:_balance]">
      {notes.map(note => (
        <button
          key={note.id}
          onClick={() => onOpen(note)}
          className={`group mb-3 sm:mb-4 w-full text-left break-inside-avoid rounded-2xl border border-[#E5E5E0]/70 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all ${noteColorBg(note.color)}`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-[#1A1A1A] text-sm line-clamp-2 flex-1">
              {note.title || 'Untitled'}
            </h3>
            <div className="flex items-center gap-0.5 shrink-0">
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); onToggleSecret(note); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onToggleSecret(note); } }}
                className={`p-1 rounded-lg transition-colors ${note.is_secret ? 'text-[#D97706]' : 'text-[#C4C4BC] opacity-0 group-hover:opacity-100 hover:text-[#1A1A1A]'}`}
                title={note.is_secret ? 'Remove from secret' : 'Make secret'}
              >
                {note.is_secret ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); onTogglePin(note); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onTogglePin(note); } }}
                className={`p-1 rounded-lg transition-colors ${note.is_pinned ? 'text-[#D97706]' : 'text-[#C4C4BC] opacity-0 group-hover:opacity-100 hover:text-[#1A1A1A]'}`}
                title={note.is_pinned ? 'Unpin' : 'Pin'}
              >
                <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-current' : ''}`} />
              </span>
            </div>
          </div>
          {htmlToText(note.body) && (
            <p className="text-xs text-[#6B6B5F] leading-relaxed line-clamp-6 whitespace-pre-wrap">{htmlToText(note.body)}</p>
          )}
          <p className="text-[10px] text-[#9CA3AF] mt-3">{relativeTime(note.updated_at)}</p>
        </button>
      ))}
    </div>
  );
}

function NoteEditor({ note, onClose, onSaved, onDelete }: {
  note: Note;
  onClose: () => void;
  onSaved: (n: Note) => void;
  onDelete: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [color, setColor] = useState<NoteColor>(note.color);
  const [pinned, setPinned] = useState(note.is_pinned);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, body, color, pinned });
  latest.current = { title, body, color, pinned };

  const save = useCallback(async () => {
    try {
      const saved = await updateNote(note.id, {
        title: latest.current.title,
        body: latest.current.body,
        color: latest.current.color,
        is_pinned: latest.current.pinned,
      });
      onSaved(saved);
    } catch {
      showToast('Could not save note', 'error');
    }
  }, [note.id, onSaved, showToast]);

  // Debounced autosave on edits
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [title, body, color, pinned, save]);

  const close = async () => {
    if (timer.current) clearTimeout(timer.current);
    await save();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-6" onClick={close}>
      <div
        className={`w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-screen sm:max-h-[85vh] ${noteColorBg(color)}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-black/5">
          <button onClick={close} className="p-2 rounded-lg hover:bg-black/5 transition-colors text-[#6B6B5F]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setPinned(p => !p)}
            className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${pinned ? 'text-[#D97706]' : 'text-[#6B6B5F]'}`}
            aria-label={pinned ? 'Unpin' : 'Pin'}
          >
            {pinned ? <Pin className="w-5 h-5 fill-current" /> : <PinOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-[#6B6B5F]"
            aria-label="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-xl sm:text-2xl font-semibold text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:outline-none mb-3"
          />
          <RichTextEditor
            initialHtml={note.body}
            onChange={setBody}
            placeholder="Start writing…"
            autoFocus={!title && !note.body}
          />
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-t border-black/5">
          {NOTE_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-7 h-7 rounded-full ${c.bg} ring-2 ${color === c.value ? 'ring-[#1A1A1A]' : c.ring} transition-all`}
              aria-label={c.label}
            />
          ))}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-6" onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-[#1A1A1A] mb-1">Delete this note?</p>
            <p className="text-sm text-[#6B6B5F] mb-5">This can’t be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 h-10 border border-[#E5E5E0] rounded-xl text-sm font-medium text-[#6B6B5F] hover:bg-[#F5F5F0]">Cancel</button>
              <button onClick={() => onDelete(note.id)} className="flex-1 h-10 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
