// The few Stripe calls the function makes, over plain HTTPS.
//
// The secret key is the function's secret STRIPE_SECRET_KEY (a restricted key
// that may write Checkout Sessions is enough). Without it card payments are
// switched off and the booking forms do not offer them.

const KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
export const stripeConfigured = () => KEY !== '';

export interface CheckoutSession {
  id: string;
  url: string | null;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  payment_intent: string | null;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string>;
}

// Nested parameters in Stripe's form encoding: { a: { b: 1 } } → a[b]=1.
function encode(params: Record<string, unknown>, prefix = '', out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object') encode(value as Record<string, unknown>, name, out);
    else out.append(name, String(value));
  }
  return out;
}

async function call<T>(method: 'GET' | 'POST', path: string, params?: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
  if (!KEY) throw new Error('Card payments are not set up');
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: params ? encode(params) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${data?.error?.message ?? 'request failed'}`);
  return data as T;
}

export const createCheckoutSession = (params: Record<string, unknown>, idempotencyKey: string) =>
  call<CheckoutSession>('POST', 'checkout/sessions', params, idempotencyKey);

export const getCheckoutSession = (id: string) =>
  call<CheckoutSession>('GET', `checkout/sessions/${encodeURIComponent(id)}`);

export const expireCheckoutSession = (id: string) =>
  call<CheckoutSession>('POST', `checkout/sessions/${encodeURIComponent(id)}/expire`, {});
