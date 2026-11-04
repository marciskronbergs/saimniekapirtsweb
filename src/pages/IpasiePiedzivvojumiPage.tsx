import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import LeafBackdrop from '../components/leaves/LeafBackdrop';
import { WhiskSeam } from '../components/whisks/WhiskAccent';
import WhiskHero from '../components/ipasie/WhiskHero';
import ExperienceTabs, { type ExperienceId } from '../components/ipasie/ExperienceTabs';
import PackagePanel from '../components/ipasie/PackagePanel';
import { Reveal } from '../components/pirtsRituali/ritualUi';
import { EASE, glass } from '../components/pirtsRituali/ritualStyles';

// "Īpašie Pirts Piedzīvojumi", Vecmeitas Pūrs and Vīru Paka in one page: the
// whisk hero, the two experiences as tabs, and the chosen one's programme
// opening below them. /ipasiie-piedzivvojumi opens with neither chosen;
// /vecmeitas-purs and /viru-paka (the former separate pages, still linked
// from the menu and elsewhere) open with theirs. Choosing a tab updates the
// address to match without scrolling the page back to the top.

const PATHS: Record<ExperienceId, string> = { vecmeitas: '/vecmeitas-purs', viru: '/viru-paka' };
const PANEL_ID = 'experience-panel';

const IpasiePiedzivvojumiPage = ({ initial = null }: { initial?: ExperienceId | null }) => {
  const { t } = useTranslation('special');
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ExperienceId | null>(initial);
  const panelRef = useRef<HTMLDivElement>(null);
  // Scroll to the programme only when it was asked for (a deep link, a click).
  const reveal = useRef(initial !== null);

  // Arriving at /vecmeitas-purs or /viru-paka (also from the menu while here).
  useEffect(() => {
    if (initial) {
      setSelected(initial);
      reveal.current = true;
    }
  }, [initial]);

  useEffect(() => {
    if (!selected || !reveal.current) return;
    reveal.current = false;
    // After the route's own scroll to the top and the panel's first frames.
    const timer = window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
    return () => window.clearTimeout(timer);
  }, [selected]);

  const choose = (id: ExperienceId) => {
    if (id === selected) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    reveal.current = selected === null;
    setSelected(id);
    navigate(PATHS[id], { state: { keepScroll: true } });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-[#0a0a0a]">
        <HeaderSection />
        <main>
          {/* The site's drifting leaves, behind the whole page. */}
          <LeafBackdrop className="!bg-transparent">
          <WhiskHero>
            <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pb-24 lg:pt-24">
              <Reveal className="max-w-2xl">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-green-300 ${glass}`}>
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {t('ui.eyebrow')}
                </span>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">{t('title')}</h1>
                <p className="mt-5 text-lg leading-relaxed text-white/80 sm:text-xl">{t('subtitle')}</p>
                <p className="mt-8 text-sm font-medium text-white/60">{t('ui.pick')}</p>
              </Reveal>
              <div className="mt-6 lg:mt-8 lg:max-w-[64rem]">
                <ExperienceTabs selected={selected} onSelect={choose} panelId={PANEL_ID} />
              </div>
            </div>
          </WhiskHero>
          {/* A maple whisk from the left, behind the experience tabs' glass. */}
          <WhiskSeam behind asset="maple-left" width="34vw" shiftY="-114%" rotate={4} hideOnPhones />

          {/* The chosen programme, opening below the tabs. */}
          <div
            ref={panelRef}
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={selected ? `tab-${selected}` : undefined}
            hidden={!selected}
            className="scroll-mt-20"
          >
            <AnimatePresence initial={false}>
              {selected && (
                <motion.div
                  key="panel"
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="overflow-hidden"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={selected}
                      initial={{ y: 24 }}
                      animate={{ y: 0 }}
                      exit={{ y: -12, opacity: 0, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pb-28"
                    >
                      <PackagePanel id={selected} />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </LeafBackdrop>
        </main>
        <FooterSection />
      </div>
    </MotionConfig>
  );
};

export default IpasiePiedzivvojumiPage;
