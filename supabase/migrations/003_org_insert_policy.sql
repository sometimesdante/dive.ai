-- Allow any authenticated user to create an organisation.
-- Visibility is already restricted to members via the SELECT policy.
create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.uid() is not null);
