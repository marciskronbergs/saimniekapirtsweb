// Catches mistyped email addresses and phone numbers on the booking and gift
// card forms before the booking is saved. A guest who types
// kaspars@gmal.com never gets their invoice, and the office has no way to
// reach them.
//
// Two checks on the email address:
// - a domain one letter or two off a common one (gmal.com, inbox.lvv) is
//   offered corrected;
// - a domain that can receive no mail at all (no MX or A record) is refused.
//   The lookup asks a public DNS-over-HTTPS service about the domain only,
//   never the address; if it cannot answer, the address is let through.

const COMMON_DOMAINS = [
  'gmail.com', 'inbox.lv', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
  'icloud.com', 'me.com', 'mail.ru', 'yandex.ru', 'yandex.com', 'tvnet.lv',
  'apollo.lv', 'one.lv', 'gmx.com', 'gmx.de', 'protonmail.com', 'proton.me', 'bk.ru', 'list.ru',
];

const distance = (a: string, b: string): number => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const here = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = here;
    }
  }
  return row[b.length];
};

const split = (email: string) => {
  const at = email.trim().lastIndexOf('@');
  return at > 0 ? { local: email.trim().slice(0, at), domain: email.trim().slice(at + 1).toLowerCase() } : null;
};

/** The address with its domain corrected, when it looks like a typo of a common one. */
export function suggestEmail(email: string): string | null {
  const parts = split(email);
  if (!parts || !parts.domain || COMMON_DOMAINS.includes(parts.domain)) return null;
  let best: { domain: string; d: number } | null = null;
  for (const domain of COMMON_DOMAINS) {
    const d = distance(parts.domain, domain);
    if (d > 0 && d <= 2 && (!best || d < best.d)) best = { domain, d };
  }
  return best ? `${parts.local}@${best.domain}` : null;
}

const answers = new Map<string, Promise<boolean | null>>();

async function lookup(domain: string, type: 'MX' | 'A'): Promise<{ status: number; found: boolean }> {
  const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
    headers: { accept: 'application/dns-json' },
  });
  if (!res.ok) throw new Error(`DNS ${res.status}`);
  const data = await res.json();
  const code = type === 'MX' ? 15 : 1;
  return { status: data.Status, found: (data.Answer ?? []).some((a: { type: number }) => a.type === code) };
}

/** Whether mail can be delivered to the address's domain: null when unknown. */
export function domainTakesMail(email: string): Promise<boolean | null> {
  const parts = split(email);
  if (!parts || !parts.domain.includes('.')) return Promise.resolve(false);
  const known = answers.get(parts.domain);
  if (known) return known;
  const answer = (async () => {
    try {
      const mx = await lookup(parts.domain, 'MX');
      if (mx.status === 3) return false; // no such domain
      if (mx.found) return true;
      return (await lookup(parts.domain, 'A')).found; // mail may go to the host itself
    } catch {
      return null;
    }
  })();
  answers.set(parts.domain, answer);
  return answer;
}

/** A phone number with fewer than 8 digits cannot be complete. */
export const phoneLooksShort = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 0 && digits.length < 8;
};
