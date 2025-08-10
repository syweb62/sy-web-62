-- FINAL Supabase schema for Sushi Yaki
-- Safe to run multiple times (uses IF NOT EXISTS where possible).
-- Creates tables, constraints, indexes, triggers, RLS policies, grants, and minimal seeds.

-- 1) Extensions (Supabase: enabled by default, but keep for idempotency)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2) Tables

-- 2.1) profiles: 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique not null,
  avatar_url text,
  phone text,
  address text,
  role text default 'user' check (role in ('user','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.2) menu_items: items shown on Menu page
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

-- 2.3) orders: captures checkout info
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

-- 2.4) order_items: line items per order
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(order_id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(10,2) not null check (price_at_purchase > 0),
  created_at timestamptz default now()
);

-- 2.5) reservations: table bookings
create table if not exists public.reservations (
  reservation_id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  date date not null,
  time time not null,
  people_count integer not null check (people_count > 0),
  created_at timestamptz default now()
);

-- 2.6) social_media_links: footer/header social icons
create table if not exists public.social_media_links (
  id uuid primary key default uuid_generate_v4(),
  platform_name text not null,
  link text not null,
  button_type text,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 3) Indexes
create index if not exists idx_menu_items_category on public.menu_items(category);
create index if not exists idx_menu_items_available on public.menu_items(is_available);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_reservations_user_id on public.reservations(user_id);
create index if not exists idx_reservations_date on public.reservations(date);
create index if not exists idx_social_media_display_order on public.social_media_links(display_order);

-- 4) Triggers and functions

-- 4.1) Generic updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4.2) Attach updated_at to profiles and menu_items
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_menu_items_updated_at on public.menu_items;
create trigger update_menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.update_updated_at_column();

-- 4.3) Auto-create profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, created_at, updated_at)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), now(), now())
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reservations enable row level security;
alter table public.social_media_links enable row level security;

-- 6) Policies (idempotent creation via guarded DO blocks)

-- 6.1) profiles: public select; user can insert/update self
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_public'
  ) then
    create policy "profiles_select_public" on public.profiles
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_self'
  ) then
    create policy "profiles_insert_self" on public.profiles
      for insert with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_self'
  ) then
    create policy "profiles_update_self" on public.profiles
      for update using (auth.uid() = id);
  end if;
end $$;

-- 6.2) menu_items: public read; admin write/delete
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_select_public'
  ) then
    create policy "menu_items_select_public" on public.menu_items
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_insert_admin'
  ) then
    create policy "menu_items_insert_admin" on public.menu_items
      for insert with check (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_update_admin'
  ) then
    create policy "menu_items_update_admin" on public.menu_items
      for update using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_delete_admin'
  ) then
    create policy "menu_items_delete_admin" on public.menu_items
      for delete using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      );
  end if;
end $$;

-- 6.3) orders: guests can insert; owner can select/update; admin full
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_insert_any'
  ) then
    create policy "orders_insert_any" on public.orders
      for insert with check (true);
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

-- 6.4) order_items: owner via order; admin full
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_insert_any'
  ) then
    create policy "order_items_insert_any" on public.order_items
      for insert with check (true);
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

-- 6.5) reservations: public insert; owner select/update; admin full
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservations' and policyname='reservations_insert_any'
  ) then
    create policy "reservations_insert_any" on public.reservations
      for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservations' and policyname='reservations_select_owner_or_admin'
  ) then
    create policy "reservations_select_owner_or_admin" on public.reservations
      for select using (
        user_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservations' and policyname='reservations_update_owner_or_admin'
  ) then
    create policy "reservations_update_owner_or_admin" on public.reservations
      for update using (
        user_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservations' and policyname='reservations_delete_admin'
  ) then
    create policy "reservations_delete_admin" on public.reservations
      for delete using (
        exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;
end $$;

-- 6.6) social_media_links: public read; admin write/delete
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='social_media_links' and policyname='social_links_select_public'
  ) then
    create policy "social_links_select_public" on public.social_media_links
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='social_media_links' and policyname='social_links_insert_admin'
  ) then
    create policy "social_links_insert_admin" on public.social_media_links
      for insert with check (
        exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='social_media_links' and policyname='social_links_update_admin'
  ) then
    create policy "social_links_update_admin" on public.social_media_links
      for update using (
        exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='social_media_links' and policyname='social_links_delete_admin'
  ) then
    create policy "social_links_delete_admin" on public.social_media_links
      for delete using (
        exists (select 1 from public.profiles where id = auth.uid() and role='admin')
      );
  end if;
end $$;

-- 7) Grants (RLS still enforces record-level access)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- Ensure future tables get same privileges
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- 8) Seeds (idempotent)

-- 8.1) Minimal menu_items, only if table is empty
insert into public.menu_items (name, description, price, category, image_url, is_available)
select
  'Salmon Sashimi',
  'Fresh Atlantic salmon, thinly sliced',
  18.99,
  'Sashimi',
  '/placeholder.svg?height=300&width=400',
  true
where not exists (select 1 from public.menu_items);

insert into public.menu_items (name, description, price, category, image_url, is_available)
values
('Tuna Sashimi','Premium bluefin tuna', 22.99, 'Sashimi', '/placeholder.svg?height=300&width=400', true),
('California Roll','Crab, avocado, cucumber', 12.99, 'Sushi Rolls', '/placeholder.svg?height=300&width=400', true)
on conflict do nothing;

-- 8.2) Social media links, if none
insert into public.social_media_links (platform_name, link, button_type, display_order)
select 'Instagram', 'https://instagram.com/your-restaurant', 'icon', 1
where not exists (select 1 from public.social_media_links);

insert into public.social_media_links (platform_name, link, button_type, display_order)
values
('Facebook','https://facebook.com/your-restaurant','icon',2),
('TikTok','https://tiktok.com/@your-restaurant','icon',3)
on conflict do nothing;

-- 9) Notice
do $$
begin
  raise notice 'Supabase schema setup complete.';
end $$;
