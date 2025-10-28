-- Create extension for UUIDs if not exists
create extension if not exists "uuid-ossp";

-- USERS
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- AUCTIONS
create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  starting_price numeric(12,2) not null check (starting_price >= 0),
  current_price numeric(12,2) not null check (current_price >= 0),
  currency text not null default 'USD',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active','ended','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SELLS (fixed-price listings)
create table if not exists public.sells (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'USD',
  stock int not null default 1 check (stock >= 0),
  status text not null default 'active' check (status in ('active','sold_out','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id) on delete restrict,
  seller_id uuid not null references public.users(id) on delete restrict,
  source_type text not null check (source_type in ('sell','auction')),
  source_id uuid not null,
  quantity int not null default 1 check (quantity > 0),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'created' check (status in ('created','paid','shipped','completed','cancelled','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_orders_sell foreign key (source_id)
    references public.sells(id) on delete restrict deferrable initially deferred,
  constraint fk_orders_auction foreign key (source_id)
    references public.auctions(id) on delete restrict deferrable initially deferred,
  constraint orders_source_type_consistent check (
    (source_type = 'sell' and exists (select 1 from public.sells s where s.id = source_id)) or
    (source_type = 'auction' and exists (select 1 from public.auctions a where a.id = source_id))
  )
);

-- Triggers for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp_auctions
before update on public.auctions
for each row execute function public.set_updated_at();

create trigger set_timestamp_sells
before update on public.sells
for each row execute function public.set_updated_at();

create trigger set_timestamp_orders
before update on public.orders
for each row execute function public.set_updated_at();

-- Indexes
create index if not exists idx_auctions_seller on public.auctions(seller_id);
create index if not exists idx_sells_seller on public.sells(seller_id);
create index if not exists idx_orders_buyer on public.orders(buyer_id);
create index if not exists idx_orders_seller on public.orders(seller_id);
create index if not exists idx_orders_source on public.orders(source_type, source_id);

-- RLS
alter table public.users enable row level security;
alter table public.auctions enable row level security;
alter table public.sells enable row level security;
alter table public.orders enable row level security;

-- Policies
-- Users: users can see themselves; admins can see all (optional claim: role = 'admin')
create policy if not exists "Users can select self" on public.users
for select using (auth.uid()::uuid = id);

create policy if not exists "Users can insert self" on public.users
for insert with check (true);

create policy if not exists "Users can update self" on public.users
for update using (auth.uid()::uuid = id);

-- Auctions: anyone can read active/ended; only seller can modify
create policy if not exists "Auctions are readable" on public.auctions
for select using (true);

create policy if not exists "Auction seller can insert" on public.auctions
for insert with check (auth.uid()::uuid = seller_id);

create policy if not exists "Auction seller can update" on public.auctions
for update using (auth.uid()::uuid = seller_id);

create policy if not exists "Auction seller can delete" on public.auctions
for delete using (auth.uid()::uuid = seller_id);

-- Sells: anyone can read; only seller can modify
create policy if not exists "Sells are readable" on public.sells
for select using (true);

create policy if not exists "Sell seller can insert" on public.sells
for insert with check (auth.uid()::uuid = seller_id);

create policy if not exists "Sell seller can update" on public.sells
for update using (auth.uid()::uuid = seller_id);

create policy if not exists "Sell seller can delete" on public.sells
for delete using (auth.uid()::uuid = seller_id);

-- Orders: buyers and sellers can see related orders
create policy if not exists "Order participants can read" on public.orders
for select using (
  auth.uid()::uuid = buyer_id or auth.uid()::uuid = seller_id
);

create policy if not exists "Buyer can insert" on public.orders
for insert with check (auth.uid()::uuid = buyer_id);

create policy if not exists "Participants can update" on public.orders
for update using (
  auth.uid()::uuid = buyer_id or auth.uid()::uuid = seller_id
);
