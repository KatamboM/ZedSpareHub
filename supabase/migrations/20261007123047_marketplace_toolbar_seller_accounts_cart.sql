-- Seller onboarding, seller-owned listings/orders, and cart order grouping.
-- This migration is also applied to the connected Supabase project.

create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  whatsapp_phone text,
  location text not null,
  categories text[] not null default '{}',
  estimated_sku_count integer,
  social_link text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.seller_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  application_id uuid unique references public.seller_applications(id),
  store_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'suspended')),
  created_at timestamptz not null default now()
);

alter table public.parts
  add column if not exists seller_user_id uuid;

alter table public.orders
  add column if not exists seller_user_id uuid,
  add column if not exists order_group_id text,
  add column if not exists quantity integer not null default 1 check (quantity > 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'parts_seller_user_id_fkey'
  ) then
    alter table public.parts
      add constraint parts_seller_user_id_fkey
      foreign key (seller_user_id) references public.seller_profiles(user_id);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'orders_seller_user_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_seller_user_id_fkey
      foreign key (seller_user_id) references public.seller_profiles(user_id);
  end if;
end
$$;

alter table public.seller_applications enable row level security;
alter table public.seller_profiles enable row level security;

drop policy if exists "Public can submit seller applications" on public.seller_applications;
create policy "Public can submit seller applications"
  on public.seller_applications for insert to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Sellers can view their own profile" on public.seller_profiles;
create policy "Sellers can view their own profile"
  on public.seller_profiles for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Approved sellers can insert own parts" on public.parts;
create policy "Approved sellers can insert own parts"
  on public.parts for insert to authenticated
  with check (
    seller_user_id = auth.uid()
    and exists (
      select 1 from public.seller_profiles sp
      where sp.user_id = auth.uid() and sp.status = 'approved'
    )
  );

drop policy if exists "Approved sellers can update own parts" on public.parts;
create policy "Approved sellers can update own parts"
  on public.parts for update to authenticated
  using (
    seller_user_id = auth.uid()
    and exists (
      select 1 from public.seller_profiles sp
      where sp.user_id = auth.uid() and sp.status = 'approved'
    )
  )
  with check (
    seller_user_id = auth.uid()
    and exists (
      select 1 from public.seller_profiles sp
      where sp.user_id = auth.uid() and sp.status = 'approved'
    )
  );

drop policy if exists "Public can place orders" on public.orders;
create policy "Public can place orders"
  on public.orders for insert to anon, authenticated
  with check (
    seller_user_id is null
    or exists (
      select 1 from public.parts p
      where p.sku_id = orders.part_sku_id
        and p.seller_user_id = orders.seller_user_id
        and p.part_name = orders.part_name
        and p.part_number is not distinct from orders.part_number
        and p.sell_price_zmw is not distinct from orders.sell_price_zmw
    )
  );

drop policy if exists "Sellers can view own orders" on public.orders;
create policy "Sellers can view own orders"
  on public.orders for select to authenticated
  using (
    seller_user_id = auth.uid()
    and exists (
      select 1 from public.seller_profiles sp
      where sp.user_id = auth.uid() and sp.status = 'approved'
    )
  );

drop policy if exists "Sellers can update own order status" on public.orders;
create policy "Sellers can update own order status"
  on public.orders for update to authenticated
  using (
    seller_user_id = auth.uid()
    and exists (
      select 1 from public.seller_profiles sp
      where sp.user_id = auth.uid() and sp.status = 'approved'
    )
  )
  with check (
    seller_user_id = auth.uid()
    and exists (
      select 1 from public.seller_profiles sp
      where sp.user_id = auth.uid() and sp.status = 'approved'
    )
  );
