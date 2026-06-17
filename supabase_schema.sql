-- Supabase Database Schema for Bagged (formerly ListTogether)

-- 1. Create the Users table (Profiles)
create table users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  subscription_status text default 'trialing',
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 2. Create the Shopping Lists table
create table lists (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references users(id) on delete cascade not null,
  name text not null,
  privacy text check (privacy in ('private', 'invite_only', 'link_sharing')) default 'private',
  invite_code text unique not null,
  share_token uuid default gen_random_uuid() unique not null,
  budget_cents integer,
  layout_preference text check (layout_preference in ('compact', 'standard', 'visual')) default 'standard',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Create the Items table
create table items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references lists(id) on delete cascade not null,
  name text not null,
  quantity numeric default 1,
  unit text,
  category text default 'Uncategorized',
  notes text,
  estimated_price_cents integer,
  is_checked boolean default false,
  sort_order integer default 0,
  category_sort_order integer default 0,
  added_by uuid references users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Create the Collaborators table
create table list_collaborators (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references lists(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade,
  email text,
  role text default 'editor',
  invited_at timestamp with time zone default now(),
  accepted_at timestamp with time zone
);

-- 5. Enable Row Level Security (RLS)
alter table users enable row level security;
alter table lists enable row level security;
alter table items enable row level security;
alter table list_collaborators enable row level security;

-- 6. Define RLS Policies
create policy "Users can view their own profile" on users for select using (auth.uid() = id);
create policy "Users can update their own profile" on users for update using (auth.uid() = id);
create policy "Users can insert their own profile" on users for insert with check (auth.uid() = id);

-- Lists: Owner + Collaborators can view
create policy "Users can view lists they own or collaborate on" on lists for select using (
  auth.uid() = owner_id or 
  exists (select 1 from list_collaborators where list_id = lists.id and user_id = auth.uid())
);
create policy "Users can create lists" on lists for insert with check (auth.uid() = owner_id);
create policy "Users can update lists they own" on lists for update using (auth.uid() = owner_id);

-- Items: Owner + Collaborators can view and manage
create policy "Users can view items in their lists" on items for select using (
  exists (select 1 from lists where id = items.list_id and (owner_id = auth.uid() or 
    exists (select 1 from list_collaborators where list_id = items.list_id and user_id = auth.uid())))
);
create policy "Users can manage items in their lists" on items for all using (
  exists (select 1 from lists where id = items.list_id and (owner_id = auth.uid() or 
    exists (select 1 from list_collaborators where list_id = items.list_id and user_id = auth.uid())))
);

-- Collaborators: Owner can manage, Users can view their own, and Users can JOIN
create policy "Users can view collaborators for their lists" on list_collaborators for select using (
  exists (select 1 from lists where id = list_collaborators.list_id and owner_id = auth.uid()) or
  user_id = auth.uid()
);
create policy "Users can join a list via invite" on list_collaborators for insert with check (
  auth.uid() = user_id
);
create policy "Owners can manage collaborators" on list_collaborators for all using (
  exists (select 1 from lists where id = list_collaborators.list_id and owner_id = auth.uid())
);

-- 7. Link Sharing Policies (Public Access)
create policy "Anyone can view shared lists" on lists for select using (privacy = 'link_sharing');
create policy "Anyone can view items in shared lists" on items for select using (
  exists (select 1 from lists where id = items.list_id and privacy = 'link_sharing')
);
create policy "Anyone can view profiles of shared list owners" on users for select using (
  exists (select 1 from lists where owner_id = users.id and privacy = 'link_sharing')
);

-- 8. Automation: Create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, subscription_status, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'trialing',
    now() + interval '5 days'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
