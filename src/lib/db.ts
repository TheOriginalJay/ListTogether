import Dexie, { type Table } from 'dexie';
import type { OfflineMutation, ListItem, ShoppingList } from '@/types';

export interface LocalBackup {
  id: string;
  created_at: number;
  auto: boolean;
  data: string; // JSON string of BackupFile
}

export class BaggedDB extends Dexie {
  mutations!: Table<OfflineMutation>;
  items!: Table<ListItem>;
  lists!: Table<ShoppingList>;
  settings!: Table<{ key: string; value: unknown }>;
  backups!: Table<LocalBackup>;

  constructor() {
    super('BaggedDB');
    this.version(1).stores({
      mutations: 'id, type, created_at, retry_count',
      items: 'id, list_id, category, sort_order, is_checked, updated_at',
      lists: 'id, owner_id, updated_at',
      settings: 'key',
    });
    this.version(2).stores({
      mutations: 'id, type, created_at, retry_count',
      items: 'id, list_id, category, sort_order, is_checked, updated_at',
      lists: 'id, owner_id, updated_at',
      settings: 'key',
      backups: 'id, created_at',
    });
  }
}

export const db = new BaggedDB();

// Offline mutation queue
export async function queueMutation(mutation: Omit<OfflineMutation, 'id' | 'created_at' | 'retry_count'>) {
  const id = crypto.randomUUID();
  await db.mutations.add({
    ...mutation,
    id,
    created_at: Date.now(),
    retry_count: 0,
  });
  return id;
}

export async function getPendingMutations() {
  return db.mutations.orderBy('created_at').toArray();
}

export async function removeMutation(id: string) {
  await db.mutations.delete(id);
}

export async function clearMutationQueue() {
  await db.mutations.clear();
}

export async function incrementRetryCount(id: string) {
  const mutation = await db.mutations.get(id);
  if (mutation) {
    await db.mutations.update(id, { retry_count: mutation.retry_count + 1 });
  }
}

// Local item cache
export async function cacheItems(listId: string, items: ListItem[]) {
  // Remove old items for this list
  await db.items.where('list_id').equals(listId).delete();
  // Add new items
  await db.items.bulkAdd(items);
}

export async function getCachedItems(listId: string): Promise<ListItem[]> {
  return db.items.where('list_id').equals(listId).sortBy('sort_order');
}

export async function updateCachedItem(itemId: string, updates: Partial<ListItem>) {
  await db.items.update(itemId, updates);
}

export async function deleteCachedItem(itemId: string) {
  await db.items.delete(itemId);
}

export async function addCachedItem(item: ListItem) {
  await db.items.add(item);
}

// Local list cache
export async function cacheLists(lists: ShoppingList[]) {
  await db.lists.clear();
  await db.lists.bulkAdd(lists);
}

export async function getCachedLists(): Promise<ShoppingList[]> {
  return db.lists.toArray();
}

// Settings
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const row = await db.settings.get(key);
  return (row?.value as T) ?? defaultValue;
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}

// Connection status
let isOnline = navigator.onLine;

export function getOnlineStatus() {
  return isOnline;
}

export function setOnlineStatus(status: boolean) {
  isOnline = status;
}

window.addEventListener('online', () => { isOnline = true; });
window.addEventListener('offline', () => { isOnline = false; });

// Local on-device backup snapshots
export async function saveLocalBackup(json: string, auto: boolean, keep = 7): Promise<void> {
  await db.backups.add({ id: crypto.randomUUID(), created_at: Date.now(), auto, data: json });
  const all = await db.backups.orderBy('created_at').reverse().toArray();
  const stale = all.slice(keep);
  if (stale.length) await db.backups.bulkDelete(stale.map(b => b.id));
}

export async function getLatestBackup(): Promise<LocalBackup | undefined> {
  return (await db.backups.orderBy('created_at').reverse().limit(1).toArray())[0];
}

export async function listLocalBackups(): Promise<LocalBackup[]> {
  return db.backups.orderBy('created_at').reverse().toArray();
}
