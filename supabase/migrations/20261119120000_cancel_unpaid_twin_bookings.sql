-- A guest who leaves the card payment page and books again leaves the first,
-- unpaid booking holding a sauna; an hour later it turns into a booking by
-- bank transfer and its invoice goes out too (Inkeri, 9.01.2027).
--
-- When a card payment for a booking goes through, the same guest's other
-- booking for the same service, day and part of the day that was also meant
-- to be paid by card and never was is cancelled through the invoice
-- function's cancel action, as the office's cancel button does: the booking
-- goes, its invoice (if any) is annulled and it comes off the calendar.
--
-- Only such twins are touched. A guest who books both saunas on purpose, by
-- bank transfer or in cash, keeps both bookings.

create or replace function public.cancel_unpaid_twins()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_paid public.reservations;
  v_twin record;
  v_pin text;
begin
  if new.status is distinct from 'paid' or old.status = 'paid' or new.source_type <> 'reservation' then
    return new;
  end if;

  select * into v_paid from public.reservations where id = new.source_id;
  if not found or coalesce(trim(v_paid.email), '') = '' then
    return new;
  end if;

  select decrypted_secret into v_pin from vault.decrypted_secrets where name = 'invoice_admin_pin';
  if v_pin is null then
    return new;
  end if;

  for v_twin in
    select r.id
      from public.reservations r
     where r.id <> v_paid.id
       and lower(trim(r.email)) = lower(trim(v_paid.email))
       and r.reservation_date = v_paid.reservation_date
       -- The same part of the day: before 14:00 midday, from 14:00 evening.
       and (r.reservation_time < '14:00') = (v_paid.reservation_time < '14:00')
       and r.form_type = v_paid.form_type
       and coalesce(r.ritual_type, '') = coalesce(v_paid.ritual_type, '')
       and coalesce(r.rental_type, '') = coalesce(v_paid.rental_type, '')
       -- It went to the card payment page and was never paid.
       and exists (select 1 from public.card_payments p
                    where p.source_type = 'reservation' and p.source_id = r.id)
       and not exists (select 1 from public.card_payments p
                        where p.source_type = 'reservation' and p.source_id = r.id and p.status = 'paid')
       and not exists (select 1 from public.invoices i
                        where i.source_type = 'reservation' and i.source_id = r.id and (i.paid or i.kind = 'final'))
  loop
    perform net.http_post(
      url := 'https://wigoyeorqnssgbrgexku.supabase.co/functions/v1/invoice',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('manage', jsonb_build_object(
        'reservation', v_twin.id, 'pin', v_pin, 'action', 'cancel')),
      timeout_milliseconds := 60000
    );
  end loop;
  return new;
exception when others then
  raise warning 'cancel_unpaid_twins failed: %', sqlerrm;
  return new;
end;
$function$;

revoke all on function public.cancel_unpaid_twins() from public, anon, authenticated;

drop trigger if exists cancel_unpaid_twins on public.card_payments;
create trigger cancel_unpaid_twins
  after update of status on public.card_payments
  for each row execute function public.cancel_unpaid_twins();
