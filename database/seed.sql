-- ============================================================================
-- AnimAI — Seed data: pricing plans
-- Run after schema.sql. Safe to re-run (upsert on id).
-- ============================================================================

insert into public.plans
  (id, name, price_monthly_usd, price_yearly_usd, video_hours_per_period, ai_chats_per_period,
   ai_images_per_period, voice_minutes_per_period, max_export_resolution, storage_gb,
   watermarked, priority_support, is_active, sort_order)
values
  ('free_trial', 'Free Trial (4 Days)', 0, 0, 2, 20, 5, 10, '720p', 1, true, false, true, 0),
  -- Free trial numbers above are DAILY caps (1 video/day up to 30 min = ~2h/4days budget guard,
  -- 20 chats/day, 5 images/day, 10 voice min/day). The quota service treats free_trial specially
  -- and resets these counters every 24h instead of monthly — see backend/src/services/quotaService.js
  ('basic', 'Basic', 9.99, 99.99, 5, 500, 300, 1200, '720p', 20, false, false, true, 1),
  ('standard', 'Standard', 19.99, 199.99, 15, 2000, 1000, 4000, '1080p', 100, false, true, true, 2),
  ('pro', 'Pro', 39.99, 399.99, 30, 10000, 3000, 8000, '4K', 500, false, true, true, 3)
on conflict (id) do update set
  name = excluded.name,
  price_monthly_usd = excluded.price_monthly_usd,
  price_yearly_usd = excluded.price_yearly_usd,
  video_hours_per_period = excluded.video_hours_per_period,
  ai_chats_per_period = excluded.ai_chats_per_period,
  ai_images_per_period = excluded.ai_images_per_period,
  voice_minutes_per_period = excluded.voice_minutes_per_period,
  max_export_resolution = excluded.max_export_resolution,
  storage_gb = excluded.storage_gb,
  watermarked = excluded.watermarked,
  priority_support = excluded.priority_support;

-- Approximate third-party unit costs used by the Live Cost Tracker to estimate
-- spend in real time. Adjust these to your actual negotiated rates.
-- (Referenced directly in backend/src/services/costTracker.js as fallback defaults;
-- this table lets an admin override them without a redeploy.)
create table if not exists public.api_unit_costs (
  provider text primary key,
  unit_label text not null,
  unit_cost_usd numeric(10,6) not null
);

insert into public.api_unit_costs (provider, unit_label, unit_cost_usd) values
  ('stability_ai', 'per image', 0.04),
  ('fish_audio', 'per voice-minute', 0.015),
  ('hosting', 'per hour (avg)', 0.02),
  ('supabase_storage', 'per GB-month', 0.021)
on conflict (provider) do update set unit_cost_usd = excluded.unit_cost_usd;
