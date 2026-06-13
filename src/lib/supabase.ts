import { createClient } from '@supabase/supabase-js';
import type { User as UserProfile, ShoppingList, ListItem, ListCollaborator as Collaborator } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type { UserProfile, ShoppingList, ListItem, Collaborator };

// Auth helpers
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as UserProfile | null;
}

// List helpers
export async function getUserLists(): Promise<<ShoppingList[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch lists owned by the user
  const { data: ownedLists, error: ownedError } = await supabase
    .from('lists')
    .select('*, items(count)')
    .eq('owner_id', user.id);

  if (ownedError) console.error('Error fetching owned lists:', ownedError);

  // Fetch lists where the user is a collaborator
  const { data: collabData, error: collabError } = await supabase
    .from('list_collaborators')
    .select('list_id, lists(*, items(count))')
    .eq('user_id', user.id);

  if (collabError) console.error('Error fetching collaborator entries:', collabError);

  // collabData rows have a .lists property (singular join alias → single object)
  const collaboratedLists = (collabData || [])
    .map((c: any) => c.lists)
    .filter(Boolean)
    .flat();

  const allLists = [...(ownedLists || []), ...collaboratedLists];

  // Deduplicate by ID and sort by updated_at
  const uniqueLists = Array.from(new Map(allLists.map((l: any) => [l.id, l])).values());
  return (uniqueLists as any[]).sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ) as ShoppingList[];
}

export async function createList(name: string, privacy: string): Promise<<ShoppingList> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const inviteCode = generateInviteCode();
  const shareToken = crypto.randomUUID();

  const { data, error } = await supabase
    .from('lists')
    .insert({
      owner_id: user.id,
      name,
      privacy,
      invite_code: inviteCode,
      share_token: shareToken,
      layout_preference: 'standard',
    })
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingList;
}

export async function getListById(listId: string): Promise<<ShoppingList | null> {
  const { data, error } = await supabase
    .from('lists')
    .select('*, items(*)')
    .eq('id', listId)
    .single();

  if (error) return null;
  return data as ShoppingList;
}

export async function getListByShareToken(token: string): Promise<<ShoppingList | null> {
  const { data, error } = await supabase
    .from('lists')
    .select('*, items(*), owner:users(full_name, email)')
    .eq('share_token', token)
    .single();

  if (error) return null;
  // Only expose link_sharing lists to public
  const list = data as ShoppingList;
  if (list.privacy !== 'link_sharing') return null;
  return list;
}

export async function updateList(listId: string, updates: Partial<<ShoppingList>) {
  const { data, error } = await supabase
    .from('lists')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', listId)
    .select()
    .single();

  if (error) throw error;
  return data as ShoppingList;
}

export async function deleteList(listId: string) {
  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId);

  if (error) throw error;
}

// Item helpers
export async function getListItems(listId: string): Promise<ListItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', listId)
    .order('category_sort_order', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []) as ListItem[];
}

export async function createItem(item: Omit<ListItem, 'id' | 'created_at' | 'updated_at'>): Promise<ListItem> {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data as ListItem;
}

export async function updateItem(itemId: string, updates: Partial<ListItem>) {
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as ListItem;
}

export async function deleteItem(itemId: string) {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

export async function batchCreateItems(items: Omit<ListItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<ListItem[]> {
  const { data, error } = await supabase
    .from('items')
    .insert(items)
    .select();

  if (error) throw error;
  return (data || []) as ListItem[];
}

// Collaborator helpers
export async function getCollaborators(listId: string): Promise<<Collaborator[]> {
  const { data, error } = await supabase
    .from('list_collaborators')
    .select('*')
    .eq('list_id', listId);

  if (error) throw error;
  return (data || []) as Collaborator[];
}

export async function addCollaborator(listId: string, email: string, role: string): Promise<<Collaborator> {
  const { data, error } = await supabase
    .from('list_collaborators')
    .insert({ list_id: listId, email, role })
    .select()
    .single();

  if (error) throw error;
  return data as Collaborator;
}

export async function removeCollaborator(collaboratorId: string) {
  const { error } = await supabase
    .from('list_collaborators')
    .delete()
    .eq('id', collaboratorId);

  if (error) throw error;
}

// FIXED: Join by invite code — uses security definer RPC to bypass RLS
export async function joinListByCode(code: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const normalizedCode = code.toUpperCase().trim();
  if (normalizedCode.length !== 6) throw new Error('Invite code must be 6 characters');

  // Use RPC to bypass RLS for invite code lookup
  const { data: list, error: listError } = await supabase
    .rpc('get_list_by_invite_code', { p_code: normalizedCode })
    .single();

  if (listError || !list) throw new Error('Invalid invite code');

  // If user is already the owner, just return the list id
  if (list.owner_id === user.id) {
    return list.id;
  }

  // Check if already a collaborator
  const { data: existing, error: existingError } = await supabase
    .from('list_collaborators')
    .select('id')
    .eq('list_id', list.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError) console.error('Error checking existing collaborator:', existingError);

  if (existing) {
    return list.id;
  }

  // Insert as new collaborator
  const { error: insertError } = await supabase
    .from('list_collaborators')
    .insert({
      list_id: list.id,
      user_id: user.id,
      role: 'editor',
      accepted_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error('Error joining list:', insertError);
    throw new Error('Failed to join list. You may already be a member.');
  }

  return list.id;
}

// Realtime subscriptions
export function subscribeToList(listId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`list_${listId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'items',
        filter: `list_id=eq.${listId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToListChanges(listId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`list_meta_${listId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'lists',
        filter: `id=eq.${listId}`,
      },
      callback
    )
    .subscribe();
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
