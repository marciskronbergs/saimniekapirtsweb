import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { GiftCardRitual, Locale } from '../../lib/pricing';
import {
  formatCardDate,
  giftCardWords,
  ritualLine,
  ritualName,
  ritualSteps,
  type GiftCardKind,
  type GiftCardWords,
} from '../../lib/giftCardText';
import { fontFaces } from './giftCardAssets';
import GiftCardA4Page, { A4_H, A4_W } from './GiftCardA4';

// A preview of the gift card a buyer will get, for the gift card page: the
// same design as the PDF the invoice function draws (giftcard.ts), with the
// same fonts, photos and words, drawn here in HTML at the design's own size
// (850 × 370 px) and scaled to fit; a ritual card also as its A4 pages
// (GiftCardA4). The number and date are a sample until the card is paid for.

const W = 850;
const H = 370;

const INK = '#1D2A22';
const SOFT = '#55615A';
const LABEL = '#5E665F';
const HONEY = '#8A5A22';
const RULE = '#C9BDA5';
const LINEN = '#F4EFE6';
const PAPER = '#F7F3EC';
const TAGLINE = '#3B5443';
const FOREST = '#16221B';
const CREAM = '#F3EBDC';
const CREAM2 = '#E6DBC4';
const CREAM_SOFT = '#D9CDB4';
const HONEY_ON_DARK = '#C9A96E';
const RULE_ON_DARK = '#4A4636';

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

interface Sample {
  code: string;
  validUntil: string;
}

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

// A title, a line in italics and a line of facts: the ritual card, and the
// value card without its amount.
const TitleBlock: React.FC<{ lines: [string, string, string]; max: number; colors: [string, string, string] }> = ({ lines, max, colors }) => (
  <>
    <FitLine max={max} min={36} style={{ marginTop: 8, fontFamily: serif, fontWeight: 600, fontSize: 46, lineHeight: 1, color: colors[0] }}>
      {lines[0]}
    </FitLine>
    <FitLine max={max} min={19} style={{ marginTop: 5, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 24, lineHeight: 1.15, color: colors[1] }}>
      {lines[1]}
    </FitLine>
    <FitLine max={max} min={10} style={{ marginTop: 11, fontFamily: sans, fontSize: 12, lineHeight: 1.2, letterSpacing: '0.05em', color: colors[2] }}>
      {lines[2]}
    </FitLine>
  </>
);

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

interface CardProps {
  kind: GiftCardKind;
  side: 'front' | 'back';
  locale: Locale;
  value: number;
  ritual: GiftCardRitual | null;
  sample: Sample;
}

// One side of a card at the design's size.
const CardSide: React.FC<CardProps> = ({ kind, side, locale, value, ritual, sample }) => {
  const w = giftCardWords[locale];
  const root: React.CSSProperties = { width: W, height: H, display: 'flex', overflow: 'hidden', fontFamily: sans };

  if (kind === 'ritual' && ritual) {
    if (side === 'front') {
      return (
        <div style={{ ...root, background: FOREST, color: CREAM }}>
          <div style={{ width: 360, height: H, boxSizing: 'border-box', padding: '30px 32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img src="/giftcard/logo_on_dark.png" alt="Saimnieka Pirts" style={{ height: 64, width: 'auto', display: 'block' }} />
            <div style={{ marginTop: 17 }}><Eyebrow color={HONEY_ON_DARK}>{w.giftCard}</Eyebrow></div>
            <TitleBlock lines={[w.ritual, ritualLine(ritual, locale), w.facts(ritual)]} max={296} colors={[CREAM, CREAM2, CREAM_SOFT]} />
            <FrontBottom w={w} sample={sample} rule={RULE_ON_DARK} label={CREAM_SOFT} value={CREAM} footer={CREAM_SOFT} />
          </div>
          <Photo src="/giftcard/ritual_front.jpg" alt={w.photos.ritualFront} width={490} />
        </div>
      );
    }
    const steps = ritualSteps(ritual, locale);
    const rows = Math.ceil(steps.length / 2);
    // Six steps (no hot tub) sit a little looser, so the back is as full as with seven.
    const loose = rows < 4;
    return (
      <div style={{ ...root, background: PAPER, color: INK }}>
        <Photo src="/giftcard/ritual_back.jpg" alt={w.photos.ritualBack} width={256} />
        <div style={{ width: 594, height: H, boxSizing: 'border-box', padding: '34px 44px 26px 40px', display: 'flex', flexDirection: 'column' }}>
          <BackHeader w={w} text={`${w.no} ${sample.code}`} />
          <div style={{ marginTop: 10, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 32, lineHeight: 1.05 }}>{w.course}</div>
          <FitLine max={510} min={10} style={{ marginTop: 4, fontFamily: sans, fontSize: 12, lineHeight: 1.4, color: SOFT }}>
            {`${ritualName(ritual, locale)} · ${w.led}`}
          </FitLine>
          <ol
            style={{
              margin: `${loose ? 20 : 14}px 0 0`, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gridTemplateRows: `repeat(${rows}, auto)`, gridAutoFlow: 'column', columnGap: 24, rowGap: loose ? 9 : 6,
            }}
          >
            {steps.map((step, i) => (
              <Step key={step} n={i + 1} bold size={12.5} fit={219}>{step}</Step>
            ))}
          </ol>
          <p style={{ margin: `${loose ? 18 : 14}px 0 0`, fontFamily: sans, fontSize: 12, lineHeight: 1.45, color: SOFT }}>{w.book}</p>
          <BackFooter w={w} sample={sample} />
        </div>
      </div>
    );
  }

  const plain = kind === 'plain';
  if (side === 'front') {
    return (
      <div style={{ ...root, background: LINEN, color: INK }}>
        <Photo src="/giftcard/value_front.jpg" alt={w.photos.valueFront} width={490} />
        <div style={{ width: 360, height: H, boxSizing: 'border-box', padding: '30px 34px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src="/giftcard/logo_on_light.png" alt="Saimnieka Pirts" style={{ height: 64, width: 'auto', display: 'block' }} />
          <div style={{ marginTop: 17 }}><Eyebrow color={HONEY}>{w.giftCard}</Eyebrow></div>
          {plain ? (
            <TitleBlock lines={[w.plainTitle, w.plainLine, w.plainFacts]} max={292} colors={[INK, TAGLINE, LABEL]} />
          ) : (
            <>
              <div style={{ marginTop: 4, width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'baseline' }}>
                <span />
                <span style={{ position: 'relative', left: -4, fontFamily: serif, fontWeight: 600, fontSize: 86, lineHeight: 0.95, color: INK }}>{value}</span>
                <span style={{ position: 'relative', left: -4, justifySelf: 'start', marginLeft: 9, fontFamily: sans, fontWeight: 600, fontSize: 15, letterSpacing: '0.16em', color: HONEY }}>
                  EUR
                </span>
              </div>
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 25, lineHeight: 1.1, color: TAGLINE }}>{w.tagline}</div>
            </>
          )}
          <FrontBottom w={w} sample={sample} rule={RULE} label={LABEL} value={INK} footer={LABEL} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...root, background: PAPER, color: INK }}>
      <div style={{ width: 594, height: H, boxSizing: 'border-box', padding: '34px 40px 26px 44px', display: 'flex', flexDirection: 'column' }}>
        <BackHeader w={w} text={plain ? `${w.no} ${sample.code}` : `${w.no} ${sample.code} · ${value} EUR`} />
        <div style={{ marginTop: 10, fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 32, lineHeight: 1.05 }}>{w.howTo}</div>
        <ol style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
          {w.steps.map((step, i) => (
            <Step key={step} n={i + 1}>{step}</Step>
          ))}
        </ol>
        <p style={{ margin: '18px 0 0', fontFamily: sans, fontSize: 12.5, lineHeight: 1.45, color: SOFT }}>{plain ? w.anyServicePlain : w.anyService}</p>
        <BackFooter w={w} sample={sample} />
      </div>
      <Photo src="/giftcard/value_back.jpg" alt={w.photos.valueBack} width={256} />
    </div>
  );
};

// A design at the width of its container: drawn at its own size and scaled.
const Scaled: React.FC<{ w: number; h: number; label: string; width?: number; children: React.ReactNode }> = ({ w, h, label, width, children }) => {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / w);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [w]);
  return (
    <figure className="space-y-2">
      <div
        ref={box}
        className="relative overflow-hidden rounded-md shadow-2xl shadow-black/60"
        style={{ aspectRatio: `${w} / ${h}`, width: width ?? '100%' }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
      <figcaption className="text-xs uppercase tracking-widest text-gray-400">{label}</figcaption>
    </figure>
  );
};

// A sample number in the card's own form, that of its advance invoice
// (AR-YYYY-NNNN), and a year's validity.
function sampleCard(): Sample {
  const now = new Date();
  const until = new Date(now);
  until.setFullYear(now.getFullYear() + 1);
  const iso = `${until.getFullYear()}-${String(until.getMonth() + 1).padStart(2, '0')}-${String(until.getDate()).padStart(2, '0')}`;
  return { code: `AR-${now.getFullYear()}-0000`, validUntil: iso };
}

interface GiftCardPreviewProps {
  // A value card (shown with and without its amount) or a ritual card (as a
  // card and as an A4 page).
  value?: number;
  ritual?: GiftCardRitual | null;
  onClose: () => void;
}

const GiftCardPreview: React.FC<GiftCardPreviewProps> = ({ value = 0, ritual = null, onClose }) => {
  const { t, i18n } = useTranslation('giftcards');
  const locale: Locale = i18n.language === 'en' ? 'en' : 'lv';
  // The second version: the value card without its amount, the ritual card on A4.
  const [second, setSecond] = useState(false);
  // On a phone the card is small; enlarged, it scrolls sideways at a readable size.
  const [enlarged, setEnlarged] = useState(false);
  const [sample] = useState(sampleCard);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pressedOutside = useRef(false);
  const kind: GiftCardKind = ritual ? 'ritual' : second ? 'plain' : 'value';
  const a4 = !!ritual && second;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panelRef.current) return;
      // Keep the keyboard inside the dialog.
      const focusable = panelRef.current.querySelectorAll<HTMLElement>('button, a[href]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [onClose]);

  const tab = (isSecond: boolean, label: string) => (
    <button
      type="button"
      aria-pressed={second === isSecond}
      onClick={() => setSecond(isSecond)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        second === isSecond ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'
      }`}
    >
      {label}
    </button>
  );

  // On the page body: the forms around it are transformed, which would pin a
  // fixed overlay to them instead of the window.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-card-preview-title"
      className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center bg-black/85 p-3 sm:p-6 overflow-y-auto"
      // Closes on a click on the backdrop, but not at the end of a drag that
      // started inside the dialog (selecting text).
      onMouseDown={(e) => {
        pressedOutside.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedOutside.current && e.target === e.currentTarget) onClose();
      }}
    >
      <style>{fontFaces}</style>
      <div
        ref={panelRef}
        className="relative w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-green-500/20 bg-[#0d0d0d] p-4 sm:p-8 text-white space-y-5 my-auto"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="gift-card-preview-title" className="text-xl sm:text-2xl font-bold">{t('preview.title')}</h2>
            <p className="mt-1 text-sm sm:text-base text-gray-300">{t(ritual ? 'preview.bothVersionsRitual' : 'preview.bothVersions')}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t('preview.close')} className="rounded-lg p-2 hover:bg-white/10 shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('preview.title')}>
          {tab(false, t(ritual ? 'preview.card' : 'preview.withAmount'))}
          {tab(true, t(ritual ? 'preview.a4' : 'preview.withoutAmount'))}
        </div>
        <button
          type="button"
          aria-pressed={enlarged}
          onClick={() => setEnlarged(!enlarged)}
          className="sm:hidden rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold text-gray-200"
        >
          {enlarged ? t('preview.fit') : t('preview.enlarge')}
        </button>
        {/* The A4 pages side by side where there is room. */}
        <div className={`${a4 ? 'grid gap-5 sm:grid-cols-2' : 'space-y-5'}${enlarged ? ' overflow-x-auto -mx-4 px-4 pb-2' : ''}`}>
          {a4 && ritual
            ? ([1, 2] as const).map((page) => (
              <Scaled key={page} w={A4_W} h={A4_H} label={t(page === 1 ? 'preview.page1' : 'preview.page2')} width={enlarged ? 700 : undefined}>
                <GiftCardA4Page page={page} locale={locale} ritual={ritual} code={sample.code} validUntil={sample.validUntil} />
              </Scaled>
            ))
            : (['front', 'back'] as const).map((side) => (
              <Scaled key={side} w={W} h={H} label={t(side === 'front' ? 'preview.front' : 'preview.back')} width={enlarged ? 760 : undefined}>
                <CardSide kind={kind} side={side} locale={locale} value={value} ritual={ritual} sample={sample} />
              </Scaled>
            ))}
        </div>
        <p className="text-xs sm:text-sm text-gray-400">{t('preview.sample')}</p>
      </div>
    </div>,
    document.body,
  );
};

export default GiftCardPreview;
