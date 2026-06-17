-- Allow any member of a list (owner or collaborator) to view the full collaborator
-- list, so chat/participants can show everyone. Uses SECURITY DEFINER helpers to
-- avoid RLS recursion on list_collaborators referencing itself.
drop policy if exists "Users can view collaborators for their lists" on list_collaborators;
drop policy if exists "Members can view list collaborators" on list_collaborators;
create policy "Members can view list collaborators" on list_collaborators for select using (
  public.is_list_owner(list_id, auth.uid()) or public.is_list_collaborator(list_id, auth.uid())
);
