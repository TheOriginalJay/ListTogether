export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'none';
export type PrivacySetting = 'private' | 'invite_only' | 'link_sharing';
export type LayoutMode = 'compact' | 'standard' | 'visual';
export type CollaboratorRole = 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  owner_id: string;
  name: string;
  privacy: PrivacySetting;
  invite_code: string;
  share_token: string;
  budget_cents: number | null;
  layout_preference: LayoutMode;
  created_at: string;
  updated_at: string;
  owner?: User;
  item_count?: number;
  checked_count?: number;
}

export interface ListCollaborator {
  id: string;
  list_id: string;
  user_id: string | null;
  email: string | null;
  role: CollaboratorRole;
  invited_at: string;
  accepted_at: string | null;
  user?: User;
}

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string;
  notes: string | null;
  estimated_price_cents: number | null;
  is_checked: boolean;
  sort_order: number;
  category_sort_order: number;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedItem {
  name: string;
  quantity: number;
  unit: string | null;
  category: string;
  estimated_price_cents: number | null;
}

export interface OfflineMutation {
  id: string;
  type: 'create_item' | 'update_item' | 'delete_item' | 'create_list' | 'update_list' | 'delete_list' | 'check_item';
  payload: Record<string, unknown>;
  created_at: number;
  retry_count: number;
}

export interface AppSettings {
  defaultLayout: LayoutMode;
  moveCheckedToBottom: boolean;
}

// ── Notes ──────────────────────────────────────────────────────────────
export type NoteColor = 'default' | 'amber' | 'rose' | 'green' | 'blue' | 'purple';

export interface Note {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  color: NoteColor;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ── Reminders ──────────────────────────────────────────────────────────
export type ReminderPriority = 'none' | 'low' | 'medium' | 'high';

export interface Reminder {
  id: string;
  owner_id: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  remind_at: string | null;
  priority: ReminderPriority;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
