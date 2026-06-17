-- Bagged — social layer: notifications + in-list chat.

-- ── Notifications ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamp with time zone default now()
);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc);
alter table notifications enable row level security;

drop policy if exists "Own notifications" on notifications;
create policy "Own notifications" on notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Chat messages ─────────────────────────────────────────────────────────────
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references lists(id) on delete cascade not null,
  user_id uuid references users(id) on delete set null,
  body text not null,
  created_at timestamp with time zone default now()
);
create index if not exists messages_list_idx on messages(list_id, created_at);
alter table messages enable row level security;

drop policy if exists "Members read messages" on messages;
create policy "Members read messages" on messages for select using (
  exists (select 1 from lists where id = messages.list_id and (owner_id = auth.uid()
    or exists (select 1 from list_collaborators where list_id = messages.list_id and user_id = auth.uid())))
);

drop policy if exists "Members send messages" on messages;
create policy "Members send messages" on messages for insert with check (
  user_id = auth.uid() and exists (select 1 from lists where id = messages.list_id and (owner_id = auth.uid()
    or exists (select 1 from list_collaborators where list_id = messages.list_id and user_id = auth.uid())))
);

drop policy if exists "Delete own messages" on messages;
create policy "Delete own messages" on messages for delete using (user_id = auth.uid());

-- ── Notify the list owner when someone joins ─────────────────────────────────
create or replace function public.notify_list_owner_on_join()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_list_name text;
  v_joiner text;
begin
  select owner_id, name into v_owner, v_list_name from public.lists where id = new.list_id;
  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;
  select coalesce(full_name, email) into v_joiner from public.users where id = new.user_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_owner,
    'join',
    'New collaborator',
    coalesce(v_joiner, 'Someone') || ' joined "' || coalesce(v_list_name, 'a list') || '"',
    '/list/' || new.list_id
  );
  return new;
end;
$$;

drop trigger if exists list_collab_join_notify on list_collaborators;
create trigger list_collab_join_notify after insert on list_collaborators
  for each row execute procedure public.notify_list_owner_on_join();

-- ── Realtime ──────────────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
