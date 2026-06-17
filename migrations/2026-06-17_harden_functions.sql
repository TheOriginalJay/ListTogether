-- Optional security hardening (advisor warnings). Safe to run in Supabase SQL Editor.
-- Pins search_path and removes public RPC execute on internal trigger functions.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, avatar_url, subscription_status, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'active',
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Revoke from PUBLIC too (default grant) so these trigger-only functions aren't
-- callable as PostgREST RPC. Triggers don't require EXECUTE, so they keep firing.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.notify_list_owner_on_join() from public, anon, authenticated;
