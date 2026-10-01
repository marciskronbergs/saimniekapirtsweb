-- Proof of cookie consent. Every choice made in the site's cookie dialog
-- (src/lib/consent.ts) is written here: which categories were allowed, how
-- (allow all, deny, or a custom choice), under which version of the cookie
-- declaration, and when. consent_id is the random id the visitor's browser
-- keeps, so one visitor's changes read as a history. No IP address is stored.
--
-- The public key may only add rows, never read, change or delete them; the
-- office reads the log with the service role.
create table public.cookie_consents (
  id bigint generated always as identity primary key,
  consent_id uuid not null,
  created_at timestamptz not null default now(),
  preferences boolean not null,
  statistics boolean not null,
  marketing boolean not null,
  method text not null check (method in ('accept_all', 'reject_all', 'custom')),
  policy_version integer not null check (policy_version > 0),
  language text check (char_length(language) <= 10),
  page_url text check (char_length(page_url) <= 500),
  user_agent text check (char_length(user_agent) <= 500)
);

create index cookie_consents_consent_id_idx on public.cookie_consents (consent_id, created_at);

alter table public.cookie_consents enable row level security;

revoke all on public.cookie_consents from anon, authenticated;
grant insert (consent_id, preferences, statistics, marketing, method, policy_version, language, page_url, user_agent)
  on public.cookie_consents to anon, authenticated;

create policy "Visitors can record their cookie choice"
  on public.cookie_consents
  for insert
  to anon, authenticated
  with check (true);
