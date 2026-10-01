// The visitor's cookie choice, and how it reaches Google Tag Manager.
//
// index.html sets Consent Mode v2 to "denied" before Tag Manager loads and
// restores a saved choice from the same storage key, so STORAGE_KEY, VERSION,
// MAX_AGE_DAYS and the saved fields must stay in step with the inline script
// there.
//
// Every choice is announced twice: as a Consent Mode update, which Google tags
// (GA4, Google Ads) honour on their own, and as a `cookie_consent_update`
// dataLayer event carrying one variable per category, which the Meta and
// TikTok pixel tags in Tag Manager use as their trigger. Each choice is also
// written to the `cookie_consents` table as proof of consent.

import { supabase } from './supabase';

export type ConsentCategory = 'preferences' | 'statistics' | 'marketing';

export interface ConsentChoice {
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
}

export type ConsentMethod = 'accept_all' | 'reject_all' | 'custom';

export interface SavedConsent extends ConsentChoice {
  id: string;
  at: string;
  method: ConsentMethod;
}

const STORAGE_KEY = 'sp_cookie_consent';
/** Raise when the cookie declaration changes materially: everyone is asked again. */
export const VERSION = 1;
/** A choice is asked for again after a year, as regulators expect. */
const MAX_AGE_DAYS = 365;
const CHANGE_EVENT = 'sp:cookie-consent';
const OPEN_SETTINGS_EVENT = 'sp:open-cookie-settings';

export const ALL_GRANTED: ConsentChoice = { preferences: true, statistics: true, marketing: true };
export const ALL_DENIED: ConsentChoice = { preferences: false, statistics: false, marketing: false };

type DataLayerWindow = Window & { dataLayer?: unknown[] };

const state = (granted: boolean) => (granted ? 'granted' : 'denied');

export function readConsent(): SavedConsent | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || saved.v !== VERSION) return null;
    const age = Date.now() - new Date(saved.at).getTime();
    if (!(age >= 0 && age < MAX_AGE_DAYS * 86_400_000)) return null;
    return {
      id: String(saved.id),
      at: String(saved.at),
      method: saved.method,
      preferences: Boolean(saved.preferences),
      statistics: Boolean(saved.statistics),
      marketing: Boolean(saved.marketing),
    };
  } catch {
    // Storage blocked or unreadable: treat as "not asked yet".
    return null;
  }
}

function newConsentId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Older browsers: a v4-shaped id from Math.random is enough for a receipt.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function announce(choice: ConsentChoice) {
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  const ads = state(choice.marketing);
  const prefs = state(choice.preferences);
  // gtag() pushes its `arguments` object; Tag Manager only reads consent
  // commands in that shape, not as a plain array.
  const gtag: (...args: unknown[]) => void = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  gtag('consent', 'update', {
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: state(choice.statistics),
    functionality_storage: prefs,
    personalization_storage: prefs,
  });
  w.dataLayer.push({
    event: 'cookie_consent_update',
    consent_preferences: prefs,
    consent_statistics: state(choice.statistics),
    consent_marketing: ads,
  });
}

async function record(saved: SavedConsent) {
  // Fire and forget: a failed receipt must never stand between the visitor
  // and the site. The table only accepts inserts from the public key.
  const { error } = await supabase.from('cookie_consents').insert({
    consent_id: saved.id,
    preferences: saved.preferences,
    statistics: saved.statistics,
    marketing: saved.marketing,
    method: saved.method,
    policy_version: VERSION,
    language: document.documentElement.lang || null,
    page_url: (window.location.origin + window.location.pathname).slice(0, 500),
    user_agent: navigator.userAgent.slice(0, 500),
  });
  if (error) console.warn('Cookie consent was applied but not logged:', error.message);
}

export function saveConsent(choice: ConsentChoice, method: ConsentMethod) {
  const previous = readConsent();
  const saved: SavedConsent = {
    // The same visitor keeps one id across changes, so the log reads as a history.
    id: previous?.id ?? newConsentId(),
    at: new Date().toISOString(),
    method,
    ...choice,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: VERSION, ...saved }));
  } catch {
    // The choice still applies to this page view.
  }

  announce(choice);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  void record(saved);

  // Pixels and embeds that already loaded keep running until the page is
  // left, so a withdrawn consent only takes full effect after a reload.
  const withdrawn =
    previous &&
    ((previous.preferences && !choice.preferences) ||
      (previous.statistics && !choice.statistics) ||
      (previous.marketing && !choice.marketing));
  if (withdrawn) window.location.reload();
}

export function onConsentChange(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/** Opens the consent dialog on its settings view, e.g. from the footer. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

export function onOpenCookieSettings(listener: () => void) {
  window.addEventListener(OPEN_SETTINGS_EVENT, listener);
  return () => window.removeEventListener(OPEN_SETTINGS_EVENT, listener);
}
