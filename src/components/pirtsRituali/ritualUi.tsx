import React, { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform, type HTMLMotionProps } from 'framer-motion';
import { EASE, glass, glassGreen } from './ritualStyles';

// Building blocks the rituals page's sections share: the glass surfaces, a
// section heading, a reveal on scroll, a card with a light that follows the
// pointer, and a number that counts up when it comes into view. The spotlight
// card and the count-up follow the patterns of 21st.dev's "spotlight card"
// and "number ticker", rebuilt on framer-motion (already on the site) and
// the site's own colours.
//
// Motion respects reduced motion through the page's <MotionConfig
// reducedMotion="user">: framer-motion then skips the movement and keeps
// the fades.

// Rises into place once, when scrolled into view. The fade is on the direct
// children (through --rv, see index.css), not on this wrapper: a fading
// ancestor cuts a glass child's backdrop blur off from the page until the
// fade ends, and the blur then snaps on.
export const Reveal: React.FC<HTMLMotionProps<'div'> & { delay?: number; y?: number }> = ({
  delay = 0,
  y = 28,
  children,
  ...rest
}) => (
  <motion.div
    data-reveal=""
    initial={{ '--rv': 0, y } as never}
    whileInView={{ '--rv': 1, y: 0 } as never}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.8, ease: EASE, delay }}
    {...rest}
  >
    {children}
  </motion.div>
);

export const SectionHeading: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  id?: string;
  className?: string;
}> = ({ eyebrow, title, subtitle, align = 'center', id, className = '' }) => (
  <Reveal className={`${align === 'center' ? 'mx-auto text-center' : 'text-left'} max-w-3xl ${className}`}>
    {eyebrow && (
      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-green-200 ${glass}`}>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(74, 222, 128,0.9)]" />
        {eyebrow}
      </span>
    )}
    <h2 id={id} className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
      {title}
    </h2>
    {subtitle && <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">{subtitle}</p>}
  </Reveal>
);

// A glass card lit by a soft spot that follows the pointer (mouse only).
export const SpotlightCard: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { tone?: 'glass' | 'green'; contentClassName?: string }
> = ({
  tone = 'glass',
  className = '',
  contentClassName = '',
  children,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--sx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--sy', `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={`group/spot relative overflow-hidden rounded-[1.75rem] ${tone === 'green' ? glassGreen : glass} ${className}`}
      {...rest}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--sx, 50%) var(--sy, 0%), rgba(134, 239, 172,0.14), transparent 60%)' }}
      />
      <div className={`relative ${contentClassName}`}>{children}</div>
    </div>
  );
};

// Counts up to `to` once it is in view (straight to it for reduced motion);
// screen readers get the final number from the label.
export const CountUp: React.FC<{ to: number; suffix?: string; className?: string }> = ({ to, suffix = '', className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => `${Math.round(v).toLocaleString('lv-LV')}${suffix}`);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      value.set(to);
      return;
    }
    const controls = animate(value, to, { duration: 1.6, ease: EASE });
    return () => controls.stop();
  }, [inView, to, value]);
  return (
    <motion.span ref={ref} className={className} aria-label={`${to}${suffix}`}>
      {text}
    </motion.span>
  );
};
