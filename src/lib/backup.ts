import { supabase } from '@/lib/supabase';
import { getUserLists, getListItems, createList, batchCreateItems } from '@/lib/supabase';
import { getNotes, createNote, updateNote } from '@/lib/notes';
import { getReminders, createReminder } from '@/lib/reminders';
import type { ListItem } from '@/types';

export interface BackupFile {
  app: 'Bagged';
  version: 1;
  exportedAt: string;
  lists: Array<Record<string, unknown> & { items: ListItem[] }>;
  notes: Array<Record<string, unknown>>;
  reminders: Array<Record<string, unknown>>;
}

/** Gather everything the signed-in user owns into a single object. */
export async function buildBackup(): Promise<BackupFile> {
  const [lists, notes, reminders] = await Promise.all([getUserLists(), getNotes(), getReminders()]);
  const listsWithItems = await Promise.all(
    lists.map(async l => ({ ...l, items: await getListItems(l.id) }))
  );
  return {
    app: 'Bagged',
    version: 1,
    exportedAt: new Date().toISOString(),
    lists: listsWithItems as BackupFile['lists'],
    notes: notes as unknown as BackupFile['notes'],
    reminders: reminders as unknown as BackupFile['reminders'],
  };
}

/** Trigger a download of the backup as a .json file. */
export async function exportBackup(): Promise<void> {
  const data = await buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = data.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `bagged-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportResult { lists: number; items: number; notes: number; reminders: number }

/**
 * Restore a backup. Everything is recreated as NEW records owned by the current
 * user (non-destructive — it never overwrites or deletes existing data).
 */
export async function importBackup(file: File): Promise<ImportResult> {
  const text = await file.text();
  let data: BackupFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  if (data?.app !== 'Bagged' || !Array.isArray(data.lists)) {
    throw new Error('This doesn’t look like a Bagged backup.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const result: ImportResult = { lists: 0, items: 0, notes: 0, reminders: 0 };

  // Lists + their items
  for (const l of data.lists) {
    const name = String(l.name ?? 'Imported list');
    const privacy = typeof l.privacy === 'string' ? l.privacy : 'private';
    const newList = await createList(name, privacy);
    result.lists++;

    const items = Array.isArray(l.items) ? l.items : [];
    if (items.length) {
      const payload = items.map((it, i) => ({
        list_id: newList.id,
        name: String(it.name ?? 'Item'),
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        unit: it.unit ?? null,
        category: String(it.category ?? 'Uncategorized'),
        notes: it.notes ?? null,
        estimated_price_cents: typeof it.estimated_price_cents === 'number' ? it.estimated_price_cents : null,
        image_url: (it.image_url as string) ?? null,
        is_checked: !!it.is_checked,
        sort_order: typeof it.sort_order === 'number' ? it.sort_order : i,
        category_sort_order: typeof it.category_sort_order === 'number' ? it.category_sort_order : 0,
        added_by: user.id,
      }));
      const created = await batchCreateItems(payload as Parameters<typeof batchCreateItems>[0]);
      result.items += created.length;
    }
  }

  // Notes
  for (const n of data.notes ?? []) {
    const created = await createNote({
      title: String(n.title ?? ''),
      body: String(n.body ?? ''),
      color: (n.color as never) ?? 'default',
    });
    if (n.is_pinned) await updateNote(created.id, { is_pinned: true });
    result.notes++;
  }

  // Reminders
  for (const r of data.reminders ?? []) {
    await createReminder({
      title: String(r.title ?? 'Reminder'),
      notes: (r.notes as string) ?? null,
      due_at: (r.due_at as string) ?? null,
      priority: (r.priority as never) ?? 'none',
    });
    result.reminders++;
  }

  return result;
}
