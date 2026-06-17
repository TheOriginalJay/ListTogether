import { supabase } from '@/lib/supabase';
import type { Note, NoteColor } from '@/types';

export async function getNotes(): Promise<Note[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('owner_id', user.id)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
  return (data || []) as Note[];
}

export async function createNote(partial?: Partial<Pick<Note, 'title' | 'body' | 'color'>>): Promise<Note> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .insert({
      owner_id: user.id,
      title: partial?.title ?? '',
      body: partial?.body ?? '',
      color: partial?.color ?? 'default',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, 'title' | 'body' | 'color' | 'is_pinned' | 'is_archived'>>
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

export const NOTE_COLORS: { value: NoteColor; label: string; bg: string; ring: string }[] = [
  { value: 'default', label: 'Default', bg: 'bg-white', ring: 'ring-[#E5E5E0]' },
  { value: 'amber', label: 'Amber', bg: 'bg-[#FEF3C7]', ring: 'ring-[#FCD34D]' },
  { value: 'rose', label: 'Rose', bg: 'bg-[#FFE4E6]', ring: 'ring-[#FDA4AF]' },
  { value: 'green', label: 'Green', bg: 'bg-[#DCFCE7]', ring: 'ring-[#86EFAC]' },
  { value: 'blue', label: 'Blue', bg: 'bg-[#DBEAFE]', ring: 'ring-[#93C5FD]' },
  { value: 'purple', label: 'Purple', bg: 'bg-[#EDE9FE]', ring: 'ring-[#C4B5FD]' },
];

export function noteColorBg(color: NoteColor): string {
  return NOTE_COLORS.find(c => c.value === color)?.bg ?? 'bg-white';
}
