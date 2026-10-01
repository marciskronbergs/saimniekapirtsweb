// Booking events for Google Tag Manager.
//
// The names are GA4's recommended ecommerce events, so GA4 reports them as a
// funnel without any setup, and Tag Manager maps them onto the ad platforms:
//
//   begin_checkout  a booking or gift card form opens   Meta InitiateCheckout, TikTok InitiateCheckout
//   generate_lead   a booking or gift card order is saved  Meta Lead,          TikTok SubmitForm
//   purchase        either is paid by card               Meta Purchase,        TikTok CompletePayment
//   contact         a phone number is tapped             Meta Contact,         TikTok Contact
//
// Each event goes to the dataLayer for Tag Manager, and to GA4 through the
// gtag.js snippet in index.html: that snippet only reads gtag('event', …)
// commands, not the plain objects Tag Manager listens for.
//
// Pushing to the dataLayer stores nothing on the visitor's device; whether a
// tag may act on an event is decided in Tag Manager by the cookie consent
// (src/lib/consent.ts). No name, email, phone or booking id goes in here: the
// booking id is the secret in the office's cancel link, so events carry a
// random event_id instead, which the Meta and TikTok tags can use to
// de-duplicate against a server-side feed later.

import priceCatalog from '../data/priceCatalog.json';
import { priceGiftCard, priceReservation, type GiftCardForPricing, type ReservationForPricing } from './pricing';

export type BookingType = 'ritual' | 'noma';

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category: string;
  price: number;
  quantity: number;
}

const CURRENCY = 'EUR';

function push(event: string, params: Record<string, unknown>, ecommerce?: Record<string, unknown>) {
  const w = window as DataLayerWindow & { gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  const eventId = randomId();
  // Tag Manager merges ecommerce objects between pushes unless it is cleared first.
  if (ecommerce) w.dataLayer.push({ ecommerce: null });
  // `value` is reset on every event: Tag Manager keeps the last value it saw,
  // and an event without one must not carry the previous booking's price.
  w.dataLayer.push({ event, event_id: eventId, value: undefined, ...params, ...(ecommerce ? { ecommerce } : {}) });
  // GA4 takes the ecommerce fields flat, next to the other parameters.
  w.gtag?.('event', event, { ...params, ...(ecommerce ?? {}), event_id: eventId });
}

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const bookingType = (formType: string | null | undefined): BookingType =>
  formType === 'noma' ? 'noma' : 'ritual';

/** What was booked, as GA4 items, priced from the same list the invoices use. */
function bookingItems(booking: ReservationForPricing) {
  const priced = priceReservation(priceCatalog, booking);
  const category = bookingType(booking.form_type);
  const items: EcommerceItem[] = priced.items.map((item) => ({
    // The Latvian name is the stable one; it is what the office sees too.
    item_id: item.name.lv,
    item_name: item.name.lv,
    item_category: category,
    price: item.quantity > 0 ? Math.round((item.amount / item.quantity) * 100) / 100 : item.amount,
    quantity: item.quantity,
  }));
  return { items, value: priced.total };
}

/** The booking form was opened: the start of the funnel. */
export function trackBookingStart(type: BookingType) {
  push('begin_checkout', { booking_type: type }, { currency: CURRENCY, items: [] });
}

/** A booking was saved. Fired for every payment method, card included. */
export function trackBookingSaved(
  booking: ReservationForPricing & { payment_method?: string; gift_card_code?: string | null },
) {
  const { items, value } = bookingItems(booking);
  push(
    'generate_lead',
    {
      booking_type: bookingType(booking.form_type),
      payment_method: booking.payment_method ?? 'transfer',
      with_gift_card: Boolean(booking.gift_card_code),
      value,
      currency: CURRENCY,
    },
    { currency: CURRENCY, value, items },
  );
}

/** A gift card form was opened: which card, by its kind. */
export function trackGiftCardStart(kind: 'ritual' | 'custom') {
  push('begin_checkout', { booking_type: 'gift_card', gift_card_kind: kind }, { currency: CURRENCY, items: [] });
}

/** A gift card order was saved, for every payment method. */
export function trackGiftCardOrdered(order: GiftCardForPricing & { payment_method?: string }) {
  const priced = priceGiftCard(priceCatalog, order);
  const items: EcommerceItem[] = priced.items.map((item) => ({
    item_id: item.name.lv,
    item_name: item.name.lv,
    item_category: 'gift_card',
    price: item.unitPrice,
    quantity: item.quantity,
  }));
  push(
    'generate_lead',
    {
      booking_type: 'gift_card',
      payment_method: order.payment_method ?? 'transfer',
      value: priced.total,
      currency: CURRENCY,
    },
    { currency: CURRENCY, value: priced.total, items },
  );
}

/**
 * A card payment went through, for a booking or a gift card. `payment` is the
 * payment's id from the return address; it is hashed before use, since
 * whoever holds it can open the payment page. Sent once per payment even if
 * the page is reloaded.
 */
export async function trackPaid(
  payment: string,
  type: 'reservation' | 'gift_card',
  order: { total: number; items: { name: string; quantity: number; amount: number }[] },
) {
  const transactionId = await hashId(payment);
  const onceKey = `sp_paid_${transactionId}`;
  try {
    if (localStorage.getItem(onceKey)) return;
    localStorage.setItem(onceKey, '1');
  } catch {
    // Without storage a reload may count twice; GA4 still de-duplicates by
    // transaction_id.
  }

  push(
    'purchase',
    { booking_type: type, value: order.total, currency: CURRENCY },
    {
      transaction_id: transactionId,
      currency: CURRENCY,
      value: order.total,
      items: order.items.map((item) => ({
        item_id: item.name,
        item_name: item.name,
        item_category: type,
        price: item.quantity > 0 ? Math.round((item.amount / item.quantity) * 100) / 100 : item.amount,
        quantity: item.quantity,
      })),
    },
  );
}

/**
 * Counts taps on the phone number wherever it appears, without touching each
 * link: one listener on the document, installed once from main.tsx.
 */
export function trackContactLinks() {
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a[href^="tel:"], a[href^="mailto:"]');
      if (!link) return;
      const method = link.getAttribute('href')!.startsWith('tel:') ? 'phone' : 'email';
      push('contact', { contact_method: method, page_path: window.location.pathname });
    },
    { capture: true },
  );
}

async function hashId(value: string) {
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return randomId();
  }
}
