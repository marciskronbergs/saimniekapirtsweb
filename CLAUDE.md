# SaimniekaPirts: how to work with the owner

The owner (Mārcis) runs the business, not servers. Talk to him in Latvian,
in short plain sentences, with no ids, JSON or tool names unless he asks.

## Do it yourself, ask only for keys

- Anything a connected tool can do, do it yourself: Supabase, GitHub (Netlify
  deploys `main`), Google Ads and Google Analytics through Composio, the
  official Meta connector, Make, AdCrew. Do not send him to click through a
  page a tool can change.
- Ask him only for what no tool can do:
  - **Keys and tokens.** Say exactly where to copy each one, with a direct
    link, and where to paste it. Secrets go into
    https://supabase.com/dashboard/project/wigoyeorqnssgbrgexku/functions/secrets
    and never into the chat.
  - **The few settings with no API.** Give a direct link to the right page and
    the exact clicks.
- A cloud chat cannot click in his browser. The Claude sidebar in his Chrome
  can: when a step needs clicks, give him a ready text to paste there.
- Supabase `apply_migration`, and `execute_sql` that changes the schema, wait
  for an approval that never reaches him. Give him the SQL to paste into
  https://supabase.com/dashboard/project/wigoyeorqnssgbrgexku/sql/new instead.
  Plain `select` calls (including the office actions through `net.http_post`)
  work.

## Ask before spending or changing ad accounts

Get his explicit "jā" before changing anything in Google Ads or Meta:
budgets, bids, bidding strategy, conversion goals, or switching a campaign or
ad on. Build new ads paused and show the plan first.

## Accounts

- Google Analytics 4: **"SaimniekaPirts New web"**, property 495925847,
  G-46HJJ959K8. The site sends data here. The old property "Pirts "Pie
  Saimnieka" - GA4" (335318804, G-FD2FM5P1XQ) gets no data; leave it alone.
  The Composio Analytics connections can only read.
- Google Ads: customer 884-679-4268, tag AW-784077665. Primary conversions:
  "SaimniekaPirts New web (web) purchase" (GA4 import) and "Rezervācija
  (mājaslapa)" (site tag, sent from `src/lib/analytics.ts`).
- Meta: ad account 122322304515595 (now in the business portfolio
  751667061920260), Page "Sarmaspa.lv - Saimniekapirts.lv"
  1056776424483097, pixel 9129223913845060 (the ad account's own; the old
  1601718544265561 belongs to an account he cannot open), Instagram @saimniekapirts.
- **Meta: the official Meta connector only pushes, Composio reads.** Use the
  official connector only to create or change things (campaigns, ad sets,
  ads, creatives, audiences, uploads). Every read (insights, ad lists,
  Instagram posts and reels, comments, follower numbers) goes elsewhere:
  Metricool (brand 3594169) for Instagram reels and posts with reach, views,
  watch time and media ids; AdCrew `query_data` (`meta_ads_insights`) for ad
  results; Composio's Meta Ads tools once a working read token is connected.
  The official key is for account control; too many reads through it can get
  the account banned.
- Supabase project `wigoyeorqnssgbrgexku`. Edge Functions: `invoice` (office,
  invoices, payments) and `conversions` (server-side conversions, every 10
  minutes from pg_cron).

## Standing rules

- Never re-open public read of `reservations`. Booking ids are secret.
- The office PIN lives in Vault (`invoice_admin_pin`); never show it.
- Office-only data never goes in columns of `reservations` or orders, because
  anon can insert any column.
- Before pushing to `main`: `npm run build && npm run prerender && npm run verify:build`
  with the public Supabase URL and anon key set. Do not commit `dist`.
