import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { callInvoiceFunction, eur, useOfficePage } from '../lib/officeApi';

// The office's page for one invoice or one booking, opened from a link:
//   /rekins?id=<invoice>&t=<token>   from the advance invoice email
//   /rekins?r=<booking>              from the office's calendar
// Looking needs only the link; annulling, cancelling or issuing a final
// invoice also needs the office PIN, because the invoice email is the one
// forwarded to guests. It is in Latvian only and kept out of search engines.

// The replies differ by action; each use below knows which it asked for.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = (body: Record<string, unknown>) => callInvoiceFunction<any>({ manage: body });

interface InvoiceView {
  number: string;
  kind: 'advance' | 'final';
  status: 'issued' | 'annulled';
  source_type: 'reservation' | 'gift_card';
  customer_name: string;
  total: number;
  visit: string | null;
  final_number: string | null;
}

interface BookingView {
  type: 'reservation';
  cancelled: boolean;
  customer_name: string;
  visit: string;
  sauna: string | null;
  service: string | null;
  advance_number: string | null;
  advance_status: 'issued' | 'annulled' | null;
  final_number: string | null;
}

const Row = ({ label, value }: { label: string; value: string | null | undefined }) =>
  value ? (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  ) : null;

const RekinsPage = () => {
  const [params] = useSearchParams();
  const invoiceId = params.get('id');
  const token = params.get('t');
  const bookingId = params.get('r');
  const target = bookingId ? { reservation: bookingId } : { id: invoiceId, token };

  const [invoice, setInvoice] = useState<InvoiceView | null>(null);
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useOfficePage(bookingId ? 'Rezervācija' : 'Rēķins');

  useEffect(() => {
    call({ ...target, action: 'view' })
      .then((data) => (bookingId ? setBooking(data) : setInvoice(data)))
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, token, bookingId]);

  const act = async (action: string, question: string, done: (data: any) => string) => {
    if (!pin) return setError('Ievadiet PIN.');
    if (!window.confirm(question)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await call({ ...target, action, pin });
      if (bookingId) setBooking(data);
      else if (data.invoice) setInvoice(data.invoice);
      setNotice(done(data));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const canAct = invoice
    ? invoice.kind === 'advance' && invoice.status === 'issued' && !invoice.final_number
    : booking
      ? !booking.cancelled && !booking.final_number
      : false;

  return (
    <main className="min-h-screen bg-black text-white flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-green-500/30 bg-[#0d0d0d] p-6 space-y-5">
        <h1 className="text-2xl font-bold">{bookingId ? 'Rezervācija' : 'Rēķins'}</h1>

        {!invoice && !booking && !error && <p className="text-gray-400">Ielādē…</p>}

        {invoice && (
          <div>
            <Row label={invoice.kind === 'advance' ? 'Avansa rēķins' : 'Rēķins'} value={invoice.number} />
            <Row label="Statuss" value={invoice.status === 'annulled' ? 'Anulēts' : invoice.kind === 'final' ? 'Apmaksāts' : 'Izrakstīts'} />
            <Row label="Klients" value={invoice.customer_name} />
            <Row label="Apmeklējums" value={invoice.visit ?? (invoice.source_type === 'gift_card' ? 'Dāvanu karte' : null)} />
            <Row label="Summa" value={eur(invoice.total)} />
            <Row label="Gala rēķins" value={invoice.final_number} />
          </div>
        )}

        {booking && (
          <div>
            <Row label="Statuss" value={booking.cancelled ? 'Atcelta' : 'Aktīva'} />
            <Row label="Klients" value={booking.customer_name} />
            <Row label="Laiks" value={booking.visit} />
            <Row label="Pirts" value={booking.sauna} />
            <Row label="Pakalpojums" value={booking.service} />
            <Row label="Avansa rēķins" value={booking.advance_number && `${booking.advance_number}${booking.advance_status === 'annulled' ? ' (anulēts)' : ''}`} />
            <Row label="Gala rēķins" value={booking.final_number} />
          </div>
        )}

        {canAct && (
          <div className="space-y-3">
            <label className="block text-sm text-gray-300">
              PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.trim())}
                className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-600 px-4 py-3 text-white"
              />
            </label>

            {booking && (
              <button
                disabled={busy}
                onClick={() =>
                  act('cancel', 'Atcelt šo rezervāciju? Laiks atkal būs brīvs mājaslapā, un avansa rēķins tiks anulēts.', () =>
                    'Rezervācija atcelta: laiks ir brīvs, avansa rēķins anulēts, un Make to izņem no kalendāra. Ja notikums kalendārā paliek, izdzēsiet to ar roku.'
                  )
                }
                className="w-full rounded-lg bg-red-700 hover:bg-red-600 disabled:bg-gray-600 py-3 font-semibold"
              >
                Atcelt rezervāciju
              </button>
            )}

            {invoice && (
              <>
                <button
                  disabled={busy}
                  onClick={() =>
                    act('annul', `Anulēt avansa rēķinu ${invoice.number}? Gala rēķins netiks izrakstīts.`, () =>
                      'Avansa rēķins anulēts.'
                    )
                  }
                  className="w-full rounded-lg bg-red-700 hover:bg-red-600 disabled:bg-gray-600 py-3 font-semibold"
                >
                  Anulēt avansa rēķinu
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    act('final', 'Izrakstīt gala rēķinu tagad? Tas tiks atzīmēts kā apmaksāts un nosūtīts klientam.', (d) =>
                      `Gala rēķins ${d.number ?? ''} izrakstīts un nosūtīts klientam.`
                    )
                  }
                  className="w-full rounded-lg bg-green-700 hover:bg-green-600 disabled:bg-gray-600 py-3 font-semibold"
                >
                  Apmaksāts – izrakstīt gala rēķinu tagad
                </button>
                <p className="text-xs text-gray-500">
                  Rezervācijām gala rēķins aiziet automātiski nākamajā rītā pēc apmeklējuma. Pogu izmantojiet
                  dāvanu kartēm pēc apmaksas.
                </p>
              </>
            )}
          </div>
        )}

        {notice && <p className="rounded-lg bg-green-900/40 border border-green-600 p-3 text-green-300">{notice}</p>}
        {error && <p className="rounded-lg bg-red-900/40 border border-red-600 p-3 text-red-300">{error}</p>}
      </div>
    </main>
  );
};

export default RekinsPage;
