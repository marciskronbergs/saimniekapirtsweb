-- When the office cancels a booking, the invoice function asks the Make
-- scenario the old CRM used on delete to take the booking off the Google
-- Calendar. Its webhook address is kept in Vault as
-- booking_cancelled_webhook_url; while that is absent, nothing is sent.
create or replace function public.booking_cancelled_url()
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'booking_cancelled_webhook_url';
$$;
revoke execute on function public.booking_cancelled_url() from public, anon, authenticated;
grant execute on function public.booking_cancelled_url() to service_role;
