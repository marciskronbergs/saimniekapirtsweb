import { useEffect, useState } from 'react';
import { onConsentChange, readConsent, type SavedConsent } from '../lib/consent';

/** The saved cookie choice, kept current when the visitor changes it. */
export function useCookieConsent(): SavedConsent | null {
  const [consent, setConsent] = useState(readConsent);
  useEffect(() => onConsentChange(() => setConsent(readConsent())), []);
  return consent;
}
