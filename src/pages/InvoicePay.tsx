import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { callInvoiceFunction } from '../lib/officeApi';

// An invoice's payment link (/apmaksa?i=<invoice>&t=<token>), from the email
// the office sent or a QR code shown on site: what the invoice is for, a
// button to pay it by card on Stripe's page, and the bank details for paying
// it by transfer instead.

interface InvoiceView {
  number: string;
  status: 'issued' | 'annulled';
  paid: boolean;
  type: 'reservation' | 'gift_card';
  locale: 'lv' | 'en';
  name: string;
  date: string | null;
  time: string | null;
  items: { name: string; quantity: number; amount: number }[];
  total: number;
  due_on: string;
  bank: { payee: string; iban: string; bank: string; swift: string };
  card: boolean;
}

const texts = {
  lv: {
    loading: 'Ielādē rēķinu…',
    notFound: 'Rēķins netika atrasts. Pārbaudiet saiti vai zvaniet +371 26 752 661.',
    title: (n: string) => `Rēķins Nr. ${n}`,
    hello: (n: string) => `Sveiki, ${n}!`,
    visit: (d: string, t: string) => `Apmeklējums ${d} plkst. ${t}`,
    giftCard: 'Dāvanu karte',
    total: 'Kopā',
    pay: (sum: string) => `Maksāt ar karti ${sum}`,
    secure: 'Maksājums notiek drošā Stripe lapā.',
    transfer: 'Vai ar pārskaitījumu',
    payee: 'Saņēmējs',
    account: 'Konts',
    bankName: 'Banka',
    reference: 'Maksājuma mērķis',
    due: 'Apmaksāt līdz',
    paid: 'Rēķins ir apmaksāts. Paldies!',
    annulled: 'Šis rēķins ir anulēts. Ja rodas jautājumi, zvaniet +371 26 752 661.',
    cancelled: 'Maksājums netika pabeigts. Varat mēģināt vēlreiz.',
    failed: 'Neizdevās atvērt maksājumu. Mēģiniet vēlreiz vai zvaniet +371 26 752 661.',
    home: 'Uz sākumlapu',
  },
  en: {
    loading: 'Loading the invoice…',
    notFound: 'We could not find this invoice. Please check the link or call +371 26 752 661.',
    title: (n: string) => `Invoice ${n}`,
    hello: (n: string) => `Hello ${n},`,
    visit: (d: string, t: string) => `Visit on ${d} at ${t}`,
    giftCard: 'Gift card',
    total: 'Total',
    pay: (sum: string) => `Pay ${sum} by card`,
    secure: 'You pay on a secure Stripe page.',
    transfer: 'Or by bank transfer',
    payee: 'Payee',
    account: 'Account (IBAN)',
    bankName: 'Bank',
    reference: 'Payment reference',
    due: 'Due by',
    paid: 'This invoice has been paid. Thank you!',
    annulled: 'This invoice has been annulled. For any questions, call +371 26 752 661.',
    cancelled: 'The payment was not completed. You can try again.',
    failed: 'We could not open the payment. Please try again or call +371 26 752 661.',
    home: 'Back to the home page',
  },
};

const formatDate = (iso: string) => iso.split('-').reverse().join('.');
const money = (n: number, locale: 'lv' | 'en') =>
  locale === 'lv' ? `${n.toFixed(2).replace('.', ',')} €` : `€${n.toFixed(2)}`;

const InvoicePay = ({ id, token, cancelled }: { id: string; token: string; cancelled: boolean }) => {
  const { i18n } = useTranslation();
  const [view, setView] = useState<InvoiceView | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callInvoiceFunction<InvoiceView>({ invoice_payment: { i: id, t: token } })
      .then(setView)
      .catch(() => setMissing(true));
  }, [id, token]);

  const locale: 'lv' | 'en' = view?.locale ?? (i18n.language === 'en' ? 'en' : 'lv');
  const tx = texts[locale];

  const pay = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const r = await callInvoiceFunction<{ url?: string; status?: string }>({ pay_invoice: { i: id, t: token } });
      if (r.url) {
        window.location.assign(r.url);
        return;
      }
      if (r.status === 'paid' && view) setView({ ...view, paid: true });
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  if (missing) return <p className="text-gray-300">{tx.notFound}</p>;
  if (!view) {
    return (
      <p className="flex items-center gap-3 text-gray-300">
        <Loader2 className="w-5 h-5 animate-spin text-green-400" /> {tx.loading}
      </p>
    );
  }

  const open = view.status === 'issued' && !view.paid;
  const rows: [string, string][] = [
    [tx.payee, view.bank.payee],
    [tx.account, view.bank.iban],
    [tx.bankName, `${view.bank.bank}, SWIFT ${view.bank.swift}`],
    [tx.reference, view.number],
    [tx.due, formatDate(view.due_on)],
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-gray-400">{tx.hello(view.name)}</p>
        <h1 className="text-2xl sm:text-3xl font-bold">{tx.title(view.number)}</h1>
        <p className="text-gray-300 mt-1">
          {view.type === 'reservation' && view.date ? tx.visit(formatDate(view.date), view.time ?? '') : tx.giftCard}
        </p>
      </div>

      <ul className="text-sm text-gray-300 space-y-1 border-t border-gray-800 pt-4">
        {view.items.map((item) => (
          <li key={item.name} className="flex justify-between gap-4">
            <span>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</span>
            <span className="whitespace-nowrap">{money(item.amount, locale)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-4 font-bold text-white pt-1">
          <span>{tx.total}</span>
          <span>{money(view.total, locale)}</span>
        </li>
      </ul>

      {view.paid && (
        <p className="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-600 p-4 text-green-200">
          <Check className="w-6 h-6 shrink-0" /> {tx.paid}
        </p>
      )}
      {view.status === 'annulled' && <p className="rounded-xl bg-gray-800 p-4 text-gray-300">{tx.annulled}</p>}

      {open && (
        <>
          {cancelled && <p className="rounded-lg bg-yellow-900/30 border border-yellow-700 p-3 text-yellow-200">{tx.cancelled}</p>}
          {view.card && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={pay}
                disabled={busy}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 px-6 py-3 font-bold"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {tx.pay(money(view.total, locale))}
              </button>
              <p className="text-xs text-gray-400">{tx.secure}</p>
            </div>
          )}
          <div className="rounded-xl border border-gray-800 p-4">
            <h2 className="font-semibold mb-2">{tx.transfer}</h2>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-gray-400">{k}</dt>
                  <dd className="text-gray-100 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}

      {failed && <p className="rounded-lg bg-red-900/40 border border-red-600 p-3 text-red-300">{tx.failed}</p>}
      <p>
        <a href="/" className="text-green-400 hover:text-green-300">{tx.home}</a>
      </p>
    </div>
  );
};

export default InvoicePay;
