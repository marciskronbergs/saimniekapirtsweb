import { useEffect, useState } from 'react';
import { callInvoiceFunction } from './officeApi';

// Paying by card through Stripe. The invoice function knows whether card
// payments are switched on, makes the Stripe Checkout page for a booking or
// gift card order that has just been saved, and tells /apmaksa how it went.

let cardOn: Promise<boolean> | null = null;

// Whether to offer card payment at all; asked once per visit.
export function useCardPayments() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    cardOn ??= callInvoiceFunction<{ card: boolean }>({ payment_options: true })
      .then((r) => !!r.card)
      .catch(() => false);
    cardOn.then((on) => live && setEnabled(on));
    return () => {
      live = false;
    };
  }, []);
  return enabled;
}

export interface CheckoutResult {
  url?: string;
  payment?: string;
  status?: 'paid' | 'not_card';
  fallback?: string;
}

// Opens the Stripe page for a saved booking or order. Returns only when the
// guest is not being sent there: the booking then falls back to a bank
// transfer (or had already been paid).
export async function goToCardPayment(type: 'reservation' | 'gift_card', id: string): Promise<CheckoutResult> {
  let result: CheckoutResult;
  try {
    result = await callInvoiceFunction<CheckoutResult>({ checkout: { type, id } });
  } catch {
    return { fallback: 'unreachable' };
  }
  if (result.url) {
    window.location.assign(result.url);
    // Keep the form busy while the browser leaves.
    await new Promise(() => {});
  }
  if (result.status === 'paid' && result.payment) {
    window.location.assign(`/apmaksa?p=${result.payment}`);
    await new Promise(() => {});
  }
  return result;
}

export const paymentLabel = (method: string) =>
  method === 'cash' ? 'Skaidrā naudā uz vietas'
    : method === 'card' ? 'Karte (Stripe) – maksā tiešsaistē'
    : 'Pārskaitījums (avansa rēķins)';
