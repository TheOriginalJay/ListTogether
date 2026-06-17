import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  list_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  sender?: { full_name: string | null; email: string | null } | null;
}

export interface ListMember {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

function displayName(u: { full_name?: string | null; email?: string | null } | null | undefined): string {
  return u?.full_name || u?.email?.split('@')[0] || 'Member';
}

/** All people on a list: the owner plus accepted collaborators. */
export async function getListMembers(listId: string): Promise<ListMember[]> {
  const { data: list } = await supabase
    .from('lists')
    .select('owner_id, owner:users(full_name, email)')
    .eq('id', listId)
    .single();

  const { data: collabs } = await supabase
    .from('list_collaborators')
    .select('user_id, role, user:users(full_name, email)')
    .eq('list_id', listId);

  const members: ListMember[] = [];
  const seen = new Set<string>();

  if (list?.owner_id) {
    members.push({ id: list.owner_id, name: displayName(list.owner as never), role: 'owner' });
    seen.add(list.owner_id);
  }
  for (const c of collabs || []) {
    if (!c.user_id || seen.has(c.user_id)) continue;
    seen.add(c.user_id);
    members.push({ id: c.user_id, name: displayName(c.user as never), role: c.role === 'viewer' ? 'viewer' : 'editor' });
  }
  return members;
}

export async function getMessages(listId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users(full_name, email)')
    .eq('list_id', listId)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) { console.error('messages:', error); throw error; }
  return (data || []) as ChatMessage[];
}

export async function sendMessage(listId: string, body: string): Promise<ChatMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('messages')
    .insert({ list_id: listId, user_id: user.id, body })
    .select('*, sender:users(full_name, email)')
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw error;
}

export function subscribeMessages(listId: string, callback: () => void) {
  return supabase
    .channel(`messages:${listId}:${crypto.randomUUID()}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `list_id=eq.${listId}` },
      callback)
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'messages', filter: `list_id=eq.${listId}` },
      callback)
    .subscribe();
}
