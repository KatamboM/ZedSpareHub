# Private request dashboard

Open /admin/requests and sign in with a ZedSpareHub account. Seller access does not provide operator access.

An owner must first create and verify a login via Set up owner login on /admin/requests (no seller profile or store is created). After confirming the exact owner email, an administrator can approve that account through Supabase SQL Editor:

```sql
insert into public.request_operators(user_id)
select id from auth.users where email = '<confirmed owner email>'
on conflict (user_id) do nothing;
```

Never approve a user based on user_metadata, seller status or the first signup. Confirm account ownership before granting access.

Operators can search/paginate enquiries and edit only status and private operator notes. Requests cannot be deleted or contact details modified from this dashboard. Public visitors retain insert-only access. WhatsApp is a manual follow-up link and saving does not send messages.

Status meanings: New (unreviewed), Sourcing (checking sellers), Quoted (options/pricing discussed), Closed (no further follow-up). These are sourcing enquiries, not orders.

Concurrent changes are checked against the original status and notes to avoid overwriting another operator's update. Refresh clears the selected detail; unsaved edits are discarded.
