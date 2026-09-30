import { useEffect } from 'react';

// The office's pages (/rekins and /birojs) talk to the invoice function, which
// checks the office PIN itself. These pages are in Latvian only and are kept
// out of search engines.

const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invoice`;

const messages: Record<string, string> = {
  bad_link: 'Saite nav pilnīga. Atveriet to vēlreiz no e-pasta vai kalendāra.',
  not_found: 'Šāds rēķins vai rezervācija netika atrasta.',
  wrong_pin: 'Nepareizs PIN.',
  pin_locked: 'Pārāk daudz nepareizu PIN mēģinājumu. Mēģiniet vēlreiz pēc 15 minūtēm.',
  final_exists: 'Gala rēķins jau ir izrakstīts, tāpēc to vairs nevar mainīt.',
  unknown_master: 'Šī pirtnieka saite nav derīga. Palūdziet birojam jaunu saiti.',
  guest_mail_off: 'Klientu e-pasti vēl nav ieslēgti, tāpēc gala rēķinu vēl nevar nosūtīt.',
};

export class OfficeError extends Error {
  constructor(public code: string) {
    super(messages[code] ?? code ?? 'Neizdevās. Mēģiniet vēlreiz.');
  }
}

export async function callInvoiceFunction<T = unknown>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new OfficeError('Nav savienojuma. Pārbaudiet internetu un mēģiniet vēlreiz.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new OfficeError(data.error ?? 'Neizdevās. Mēģiniet vēlreiz.');
  return data;
}

// Every page carries a robots tag saying "index"; the office's pages must say
// the opposite.
export function useOfficePage(title: string) {
  useEffect(() => {
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = robots?.content ?? null;
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow';
    document.title = `${title} · SaimniekaPirts`;
    return () => {
      if (previous === null) robots?.remove();
      else if (robots) robots.content = previous;
    };
  }, [title]);
}

export const eur = (n: number) => `${Number(n).toFixed(2).replace('.', ',')} €`;
