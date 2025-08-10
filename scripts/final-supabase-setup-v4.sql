-- Align schema with app behavior; safe to run multiple times.

-- 1) Ensure extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2) Tables that should already exist (from previous setup)
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

-- 3) Order items: add flexible metadata columns and relax FK to allow null menu_item_id
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(order_id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(10,2) not null check (price_at_purchase > 0),
  created_at timestamptz default now()
);

-- 3.a) Make menu_item_id nullable if currently NOT NULL
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

-- 3.b) Add metadata columns if missing
alter table public.order_items
  add column if not exists item_name text,
  add column if not exists item_description text,
  add column if not exists item_image text;

-- 4) Helpful indexes
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- 5) Enable RLS (idempotent)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 6) Policies (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_insert_any'
  ) then
    create policy "orders_insert_any" on public.orders for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_select_owner_or_admin'
  ) then
    create policy "orders_select_owner_or_admin" on public.orders
      for select using (
        user_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_update_owner_or_admin'
  ) then
    create policy "orders_update_owner_or_admin" on public.orders
      for update using (
        user_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_delete_admin'
  ) then
    create policy "orders_delete_admin" on public.orders
      for delete using (
        exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_insert_any'
  ) then
    create policy "order_items_insert_any" on public.order_items for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_select_owner_or_admin'
  ) then
    create policy "order_items_select_owner_or_admin" on public.order_items
      for select using (
        exists (
          select 1 from public.orders o
          where o.order_id = order_items.order_id
            and (
              o.user_id = auth.uid()
              or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin')
            )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_update_owner_or_admin'
  ) then
    create policy "order_items_update_owner_or_admin" on public.order_items
      for update using (
        exists (
          select 1 from public.orders o
          where o.order_id = order_items.order_id
            and (
              o.user_id = auth.uid()
              or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin')
            )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_delete_admin'
  ) then
    create policy "order_items_delete_admin" on public.order_items
      for delete using (
        exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;
end $$;

-- 7) Grants (keep permissive; RLS governs rows)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- 8) Done
do $$ begin raise notice 'v4 schema update complete'; end $$;
