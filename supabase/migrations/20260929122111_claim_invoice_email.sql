-- Marks an invoice as being mailed, unless it has gone out already or another
-- call started sending it in the last ten minutes. Returns whether this caller
-- may send it. Done in the database because the REST API re-applies an OR
-- filter to the rows an update returns, which breaks the same check there.
create or replace function public.claim_invoice_email(p_invoice_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    update public.invoices
       set email_attempted_at = now()
     where id = p_invoice_id
       and emailed_at is null
       and (email_attempted_at is null or email_attempted_at < now() - interval '10 minutes')
    returning 1
  )
  select exists (select 1 from claimed);
$$;
revoke execute on function public.claim_invoice_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_invoice_email(uuid) to service_role;
