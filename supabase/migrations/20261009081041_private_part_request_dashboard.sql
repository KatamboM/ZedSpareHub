create table public.request_operators (
user_id uuid primary key references auth.users(id) on delete cascade,
created_at timestamptz not null default now()
);
alter table public.request_operators enable row level security;
revoke all on public.request_operators from anon, authenticated;
grant select on public.request_operators to authenticated;
create policy "Operators view own membership" on public.request_operators for select to authenticated using (user_id = (select auth.uid()));
alter table public.part_requests add column operator_notes text not null default '' check (char_length(operator_notes) <= 3000);
grant select on public.part_requests to authenticated;
grant update (status, operator_notes) on public.part_requests to authenticated;
create policy "Operators view requests" on public.part_requests for select to authenticated using (exists (select 1 from public.request_operators o where o.user_id = (select auth.uid())));
create policy "Operators manage requests" on public.part_requests for update to authenticated using (exists (select 1 from public.request_operators o where o.user_id = (select auth.uid()))) with check (exists (select 1 from public.request_operators o where o.user_id = (select auth.uid())));
create index part_requests_status_created_idx on public.part_requests(status, created_at desc);
