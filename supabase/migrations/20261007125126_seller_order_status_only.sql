-- Sellers may update only the status field on orders; buyer and pricing data remain fixed.
revoke update on table public.orders from authenticated;
grant update (status) on table public.orders to authenticated;
