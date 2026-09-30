import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, CreditCard, Download, Gift, Loader2, Mail, RefreshCw } from 'lucide-react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { callInvoiceFunction, useOfficePage } from '../lib/officeApi';
import InvoicePay from './InvoicePay';

// Where Stripe sends a guest back after paying by card (/apmaksa?p=<payment>),
// or after turning back without paying (&atcelts=1). It asks the invoice
// function how the payment went. A paid gift card can be downloaded here; it
// is also emailed with its invoice. With ?i=<invoice>&t=<token> it is instead
// the page an invoice's payment link opens (InvoicePay).

interface PaymentView {
  status: 'open' | 'paid' | 'expired';
  method: 'card' | 'transfer';
  type: 'reservation' | 'gift_card';
  locale: 'lv' | 'en';
  name: string;
  email: string;
  date: string | null;
  time: string | null;
  items: { name: string; quantity: number; amount: number }[];
  total: number;
  // A ritual card comes as a card and as an A4 page. The code goes with the
  // number when the card is used to book online.
  gift_card: { code: string; pin?: string; valid_until: string; kind?: 'ritual' | 'value' } | null;
}

const texts = {
  lv: {
    title: 'Apmaksa',
    loading: 'Pārbaudām maksājumu…',
    notFound: 'Maksājums netika atrasts. Ja apmaksājāt, apstiprinājums pienāks uz e-pastu; jautājumu gadījumā zvaniet +371 26 752 661.',
    paidBooking: (n: string) => `Paldies, ${n}! Apmaksa saņemta.`,
    paidGift: (n: string) => `Paldies, ${n}! Dāvanu karte apmaksāta.`,
    booked: (d: string, t: string) => `Jūsu rezervācija ${d} plkst. ${t} ir apstiprināta.`,
    sentBooking: (e: string) => `Apstiprinājumu un rēķinu nosūtījām uz ${e}.`,
    sentGift: (e: string) => `Dāvanu karti un rēķinu nosūtījām arī uz ${e}.`,
    giftNumber: 'Dāvanu kartes Nr.',
    validUntil: 'derīga līdz',
    download: 'Lejupielādēt dāvanu karti (PDF)',
    code: 'kods',
    downloadCard: 'Karte (PDF)',
    downloadA4: 'A4 (PDF)',
    twoVersionsRitual: 'Dāvanu karte ir divos variantos – kā karte un A4 formātā. Dāviniet to, kurš Jums labāk patīk.',
    preparing: 'Dāvanu karti vēl gatavojam – tā parādīsies šeit pēc brīža un pienāks arī uz e-pastu.',
    downloading: 'Sagatavojam…',
    total: 'Kopā',
    unpaidTitle: 'Maksājums netika pabeigts',
    unpaidBooking: 'Jūsu rezervācija ir saglabāta. Varat mēģināt apmaksāt vēlreiz vai norēķināties ar pārskaitījumu.',
    unpaidGift: 'Jūsu pasūtījums ir saglabāts. Varat mēģināt apmaksāt vēlreiz vai norēķināties ar pārskaitījumu.',
    retry: 'Maksāt ar karti vēlreiz',
    transfer: 'Maksāt ar pārskaitījumu',
    waiting: 'Gaidām apstiprinājumu no bankas…',
    transferTitle: 'Norēķins ar pārskaitījumu',
    transferText: (e: string) => `Rēķinu apmaksai nosūtām uz ${e} – tas pienāks pēc dažām minūtēm.`,
    transferGift: 'Pēc apmaksas nosūtīsim dāvanu karti.',
    home: 'Uz sākumlapu',
    failed: 'Neizdevās. Mēģiniet vēlreiz vai zvaniet +371 26 752 661.',
  },
  en: {
    title: 'Payment',
    loading: 'Checking your payment…',
    notFound: 'We could not find this payment. If you paid, the confirmation will reach you by email; for any questions call +371 26 752 661.',
    paidBooking: (n: string) => `Thank you, ${n}! Your payment has been received.`,
    paidGift: (n: string) => `Thank you, ${n}! Your gift card is paid.`,
    booked: (d: string, t: string) => `Your booking on ${d} at ${t} is confirmed.`,
    sentBooking: (e: string) => `We have emailed the confirmation and the invoice to ${e}.`,
    sentGift: (e: string) => `We have also emailed the gift card and the invoice to ${e}.`,
    giftNumber: 'Gift card no.',
    validUntil: 'valid until',
    download: 'Download the gift card (PDF)',
    code: 'code',
    downloadCard: 'Card (PDF)',
    downloadA4: 'A4 (PDF)',
    twoVersionsRitual: 'The gift card comes in two versions – as a card and as an A4 page. Give whichever you like.',
    preparing: 'We are still preparing the gift card – it will appear here in a moment and reach you by email too.',
    downloading: 'Preparing…',
    total: 'Total',
    unpaidTitle: 'The payment was not completed',
    unpaidBooking: 'Your booking has been kept. You can try paying again or pay by bank transfer.',
    unpaidGift: 'Your order has been kept. You can try paying again or pay by bank transfer.',
    retry: 'Pay by card again',
    transfer: 'Pay by bank transfer',
    waiting: 'Waiting for the bank to confirm…',
    transferTitle: 'Paying by bank transfer',
    transferText: (e: string) => `We are emailing the invoice for payment to ${e} – it will arrive within a few minutes.`,
    transferGift: 'Once it is paid, we will send you the gift card.',
    home: 'Back to the home page',
    failed: 'Something went wrong. Please try again or call +371 26 752 661.',
  },
};

const formatDate = (iso: string) => iso.split('-').reverse().join('.');
const money = (n: number, locale: 'lv' | 'en') =>
  locale === 'lv' ? `${n.toFixed(2).replace('.', ',')} €` : `€${n.toFixed(2)}`;

const ApmaksaPage = () => {
  useOfficePage('Apmaksa');
  const [params] = useSearchParams();
  const payment = params.get('p') ?? '';
  const invoiceId = params.get('i') ?? '';
  const invoiceToken = params.get('t') ?? '';
  const invoiceMode = !payment && !!invoiceId && !!invoiceToken;
  const cancelled = params.get('atcelts') === '1';
  const { i18n } = useTranslation();
  const [view, setView] = useState<PaymentView | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState<'retry' | 'transfer' | 'download' | 'download-second' | null>(null);
  const [failed, setFailed] = useState(false);
  const polls = useRef(0);

  const locale: 'lv' | 'en' = view?.locale ?? (i18n.language === 'en' ? 'en' : 'lv');
  const tx = texts[locale];

  const load = async () => {
    try {
      const data = await callInvoiceFunction<PaymentView>({ payment_status: { p: payment } });
      setView(data);
      // Back from paying, the bank may take a moment to confirm.
      // A paid gift card waits for its advance invoice, whose number it carries.
      const cardPending = data.status === 'paid' && data.type === 'gift_card' && !data.gift_card;
      if (((data.status === 'open' && data.method === 'card' && !cancelled) || cardPending) && polls.current < 15) {
        polls.current += 1;
        setTimeout(load, 2000);
      }
    } catch {
      setMissing(true);
    }
  };

  useEffect(() => {
    if (payment) load();
    else if (!invoiceMode) setMissing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  const retry = async () => {
    setBusy('retry');
    setFailed(false);
    try {
      const r = await callInvoiceFunction<{ url?: string; payment?: string; status?: string }>({ payment_retry: { p: payment } });
      if (r.url) {
        window.location.assign(r.url);
        return;
      }
      await load();
    } catch {
      setFailed(true);
    }
    setBusy(null);
  };

  const payByTransfer = async () => {
    setBusy('transfer');
    setFailed(false);
    try {
      await callInvoiceFunction({ payment_switch: { p: payment } });
      await load();
    } catch {
      setFailed(true);
    }
    setBusy(null);
  };

  // A ritual card downloads as a card or as an A4 page.
  const download = async (second = false) => {
    setBusy(second ? 'download-second' : 'download');
    setFailed(false);
    const variant = second ? { a4: true } : {};
    try {
      const r = await callInvoiceFunction<{ filename: string; pdf_base64: string }>({ gift_card_pdf: { p: payment, ...variant } });
      const bytes = Uint8Array.from(atob(r.pdf_base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = r.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setFailed(true);
    }
    setBusy(null);
  };

  const paid = view?.status === 'paid';
  const switched = view && !paid && view.method === 'transfer';
  const unpaid = view && !paid && !switched && (cancelled || view.status === 'expired' || polls.current >= 15);

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderSection />
      <main className="px-4 sm:px-6 pt-32 pb-20">
        <div className="max-w-xl mx-auto rounded-3xl bg-[#0d0d0d] border border-green-500/20 p-6 sm:p-10 shadow-2xl shadow-green-500/10">
          {invoiceMode && <InvoicePay id={invoiceId} token={invoiceToken} cancelled={cancelled} />}
          {!invoiceMode && (
            <>
              {!view && !missing && (
                <p className="flex items-center gap-3 text-gray-300">
                  <Loader2 className="w-5 h-5 animate-spin text-green-400" /> {tx.loading}
                </p>
              )}
              {missing && <p className="text-gray-300">{tx.notFound}</p>}

              {view && paid && (
                <div className="space-y-5">
                  <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {view.type === 'gift_card' ? tx.paidGift(view.name) : tx.paidBooking(view.name)}
                  </h1>
                  {view.type === 'reservation' && view.date && (
                    <p className="text-lg text-gray-200">{tx.booked(formatDate(view.date), view.time ?? '')}</p>
                  )}
                  {view.gift_card && (
                    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#1b2631] to-black p-5 space-y-3">
                      <p className="flex items-center gap-2 text-amber-300">
                        <Gift className="w-5 h-5" /> {tx.giftNumber} <strong className="text-amber-200 whitespace-nowrap">{view.gift_card.code}</strong>
                      </p>
                      <p className="text-sm text-gray-400">
                        {view.gift_card.pin && <>{tx.code} <strong className="text-amber-200">{view.gift_card.pin}</strong> · </>}
                        {tx.validUntil} {formatDate(view.gift_card.valid_until)}
                      </p>
                      {view.gift_card.kind === 'ritual' ? (
                        <>
                          <p className="text-sm text-gray-300">{tx.twoVersionsRitual}</p>
                          <div className="flex flex-wrap gap-3">
                            {([false, true] as const).map((second) => {
                              const mine = busy === (second ? 'download-second' : 'download');
                              const label = second ? tx.downloadA4 : tx.downloadCard;
                              return (
                                <button
                                  key={String(second)}
                                  onClick={() => download(second)}
                                  disabled={busy !== null}
                                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 px-5 py-3 font-bold"
                                >
                                  {mine ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                  {mine ? tx.downloading : label}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => download()}
                          disabled={busy !== null}
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 px-5 py-3 font-bold"
                        >
                          {busy === 'download' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                          {busy === 'download' ? tx.downloading : tx.download}
                        </button>
                      )}
                    </div>
                  )}
                  {!view.gift_card && view.type === 'gift_card' && (
                    <p className="flex items-center gap-3 text-sm text-gray-300">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> {tx.preparing}
                    </p>
                  )}
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
                  <p className="flex items-start gap-2 text-gray-300">
                    <Mail className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    {view.type === 'gift_card' ? tx.sentGift(view.email) : tx.sentBooking(view.email)}
                  </p>
                </div>
              )}

              {view && switched && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold">{tx.transferTitle}</h1>
                  <p className="text-gray-300">{tx.transferText(view.email)}</p>
                  {view.type === 'gift_card' && <p className="text-gray-300">{tx.transferGift}</p>}
                </div>
              )}

              {view && unpaid && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold">{tx.unpaidTitle}</h1>
                  <p className="text-gray-300">{view.type === 'gift_card' ? tx.unpaidGift : tx.unpaidBooking}</p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={retry}
                      disabled={busy !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 px-5 py-3 font-bold"
                    >
                      {busy === 'retry' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                      {tx.retry}
                    </button>
                    <button
                      onClick={payByTransfer}
                      disabled={busy !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-60 px-5 py-3"
                    >
                      {busy === 'transfer' && <Loader2 className="w-5 h-5 animate-spin" />}
                      {tx.transfer}
                    </button>
                  </div>
                </div>
              )}

              {view && !paid && !switched && !unpaid && (
                <p className="flex items-center gap-3 text-gray-300">
                  <RefreshCw className="w-5 h-5 animate-spin text-green-400" /> {tx.waiting}
                </p>
              )}

              {failed && <p className="mt-4 rounded-lg bg-red-900/40 border border-red-600 p-3 text-red-300">{tx.failed}</p>}
            </>
          )}
          {!invoiceMode && (
            <p className="mt-8">
              <a href="/" className="text-green-400 hover:text-green-300">{tx.home}</a>
            </p>
          )}
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default ApmaksaPage;
