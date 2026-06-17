import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  list_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
}

export interface ListMember {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
}

/** All people on a list (owner + collaborators), names only — never email. */
export async function getListMembers(listId: string): Promise<ListMember[]> {
  const { data, error } = await supabase.rpc('get_list_members', { p_list_id: listId });
  if (error) { console.error('members:', error); return []; }

  const members: ListMember[] = [];
  const seen = new Set<string>();
  for (const m of (data || []) as ListMember[]) {
    if (!m.id || seen.has(m.id)) continue;
    seen.add(m.id);
    members.push(m);
  }
  return members;
}

export async function getMessages(listId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, list_id, user_id, body, created_at')
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
    .select('id, list_id, user_id, body, created_at')
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
