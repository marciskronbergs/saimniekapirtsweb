import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { motion, type MotionStyle } from 'framer-motion';
import { GLASS_FONT, useGlassFont } from './glassFont';

// The homepage hero's glass lettering, for use elsewhere: Saira Extra
// Condensed 800, the picture behind the letters seen through them slightly
// refracted, a pale tint and a sheen inside, light gathered along the inner
// edge, a soft shadow outside and a fine bright outline. The filter values
// are the ones in hero/WhiskPosterHero.tsx; each instance has its own ids, so
// several can share a page with the hero.
//
// The lettering is decoration (aria-hidden): the real heading lives in the
// page's text.

export interface GlassTitleProps {
  text: string;
  // The SVG covers its stage: the stage's size in CSS pixels.
  width: number;
  height: number;
  // Where the word goes, in stage pixels: between left and right (at most
  // maxSize tall), with its baseline at `baseline`.
  left: number;
  right: number;
  baseline: number;
  maxSize: number;
  align?: 'center' | 'start';
  // The picture seen through the letters, and its box in stage pixels: the
  // same box as the background behind the title, so the two line up.
  glass: { src: string; x: number; y: number; w: number; h: number };
  // Moves the picture inside the letters, e.g. to keep it aligned with a
  // background that scrolls at another speed than the title.
  glassStyle?: MotionStyle;
  // Called with the word's final box once measured.
  onLayout?: (box: { x: number; top: number; width: number; size: number }) => void;
  className?: string;
  style?: React.CSSProperties;
}

const GlassTitle: React.FC<GlassTitleProps> = ({
  text,
  width: W,
  height: H,
  left,
  right,
  baseline,
  maxSize,
  align = 'center',
  glass,
  glassStyle,
  onLayout,
  className = '',
  style,
}) => {
  const ids = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `glass-${ids}-${name}`;
  const probeRef = useRef<SVGTextElement>(null);
  const fontVersion = useGlassFont();
  const [measured, setMeasured] = useState<{ width: number } | null>(null);

  // Measured at 100px; scaled from there.
  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const width = probe.getComputedTextLength();
    setMeasured(width > 0 && Number.isFinite(width) ? { width } : null);
  }, [text, fontVersion]);

  const size = measured ? Math.min(maxSize, ((right - left) / measured.width) * 100) : 0;
  const textWidth = measured ? (measured.width * size) / 100 : 0;
  const x = align === 'center' ? left + (right - left - textWidth) / 2 : left;

  useEffect(() => {
    if (size > 0) onLayout?.({ x, top: baseline - size * 0.74, width: textWidth, size });
  }, [x, baseline, size, textWidth, onLayout]);

  const blurInner = Math.max(2, size * 0.035);
  const blurShadow = Math.max(3, size * 0.05);
  const displace = Math.max(6, size * 0.07);

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
      style={style}
      width={W}
      height={H}
      viewBox={`0 0 ${W || 1} ${H || 1}`}
    >
      {/* Measures the word in the current face. */}
      <text ref={probeRef} fontFamily={GLASS_FONT} fontWeight={800} fontSize={100} visibility="hidden">
        {text}
      </text>
      {size > 0 && (
        <>
          <defs>
            <g id={id('glyphs')}>
              <text x={x} y={baseline} fontFamily={GLASS_FONT} fontWeight={800} fontSize={size}>
                {text}
              </text>
            </g>
            <mask id={id('mask')} maskUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
              <use href={`#${id('glyphs')}`} fill="white" />
            </mask>
            {/* The picture bent a little, as thick glass would. */}
            <filter id={id('refract')} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves={2} seed={7} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={displace} xChannelSelector="R" yChannelSelector="G" result="bent" />
              <feColorMatrix in="bent" type="matrix" values="1.06 0 0 0 0.05  0 1.06 0 0 0.06  0 0 1.06 0 0.06  0 0 0 1 0" />
            </filter>
            {/* Light gathered just inside each letter's edge. */}
            <filter id={id('inner')} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation={blurInner} result="blur" />
              <feComposite in="SourceAlpha" in2="blur" operator="out" result="rim" />
              <feFlood floodColor="#ffffff" floodOpacity={0.5} />
              <feComposite in2="rim" operator="in" />
            </filter>
            {/* A soft shadow outside the letters, for contrast on bright leaves. */}
            <filter id={id('shadow')} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation={blurShadow} result="blur" />
              <feOffset in="blur" dy={4} result="moved" />
              <feFlood floodColor="#06120a" floodOpacity={0.32} />
              <feComposite in2="moved" operator="in" result="shadow" />
              <feComposite in="shadow" in2="SourceAlpha" operator="out" />
            </filter>
            <linearGradient id={id('sheen')} x1="0" y1="0" x2="0.25" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
              <stop offset="0.42" stopColor="#fff" stopOpacity={0.04} />
              <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
              <stop offset="1" stopColor="#fff" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <use href={`#${id('glyphs')}`} fill="#000" filter={`url(#${id('shadow')})`} />
          <g mask={`url(#${id('mask')})`}>
            <motion.image
              href={glass.src}
              x={glass.x}
              y={glass.y}
              width={glass.w}
              height={glass.h}
              preserveAspectRatio="none"
              filter={`url(#${id('refract')})`}
              style={glassStyle}
            />
            <rect x="-50%" y="-50%" width="200%" height="200%" fill="#e9f5ea" opacity={0.12} />
            <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id('sheen')})`} />
          </g>
          <use href={`#${id('glyphs')}`} fill="#fff" filter={`url(#${id('inner')})`} />
          <use href={`#${id('glyphs')}`} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth={1.1} />
        </>
      )}
    </svg>
  );
};

export default GlassTitle;
