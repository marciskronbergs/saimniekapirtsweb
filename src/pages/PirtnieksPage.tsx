import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Phone, RefreshCw } from 'lucide-react';
import { callInvoiceFunction, eur, useOfficePage } from '../lib/officeApi';

// A sauna master's own page, opened from the private link the office sends
// them: /pirtnieks?t=<token>. It lists the upcoming bookings assigned to them,
// with what they need for the ritual and nothing about invoices.

interface MasterBooking {
  id: string;
  type: 'noma' | 'ritual';
  date: string;
  time: string;
  sauna: string | null;
  service: string | null;
  participants: number | null;
  overnight: boolean;
  transport: string | null;
  message: string | null;
  name: string;
  phone: string | null;
  locale: 'lv' | 'en' | 'ru';
  cash_due: number | null;
}

interface MasterView {
  name: string;
  today: string;
  bookings: MasterBooking[];
}

const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('lv-LV', { weekday: 'long', day: 'numeric', month: 'long' });

const PirtnieksPage = () => {
  useOfficePage('Pirtnieks');
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const [view, setView] = useState<MasterView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setView(await callInvoiceFunction<MasterView>({ sauna_master: { token } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const byDay = useMemo(() => {
    const days = new Map<string, MasterBooking[]>();
    for (const b of view?.bookings ?? []) days.set(b.date, [...(days.get(b.date) ?? []), b]);
    return [...days.entries()];
  }, [view]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png"
              alt="SaimniekaPirts"
              className="h-10 object-contain"
            />
            <h1 className="text-lg font-bold text-green-400">{view ? view.name : 'Pirtnieks'}</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atjaunot</span>
          </button>
        </header>

        {!view && !error && <p className="text-gray-400">Ielādē…</p>}
        {error && <p className="rounded-lg bg-red-900/40 border border-red-600 p-3 text-red-300">{error}</p>}

        {view && (
          <>
            <h2 className="text-gray-300">
              Jūsu nākamās rezervācijas: <strong className="text-white">{view.bookings.length}</strong>
            </h2>
            {view.bookings.length === 0 && <p className="text-gray-400">Pašlaik Jums nav piešķirtu rezervāciju.</p>}
            {byDay.map(([day, bookings]) => (
              <div key={day} className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  <CalendarDays className="w-4 h-4" />
                  {day === view.today ? `Šodien · ${longDate(day)}` : longDate(day)}
                </h3>
                {bookings.map((b) => (
                  <article key={b.id} className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-4 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-2xl font-bold text-green-400">{b.time}</span>
                      <span className="text-lg font-semibold">{b.name}</span>
                      {b.locale !== 'lv' && <span className="text-xs rounded-full border border-sky-500/40 px-2 text-sky-300">{b.locale.toUpperCase()}</span>}
                    </div>
                    {b.phone && (
                      <a href={`tel:${b.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1 text-gray-300 hover:text-white">
                        <Phone className="w-4 h-4 text-green-400" /> {b.phone}
                      </a>
                    )}
                    <ul className="text-sm text-gray-300 space-y-0.5">
                      <li>{b.service ?? (b.type === 'ritual' ? 'Rituāls' : 'Noma')}</li>
                      {b.sauna && <li className="text-gray-400">{b.sauna}</li>}
                      {b.participants ? <li className="text-gray-400">Dalībnieki: {b.participants}</li> : null}
                      {b.overnight && <li className="text-gray-400">Ar nakšņošanu</li>}
                      {b.transport && <li className="text-sky-300">🚌 {b.transport}</li>}
                      {b.cash_due !== null && (
                        <li className="text-yellow-300">💶 Maksās skaidrā naudā uz vietas: {eur(b.cash_due)}</li>
                      )}
                    </ul>
                    {b.message && <p className="text-sm italic text-gray-400 whitespace-pre-line">“{b.message}”</p>}
                  </article>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
};

export default PirtnieksPage;
