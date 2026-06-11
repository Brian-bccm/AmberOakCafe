-- Amber & Oak Cafe full-stack schema
-- Run this in the Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  category text not null default 'Brunch',
  tag text not null default 'Signature',
  image_url text,
  customization_options jsonb not null default '[]'::jsonb,
  is_available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  reservation_date date not null,
  reservation_time time not null,
  guests integer not null check (guests > 0),
  notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  order_type text not null default 'pickup' check (order_type in ('pickup','delivery','dine-in')),
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','completed','cancelled')),
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  customizations jsonb not null default '{}'::jsonb,
  notes text,
  line_total numeric(10,2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();

drop trigger if exists set_reservations_updated_at on public.reservations;
create trigger set_reservations_updated_at before update on public.reservations for each row execute function public.set_updated_at();

drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create index if not exists menu_items_display_order_idx on public.menu_items(display_order, name);
create index if not exists reservations_date_idx on public.reservations(reservation_date, reservation_time);
create index if not exists reservations_status_idx on public.reservations(status);
create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);
create index if not exists orders_status_idx on public.orders(status, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_menu_item_id_idx on public.order_items(menu_item_id);

alter table public.menu_items enable row level security;
alter table public.reservations enable row level security;
alter table public.contact_messages enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant select on public.menu_items to anon, authenticated;
grant insert on public.reservations to anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant insert on public.order_items to anon, authenticated;
grant select, insert, update, delete on public.menu_items to authenticated;
grant select, update, delete on public.reservations to authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select, update, delete on public.orders to authenticated;
grant select, update, delete on public.order_items to authenticated;

create policy "Public can view available menu items" on public.menu_items
  for select to anon, authenticated
  using (is_available = true or public.is_admin());

create policy "Admins manage menu items" on public.menu_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can create reservations" on public.reservations
  for insert to anon, authenticated
  with check (true);

create policy "Admins manage reservations" on public.reservations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can create contact messages" on public.contact_messages
  for insert to anon, authenticated
  with check (true);

create policy "Admins manage contact messages" on public.contact_messages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can create orders" on public.orders
  for insert to anon, authenticated
  with check (true);

create policy "Admins manage orders" on public.orders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can create order items" on public.order_items
  for insert to anon, authenticated
  with check (true);

create policy "Admins manage order items" on public.order_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
