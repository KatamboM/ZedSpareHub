create table public.part_requests (
 id uuid primary key,
 buyer_name text not null check (char_length(btrim(buyer_name)) between 2 and 100),
 buyer_phone text not null check (buyer_phone ~ '^\\+260[79][0-9]{8}$'),
 buyer_location text not null check (char_length(btrim(buyer_location)) between 2 and 160),
 car_make text not null check (char_length(btrim(car_make)) between 1 and 60),
 car_model text not null check (char_length(btrim(car_model)) between 1 and 80),
 vehicle_year integer check (vehicle_year between 1950 and 2100),
 engine_code text check (char_length(engine_code) <= 80),
 chassis_number text check (char_length(chassis_number) <= 80),
 part_name text not null check (char_length(btrim(part_name)) between 2 and 200),
 part_number text check (char_length(part_number) <= 100),
 notes text check (char_length(notes) <= 1500),
 status text not null default 'New' check (status in ('New','Sourcing','Quoted','Closed')),
 created_at timestamptz not null default now()
);
alter table public.part_requests enable row level security;
revoke all on public.part_requests from anon, authenticated;
grant insert (id,buyer_name,buyer_phone,buyer_location,car_make,car_model,vehicle_year,engine_code,chassis_number,part_name,part_number,notes) on public.part_requests to anon, authenticated;
create policy "Visitors submit new part requests" on public.part_requests for insert to anon, authenticated with check (status = 'New');
create index part_requests_created_at_idx on public.part_requests (created_at desc);
