-- E-commerce core tables
-- This migration creates user_login, seller, artwork, add_to_cart, orders, and order_items
-- including primary/foreign keys, constraints, and helpful indexes.

begin;

-- Extensions commonly available in Supabase
create extension if not exists "pgcrypto";  -- for gen_random_uuid()
create extension if not exists "citext";    -- for case-insensitive unique emails/usernames

-- Payment status enum
do $$ begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
  end if;
end $$;

-- Users who can authenticate
create table if not exists public.user_login (
  user_id        uuid primary key default gen_random_uuid(),
  username       citext not null unique,
  password_hash  text not null,
  email          citext not null unique,
  created_at     timestamptz not null default now()
);

-- Sellers that list artworks
create table if not exists public.seller (
  seller_id      uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.user_login(user_id) on update cascade on delete cascade,
  store_name     text not null,
  contact_email  citext not null unique,
  bank_details   jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists idx_seller_user_id on public.seller(user_id);

-- Artworks for sale
create table if not exists public.artwork (
  artwork_id      uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references public.seller(seller_id) on update cascade on delete cascade,
  title           text not null,
  description     text,
  price           numeric(12,2) not null check (price >= 0),
  image_url       text,
  stock_quantity  integer not null default 0 check (stock_quantity >= 0),
  is_available    boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_artwork_seller_id on public.artwork(seller_id);
create index if not exists idx_artwork_is_available on public.artwork(is_available);
create index if not exists idx_artwork_price on public.artwork(price);

-- Shopping cart items (temporary pre-checkout)
create table if not exists public.add_to_cart (
  cart_item_id  uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.user_login(user_id) on update cascade on delete cascade,
  artwork_id    uuid not null references public.artwork(artwork_id) on update cascade on delete cascade,
  quantity      integer not null default 1 check (quantity > 0),
  added_at      timestamptz not null default now(),
  unique (user_id, artwork_id)
);

create index if not exists idx_cart_user_id on public.add_to_cart(user_id);
create index if not exists idx_cart_artwork_id on public.add_to_cart(artwork_id);
create index if not exists idx_cart_user_added_at on public.add_to_cart(user_id, added_at desc);

-- Orders (successful transactions)
create table if not exists public.orders (
  order_id         uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.user_login(user_id) on update cascade on delete restrict,
  order_date       timestamptz not null default now(),
  total_amount     numeric(12,2) not null check (total_amount >= 0),
  shipping_address text not null,
  payment_status   payment_status not null default 'pending'
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_order_date on public.orders(order_date desc);
create index if not exists idx_orders_user_date on public.orders(user_id, order_date desc);

-- Order line items
create table if not exists public.order_items (
  order_item_id           uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.orders(order_id) on update cascade on delete cascade,
  artwork_id              uuid not null references public.artwork(artwork_id) on update cascade on delete restrict,
  quantity                integer not null check (quantity > 0),
  unit_price_at_purchase  numeric(12,2) not null check (unit_price_at_purchase >= 0),
  unique (order_id, artwork_id)
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_artwork_id on public.order_items(artwork_id);

commit;
