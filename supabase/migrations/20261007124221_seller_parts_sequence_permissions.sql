-- Allow approved seller sessions to insert parts using the table's bigserial id.
grant usage, select on sequence public.parts_id_seq to authenticated;
