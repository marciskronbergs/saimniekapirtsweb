import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { GiftCardRitual, Locale } from '../../lib/pricing';
import { formatCardDate, giftCardWords } from '../../lib/giftCardText';
import { fontFaces } from './giftCardAssets';
import GiftCardA4Page, { A4_H, A4_W } from './GiftCardA4';
import { LIGHT_H, LIGHT_W, LightCardSide, type Sample } from './LightCard';

// A preview of the gift card a buyer will get, for the gift card page: the
// owner's "Dāvanu karte – PIRTS PRIEKIEM" as the PDF the invoice function
// draws it (giftcard.ts), the same pictures with the same words laid over
// them, at the pictures' own size (2000 × 873 px) and scaled to fit; a ritual
// card also as its A4 pages (GiftCardA4). The number and date are a sample
// until the card is paid for.

const W = 2000;
const H = 873;

const GOLD = '#FEDD58';
const GOLD_SOFT = '#AE9C47';
const sans = "'GC Sans', Helvetica, Arial, sans-serif";

// A line placed by its baseline, as the PDF places it (Montserrat sits 0.8585
// of its size below the top of a line box of height 1). It shrinks, from its
// size down to `min`, until it fits `max` px.
const Line: React.FC<{
  x: number; y: number; size: number; min?: number; max?: number; bold?: boolean; color?: string; spacing?: number;
  align?: 'left' | 'center'; children: string;
}> = ({ x, y, size, min, max, bold, color = GOLD, spacing = 0, align = 'left', children }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState(size);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !max) return;
    const measure = () => {
      let s = size;
      el.style.fontSize = `${s}px`;
      while (min && s > min && el.offsetWidth > max) {
        s -= 0.5;
        el.style.fontSize = `${s}px`;
      }
      setFit(s);
    };
    measure();
    let live = true;
    document.fonts?.ready.then(() => live && measure());
    return () => {
      live = false;
    };
  }, [children, size, min, max]);
  return (
    <span
      ref={ref}
      style={{
        position: 'absolute', top: y - 0.8585 * fit, left: x, transform: align === 'center' ? 'translateX(-50%)' : undefined,
        fontFamily: sans, fontWeight: bold ? 600 : 400, fontSize: fit, lineHeight: 1, letterSpacing: spacing, color, whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};


interface CardProps {
  side: 'front' | 'back';
  locale: Locale;
  value: number;
  ritual: GiftCardRitual | null;
  sample: Sample;
}

// One side of the ribbon card. It always shows the amount (a ritual card: the
// ritual's price); a ritual card names the ritual in the line under it.
const CardSide: React.FC<CardProps> = ({ side, locale, value, ritual, sample }) => {
  const w = giftCardWords[locale];
  const root: React.CSSProperties = { position: 'relative', width: W, height: H, overflow: 'hidden' };
  if (side === 'back') {
    return (
      <div style={root}>
        <img src="/giftcard/card_back.jpg" alt={w.photos.ribbonBack} style={{ width: W, height: H, display: 'block' }} />
      </div>
    );
  }
  const usage = ritual ? w.ritualUsage(ritual) : w.usage;
  return (
    <div style={root}>
      <img src="/giftcard/card_front.jpg" alt={w.photos.ribbonFront} style={{ width: W, height: H, display: 'block' }} />
      <Line x={1524} y={243} size={50} min={34} max={336} bold>{sample.code}</Line>
      <span style={{ position: 'absolute', top: 322 - 0.8585 * 22, left: 1524, fontFamily: sans, fontSize: 22, lineHeight: 1, color: GOLD, whiteSpace: 'nowrap' }}>
        {w.codeLine}{' '}
        <strong style={{ fontWeight: 600, fontSize: 28, letterSpacing: 2, marginLeft: 6 }}>{sample.pin}</strong>
      </span>
      <Line x={955} y={510} size={68} bold align="center">{`${value} EUR`}</Line>
      <Line x={1280} y={516} size={36} bold>{w.valueWord}</Line>
      <Line x={1418} y={607} size={50} bold>{formatCardDate(sample.validUntil)}</Line>
      <Line x={1040} y={680} size={26} min={18} max={960} spacing={0.5} align="center">{usage}</Line>
      <Line x={1040} y={714} size={20} min={15} max={960} spacing={0.5} color={GOLD_SOFT} align="center">{w.payMore}</Line>
      <Line x={1040} y={766} size={20} min={14} max={1120} spacing={5} color={GOLD_SOFT} align="center">{w.ribbonAddress}</Line>
      <Line x={1040} y={798} size={20} min={14} max={1120} spacing={5} color={GOLD_SOFT} align="center">{w.book}</Line>
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
  return { code: `AR-${now.getFullYear()}-0000`, pin: 'ABCD', validUntil: iso };
}

interface GiftCardPreviewProps {
  // The card's value (a ritual: its price), shown on both cards.
  // A value card, or a ritual card (as a card and as an A4 page).
  value?: number;
  ritual?: GiftCardRitual | null;
  onClose: () => void;
}

const GiftCardPreview: React.FC<GiftCardPreviewProps> = ({ value = 0, ritual = null, onClose }) => {
  const { t, i18n } = useTranslation('giftcards');
  const locale: Locale = i18n.language === 'en' ? 'en' : 'lv';
  // Which card is shown: the ribbon card, the light card, or a ritual's A4.
  const [view, setView] = useState<'ribbon' | 'light' | 'a4'>('ribbon');
  // On a phone the card is small; enlarged, it scrolls sideways at a readable size.
  const [enlarged, setEnlarged] = useState(false);
  const [sample] = useState(sampleCard);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pressedOutside = useRef(false);
  const a4 = !!ritual && view === 'a4';

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

  const tab = (which: typeof view, label: string) => (
    <button
      type="button"
      aria-pressed={view === which}
      onClick={() => setView(which)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        view === which ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'
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
            <p className="mt-1 text-sm sm:text-base text-gray-300">{t(ritual ? 'preview.versionsRitual' : 'preview.versions')}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t('preview.close')} className="rounded-lg p-2 hover:bg-white/10 shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('preview.title')}>
          {tab('ribbon', t('preview.ribbon'))}
          {tab('light', t('preview.light'))}
          {ritual && tab('a4', t('preview.a4'))}
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
                <GiftCardA4Page page={page} locale={locale} ritual={ritual} code={sample.code} pin={sample.pin} validUntil={sample.validUntil} />
              </Scaled>
            ))
            : (['front', 'back'] as const).map((side) => view === 'light' ? (
              <Scaled key={`light-${side}`} w={LIGHT_W} h={LIGHT_H} label={t(side === 'front' ? 'preview.front' : 'preview.back')} width={enlarged ? 760 : undefined}>
                <LightCardSide side={side} locale={locale} value={value} ritual={ritual} sample={sample} />
              </Scaled>
            ) : (
              <Scaled key={side} w={W} h={H} label={t(side === 'front' ? 'preview.front' : 'preview.back')} width={enlarged ? 900 : undefined}>
                <CardSide side={side} locale={locale} value={value} ritual={ritual} sample={sample} />
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
