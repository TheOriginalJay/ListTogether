import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  list_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  sender?: { full_name: string | null; email: string | null } | null;
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
    .channel(`messages_${listId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `list_id=eq.${listId}` },
      callback)
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'messages', filter: `list_id=eq.${listId}` },
      callback)
    .subscribe();
}
