-- Bagged — 3-in-1 expansion: Notes + Reminders, plus free-service fix.
-- Safe to run on the existing database (idempotent-ish; uses IF NOT EXISTS where possible).

-- ── Free service: stop the signup trigger from forcing a 5-day trial ──────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, subscription_status, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'active',   -- service is free for everyone
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- ── Notes ─────────────────────────────────────────────────────────────────────
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references users(id) on delete cascade not null,
  title text not null default '',
  body text not null default '',
  color text not null default 'default',
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists notes_owner_idx on notes(owner_id, updated_at desc);

alter table notes enable row level security;

drop policy if exists "Owners manage their notes" on notes;
create policy "Owners manage their notes" on notes for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ── Reminders ───────────────────────────────────────────────────────────────
create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references users(id) on delete cascade not null,
  title text not null,
  notes text,
  due_at timestamp with time zone,
  remind_at timestamp with time zone,
  priority text check (priority in ('none', 'low', 'medium', 'high')) default 'none',
  is_completed boolean not null default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists reminders_owner_idx on reminders(owner_id, due_at);

alter table reminders enable row level security;

drop policy if exists "Owners manage their reminders" on reminders;
create policy "Owners manage their reminders" on reminders for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ── updated_at maintenance ────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists notes_touch_updated_at on notes;
create trigger notes_touch_updated_at before update on notes
  for each row execute procedure public.touch_updated_at();

drop trigger if exists reminders_touch_updated_at on reminders;
create trigger reminders_touch_updated_at before update on reminders
  for each row execute procedure public.touch_updated_at();
