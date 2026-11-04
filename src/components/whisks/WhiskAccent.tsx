import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';

// A hand presenting a sauna whisk from the edge of the window: decoration
// placed beside a section or across the seam between two (public/media/whisks,
// cut from photos, cropped to what is visible: the forearm runs out of the
// picture on its own side).
//
// Three layers, so the motions never overwrite each other:
//   holder  where it sits: against its edge of the window (the host must be a
//           full-width `relative` element), its size and height; the forearm
//           a little past the edge, so it reads as continuing off screen.
//   enter   the arm sliding in from its side and turning up into place when
//           the holder comes into view, and back out when it has gone.
//   drift   a small scroll-linked rise and turn while it is in view.
// Both turns pivot near the forearm. framer-motion drives the motion values
// straight onto the transforms, without a React render per scroll step.
// Reduced motion: the held pose, no slide and no drift. Phones: less travel,
// less turn, its own size and height, or left out (`hideOnPhones`).

export type WhiskAsset = 'birch-left' | 'maple-left' | 'oak-right' | 'maple-right';

interface AssetInfo {
  side: 'left' | 'right';
  // Height per width of the cropped picture.
  ratio: number;
  // Where the forearm leaves the picture: the pivot for every turn.
  origin: string;
}

const ASSETS: Record<WhiskAsset, AssetInfo> = {
  'birch-left': { side: 'left', ratio: 928 / 1523, origin: '0% 83%' },
  'maple-left': { side: 'left', ratio: 934 / 1531, origin: '0% 67%' },
  'oak-right': { side: 'right', ratio: 1010 / 1474, origin: '100% 90%' },
  'maple-right': { side: 'right', ratio: 900 / 1502, origin: '100% 13%' },
};

const src = (asset: WhiskAsset, w: 640 | 1200 | 1500) => `/media/whisks/${asset}-${w}.webp`;
const EASE = [0.22, 1, 0.36, 1] as const;
const PHONE = '(max-width: 767px)';

interface WhiskAccentProps {
  asset: WhiskAsset;
  // Width (any CSS length; vw keeps it tied to the window).
  width?: string;
  // Top of the holder within the host, and a shift by a share of its own
  // height (e.g. '-50%' centres it on `top`).
  top?: string;
  shiftY?: string;
  // Resting turn, in degrees (positive lifts the crown for either side).
  rotate?: number;
  // How much of the picture's width stays past the window's edge.
  bleed?: number;
  // Scroll-linked drift: pixels and degrees across the holder's pass.
  drift?: number;
  driftTurn?: number;
  phone?: { width?: string; top?: string; shiftY?: string; rotate?: number; bleed?: number };
  hideOnPhones?: boolean;
  // Above the host's content (rare: only where nothing readable is near).
  front?: boolean;
  // Brightness: whisks set behind the content sit a little deeper in shade.
  dim?: number;
  className?: string;
}

const usePhone = () => {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const onChange = () => setPhone(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return phone;
};

const WhiskAccent = ({
  asset,
  width = '30vw',
  top = '0px',
  shiftY = '0%',
  rotate = 0,
  bleed = 0.06,
  drift = 26,
  driftTurn = 2,
  phone: phoneOpts = {},
  hideOnPhones = false,
  front = false,
  dim = 0.86,
  className = '',
}: WhiskAccentProps) => {
  const info = ASSETS[asset];
  const left = info.side === 'left';
  // CSS rotation is clockwise; a left arm lifts its crown turning anticlockwise.
  const lift = left ? -1 : 1;
  const holderRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const phone = usePhone();
  const inView = useInView(holderRef, { amount: 0.25, margin: '0px 0px -8% 0px' });

  const restTurn = lift * (phone && phoneOpts.rotate !== undefined ? phoneOpts.rotate : rotate);
  const travel = phone ? 26 : 42; // % of its own width
  const startTurn = (phone ? 4 : 8) * -lift; // the crown starts lowered

  const { scrollYProgress } = useScroll({ target: holderRef, offset: ['start end', 'end start'] });
  const reach = reduced ? 0 : phone ? drift * 0.6 : drift;
  const turn = reduced ? 0 : (phone ? driftTurn * 0.5 : driftTurn) * lift;
  const driftY = useTransform(scrollYProgress, [0, 1], [reach / 2, -reach / 2]);
  const driftRotate = useTransform(scrollYProgress, [0, 1], [-turn / 2, turn / 2]);

  if (hideOnPhones && phone) return null;

  const b = phone && phoneOpts.bleed !== undefined ? phoneOpts.bleed : bleed;
  const holderStyle: CSSProperties = {
    width: phone && phoneOpts.width ? phoneOpts.width : width,
    top: phone && phoneOpts.top ? phoneOpts.top : top,
    [left ? 'left' : 'right']: 0,
    transform: `translate(${(left ? -b : b) * 100}%, ${phone && phoneOpts.shiftY ? phoneOpts.shiftY : shiftY})`,
  };

  const shown = reduced || inView;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 select-none [overflow-x:clip] ${front ? 'z-20' : 'z-0'} ${className}`}
    >
      <div ref={holderRef} className="absolute" style={holderStyle}>
        <motion.div
          initial={false}
          animate={
            shown
              ? { x: '0%', rotate: restTurn, opacity: 1 }
              : { x: `${(left ? -travel : travel)}%`, rotate: restTurn + startTurn, opacity: 0 }
          }
          transition={
            reduced
              ? { duration: 0 }
              : shown
                ? { duration: phone ? 0.8 : 1, ease: EASE, opacity: { duration: 0.5, ease: 'easeOut' } }
                : { duration: 0.7, ease: [0.4, 0, 0.6, 1], opacity: { duration: 0.45, delay: 0.2 } }
          }
          style={{ transformOrigin: info.origin, willChange: 'transform, opacity' }}
        >
          <motion.div style={{ y: driftY, rotate: driftRotate, transformOrigin: info.origin }}>
            <img
              src={src(asset, 1200)}
              srcSet={`${src(asset, 640)} 640w, ${src(asset, 1200)} 1200w, ${src(asset, 1500)} 1500w`}
              sizes={phone ? phoneOpts.width ?? width : width}
              width={1200}
              height={Math.round(1200 * info.ratio)}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className="block h-auto w-full max-w-none"
              style={{ filter: `brightness(${dim}) saturate(0.95) drop-shadow(0 24px 40px rgba(0,0,0,0.55))` }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// Across the seam between two full-width sections: a zero-height anchor
// placed between them (they keep their own layout), the picture centred on
// the seam unless `shiftY` says otherwise. Above both, or with `behind`
// under their content, so it can tuck behind cards and glass: only inside
// a LeafBackdrop, whose content layer is the stacking context it sinks into
// (elsewhere it would sink below the page's own background).
export const WhiskSeam = ({ shiftY = '-50%', behind = false, ...props }: WhiskAccentProps & { behind?: boolean }) => (
  <div className={`relative h-0 ${behind ? '-z-10' : 'z-20'}`}>
    <WhiskAccent shiftY={shiftY} dim={behind ? 0.74 : undefined} {...props} />
  </div>
);

export default WhiskAccent;
