import { useEffect, useState, useCallback } from 'react';
import { Plus, Bell, Check, Trash2, X, Calendar, ChevronDown } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import {
  getReminders, createReminder, updateReminder, toggleReminder, deleteReminder,
  groupReminders, PRIORITY_META,
} from '@/lib/reminders';
import type { Reminder, ReminderPriority } from '@/types';

function fmtDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${time}`;
}

// Convert an ISO string to the value a <input type="datetime-local"> expects (local time).
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function RemindersPage() {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Reminder | 'new' | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(async () => {
    try {
      setReminders(await getReminders());
    } catch {
      showToast('Could not load reminders', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onCreate = () => setEditing('new');
    window.addEventListener('showCreateReminder', onCreate);
    return () => window.removeEventListener('showCreateReminder', onCreate);
  }, []);

  const handleToggle = async (r: Reminder) => {
    const optimistic = { ...r, is_completed: !r.is_completed };
    setReminders(prev => prev.map(x => (x.id === r.id ? optimistic : x)));
    try {
      const saved = await toggleReminder(r.id, optimistic.is_completed);
      setReminders(prev => prev.map(x => (x.id === r.id ? saved : x)));
    } catch {
      setReminders(prev => prev.map(x => (x.id === r.id ? r : x)));
      showToast('Could not update reminder', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const prev = reminders;
    setReminders(p => p.filter(x => x.id !== id));
    setEditing(null);
    try {
      await deleteReminder(id);
      showToast('Reminder deleted', 'info');
    } catch {
      setReminders(prev);
      showToast('Could not delete reminder', 'error');
    }
  };

  const handleSave = async (input: { title: string; notes: string; due_at: string | null; priority: ReminderPriority }, existing: Reminder | null) => {
    try {
      if (existing) {
        const saved = await updateReminder(existing.id, input);
        setReminders(prev => prev.map(x => (x.id === existing.id ? saved : x)));
      } else {
        const created = await createReminder(input);
        setReminders(prev => [created, ...prev]);
      }
      setEditing(null);
    } catch {
      showToast('Could not save reminder', 'error');
    }
  };

  const groups = groupReminders(reminders);
  const sections: { key: string; label: string; items: Reminder[]; tone?: string }[] = [
    { key: 'overdue', label: 'Overdue', items: groups.overdue, tone: 'text-red-600' },
    { key: 'today', label: 'Today', items: groups.today, tone: 'text-[#D97706]' },
    { key: 'upcoming', label: 'Upcoming', items: groups.upcoming },
    { key: 'someday', label: 'No date', items: groups.someday },
  ];
  const activeCount = reminders.filter(r => !r.is_completed).length;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E0]/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] tracking-tight">Reminders</h1>
          {activeCount > 0 && (
            <span className="text-xs font-semibold text-[#9CA3AF] bg-[#F5F5F0] px-2 py-0.5 rounded-md">{activeCount}</span>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setEditing('new')}
            className="hidden sm:flex items-center gap-2 h-10 px-4 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> New reminder
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-[#E5E5E0] border-t-[#D97706] rounded-full animate-spin" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F5F0] flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-[#C4C4BC]" />
            </div>
            <p className="font-semibold text-[#1A1A1A] mb-1">No reminders yet</p>
            <p className="text-sm text-[#9CA3AF] mb-5">Never forget the milk again.</p>
            <button onClick={() => setEditing('new')} className="inline-flex items-center gap-2 h-10 px-4 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-all">
              <Plus className="w-4 h-4" /> New reminder
            </button>
          </div>
        ) : (
          <>
            {sections.filter(s => s.items.length > 0).map(section => (
              <div key={section.key}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${section.tone || 'text-[#9CA3AF]'}`}>
                  {section.label} <span className="text-[#C4C4BC]">· {section.items.length}</span>
                </p>
                <div className="space-y-2">
                  {section.items.map(r => (
                    <ReminderRow key={r.id} reminder={r} onToggle={handleToggle} onOpen={() => setEditing(r)} />
                  ))}
                </div>
              </div>
            ))}

            {groups.completed.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompleted(s => !s)}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3 hover:text-[#1A1A1A] transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCompleted ? '' : '-rotate-90'}`} />
                  Completed · {groups.completed.length}
                </button>
                {showCompleted && (
                  <div className="space-y-2">
                    {groups.completed.map(r => (
                      <ReminderRow key={r.id} reminder={r} onToggle={handleToggle} onOpen={() => setEditing(r)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={() => setEditing('new')}
        className="sm:hidden fixed right-5 bottom-20 z-30 w-14 h-14 rounded-2xl bg-[#D97706] flex items-center justify-center shadow-lg shadow-[#D97706]/30 active:scale-95 transition-all"
        aria-label="New reminder"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {editing && (
        <ReminderForm
          reminder={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function ReminderRow({ reminder, onToggle, onOpen }: {
  reminder: Reminder;
  onToggle: (r: Reminder) => void;
  onOpen: () => void;
}) {
  const overdue = !reminder.is_completed && reminder.due_at && new Date(reminder.due_at) < new Date();
  const pr = PRIORITY_META[reminder.priority];
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#E5E5E0]/60 px-4 py-3 hover:shadow-sm transition-all">
      <button
        onClick={() => onToggle(reminder)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          reminder.is_completed ? 'bg-[#D97706] border-[#D97706]' : 'border-[#D1D5DB] hover:border-[#D97706]'
        }`}
        aria-label={reminder.is_completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {reminder.is_completed && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          {reminder.priority !== 'none' && <span className={`w-2 h-2 rounded-full shrink-0 ${pr.dot}`} />}
          <p className={`text-sm font-medium truncate ${reminder.is_completed ? 'line-through text-[#9CA3AF]' : 'text-[#1A1A1A]'}`}>
            {reminder.title}
          </p>
        </div>
        {(reminder.due_at || reminder.notes) && (
          <div className="flex items-center gap-2 mt-0.5">
            {reminder.due_at && (
              <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-medium' : 'text-[#9CA3AF]'}`}>
                <Calendar className="w-3 h-3" /> {fmtDue(reminder.due_at)}
              </span>
            )}
            {reminder.notes && <span className="text-xs text-[#C4C4BC] truncate">{reminder.notes}</span>}
          </div>
        )}
      </button>
    </div>
  );
}

function ReminderForm({ reminder, onClose, onSave, onDelete }: {
  reminder: Reminder | null;
  onClose: () => void;
  onSave: (input: { title: string; notes: string; due_at: string | null; priority: ReminderPriority }, existing: Reminder | null) => void;
  onDelete: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(reminder?.title ?? '');
  const [notes, setNotes] = useState(reminder?.notes ?? '');
  const [due, setDue] = useState(toLocalInput(reminder?.due_at ?? null));
  const [priority, setPriority] = useState<ReminderPriority>(reminder?.priority ?? 'none');

  const submit = () => {
    if (!title.trim()) { showToast('Give your reminder a title', 'error'); return; }
    onSave(
      {
        title: title.trim(),
        notes: notes.trim(),
        due_at: due ? new Date(due).toISOString() : null,
        priority,
      },
      reminder
    );
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E0]/60">
          <h2 className="font-semibold text-[#1A1A1A]">{reminder ? 'Edit reminder' : 'New reminder'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F5F5F0] text-[#6B6B5F]" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What do you need to remember?"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm font-medium text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
          />

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Due date & time</label>
            <input
              type="datetime-local"
              value={due}
              onChange={e => setDue(e.target.value)}
              className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm font-medium text-[#1A1A1A] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-2">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {(['none', 'low', 'medium', 'high'] as ReminderPriority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-medium capitalize transition-all ${
                    priority === p ? 'border-[#D97706] bg-[#D97706]/[0.05] text-[#1A1A1A]' : 'border-[#E5E5E0] text-[#6B6B5F] hover:border-[#1A1A1A]/20'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${PRIORITY_META[p].dot}`} /> {p}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#C4C4BC] focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:outline-none transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-[#E5E5E0]/60">
          {reminder && (
            <button onClick={() => onDelete(reminder.id)} className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors" aria-label="Delete">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="h-10 px-4 border border-[#E5E5E0] rounded-xl text-sm font-medium text-[#6B6B5F] hover:bg-[#F5F5F0] transition-colors">Cancel</button>
          <button onClick={submit} className="h-10 px-5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] active:scale-95 transition-all">Save</button>
        </div>
      </div>
    </div>
  );
}
