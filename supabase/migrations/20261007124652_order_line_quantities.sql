-- Preserve the quantity selected by buyers in cart orders.
alter table public.orders
  add column if not exists quantity integer not null default 1 check (quantity > 0);
