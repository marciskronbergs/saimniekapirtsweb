-- Invoices are mailed through a Make scenario rather than an email API. Its
-- webhook address is kept in Vault as invoice_make_webhook_url (not in this
-- public repository) and handed only to the invoice function. While the
-- secret is absent, invoicing is switched off and no numbers are used.
create or replace function public.invoice_delivery_url()
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'invoice_make_webhook_url';
$$;
revoke execute on function public.invoice_delivery_url() from public, anon, authenticated;
grant execute on function public.invoice_delivery_url() to service_role;
