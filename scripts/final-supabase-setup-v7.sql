-- Final Supabase setup (v7): idempotent, fixes profiles recursion, allows guest checkout.
-- Safe to run multiple times; avoids "policy already exists" errors.

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- SCHEMA ----------------------------------------------------------------------

-- Profiles
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

-- Menu items (kept without RLS for public reads and health checks)
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
  created_at timestamptz default now(),
  item_name text,
  item_description text,
  item_image text
);

-- Ensure menu_item_id is nullable (guest carts may lack real UUIDs)
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

-- INDEXES ---------------------------------------------------------------------

create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- RLS -------------------------------------------------------------------------

-- Enable RLS on protected tables
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Drop ALL existing profiles policies to remove any recursive ones
do $$
declare r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;
end $$;

-- Profiles policies (self-only; avoid reading profiles inside these policies)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_insert_self'
  ) then
    execute $sql$
      create policy "profiles_insert_self"
      on public.profiles
      for insert
      with check (id = auth.uid())
    $sql$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_select_self'
  ) then
    execute $sql$
      create policy "profiles_select_self"
      on public.profiles
      for select
      using (id = auth.uid())
    $sql$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='profiles_update_self'
  ) then
    execute $sql$
      create policy "profiles_update_self"
      on public.profiles
      for update
      using (id = auth.uid())
      with check (id = auth.uid())
    $sql$;
  end if;
end $$;

-- Orders policies (guest insert allowed; reads restricted to owner)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='orders' and policyname='orders_insert_any'
  ) then
    execute $sql$
      create policy "orders_insert_any"
      on public.orders
      for insert
      with check (true)
    $sql$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='orders' and policyname='orders_select_owner'
  ) then
    execute $sql$
      create policy "orders_select_owner"
      on public.orders
      for select
      using (user_id is not distinct from auth.uid())
    $sql$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='orders' and policyname='orders_update_owner'
  ) then
    execute $sql$
      create policy "orders_update_owner"
      on public.orders
      for update
      using (user_id is not distinct from auth.uid())
      with check (user_id is not distinct from auth.uid())
    $sql$;
  end if;
end $$;

-- Order items policies (guest insert allowed; reads restricted via parent order)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='order_items' and policyname='order_items_insert_any'
  ) then
    execute $sql$
      create policy "order_items_insert_any"
      on public.order_items
      for insert
      with check (true)
    $sql$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='order_items' and policyname='order_items_select_owner'
  ) then
    execute $sql$
      create policy "order_items_select_owner"
      on public.order_items
      for select
      using (
        exists (
          select 1 from public.orders o
          where o.order_id = order_items.order_id
            and (o.user_id is not distinct from auth.uid())
        )
      )
    $sql$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='order_items' and policyname='order_items_update_owner'
  ) then
    execute $sql$
      create policy "order_items_update_owner"
      on public.order_items
      for update
      using (
        exists (
          select 1 from public.orders o
          where o.order_id = order_items.order_id
            and (o.user_id is not distinct from auth.uid())
        )
      )
      with check (
        exists (
          select 1 from public.orders o
          where o.order_id = order_items.order_id
            and (o.user_id is not distinct from auth.uid())
        )
      )
    $sql$;
  end if;
end $$;

-- Grants (RLS governs protected tables)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

do $$ begin raise notice 'v7 schema update complete'; end $$;
