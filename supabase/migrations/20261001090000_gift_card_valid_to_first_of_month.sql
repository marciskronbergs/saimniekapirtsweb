-- A gift card is valid until the 1st of the month after the order month, a
-- year on: ordered 02.10.2026, valid until 01.11.2027. The order's own date
-- (Riga time) counts, not the day the card is issued.

create or replace function public.gift_card_for(p_order uuid)
returns public.gift_cards
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_row public.gift_cards;
  v_number text;
  v_ordered date;
begin
  select number into v_number from public.invoices
   where source_type = 'gift_card' and source_id = p_order and kind = 'advance' and status = 'issued'
   order by created_at desc limit 1;

  select * into v_row from public.gift_cards where order_id = p_order;
  if found then
    if v_number is not null and v_row.code <> v_number then
      update public.gift_cards set code = v_number where order_id = p_order returning * into v_row;
    end if;
    return v_row;
  end if;

  if v_number is null then
    return null;
  end if;
  select (timezone('Europe/Riga', o.created_at))::date into v_ordered
    from public.davanu_kartes_pasutijumi o where o.id = p_order;
  v_ordered := coalesce(v_ordered, (timezone('Europe/Riga', now()))::date);
  insert into public.gift_cards (order_id, code, valid_until)
    values (p_order, v_number, (date_trunc('month', v_ordered) + interval '1 month' + interval '1 year')::date)
    on conflict (order_id) do nothing;
  select * into v_row from public.gift_cards where order_id = p_order;
  return v_row;
end;
$function$;
revoke all on function public.gift_card_for(uuid) from public, anon, authenticated;

-- The cards already issued, by the same rule.
update public.gift_cards g
   set valid_until = (date_trunc('month', (timezone('Europe/Riga', o.created_at))::date) + interval '1 month' + interval '1 year')::date
  from public.davanu_kartes_pasutijumi o
 where o.id = g.order_id;
