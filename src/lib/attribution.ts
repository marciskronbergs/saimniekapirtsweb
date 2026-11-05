// Which ad brought a guest, kept so the booking can be reported to the ad
// platforms from the server (supabase/functions/conversions).
//
// Ad platforms add a click id to the address of the page the ad opens
// (gclid/gbraid/wbraid for Google, fbclid for Meta, ttclid for TikTok). The
// guest usually books a few pages, or a few days, later, so the id is kept:
// in memory from the first page on, and in localStorage only once marketing
// cookies are accepted. Without that consent nothing is stored and nothing is
// sent to the server but the consent state itself.
//
// When a booking or gift card order is saved, recordSignals() writes one row
// to `conversion_signals`: the consent state, the click ids, the Meta and
// Google Analytics browser ids from their cookies, and the event_id that the
// browser's own generate_lead event carries, so Meta can de-duplicate the two.
// The table only accepts inserts from the public key.

import { readConsent, onConsentChange } from './consent';
import { supabase } from './supabase';

const STORAGE_KEY = 'sp_ad_click';
/** Matches the attribution windows of Google Ads and Meta. */
const MAX_AGE_DAYS = 90;
const GA4_ID = '46HJJ959K8';

interface Clicks {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  ttclid?: string;
  /** When the fbclid was seen, in ms: Meta's _fbc carries it. */
  fbclid_at?: number;
  at: number;
}

const PARAMS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid'] as const;

let inMemory: Clicks | null = null;

const clean = (value: string | null) => (value && /^[\w.\-~]{4,500}$/.test(value) ? value : undefined);

function fromAddress(): Clicks | null {
  const params = new URLSearchParams(window.location.search);
  const found: Clicks = { at: Date.now() };
  let any = false;
  for (const name of PARAMS) {
    const value = clean(params.get(name));
    if (value) {
      found[name] = value;
      any = true;
    }
  }
  if (found.fbclid) found.fbclid_at = found.at;
  return any ? found : null;
}

function readStored(): Clicks | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Clicks | null;
    if (!saved || !(Date.now() - saved.at < MAX_AGE_DAYS * 86_400_000)) return null;
    return saved;
  } catch {
    return null;
  }
}

function store() {
  try {
    if (readConsent()?.marketing) {
      if (inMemory) localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemory));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage blocked: the ids still last for this visit.
  }
}

/** Reads the ad click ids from the landing address. Called once from main.tsx. */
export function captureAdClicks() {
  const stored = readStored();
  const landed = fromAddress();
  // A new ad click replaces the old one, as the platforms count the last click.
  inMemory = landed ? { ...landed } : stored;
  store();
  onConsentChange(store);
}

function cookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/\./g, '\\.')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** GA4's client id: the last two parts of the _ga cookie ("GA1.1.123.456"). */
function gaClientId() {
  const parts = cookie('_ga')?.split('.');
  return parts && parts.length >= 4 ? parts.slice(-2).join('.') : undefined;
}

/** GA4's session id, from "GS1.1.<id>.…" or "GS2.1.s<id>$o…". */
function gaSessionId() {
  const value = cookie(`_ga_${GA4_ID}`);
  const match = value?.match(/^GS\d\.\d\.s?(\d+)/);
  return match?.[1];
}

/** Meta's click cookie, or one built from the fbclid the same way the pixel would. */
function metaClick(clicks: Clicks | null) {
  const fromCookie = cookie('_fbc');
  if (fromCookie) return fromCookie;
  if (clicks?.fbclid) return `fb.1.${clicks.fbclid_at ?? clicks.at}.${clicks.fbclid}`;
  return undefined;
}

const cut = (value: string | undefined, max = 500) => (value ? value.slice(0, max) : null);

export function newEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Saves what the server needs to report this booking to the ad platforms.
 * Never throws and never blocks the booking for long: a lost row only means
 * one conversion is not reported.
 */
export async function recordSignals(sourceType: 'reservation' | 'gift_card', sourceId: string, eventId: string) {
  try {
    const consent = readConsent();
    const marketing = Boolean(consent?.marketing);
    const clicks = marketing ? inMemory ?? readStored() : null;
    const row = {
      source_type: sourceType,
      source_id: sourceId,
      event_id: eventId,
      marketing,
      consent_id: consent?.id ?? null,
      ...(marketing
        ? {
            gclid: cut(clicks?.gclid),
            gbraid: cut(clicks?.gbraid),
            wbraid: cut(clicks?.wbraid),
            ttclid: cut(clicks?.ttclid),
            fbc: cut(metaClick(clicks)),
            fbp: cut(cookie('_fbp')),
            ttp: cut(cookie('_ttp')),
            ga_client_id: cut(gaClientId(), 100),
            ga_session_id: cut(gaSessionId(), 100),
            page_url: cut(window.location.origin + window.location.pathname),
            user_agent: cut(navigator.userAgent),
          }
        : {}),
    };
    const { error } = await supabase.from('conversion_signals').insert(row);
    if (error) console.warn('Booking saved, ad attribution not recorded:', error.message);
  } catch (error) {
    console.warn('Booking saved, ad attribution not recorded:', error);
  }
}
