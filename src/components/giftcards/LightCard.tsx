import React, { useLayoutEffect, useRef, useState } from 'react';
import type { GiftCardRitual, Locale } from '../../lib/pricing';
import { formatCardDate, giftCardWords, type GiftCardWords } from '../../lib/giftCardText';

// The light gift card for the preview: the same design as the PDF the invoice
// function draws (giftcardLight.ts), with the same fonts, photos and words, in
// HTML at the design's own size (850 × 370 px). It always shows the amount (a
// ritual card: the ritual's price).

export interface Sample {
  code: string;
  pin: string;
  validUntil: string;
}

export const LIGHT_W = 850;
export const LIGHT_H = 370;
const W = LIGHT_W;
const H = LIGHT_H;

const INK = '#1D2A22';
const SOFT = '#55615A';
const LABEL = '#5E665F';
const HONEY = '#8A5A22';
const RULE = '#C9BDA5';
const LINEN = '#F4EFE6';
const PAPER = '#F7F3EC';
const TAGLINE = '#3B5443';

const serif = "'GC Serif', Georgia, serif";
const sans = "'GC Sans', Helvetica, Arial, sans-serif";


// A line that shrinks, from its size down to `min`, until it fits `max` px,
// as the PDF's lines do.
const FitLine: React.FC<{ max: number; min: number; style: React.CSSProperties; children: string }> = ({ max, min, style, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const start = Number(style.fontSize);
  const [size, setSize] = useState(start);
  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      let s = start;
      el.style.fontSize = `${s}px`;
      while (s > min && el.scrollWidth > max) {
        s -= 0.25;
        el.style.fontSize = `${s}px`;
      }
      setSize(s);
    };
    fit();
    let live = true;
    document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
    };
  }, [children, max, min, start]);
  return (
    <div ref={ref} style={{ ...style, fontSize: size, whiteSpace: 'nowrap', maxWidth: max }}>
      {children}
    </div>
  );
};

const Eyebrow: React.FC<{ color: string; center?: boolean; children: string }> = ({ color, center = true, children }) => (
  <div
    style={{
      fontFamily: sans, fontWeight: 600, fontSize: 11, lineHeight: 1.2, letterSpacing: '0.32em',
      paddingLeft: center ? '0.32em' : 0, textTransform: 'uppercase', color,
    }}
  >
    {children}
  </div>
);


// The rule, the number and date, and the footer, at the same height on every front.
const FrontBottom: React.FC<{ w: GiftCardWords; sample: Sample; rule: string; label: string; value: string; footer: string }> = ({
  w, sample, rule, label, value, footer,
}) => {
  const cell = (l: string, v: string, extra: React.CSSProperties = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, ...extra }}>
      <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 10.5, lineHeight: 1.2, letterSpacing: '0.24em', paddingLeft: '0.24em', textTransform: 'uppercase', color: label }}>
        {l}
      </span>
      <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 14, lineHeight: 1.2, letterSpacing: '0.04em', color: value }}>{v}</span>
    </div>
  );
  return (
    <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', height: 1, background: rule }} />
      <div style={{ marginTop: 12, width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {cell(w.no, sample.code)}
        {cell(w.validUntil, formatCardDate(sample.validUntil), { borderLeft: `1px solid ${rule}` })}
      </div>
      <div style={{ marginTop: 30, fontFamily: sans, fontSize: 11.5, lineHeight: 1.2, letterSpacing: '0.06em', color: footer }}>{w.contact}</div>
    </div>
  );
};

const Photo: React.FC<{ src: string; alt: string; width: number }> = ({ src, alt, width }) => (
  <img src={src} alt={alt} style={{ width, height: H, objectFit: 'cover', display: 'block', flexShrink: 0 }} />
);

const Step: React.FC<{ n: number; bold?: boolean; size?: number; fit?: number; children: string }> = ({ n, bold, size = 13, fit, children }) => {
  const text: React.CSSProperties = { fontFamily: sans, fontWeight: bold ? 600 : 400, fontSize: size, lineHeight: 1.45, color: INK };
  return (
    <li style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
      <span style={{ fontFamily: serif, fontWeight: 600, fontSize: 21, lineHeight: 1, color: HONEY, width: 12, flexShrink: 0, textAlign: 'center' }}>{n}</span>
      {fit ? <FitLine max={fit} min={10.5} style={text}>{children}</FitLine> : <span style={text}>{children}</span>}
    </li>
  );
};

const BackHeader: React.FC<{ w: GiftCardWords; text: string }> = ({ w, text }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
    <Eyebrow color={HONEY} center={false}>{w.giftCard}</Eyebrow>
    <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 12, lineHeight: 1.2, letterSpacing: '0.04em', color: INK }}>{text}</span>
  </div>
);

const BackFooter: React.FC<{ w: GiftCardWords; sample: Sample }> = ({ w, sample }) => (
  <div style={{ marginTop: 'auto', borderTop: `1px solid ${RULE}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 3, fontFamily: sans, fontSize: 11, lineHeight: 1.35, color: LABEL }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span>{w.validity(formatCardDate(sample.validUntil))}</span>
      <span style={{ fontWeight: 600, color: INK }}>saimniekapirts.lv</span>
    </div>
    <div>{w.address}</div>
  </div>
);

interface LightCardProps {
  side: 'front' | 'back';
  locale: Locale;
  value: number;
  ritual: GiftCardRitual | null;
  sample: Sample;
}

// One side of the light card at the design's size.
export const LightCardSide: React.FC<LightCardProps> = ({ side, locale, value, ritual, sample }) => {
  const w = giftCardWords[locale];
  // When the words on the back run long, the gaps close up, as in the PDF.
  const backRef = useRef<HTMLDivElement>(null);
  const [tight, setTight] = useState(false);
  useLayoutEffect(() => {
    const el = backRef.current;
    if (!el) return;
    const fit = () => setTight(el.scrollHeight > el.clientHeight);
    setTight(false);
    requestAnimationFrame(fit);
    document.fonts?.ready.then(() => requestAnimationFrame(fit));
  }, [locale, value, ritual, side]);
  const root: React.CSSProperties = { width: W, height: H, display: 'flex', overflow: 'hidden', fontFamily: sans };

  if (side === 'front') {
    return (
      <div style={{ ...root, background: LINEN, color: INK }}>
        <Photo src="/giftcard/value_front.jpg" alt={w.photos.lightFront} width={490} />
        <div style={{ width: 360, height: H, boxSizing: 'border-box', padding: '30px 34px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src="/giftcard/logo_on_light.png" alt="Saimnieka Pirts" style={{ height: 64, width: 'auto', display: 'block' }} />
          <div style={{ marginTop: 17 }}><Eyebrow color={HONEY}>{w.giftCard}</Eyebrow></div>
          <div style={{ marginTop: 4, width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'baseline' }}>
            <span />
            <span style={{ position: 'relative', left: -4, fontFamily: serif, fontWeight: 600, fontSize: 86, lineHeight: 0.95, color: INK }}>{value}</span>
            <span style={{ position: 'relative', left: -4, justifySelf: 'start', marginLeft: 9, fontFamily: sans, fontWeight: 600, fontSize: 15, letterSpacing: '0.16em', color: HONEY }}>
              EUR
            </span>
          </div>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 25, lineHeight: 1.1, color: TAGLINE }}>{w.tagline}</div>
          <FrontBottom w={w} sample={sample} rule={RULE} label={LABEL} value={INK} footer={LABEL} />
        </div>
      </div>
    );
  }
  const header = `${w.no} ${sample.code} · ${w.code} ${sample.pin} · ${value} EUR`;
  return (
    <div style={{ ...root, background: PAPER, color: INK }}>
      <div ref={backRef} style={{ width: 594, height: H, boxSizing: 'border-box', padding: '34px 40px 26px 44px', display: 'flex', flexDirection: 'column' }}>
        <BackHeader w={w} text={header} />
        <div style={{ marginTop: 10, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 32, lineHeight: 1.05 }}>{w.howTo}</div>
        <ol style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: tight ? 5 : 11 }}>
          {w.steps.map((step, i) => (
            <Step key={step} n={i + 1}>{step}</Step>
          ))}
        </ol>
        <p style={{ margin: `${tight ? 10 : 18}px 0 0`, fontFamily: sans, fontSize: 12.5, lineHeight: 1.45, color: SOFT }}>{ritual ? w.ritualService(ritual) : w.anyService}</p>
        <BackFooter w={w} sample={sample} />
      </div>
      <Photo src="/giftcard/light_back.jpg" alt={w.photos.lightBack} width={256} />
    </div>
  );
};
