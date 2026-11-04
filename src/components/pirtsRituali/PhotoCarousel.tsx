import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { glass } from './ritualStyles';

const AUTO_MS = 5000;

// Crossfading photographs that move on by themselves (not with reduced
// motion, and not while the pointer or focus is on them), with arrows, dots
// and swiping.
const PhotoCarousel: React.FC<{ slides: string[]; alt: string; frameClassName?: string }> = ({
  slides,
  alt,
  frameClassName = 'h-80 sm:h-[28rem] lg:h-full lg:min-h-[36rem]',
}) => {
  const { t } = useTranslation('rental');
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const downX = useRef<number | null>(null);
  const go = (to: number) => setIndex((to + slides.length) % slides.length);

  useEffect(() => {
    if (held || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_MS);
    return () => window.clearInterval(timer);
  }, [held, index, slides.length]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
      className={`h-full rounded-[2rem] p-2.5 ${glass}`}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div
        className={`relative touch-pan-y select-none overflow-hidden rounded-[1.5rem] ${frameClassName}`}
        onPointerDown={(e) => (downX.current = e.clientX)}
        onPointerUp={(e) => {
          if (downX.current === null) return;
          const dx = e.clientX - downX.current;
          downX.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {slides.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === index ? alt : ''}
            aria-hidden={i !== index || undefined}
            loading="lazy"
            decoding="async"
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity ${
              i === index ? 'scale-100 opacity-100' : 'scale-[1.06] opacity-0'
            }`}
          />
        ))}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {slides.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => go(i)}
                aria-label={t('showPhoto', { n: i + 1, title: alt })}
                aria-current={i === index || undefined}
                className={`tap-area h-2 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 ${
                  i === index ? 'w-7 bg-green-500' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={t('prevPhoto')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={t('nextPhoto')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              <ChevronRight aria-hidden className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCarousel;
