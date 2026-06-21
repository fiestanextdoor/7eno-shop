-- Single-use-per-account discount codes. One row per (user, code) records that
-- the user has redeemed that code on a paid order. The unique constraint makes
-- the redemption idempotent (the Stripe webhook can retry safely) and is what
-- enforces "one use per account": the checkout + validation routes refuse a
-- code the signed-in user already has a row for. Written only by the service
-- role (Stripe webhook); each user may read their own rows.

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  code text not null,
  stripe_session_id text,
  redeemed_at timestamptz default now() not null,
  unique (user_id, code)
);

alter table public.coupon_redemptions enable row level security;

create policy "Eigen coupon redemptions lezen" on public.coupon_redemptions
  for select using (auth.uid() = user_id);

create policy "Service role coupon redemptions schrijven" on public.coupon_redemptions
  for insert to service_role with check (true);
