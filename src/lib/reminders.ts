import { supabase } from '@/lib/supabase';
import type { Reminder, ReminderPriority } from '@/types';

export async function getReminders(): Promise<Reminder[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('owner_id', user.id)
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
  return (data || []) as Reminder[];
}

export async function createReminder(
  input: { title: string; notes?: string | null; due_at?: string | null; priority?: ReminderPriority }
): Promise<Reminder> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      owner_id: user.id,
      title: input.title,
      notes: input.notes ?? null,
      due_at: input.due_at ?? null,
      priority: input.priority ?? 'none',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Reminder;
}

export async function updateReminder(
  id: string,
  updates: Partial<Pick<Reminder, 'title' | 'notes' | 'due_at' | 'priority' | 'is_completed' | 'completed_at'>>
): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Reminder;
}

export async function toggleReminder(id: string, completed: boolean): Promise<Reminder> {
  return updateReminder(id, {
    is_completed: completed,
    completed_at: completed ? new Date().toISOString() : null,
  });
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  if (error) throw error;
}

export type ReminderBucket = 'overdue' | 'today' | 'upcoming' | 'someday' | 'completed';

export interface GroupedReminders {
  overdue: Reminder[];
  today: Reminder[];
  upcoming: Reminder[];
  someday: Reminder[];
  completed: Reminder[];
}

export function groupReminders(reminders: Reminder[]): GroupedReminders {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const groups: GroupedReminders = { overdue: [], today: [], upcoming: [], someday: [], completed: [] };

  for (const r of reminders) {
    if (r.is_completed) { groups.completed.push(r); continue; }
    if (!r.due_at) { groups.someday.push(r); continue; }
    const due = new Date(r.due_at);
    if (due < now) groups.overdue.push(r);
    else if (due <= endOfToday) groups.today.push(r);
    else groups.upcoming.push(r);
  }
  return groups;
}

export const PRIORITY_META: Record<ReminderPriority, { label: string; dot: string; text: string }> = {
  none: { label: 'None', dot: 'bg-[#D1D5DB]', text: 'text-[#9CA3AF]' },
  low: { label: 'Low', dot: 'bg-[#60A5FA]', text: 'text-[#2563EB]' },
  medium: { label: 'Medium', dot: 'bg-[#F59E0B]', text: 'text-[#B45309]' },
  high: { label: 'High', dot: 'bg-[#EF4444]', text: 'text-[#DC2626]' },
};
