-- Let a user read the profile (name/email) of anyone they share a list with, so chat
-- and the member list can show real names instead of "Member"/"Someone".
-- SECURITY DEFINER avoids RLS recursion across users/list_collaborators.
create or replace function public.shares_any_list(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.lists l
    where (l.owner_id = a or exists (select 1 from public.list_collaborators c where c.list_id = l.id and c.user_id = a))
      and (l.owner_id = b or exists (select 1 from public.list_collaborators c where c.list_id = l.id and c.user_id = b))
  );
$$;

revoke execute on function public.shares_any_list(uuid, uuid) from anon;

drop policy if exists "View co-member profiles" on users;
create policy "View co-member profiles" on users for select using (
  public.shares_any_list(auth.uid(), id)
);
