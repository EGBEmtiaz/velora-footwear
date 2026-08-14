create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_bn text not null,
  category text not null check (category in ('shoe','sandal')),
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  badge text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  district text not null,
  payment_method text not null check (payment_method in ('cod','bkash','nagad')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  order_status text not null default 'pending' check (order_status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  subtotal numeric(12,2) not null,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  gateway_payment_id text,
  gateway_transaction_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null
);

create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists orders_status_idx on orders(order_status);
create index if not exists products_active_idx on products(active);

alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Public storefront can read active products; all writes stay server-side.
drop policy if exists "public read active products" on products;
create policy "public read active products" on products
for select to anon, authenticated using (active = true);

-- No public direct access to orders/order_items. Server uses service role.
drop policy if exists "no public orders" on orders;
drop policy if exists "no public order items" on order_items;

insert into products (name,name_bn,category,price,stock,badge)
select 'Velora Classic Heel','Velora Classic হিল','shoe',1290,20,'NEW'
where not exists (select 1 from products);
