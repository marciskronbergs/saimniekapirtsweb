import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import ZalktisScene from './zalktis/ZalktisScene';
import GiftCardVisual, { type GiftCardKind } from './giftcards/GiftCardVisual';

// Gift cards drawn over the zalktis scene: its glass heading says what they
// are, and the cards themselves rise over the lower part of the stage and on
// over the mossy floor below it. Each card leads to the gift card page with
// its order form open (GiftCardVisual).

type Variant = 'home' | 'rituals' | 'rental';

// variant "home": both cards side by side. "rituals" (the rituals page): the
// ritual card alone; "rental" (the Pirts Noma page): the card of a chosen
// value alone. One alone is large, on the left on wide screens.
const CARDS: Record<Variant, GiftCardKind[]> = {
  home: ['ritual', 'value'],
  rituals: ['ritual'],
  rental: ['value'],
};

const GiftCards = ({ variant }: { variant: Variant }) => {
  const cards = CARDS[variant];
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Rising in on arrival, one after the other.
  const rise = `transition-all duration-700 ease-out motion-reduce:transition-none ${
    shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
  }`;

  const single = cards.length === 1;
  return (
    <div
      ref={ref}
      className={`relative mx-auto overflow-x-clip px-4 sm:px-6 ${
        single ? 'max-w-2xl pb-14 lg:flex lg:max-w-none lg:justify-start lg:px-[7vw] lg:pb-16' : 'max-w-[84rem] pb-20 sm:pb-24 lg:px-8'
      }`}
    >
      <div className={`relative gap-8 lg:gap-12 ${single ? 'grid grid-cols-1 lg:w-[min(52vw,860px)]' : 'grid grid-cols-1 md:grid-cols-2'}`}>
        {/* A soft shade under the cards, so they stand off the snake and the moss. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-16 -inset-y-14"
          style={{ background: 'radial-gradient(closest-side, rgba(3,6,3,0.55), rgba(3,6,3,0.25) 60%, transparent)' }}
        />
        {cards.map((kind, i) => (
          <div key={kind} className={rise} style={{ transitionDelay: shown ? `${i * 120}ms` : '0ms' }}>
            <GiftCardVisual kind={kind} />
          </div>
        ))}
      </div>
    </div>
  );
};

// `children`: more drawn on down over the moss after the cards (the
// homepage's way here).
const GiftCardBuySection = ({ variant = 'home', edge, children }: { variant?: Variant; edge?: string; children?: ReactNode }) => {
  const { t } = useTranslation('cards');
  return (
    <ZalktisScene
      id="davanu-kartes"
      headingId="giftcards-heading"
      edge={edge}
      title={t(`scene.${variant}.title`)}
      text={t(`scene.${variant}.text`)}
      // The rituals and rental pages end the moss with the cards.
      tight={variant !== 'home' && !children}
    >
      <GiftCards variant={variant} />
      {children}
    </ZalktisScene>
  );
};

export default GiftCardBuySection;
