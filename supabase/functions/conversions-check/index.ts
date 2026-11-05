// Checks the Meta Conversions API token without sending an event: it posts an
// empty batch, so Meta answers with an auth error if the token is wrong and a
// data error if the token is fine. Keyed with the conversions feed key.
import { createClient } from 'npm:@supabase/supabase-js@2';

const PIXEL = Deno.env.get('META_PIXEL_ID') ?? '9129223913845060';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const { data: key } = await db.rpc('conversions_feed_key');
  if (!key || url.searchParams.get('key') !== String(key)) return new Response('Not found', { status: 404 });
  const token = Deno.env.get('META_CAPI_TOKEN');
  if (!token) return Response.json({ token: false });
  const res = await fetch(`https://graph.facebook.com/v24.0/${PIXEL}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [] }),
  });
  const body = await res.json().catch(() => ({}));
  return Response.json({ token: true, pixel: PIXEL, status: res.status, error: body.error ? { code: body.error.code, subcode: body.error.error_subcode ?? null, type: body.error.type, message: body.error.message } : null, ok: res.ok });
});
