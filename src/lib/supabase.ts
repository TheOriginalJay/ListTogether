import { createClient } from '@supabase/supabase-js';
import type { User as UserProfile, ShoppingList, ListItem, ListCollaborator as Collaborator } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
export async function getUserLists(): Promise<ShoppingList[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: ownedLists } = await supabase
    .from('lists')
    .select('*, items(count)')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  const { data: collabLists } = await supabase
    .from('list_collaborators')
    .select('list:lists(*)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null);

  const owned = (ownedLists || []) as ShoppingList[];
  const collaborated = ((collabLists || []) as any[])
    .map(c => c.list)
    .filter(Boolean) as ShoppingList[];
  
  const allLists = [...owned];
  for (const list of collaborated) {
    if (!allLists.find(l => l.id === list.id)) {
      allLists.push(list);
    }
  }

  return allLists;
}

export async function createList(name: string, privacy: string): Promise<ShoppingList> {
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

export async function getListById(listId: string): Promise<ShoppingList | null> {
  const { data, error } = await supabase
    .from('lists')
    .select('*, items(*)')
    .eq('id', listId)
    .single();

  if (error) return null;
  return data as ShoppingList;
}

export async function getListByShareToken(token: string): Promise<ShoppingList | null> {
  const { data, error } = await supabase
    .from('lists')
    .select('*, items(*)')
    .eq('share_token', token)
    .eq('privacy', 'link_sharing')
    .single();

  if (error) return null;
  return data as ShoppingList;
}

export async function updateList(listId: string, updates: Partial<ShoppingList>) {
  const { data, error } = await supabase
    .from('lists')
    .update(updates)
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
export async function getCollaborators(listId: string): Promise<Collaborator[]> {
  const { data, error } = await supabase
    .from('list_collaborators')
    .select('*')
    .eq('list_id', listId);

  if (error) throw error;
  return (data || []) as Collaborator[];
}

export async function addCollaborator(listId: string, email: string, role: string): Promise<Collaborator> {
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

// Join by invite code
export async function joinListByCode(code: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: list } = await supabase
    .from('lists')
    .select('id')
    .eq('invite_code', code)
    .single();

  if (!list) throw new Error('Invalid invite code');

  const { error } = await supabase
    .from('list_collaborators')
    .insert({
      list_id: (list as any).id,
      user_id: user.id,
      role: 'editor',
      accepted_at: new Date().toISOString(),
    });

  if (error) throw error;
  return (list as any).id;
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
