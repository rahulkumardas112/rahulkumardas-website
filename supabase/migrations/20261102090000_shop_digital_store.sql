-- TradeKhata Store: database for selling digital products on rahulkumardas.in
-- Run once in Supabase → SQL Editor (project "Rahul Kumar Das").
-- Adds only new shop_* tables and functions. Existing tables are not touched;
-- admin access reuses your existing public.admin_users table.

create table public.shop_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'TradeKhata Store',
  upi_id text,
  payee_name text default 'Rahul Kumar Das',
  support_email text default 'rahulkumardas112@gmail.com',
  updated_at timestamptz default now()
);
insert into public.shop_settings (id) values (1);

create table public.shop_products (
  id bigint generated always as identity primary key,
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  features text[] default '{}',
  price_inr numeric(10,2) not null check (price_inr >= 0),
  mrp_inr numeric(10,2),
  file_format text,
  download_url text,            -- only revealed to buyers after you mark the order paid
  is_active boolean not null default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.shop_orders (
  id bigint generated always as identity primary key,
  order_code text unique not null default ('TK-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))),
  product_id bigint not null references public.shop_products(id),
  product_title text not null,
  amount_inr numeric(10,2) not null,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_email text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text check (customer_phone is null or customer_phone ~ '^[0-9+ -]{7,15}$'),
  utr text not null check (utr ~ '^[0-9A-Za-z]{8,30}$'),
  status text not null default 'pending' check (status in ('pending','paid','rejected')),
  admin_note text,
  created_at timestamptz default now(),
  paid_at timestamptz
);
create index shop_orders_status_idx on public.shop_orders(status, created_at desc);
create unique index shop_orders_utr_uniq on public.shop_orders(utr);

-- Lock the tables; every read and write goes through the functions below.
alter table public.shop_settings enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_orders  enable row level security;
revoke all on public.shop_settings, public.shop_products, public.shop_orders from anon, authenticated;

create or replace function public.shop_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

-- Public: products and payment details for the storefront (never the download link)
create or replace function public.shop_storefront() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'settings', (select jsonb_build_object('store_name', store_name, 'upi_id', upi_id, 'payee_name', payee_name, 'support_email', support_email)
                 from shop_settings where id = 1),
    'products', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'slug', slug, 'title', title, 'subtitle', subtitle,
        'description', description, 'features', features, 'price_inr', price_inr, 'mrp_inr', mrp_inr, 'file_format', file_format)
        order by sort_order, id) from shop_products where is_active), '[]'::jsonb));
$$;

-- Public: buyer submits an order after paying by UPI
create or replace function public.shop_place_order(p_product_id bigint, p_name text, p_email text, p_phone text, p_utr text)
returns text language plpgsql security definer set search_path = public as $$
declare v_prod shop_products; v_code text;
begin
  select * into v_prod from shop_products where id = p_product_id and is_active;
  if not found then raise exception 'This product is not available right now.'; end if;
  if exists (select 1 from shop_orders where utr = trim(p_utr)) then
    raise exception 'This UTR has already been used for an order. Check your order status instead.';
  end if;
  if (select count(*) from shop_orders where customer_email = lower(trim(p_email))
      and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many orders from this email in the last hour. Please try again later.';
  end if;
  insert into shop_orders (product_id, product_title, amount_inr, customer_name, customer_email, customer_phone, utr)
  values (v_prod.id, v_prod.title, v_prod.price_inr, trim(p_name), lower(trim(p_email)), nullif(trim(p_phone), ''), trim(p_utr))
  returning order_code into v_code;
  return v_code;
end $$;

-- Public: buyer checks status with order code + email; download link appears once paid
create or replace function public.shop_check_order(p_code text, p_email text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('order_code', o.order_code, 'product_title', o.product_title, 'amount_inr', o.amount_inr,
    'status', o.status, 'created_at', o.created_at,
    'download_url', case when o.status = 'paid' then p.download_url end,
    'admin_note',   case when o.status = 'rejected' then o.admin_note end)
  from shop_orders o join shop_products p on p.id = o.product_id
  where o.order_code = upper(trim(p_code)) and o.customer_email = lower(trim(p_email));
$$;

-- Admin only (signed-in user listed in admin_users)
create or replace function public.shop_admin_dashboard() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not shop_is_admin() then raise exception 'Not authorised'; end if;
  return jsonb_build_object(
    'settings', (select to_jsonb(s) from shop_settings s where id = 1),
    'products', coalesce((select jsonb_agg(to_jsonb(p) order by sort_order, id) from shop_products p), '[]'::jsonb),
    'orders',   coalesce((select jsonb_agg(to_jsonb(o)) from (select * from shop_orders order by created_at desc limit 500) o), '[]'::jsonb));
end $$;

create or replace function public.shop_admin_set_order(p_id bigint, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not shop_is_admin() then raise exception 'Not authorised'; end if;
  update shop_orders set status = p_status, admin_note = p_note,
    paid_at = case when p_status = 'paid' then now() else null end
  where id = p_id;
end $$;

create or replace function public.shop_admin_save_settings(p_upi text, p_payee text, p_email text, p_store text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not shop_is_admin() then raise exception 'Not authorised'; end if;
  update shop_settings set upi_id = nullif(trim(p_upi), ''), payee_name = p_payee, support_email = p_email,
    store_name = coalesce(nullif(trim(p_store), ''), store_name), updated_at = now() where id = 1;
end $$;

create or replace function public.shop_admin_save_product(p_id bigint, p_price numeric, p_mrp numeric, p_download_url text, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not shop_is_admin() then raise exception 'Not authorised'; end if;
  update shop_products set price_inr = p_price, mrp_inr = p_mrp,
    download_url = nullif(trim(p_download_url), ''), is_active = p_active where id = p_id;
end $$;

revoke execute on function public.shop_is_admin(), public.shop_storefront(),
  public.shop_place_order(bigint, text, text, text, text), public.shop_check_order(text, text),
  public.shop_admin_dashboard(), public.shop_admin_set_order(bigint, text, text),
  public.shop_admin_save_settings(text, text, text, text),
  public.shop_admin_save_product(bigint, numeric, numeric, text, boolean) from public, anon, authenticated;
grant execute on function public.shop_storefront(), public.shop_place_order(bigint, text, text, text, text),
  public.shop_check_order(text, text) to anon, authenticated;
grant execute on function public.shop_admin_dashboard(), public.shop_admin_set_order(bigint, text, text),
  public.shop_admin_save_settings(text, text, text, text),
  public.shop_admin_save_product(bigint, numeric, numeric, text, boolean) to authenticated;

-- First product (price is a starting suggestion; change it from the admin panel)
insert into public.shop_products (slug, title, subtitle, description, features, price_inr, mrp_inr, file_format, sort_order)
values ('tradekhata-journal', 'TradeKhata — Delivery Trader''s Journal',
  'The trading journal built for Indian stock & ETF delivery traders',
  'Log every order, see your real charges, and track every sell-high, buy-back-lower cycle until your quantity is restored. Opens in Excel and Google Sheets.',
  array['Trade Log with automatic STT, stamp duty, exchange, GST and DP charge estimates',
        'Sell-Rebuy Cycle tracker: restored or open, days to restore, net gain per cycle',
        'Holdings with average buy price, realised and unrealised P&L',
        'Year dashboard with month-by-month charts',
        'Weekly discipline review and mood tags to spot FOMO and revenge trades',
        'Editable charge rates for any broker, 500 order rows, lifetime updates'],
  199, 499, 'Excel (.xlsx) · Google Sheets', 1);
