-- ============================================================================
-- AnimAI — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New Query)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- USERS (mirrors auth.users, extended with app-specific profile data)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique not null,
  avatar_url text,
  auth_provider text default 'email',            -- 'email' | 'google' | 'facebook'
  role text not null default 'user',              -- 'user' | 'admin' | 'superadmin'
  status text not null default 'active',          -- 'active' | 'suspended' | 'banned'
  plan_id text not null default 'free_trial',     -- references plans.id
  trial_started_at timestamptz default now(),
  trial_ends_at timestamptz default (now() + interval '4 days'),
  subscription_status text not null default 'trialing', -- trialing | active | past_due | canceled | expired
  billing_cycle text default 'monthly',           -- monthly | yearly
  current_period_start timestamptz default now(),
  current_period_end timestamptz default (now() + interval '4 days'),
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login_at timestamptz
);

create index if not exists idx_users_status on public.users(status);
create index if not exists idx_users_plan on public.users(plan_id);

-- ----------------------------------------------------------------------------
-- PLANS (pricing catalogue — kept in DB so admins can edit without a redeploy)
-- ----------------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key,                     -- 'free_trial' | 'basic' | 'standard' | 'pro'
  name text not null,
  price_monthly_usd numeric(10,2) not null default 0,
  price_yearly_usd numeric(10,2) not null default 0,
  video_hours_per_period numeric(6,2) not null default 0,   -- monthly allotment (or trial-day allotment)
  ai_chats_per_period integer not null default 0,
  ai_images_per_period integer not null default 0,
  voice_minutes_per_period numeric(8,2) not null default 0,
  max_export_resolution text default '720p',
  storage_gb integer not null default 5,
  watermarked boolean not null default true,
  priority_support boolean not null default false,
  is_active boolean not null default true,
  sort_order integer default 0
);

-- ----------------------------------------------------------------------------
-- USAGE LEDGER — every unit of AI usage is logged here; quota checks SUM() this
-- table for the user's current billing period. This is the source of truth
-- for "have they exhausted their plan" enforcement.
-- ----------------------------------------------------------------------------
create table if not exists public.usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,                       -- 'video_seconds' | 'ai_chat' | 'ai_image' | 'voice_seconds'
  amount numeric(12,2) not null,            -- seconds for video/voice, count for chat/image
  project_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_usage_user_type_time on public.usage_logs(user_id, type, created_at);

-- ----------------------------------------------------------------------------
-- PROJECTS
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'Untitled Project',
  script text,
  genre text,
  style text,                               -- '3d' | 'cartoon' | 'realistic' | 'anime' | 'cinematic' | 'watercolor'
  voice_id text,
  duration_seconds integer default 120,
  resolution text default '1080p',
  format text default 'MP4',
  status text not null default 'draft',     -- draft | generating_images | generating_voice | rendering | completed | failed
  thumbnail_url text,
  video_url text,
  audio_url text,
  liked boolean default false,
  render_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_projects_user on public.projects(user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- MEDIA FILES (Supabase Storage references — images, audio, video, thumbnails)
-- ----------------------------------------------------------------------------
create table if not exists public.media_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  bucket text not null,                     -- 'images' | 'audio' | 'videos' | 'thumbnails'
  storage_path text not null,
  file_size_bytes bigint default 0,
  mime_type text,
  created_at timestamptz default now()
);

create index if not exists idx_media_user on public.media_files(user_id);
create index if not exists idx_media_project on public.media_files(project_id);

-- ----------------------------------------------------------------------------
-- PAYMENTS (Paystack + PayPal transaction records)
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,                   -- 'paystack' | 'paypal'
  provider_reference text unique not null,  -- Paystack reference / PayPal order id
  plan_id text references public.plans(id),
  billing_cycle text default 'monthly',
  amount numeric(10,2) not null,
  currency text not null default 'USD',     -- 'NGN' for Paystack, 'USD' for PayPal
  status text not null default 'pending',   -- pending | success | failed | refunded
  raw_payload jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_payments_user on public.payments(user_id, created_at desc);
create index if not exists idx_payments_status on public.payments(status);

-- ----------------------------------------------------------------------------
-- EXPENSES (manually logged or synced API cost line items, for profit tracking)
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  category text not null,                   -- 'stability_ai' | 'fish_audio' | 'hosting' | 'storage' | 'other'
  description text,
  amount_usd numeric(10,2) not null,
  occurred_at timestamptz default now(),
  created_by uuid references public.users(id)
);

-- ----------------------------------------------------------------------------
-- API COST EVENTS (fine-grained, powers the Live Cost Tracker)
-- ----------------------------------------------------------------------------
create table if not exists public.api_cost_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,                   -- 'stability_ai' | 'fish_audio' | 'supabase_storage' | 'hosting'
  user_id uuid references public.users(id),
  units numeric(10,4) not null default 1,
  unit_cost_usd numeric(10,6) not null default 0,
  total_cost_usd numeric(10,4) not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_cost_events_time on public.api_cost_events(created_at desc);
create index if not exists idx_cost_events_provider on public.api_cost_events(provider);

-- ----------------------------------------------------------------------------
-- DEVICE TOKENS (Firebase Cloud Messaging push registration)
-- ----------------------------------------------------------------------------
create table if not exists public.device_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  token text not null unique,
  platform text default 'web',
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS (in-app + push, both user-facing and admin broadcasts)
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade, -- null = broadcast to all
  title text not null,
  body text not null,
  type text default 'info',                 -- info | success | warning | payment | system
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- ADMIN / AUDIT LOGS
-- ----------------------------------------------------------------------------
create table if not exists public.admin_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.users(id),
  action text not null,                     -- 'ban_user' | 'reset_password' | 'update_plan_price' | etc.
  target_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.error_logs (
  id uuid primary key default uuid_generate_v4(),
  source text not null,                     -- 'stability_ai' | 'fish_audio' | 'ffmpeg' | 'paystack' | 'paypal' | 'server'
  user_id uuid references public.users(id),
  message text,
  stack text,
  created_at timestamptz default now()
);

create table if not exists public.login_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  ip_address text,
  device text,
  provider text,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- APP SETTINGS (single-row config the admin dashboard can edit at runtime)
-- ----------------------------------------------------------------------------
create table if not exists public.app_settings (
  id integer primary key default 1,
  maintenance_mode boolean default false,
  maintenance_message text default 'AnimAI is undergoing scheduled maintenance. Please check back shortly.',
  features jsonb default '{"ai_chat": true, "ai_images": true, "ai_video": true, "voice_generation": true}'::jsonb,
  updated_at timestamptz default now(),
  constraint app_settings_singleton check (id = 1)
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- SEED PLAN DATA (see also database/seed.sql)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- OPTIONAL BUT RECOMMENDED: auto-create a public.users row whenever someone
-- signs up via Supabase Auth (email, Google, or Facebook). This removes the
-- dependency on the backend's POST /api/auth/bootstrap-profile fallback route
-- firing at the right time and is the more robust long-term approach.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, auth_provider, trial_ends_at, current_period_end)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    now() + interval '4 days',
    now() + interval '4 days'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
