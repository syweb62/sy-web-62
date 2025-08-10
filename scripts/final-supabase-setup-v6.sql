-- Final Supabase setup (v6): fixes profiles policy recursion by using a helper function.
-- Safe to run multiple times (idempotent).

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Profiles (used by the app and RLS helper)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  name text,
  avatar_url text,
  phone text,
  address text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  order_id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  phone text,
  address text,
  payment_method text,
  status text default 'pending' check (status in ('pending','processing','completed','cancelled')),
  total_price numeric(10,2) not null check (total_price >= 0),
  subtotal numeric(10,2),
  discount numeric(10,2) default 0,
  vat numeric(10,2) default 0,
  delivery_charge numeric(10,2) default 0,
  message text,
  created_at timestamptz default now()
);

-- Menu items (used by health check and optional FK)
create table if not exists public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price > 0),
  category text,
  image_url text,
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(order_id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(10,2) not null check (price_at_purchase >= 0),
  created_at timestamptz default now()
);

-- Ensure menu_item_id is nullable for guest carts that don't carry menu UUIDs
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'order_items'
      and column_name  = 'menu_item_id'
      and is_nullable  = 'NO'
  ) then
    alter table public.order_items alter column menu_item_id drop not null;
  end if;
end $$;

-- Cart metadata columns
alter table public.order_items
  add column if not exists item_name text,
  add column if not exists item_description text,
  add column if not exists item_image text;

-- Indexes
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- Enable RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.profiles enable row level security;

-- Helper to avoid recursive profiles policy: check admin status without triggering RLS
-- Note: Using security definer here is deliberate to prevent recursion in RLS policies.
-- Supabase recommends avoiding security definer for Auth Hooks; this is a database helper, not an Auth Hook. [^1]
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- Drop legacy policies that referenced profiles directly (to prevent recursion)
do $$
begin
  -- Orders
  if exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_select_owner_or_admin') then
    drop policy "orders_select_owner_or_admin" on public.orders;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_update_owner_or_admin') then
    drop policy "orders_update_owner_or_admin" on public.orders;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_delete_admin') then
    drop policy "orders_delete_admin" on public.orders;
  end if;

  -- Order items
  if exists (select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_select_owner_or_admin') then
    drop policy "order_items_select_owner_or_admin" on public.order_items;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_update_owner_or_admin') then
    drop policy "order_items_update_owner_or_admin" on public.order_items;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_delete_admin') then
    drop policy "order_items_delete_admin" on public.order_items;
  end if;

  -- Profiles
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_self_or_admin') then
    drop policy "profiles_select_self_or_admin" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_self_or_admin') then
    drop policy "profiles_update_self_or_admin" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_self') then
    drop policy "profiles_insert_self" on public.profiles;
  end if;
end $$;

-- Recreate policies using is_admin() helper (no recursion)

-- Orders
create policy "orders_insert_any"
  on public.orders
  for insert
  with check (true);

create policy "orders_select_owner_or_admin"
  on public.orders
  for select
  using (
    (user_id is not distinct from auth.uid())
    or public.is_admin(auth.uid())
  );

create policy "orders_update_owner_or_admin"
  on public.orders
  for update
  using (
    (user_id is not distinct from auth.uid())
    or public.is_admin(auth.uid())
  );

create policy "orders_delete_admin"
  on public.orders
  for delete
  using (public.is_admin(auth.uid()));

-- Order items
create policy "order_items_insert_any"
  on public.order_items
  for insert
  with check (true);

create policy "order_items_select_owner_or_admin"
  on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.order_id = order_items.order_id
        and (
          (o.user_id is not distinct from auth.uid())
          or public.is_admin(auth.uid())
        )
    )
  );

create policy "order_items_update_owner_or_admin"
  on public.order_items
  for update
  using (
    exists (
      select 1 from public.orders o
      where o.order_id = order_items.order_id
        and (
          (o.user_id is not distinct from auth.uid())
          or public.is_admin(auth.uid())
        )
    )
  );

create policy "order_items_delete_admin"
  on public.order_items
  for delete
  using (public.is_admin(auth.uid()));

-- Profiles (no self-referencing queries)
create policy "profiles_insert_self"
  on public.profiles
  for insert
  with check (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_select_self_or_admin"
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_update_self_or_admin"
  on public.profiles
  for update
  using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));

-- Grants (RLS governs row access)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

do $$ begin raise notice 'v6 schema update complete'; end $$;
