import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, ExternalLink, LogOut, Mail, Phone, RefreshCw, Search } from 'lucide-react';
import { PopupContext } from '../App';
import { OfficeError, callInvoiceFunction, eur, useOfficePage } from '../lib/officeApi';
import MastersSection, { type Master, type MasterDraft } from './birojs/MastersSection';

// The office's CRM: the booking calendar, new bookings through the website's
// own forms, and the upcoming bookings with their invoices, each of which can
// be cancelled. Everything behind the office PIN, which the invoice function
// checks on every call; the page only keeps it for the open tab.

interface Line {
  name: string;
  quantity: number;
  amount: number;
}

interface InvoiceInfo {
  items: Line[];
  total: number | null;
  advance: { number: string; status: 'issued' | 'annulled'; link: string } | null;
  final: { number: string } | null;
}

interface Booking extends InvoiceInfo {
  id: string;
  type: 'noma' | 'ritual';
  date: string;
  time: string;
  sauna: string | null;
  service: string | null;
  participants: number | null;
  overnight: boolean;
  transport: string | null;
  payment: 'transfer' | 'cash';
  master_id: string | null;
  message: string | null;
  name: string;
  email: string;
  phone: string | null;
  locale: 'lv' | 'en';
}

interface GiftCard extends InvoiceInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  locale: 'lv' | 'en';
  created_at: string;
}

interface OfficeList {
  today: string;
  bookings: Booking[];
  gift_cards: GiftCard[];
  masters: Master[];
}

const calendars = [
  'c_4e06f936575fae87c8c1f21808d2d67faf599ac2f8a6e5276bb706874f233155@group.calendar.google.com',
  'c_94feb01b5ce8a360b843ddcf910ad8fe6b6b2a36b9348f9db6667a9a004ba51a@group.calendar.google.com',
];
const calendarModes = [
  { mode: 'MONTH', label: 'Mēnesis' },
  { mode: 'WEEK', label: 'Nedēļa' },
  { mode: 'AGENDA', label: 'Saraksts' },
] as const;
const calendarSrc = (mode: string) =>
  'https://calendar.google.com/calendar/embed?height=600&wkst=2&bgcolor=%23000000&ctz=Europe%2FRiga' +
  `&showTitle=0&showNav=1&showDate=1&showCalendars=0&showTabs=0&mode=${mode}` +
  calendars.map((c) => `&src=${encodeURIComponent(c)}`).join('');

const pinKey = 'birojs_pin';
const storedPin = () => {
  try {
    return sessionStorage.getItem(pinKey) ?? '';
  } catch {
    return '';
  }
};
const storePin = (pin: string | null) => {
  try {
    if (pin) sessionStorage.setItem(pinKey, pin);
    else sessionStorage.removeItem(pinKey);
  } catch {
    // Without storage the PIN is asked again after a reload; nothing else changes.
  }
};

// "svētdiena, 4. oktobris"
const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('lv-LV', { weekday: 'long', day: 'numeric', month: 'long' });

const dayHeading = (iso: string, today: string) => {
  const tomorrow = new Date(`${today}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (iso === today) return `Šodien · ${longDate(iso)}`;
  if (iso === tomorrow.toLocaleDateString('en-CA')) return `Rīt · ${longDate(iso)}`;
  return longDate(iso);
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('lv-LV', { day: 'numeric', month: 'short', timeZone: 'Europe/Riga' });

const Badge = ({ children, tone = 'gray' }: { children: ReactNode; tone?: 'green' | 'gray' | 'red' | 'blue' }) => {
  const tones = {
    green: 'bg-green-500/15 text-green-300 border-green-500/30',
    gray: 'bg-gray-700/40 text-gray-300 border-gray-600/50',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
    blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  };
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
};

const InvoiceLine = ({ info, cash = false }: { info: InvoiceInfo; cash?: boolean }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
    <span className="font-semibold text-white">{info.total === null ? 'Cena jāpārbauda' : eur(info.total)}</span>
    {info.advance ? (
      <a
        href={info.advance.link}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 underline underline-offset-2"
      >
        {info.advance.number}
        {info.advance.status === 'annulled' ? ' (anulēts)' : ''}
        <ExternalLink className="w-3 h-3" />
      </a>
    ) : (
      <span className="text-gray-500">{cash ? 'Skaidrā naudā uz vietas – bez rēķina' : 'Avansa rēķina vēl nav'}</span>
    )}
    {info.final && <Badge tone="green">Gala rēķins {info.final.number}</Badge>}
  </div>
);

const Contact = ({ email, phone }: { email: string; phone: string | null }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
    {phone && (
      <a href={`tel:${phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1 text-gray-300 hover:text-white">
        <Phone className="w-3.5 h-3.5 text-green-400" />
        {phone}
      </a>
    )}
    <a href={`mailto:${email}`} className="inline-flex items-center gap-1 text-gray-300 hover:text-white break-all">
      <Mail className="w-3.5 h-3.5 text-green-400" />
      {email}
    </a>
  </div>
);

const BirojsPage = () => {
  useOfficePage('Birojs');
  const popup = useContext(PopupContext);

  const [pin, setPin] = useState(storedPin);
  const [pinInput, setPinInput] = useState('');
  const [list, setList] = useState<OfficeList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mode, setMode] = useState<string>('MONTH');
  const [query, setQuery] = useState('');

  const load = useCallback(async (withPin: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await callInvoiceFunction<OfficeList>({ office: { pin: withPin, action: 'list' } });
      setList({ ...data, masters: data.masters ?? [] });
      setPin(withPin);
      storePin(withPin);
    } catch (e) {
      const err = e as OfficeError;
      if (err.code === 'wrong_pin' || err.code === 'pin_locked') {
        storePin(null);
        setPin('');
        setList(null);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pin) load(pin);
    // Only on opening the page; later loads come from the buttons.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A booking made from here goes through the website's popup; when it closes,
  // the list is fetched again so the new booking shows.
  const popupWasOpen = useRef(false);
  useEffect(() => {
    if (popup?.isPopupOpen) popupWasOpen.current = true;
    else if (popupWasOpen.current) {
      popupWasOpen.current = false;
      if (pin) load(pin);
    }
  }, [popup?.isPopupOpen, pin, load]);

  const logOut = () => {
    storePin(null);
    setPin('');
    setList(null);
    setNotice(null);
    setError(null);
  };

  const cancel = async (b: Booking) => {
    const when = `${longDate(b.date)} ${b.time}`;
    if (!window.confirm(`Atcelt ${b.name} rezervāciju (${when})?\n\nLaiks mājaslapā atkal būs brīvs, avansa rēķins tiks anulēts, un notikums tiks izņemts no kalendāra.`)) return;
    setBusyId(b.id);
    setError(null);
    setNotice(null);
    try {
      await callInvoiceFunction({ manage: { reservation: b.id, pin, action: 'cancel' } });
      setNotice(`${b.name} rezervācija (${when}) atcelta.`);
      await load(pin);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  // Assigning a master saves at once; the list is updated in place.
  const assign = async (b: Booking, masterId: string) => {
    setError(null);
    setNotice(null);
    try {
      await callInvoiceFunction({ office: { pin, action: 'assign', reservation: b.id, master_id: masterId || null } });
      setList((l) => {
        if (!l) return l;
        const bookings = l.bookings.map((x) => (x.id === b.id ? { ...x, master_id: masterId || null } : x));
        const upcoming = (id: string) => bookings.filter((x) => x.master_id === id).length;
        return { ...l, bookings, masters: l.masters.map((m) => ({ ...m, upcoming: upcoming(m.id) })) };
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveMaster = async (draft: MasterDraft) => {
    setBusyId('masters');
    setError(null);
    setNotice(null);
    try {
      const data = await callInvoiceFunction<{ masters: Master[] }>({ office: { pin, action: 'save_master', master: draft } });
      setList((l) => (l ? { ...l, masters: data.masters } : l));
      setNotice(draft.id ? `${draft.name} saglabāts.` : `${draft.name} pievienots. Nokopējiet saiti un nosūtiet to pirtniekam.`);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const bookingsByDay = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (b: Booking) =>
      !q ||
      [b.name, b.email, b.phone, b.service, b.sauna, b.advance?.number, list?.masters.find((m) => m.id === b.master_id)?.name]
        .some((v) => v?.toLowerCase().includes(q));
    const days = new Map<string, Booking[]>();
    for (const b of list?.bookings ?? []) {
      if (!matches(b)) continue;
      days.set(b.date, [...(days.get(b.date) ?? []), b]);
    }
    return [...days.entries()];
  }, [list, query]);

  if (!pin || !list) {
    return (
      <main className="min-h-screen bg-black text-white flex items-start justify-center px-4 py-16">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pinInput) load(pinInput);
          }}
          className="w-full max-w-sm rounded-2xl border border-green-500/30 bg-[#0d0d0d] p-6 space-y-5"
        >
          <img
            src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png"
            alt="SaimniekaPirts"
            className="h-14 mx-auto object-contain"
          />
          <h1 className="text-xl font-bold text-center">Birojs</h1>
          {pin && loading ? (
            <p className="text-center text-gray-400">Ielādē…</p>
          ) : (
            <>
              <label className="block text-sm text-gray-300">
                PIN
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.trim())}
                  className="mt-1 w-full rounded-lg bg-gray-800 border border-gray-600 px-4 py-3 text-white text-lg tracking-widest"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !pinInput}
                className="w-full rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-600 py-3 font-semibold text-black"
              >
                {loading ? 'Pārbauda…' : 'Ieiet'}
              </button>
            </>
          )}
          {error && <p className="rounded-lg bg-red-900/40 border border-red-600 p-3 text-red-300 text-sm">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/logo/logoTitle.png"
              alt="SaimniekaPirts"
              className="h-10 sm:h-12 object-contain"
            />
            <h1 className="text-lg sm:text-xl font-bold text-green-400">Birojs</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(pin)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atjaunot</span>
            </button>
            <button
              onClick={logOut}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Iziet</span>
            </button>
          </div>
        </header>

        {notice && <p className="rounded-lg bg-green-900/40 border border-green-600 p-3 text-green-300">{notice}</p>}
        {error && <p className="rounded-lg bg-red-900/40 border border-red-600 p-3 text-red-300">{error}</p>}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {calendarModes.map((m) => (
                <button
                  key={m.mode}
                  onClick={() => setMode(m.mode)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    mode === m.mode ? 'bg-green-600 text-black' : 'bg-gray-800 text-green-400 hover:bg-gray-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <a
              href={calendarSrc(mode)}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
            >
              <CalendarDays className="w-4 h-4" />
              Atvērt kalendāru
            </a>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-[#0d0d0d] p-2">
            <iframe
              key={mode}
              src={calendarSrc(mode)}
              title="Google kalendārs"
              className="w-full h-[420px] sm:h-[600px] rounded-lg border-0"
            />
          </div>
        </section>

        <section className="rounded-xl border border-green-500/20 bg-[#0d0d0d] p-5 space-y-4">
          <h2 className="text-lg font-bold text-green-400">Jauna rezervācija</h2>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              onClick={() => popup?.openCustomPopup('noma')}
              className="rounded-lg bg-green-600 hover:bg-green-500 py-3 font-semibold text-black"
            >
              Noma
            </button>
            <button
              onClick={() => popup?.openCustomPopup('ritual')}
              className="rounded-lg bg-green-600 hover:bg-green-500 py-3 font-semibold text-black"
            >
              Rituāls
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Tās pašas formas kā mājaslapā, ar tām pašām cenām: klients saņem apstiprinājumu, birojs saņem avansa
            rēķinu, un rezervācija parādās kalendārā. Formas pieņem rezervācijas ne ātrāk kā 24 h iepriekš.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-green-400">
              Rezervācijas <span className="text-gray-400 font-normal">· nākamās 90 dienas · {list.bookings.length}</span>
            </h2>
            <label className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Meklēt vārdu, tālruni, rēķinu…"
                className="w-full rounded-lg bg-gray-900 border border-gray-700 pl-9 pr-3 py-2 text-sm text-white"
              />
            </label>
          </div>

          {bookingsByDay.length === 0 && (
            <p className="text-gray-400">{query ? 'Nekas netika atrasts.' : 'Nākamajās 90 dienās rezervāciju nav.'}</p>
          )}

          {bookingsByDay.map(([day, bookings]) => (
            <div key={day} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{dayHeading(day, list.today)}</h3>
              {bookings.map((b) => (
                <article
                  key={b.id}
                  className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-4 grid gap-3 sm:grid-cols-[4.5rem_1fr_auto]"
                >
                  <div className="text-2xl font-bold text-green-400">{b.time}</div>
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">{b.name}</span>
                      <Badge tone={b.type === 'ritual' ? 'green' : 'blue'}>{b.type === 'ritual' ? 'Rituāls' : 'Noma'}</Badge>
                      {b.sauna && <Badge>{b.sauna}</Badge>}
                      {b.locale === 'en' && <Badge tone="blue">EN</Badge>}
                      {b.payment === 'cash' && <Badge tone="green">💶 Skaidrā naudā</Badge>}
                      {b.advance?.status === 'annulled' && <Badge tone="red">Rēķins anulēts</Badge>}
                    </div>
                    <Contact email={b.email} phone={b.phone} />
                    <ul className="text-sm text-gray-300 space-y-0.5">
                      {b.items.length > 0
                        ? b.items.map((i, n) => (
                            <li key={n} className="flex justify-between gap-4 max-w-lg">
                              <span>
                                {i.name}
                                {i.quantity > 1 ? ` × ${i.quantity}` : ''}
                              </span>
                              <span className="text-gray-400 whitespace-nowrap">{eur(i.amount)}</span>
                            </li>
                          ))
                        : b.service && <li>{b.service}</li>}
                      {b.participants ? <li className="text-gray-400">Dalībnieki: {b.participants}</li> : null}
                      {b.transport && <li className="text-sky-300">🚌 {b.transport}</li>}
                      {b.overnight && b.items.every((i) => !i.name.startsWith('Nakšņošana')) && (
                        <li className="text-gray-400">Ar nakšņošanu</li>
                      )}
                    </ul>
                    {b.message && <p className="text-sm italic text-gray-400 whitespace-pre-line">“{b.message}”</p>}
                    <InvoiceLine info={b} cash={b.payment === 'cash'} />
                    <label className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                      Pirtnieks:
                      <select
                        value={b.master_id ?? ''}
                        onChange={(e) => assign(b, e.target.value)}
                        className="rounded-lg bg-gray-800 border border-gray-600 px-2 py-1 text-white"
                      >
                        <option value="">— nav piešķirts —</option>
                        {list.masters
                          .filter((m) => m.active || m.id === b.master_id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                      {!b.master_id && b.type === 'ritual' && <Badge tone="red">Rituālam nav pirtnieka</Badge>}
                    </label>
                  </div>
                  <div className="sm:text-right">
                    {!b.final && (
                      <button
                        onClick={() => cancel(b)}
                        disabled={busyId !== null}
                        className="rounded-lg border border-red-600/60 text-red-300 hover:bg-red-900/40 disabled:opacity-50 px-3 py-2 text-sm"
                      >
                        {busyId === b.id ? 'Atceļ…' : 'Atcelt'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ))}
        </section>

        <MastersSection masters={list.masters} busy={busyId !== null} onSave={saveMaster} />

        <section className="space-y-3 pb-12">
          <h2 className="text-lg font-bold text-green-400">
            Dāvanu kartes <span className="text-gray-400 font-normal">· pēdējās 90 dienas · {list.gift_cards.length}</span>
          </h2>
          {list.gift_cards.length === 0 && <p className="text-gray-400">Pēdējās 90 dienās pasūtījumu nav.</p>}
          {list.gift_cards.map((g) => (
            <article key={g.id} className="rounded-xl border border-gray-800 bg-[#0d0d0d] p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400">{shortDate(g.created_at)}</span>
                <span className="font-semibold">{g.name}</span>
                {g.locale === 'en' && <Badge tone="blue">EN</Badge>}
              </div>
              <Contact email={g.email} phone={g.phone} />
              <p className="text-sm text-gray-300">{g.items[0]?.name ?? g.service}</p>
              <InvoiceLine info={g} />
            </article>
          ))}
          <p className="text-xs text-gray-500">
            Dāvanu kartes gala rēķinu izraksta, kad karte ir apmaksāta: atveriet avansa rēķina saiti un nospiediet
            “Apmaksāts – izrakstīt gala rēķinu tagad”.
          </p>
        </section>
      </div>
    </main>
  );
};

export default BirojsPage;
