-- ============================================================================
-- AnimAI — Row Level Security (RLS) policies
-- The backend server uses the Supabase SERVICE ROLE key (bypasses RLS entirely),
-- so these policies exist to protect data if the anon/public key is ever used
-- directly from the frontend (e.g. Supabase Auth session calls from the client).
-- ============================================================================

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.media_files enable row level security;
alter table public.payments enable row level security;
alter table public.usage_logs enable row level security;
alter table public.notifications enable row level security;

-- Users can read/update their own profile row only
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Projects: owner-only access
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- Media files: owner-only
create policy "media_select_own" on public.media_files
  for select using (auth.uid() = user_id);

-- Payments: owner can view their own history, never write directly from client
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

-- Usage logs: owner can view their own usage
create policy "usage_select_own" on public.usage_logs
  for select using (auth.uid() = user_id);

-- Notifications: owner-only, or broadcasts (user_id is null)
create policy "notifications_select_own_or_broadcast" on public.notifications
  for select using (auth.uid() = user_id or user_id is null);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- Admin tables (plans, expenses, logs, app_settings) are intentionally left
-- WITHOUT public policies — they are only ever read/written by the backend
-- using the service role key, and by the admin dashboard through backend
-- admin-only endpoints (never directly from the browser).
