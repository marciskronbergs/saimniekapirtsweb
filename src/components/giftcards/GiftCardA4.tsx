import React from 'react';
import type { GiftCardRitual, Locale } from '../../lib/pricing';
import { a4Steps, formatCardDate, giftCardA4Words, ritualLine } from '../../lib/giftCardText';

// The A4 ritual gift card for the preview: the same two pages the invoice
// function draws (giftcardA4.ts), in HTML at the design's own size
// (794 × 1123 px, an A4 page at 96 dpi).

export const A4_W = 794;
export const A4_H = 1123;

const INK = '#1D2A22';
const TEAL = '#46655F';
const TEAL_SOFT = '#6A807B';
const LABEL = '#5B726C';
const BODY = '#2F3A34';
const GREEN = '#3F9B38';
const STRIPE = '#4AA842';
const TAB = '#A9DA8E';
const BAND = '#6B6560';
const WHITE = '#FFFFFF';

const serif = "'GC Serif', Georgia, serif";
const sans = "'GC Sans', Helvetica, Arial, sans-serif";

const PHOTOS = ['/giftcard/a4_tub.jpg', '/giftcard/a4_whisk.jpg', '/giftcard/a4_scrub.jpg'];

// Lucide icons, 24 × 24, drawn with a stroke.
const ICONS: Record<string, React.ReactNode> = {
  pin: (
    <>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  ticket: (
    <>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </>
  ),
};

interface A4Props {
  page: 1 | 2;
  locale: Locale;
  ritual: GiftCardRitual;
  code: string;
  pin: string;
  validUntil: string;
}

// The logo, the title, three photos cut as chevrons and the grey band.
const Header: React.FC<{ locale: Locale; ritual: GiftCardRitual; band: string }> = ({ locale, ritual, band }) => {
  const w = giftCardA4Words[locale];
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, width: A4_W, height: 300, background: WHITE }} />
      <img src="/giftcard/logo_on_light.png" alt="Saimnieka Pirts" style={{ position: 'absolute', left: 48, top: 34, height: 112, width: 'auto', display: 'block' }} />
      <div style={{ position: 'absolute', left: 190, top: 56, width: 568, textAlign: 'center' }}>
        <div style={{ fontFamily: serif, fontWeight: 600, fontSize: 32, lineHeight: 1.05, letterSpacing: '0.05em', whiteSpace: 'nowrap', textTransform: 'uppercase', color: TEAL }}>
          {w.title}
        </div>
        <div style={{ marginTop: 10, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 27, lineHeight: 1.15, color: TEAL_SOFT }}>
          {ritualLine(ritual, locale)}
        </div>
      </div>
      {PHOTOS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={w.photos[i]}
          style={{
            position: 'absolute', left: 36 + i * 245, top: 170, width: 232, height: 206, objectFit: 'cover', display: 'block',
            clipPath: 'polygon(0 0,100% 0,100% 72%,50% 100%,0 72%)',
          }}
        />
      ))}
      <div style={{ position: 'absolute', left: 0, top: 392, width: A4_W, height: 70, background: BAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 21, letterSpacing: '0.32em', paddingLeft: '0.32em', textTransform: 'uppercase', color: WHITE }}>
          {band}
        </span>
      </div>
    </>
  );
};

const Heading: React.FC<{ children: string }> = ({ children }) => (
  <div style={{ fontFamily: serif, fontWeight: 600, fontSize: 29, lineHeight: 1.1, letterSpacing: '0.07em', textTransform: 'uppercase', color: TEAL }}>{children}</div>
);

const Para: React.FC<{ mt?: number; children: React.ReactNode }> = ({ mt = 8, children }) => (
  <p style={{ margin: `${mt}px 0 0`, fontFamily: sans, fontSize: 13, lineHeight: 1.55, color: BODY }}>{children}</p>
);

const Dashes = () => (
  <div style={{ margin: '20px 0 16px', height: 4, background: `repeating-linear-gradient(90deg,${BAND} 0 16px,transparent 16px 26px)` }} />
);

// A tab with an icon and a white pill with the label and value.
const Row: React.FC<{ top: number; icon: string; label: string; lines: string[]; strong?: boolean }> = ({ top, icon, label, lines, strong }) => (
  <div style={{ position: 'absolute', left: 60, top, width: 674, height: 84 }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 220, height: 84, borderRadius: '18px 0 0 18px', background: TAB }} />
    <svg
      viewBox="0 0 24 24" width="38" height="38" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', left: 62, top: 23 }}
      aria-hidden="true"
    >
      {ICONS[icon]}
    </svg>
    <div
      style={{
        position: 'absolute', left: 170, top: 0, width: 504, height: 84, borderRadius: '42px 18px 18px 42px', background: WHITE, boxSizing: 'border-box',
        padding: '0 28px 0 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 3,
      }}
    >
      <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 10.5, letterSpacing: '0.22em', paddingLeft: '0.22em', textTransform: 'uppercase', color: LABEL }}>{label}</div>
      {lines.map((line, i) =>
        (strong || lines.length === 1) && i === 0 ? (
          <div key={line} style={{ fontFamily: serif, fontWeight: 600, fontSize: 26, lineHeight: 1.1, color: INK }}>{line}</div>
        ) : (
          <div key={line} style={{ fontFamily: sans, fontSize: 14, lineHeight: 1.35, color: BODY }}>{line}</div>
        ),
      )}
    </div>
  </div>
);

const GiftCardA4Page: React.FC<A4Props> = ({ page, locale, ritual, code, pin, validUntil }) => {
  const w = giftCardA4Words[locale];
  const root: React.CSSProperties = {
    position: 'relative', width: A4_W, height: A4_H, overflow: 'hidden',
    background: `repeating-linear-gradient(45deg,${GREEN} 0 14px,${STRIPE} 14px 28px)`,
  };
  if (page === 1) {
    return (
      <div style={root}>
        <Header locale={locale} ritual={ritual} band={w.giftCard} />
        <div
          style={{
            position: 'absolute', left: 48, top: 462, width: 698, minHeight: 560, boxSizing: 'border-box', padding: '30px 44px 32px',
            background: WHITE, display: 'flex', flexDirection: 'column',
          }}
        >
          <Heading>{w.more}</Heading>
          <Para mt={12}>
            <b style={{ fontWeight: 600, color: INK }}>{w.belief}</b> {w.beliefText}
          </Para>
          <Para>{w.invite}</Para>
          <Dashes />
          <Heading>{w.important}</Heading>
          <Para mt={12}>{w.water}</Para>
          <Para>{w.health}</Para>
          <Dashes />
          <Heading>{w.included}</Heading>
          <ol style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {a4Steps(ritual, locale).map(([title, text], i) => (
              <li key={title} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontFamily: serif, fontWeight: 600, fontSize: 18, lineHeight: 1, color: GREEN, width: 12, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                <span style={{ fontFamily: sans, fontSize: 13, lineHeight: 1.5, color: BODY }}>
                  <b style={{ fontWeight: 600, color: INK }}>{title}</b>{' – '}{text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }
  const rows = [
    { icon: 'pin', label: w.place, lines: [...w.placeLines] },
    { icon: 'phone', label: w.book, lines: [...w.bookLines] },
    { icon: 'users', label: w.people, lines: [ritual.people[locale]] },
    { icon: 'clock', label: w.duration, lines: [w.hours(ritual.hours)] },
    { icon: 'ticket', label: w.cardNo, lines: [code, w.codeLine(pin)], strong: true },
    { icon: 'calendar', label: w.valid, lines: [formatCardDate(validUntil)] },
  ];
  return (
    <div style={root}>
      <Header locale={locale} ritual={ritual} band={w.web} />
      {rows.map((row, i) => (
        <Row key={row.icon} top={486 + i * 100} {...row} />
      ))}
    </div>
  );
};

export default GiftCardA4Page;
