-- =====================================================
-- 7ENO Webshop — Supabase Database Schema
-- Voer dit uit in de Supabase SQL Editor
-- =====================================================

-- Profiles (koppelt aan auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  stripe_customer_id text unique,
  created_at timestamptz default now() not null
);

-- Opgeslagen afleveradressen
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text not null,
  country text not null default 'NL',
  is_default boolean default true not null,
  created_at timestamptz default now() not null
);

-- Bestellingen (gevuld door Stripe webhook)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text unique not null,
  printful_order_id text,
  status text not null default 'processing',
  total_amount integer not null,
  currency text not null default 'eur',
  items jsonb not null default '[]',
  shipping_address jsonb,
  created_at timestamptz default now() not null
);

-- Inwisselingen van kortingscodes (één keer per account; gevuld door de
-- Stripe webhook). De unique-constraint dwingt "één keer per account" af.
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  code text not null,
  stripe_session_id text,
  redeemed_at timestamptz default now() not null,
  unique (user_id, code)
);

-- =====================================================
-- Row Level Security
-- =====================================================

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.coupon_redemptions enable row level security;

-- Profiles: eigen rij lezen en updaten
create policy "Eigen profiel lezen" on public.profiles
  for select using (auth.uid() = id);

create policy "Eigen profiel updaten" on public.profiles
  for update using (auth.uid() = id);

-- Addresses: eigen adressen beheren
create policy "Eigen adressen beheren" on public.addresses
  for all using (auth.uid() = user_id);

-- Orders: eigen bestellingen lezen
create policy "Eigen bestellingen lezen" on public.orders
  for select using (auth.uid() = user_id);

-- Coupon redemptions: eigen inwisselingen lezen; alleen de service role
-- (Stripe webhook) mag ze aanmaken.
create policy "Eigen coupon redemptions lezen" on public.coupon_redemptions
  for select using (auth.uid() = user_id);

create policy "Service role coupon redemptions schrijven" on public.coupon_redemptions
  for insert to service_role with check (true);

-- Verwijder oude policies die voor ALLE rollen golden (anon/authenticated konden
-- hierdoor willekeurige orders aanmaken of wijzigen).
drop policy if exists "Service role orders aanmaken" on public.orders;
drop policy if exists "Service role orders updaten" on public.orders;

-- Alleen de service role (Stripe webhook) mag orders aanmaken en updaten.
-- De service role omzeilt RLS sowieso, maar we maken de bedoeling expliciet en
-- voorkomen dat anon/authenticated rollen orders kunnen schrijven.
create policy "Service role orders aanmaken" on public.orders
  for insert to service_role with check (true);

create policy "Service role orders updaten" on public.orders
  for update to service_role using (true);

-- =====================================================
-- Trigger: maak profiel aan bij registratie
-- =====================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
