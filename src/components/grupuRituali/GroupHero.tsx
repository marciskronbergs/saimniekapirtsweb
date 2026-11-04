import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { EASE } from '../pirtsRituali/ritualStyles';

// The top of "Grupu Pirts Rituāli", in the manner of the Īpašie page's whisk
// hero: a group of friends in the sauna, large on the right, fading into the
// page on its left and lower edges, rising into place on arrival and sinking
// slowly as the page scrolls on. The words and the tabs sit over its faded
// side. No shade of its own at the foot: the photo fades out by itself, so
// nothing draws a line where the hero ends.

const PHOTO = '/media/rituals/group/slide-1.webp';

const GroupHero = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  return (
    <section ref={ref} className="relative isolate overflow-clip pt-20">
      {/* Green light behind the photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(45% 55% at 75% 35%, rgba(34,197,94,0.16), transparent 70%), radial-gradient(60% 40% at 15% 10%, rgba(34,197,94,0.07), transparent 70%)',
        }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-10 right-0 top-16 h-[28rem] w-full sm:h-[34rem] lg:bottom-0 lg:top-0 lg:h-auto lg:max-h-[46rem] lg:w-[62vw]"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.1 }}
      >
        <motion.img
          src={PHOTO}
          alt=""
          decoding="async"
          draggable={false}
          style={{ y, scale }}
          className="gh-photo h-full w-full select-none object-cover opacity-45 sm:opacity-60 lg:opacity-90"
        />
      </motion.div>

      <style>{`
        .gh-photo {
          -webkit-mask-image: linear-gradient(to left, #000 35%, transparent 100%), linear-gradient(to bottom, #000 45%, transparent 82%);
          -webkit-mask-composite: source-in;
          mask-image: linear-gradient(to left, #000 35%, transparent 100%), linear-gradient(to bottom, #000 45%, transparent 82%);
          mask-composite: intersect;
        }
      `}</style>

      <div className="relative">{children}</div>
    </section>
  );
};

export default GroupHero;
