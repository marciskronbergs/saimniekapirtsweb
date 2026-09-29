// The emails this function sends. Every one goes to the office, never to a
// guest: a person checks the invoice and forwards it. The office reads Latvian,
// so the emails are in Latvian, except for the note meant for the guest, which
// is in the language the guest booked in.

import { formatDate, formatMoney, type InvoiceRow, type InvoiceDetails } from './pdf.ts';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const eur = (n: number | string) => `${formatMoney(Number(n), 'lv')} €`;

const visitLv = (d: InvoiceDetails | null) =>
  d?.kind === 'reservation' && d.date
    ? [formatDate(d.date), d.time, d.sauna].filter(Boolean).join(', ')
    : 'dāvanu karte';

function noteForGuest(invoice: InvoiceRow): string {
  const firstName = invoice.customer_name.trim().split(/\s+/)[0] ?? '';
  const d = invoice.details;
  const due = formatDate(invoice.due_on);
  const seller = invoice.seller;
  if (invoice.locale === 'en') {
    const what = d?.kind === 'reservation' && d.date
      ? `your visit on ${formatDate(d.date)} at ${d.time}`
      : 'your gift card';
    return [
      `Hello ${firstName},`,
      '',
      `Please find attached invoice ${invoice.number} for ${what}: ${formatMoney(Number(invoice.total), 'en')} EUR.`,
      `Please pay by ${due} to ${seller.name}, ${seller.iban} (${seller.bank}, SWIFT ${seller.swift}), quoting ${invoice.number} as the payment reference.` +
        (invoice.source_type === 'reservation' ? ' You are also welcome to pay in cash on site.' : ''),
      '',
      invoice.source_type === 'reservation' ? 'We look forward to seeing you!' : 'Thank you for your order!',
      `${seller.tradeName}, ${seller.phone}`,
    ].join('\n');
  }
  const what = d?.kind === 'reservation' && d.date
    ? `par apmeklējumu ${formatDate(d.date)} plkst. ${d.time}`
    : 'par dāvanu karti';
  return [
    `Labdien, ${firstName}!`,
    '',
    `Pielikumā rēķins Nr. ${invoice.number} ${what}: ${eur(invoice.total)}.`,
    `Lūdzam samaksāt līdz ${due} uz kontu ${seller.iban} (${seller.name}, ${seller.bank}), maksājuma mērķī norādot rēķina numuru.` +
      (invoice.source_type === 'reservation' ? ' Var norēķināties arī skaidrā naudā uz vietas.' : ''),
    '',
    invoice.source_type === 'reservation' ? 'Gaidīsim Jūs!' : 'Paldies par pasūtījumu!',
    `${seller.tradeName}, ${seller.phone}`,
  ].join('\n');
}

export function invoiceEmail(invoice: InvoiceRow) {
  const subject =
    `Rēķins ${invoice.number} · ${invoice.customer_name} · ${visitLv(invoice.details)} · ${eur(invoice.total)}`;
  const lines = invoice.items
    .map((item) => {
      const qty = item.quantity > 1 ? ` × ${item.quantity}` : '';
      return `<tr><td style="padding:4px 12px 4px 0">${escapeHtml(item.name.lv)}${qty}</td>` +
        `<td style="padding:4px 0;text-align:right;white-space:nowrap">${eur(item.amount)}</td></tr>`;
    })
    .join('');
  const note = noteForGuest(invoice);
  const phone = invoice.customer_phone ? `, tālr. ${escapeHtml(invoice.customer_phone)}` : '';

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5">
<div style="background:#fff7e0;border:1px solid #e8c766;border-radius:6px;padding:12px 14px;margin-bottom:18px">
<strong>Rēķins klientam NAV nosūtīts.</strong> Pārbaudiet to un pārsūtiet uz
<a href="mailto:${escapeHtml(invoice.customer_email)}">${escapeHtml(invoice.customer_email)}</a>${phone}.
</div>
<p style="margin:0 0 4px"><strong>${escapeHtml(invoice.customer_name)}</strong></p>
<p style="margin:0 0 14px;color:#555">${escapeHtml(visitLv(invoice.details))} · rēķins ${escapeHtml(invoice.number)} · apmaksāt līdz ${formatDate(invoice.due_on)}</p>
<table style="border-collapse:collapse;margin-bottom:6px">${lines}
<tr><td style="padding:8px 12px 4px 0;border-top:1px solid #ccc"><strong>Kopā</strong></td>
<td style="padding:8px 0 4px;border-top:1px solid #ccc;text-align:right"><strong>${eur(invoice.total)}</strong></td></tr></table>
<p style="margin:22px 0 6px;color:#555">Teksts klientam (${invoice.locale === 'en' ? 'angliski' : 'latviski'}), ko var ielīmēt, pārsūtot šo e-pastu:</p>
<pre style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap;background:#f4f6f4;border-radius:6px;padding:12px 14px;margin:0">${escapeHtml(note)}</pre>
</body></html>`;

  const text = [
    'Rēķins klientam NAV nosūtīts. Pārbaudiet to un pārsūtiet uz ' +
      `${invoice.customer_email}${invoice.customer_phone ? `, tālr. ${invoice.customer_phone}` : ''}.`,
    '',
    invoice.customer_name,
    `${visitLv(invoice.details)} · rēķins ${invoice.number} · apmaksāt līdz ${formatDate(invoice.due_on)}`,
    '',
    ...invoice.items.map((i) => `${i.name.lv}${i.quantity > 1 ? ` × ${i.quantity}` : ''}: ${eur(i.amount)}`),
    `Kopā: ${eur(invoice.total)}`,
    '',
    'Teksts klientam:',
    '',
    note,
  ].join('\n');

  const filename = `${invoice.locale === 'en' ? 'Invoice' : 'Rekins'}-${invoice.number}.pdf`;
  return { subject, html, text, filename };
}

export interface HoldNotice {
  sourceType: 'reservation' | 'gift_card';
  reason: string;
  fields: [string, string][];
}

export function holdEmail(notice: HoldNotice) {
  const name = notice.fields.find(([k]) => k === 'Vārds')?.[1] ?? '';
  const subject = `Rēķins jāizveido pašiem · ${name} · ${notice.sourceType === 'reservation' ? 'rezervācija' : 'dāvanu karte'}`;
  const rows = notice.fields
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#555">${escapeHtml(k)}</td><td style="padding:3px 0">${escapeHtml(v)}</td></tr>`)
    .join('');
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5">
<div style="background:#fdecea;border:1px solid #e0a39c;border-radius:6px;padding:12px 14px;margin-bottom:18px">
<strong>Šim pasūtījumam rēķins netika izveidots</strong>, jo cenu nevarēja pārbaudīt pēc cenrāža.
Lūdzu, izrakstiet rēķinu pašrocīgi. Rēķina numurs netika izmantots.
</div>
<p style="margin:0 0 10px;color:#555">Iemesls: ${escapeHtml(notice.reason)}</p>
<table style="border-collapse:collapse">${rows}</table>
</body></html>`;
  const text = [
    'Šim pasūtījumam rēķins netika izveidots, jo cenu nevarēja pārbaudīt pēc cenrāža.',
    'Lūdzu, izrakstiet rēķinu pašrocīgi. Rēķina numurs netika izmantots.',
    '',
    `Iemesls: ${notice.reason}`,
    '',
    ...notice.fields.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
  ].join('\n');
  return { subject, html, text };
}
