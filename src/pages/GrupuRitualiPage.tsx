import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import LeafBackdrop from '../components/leaves/LeafBackdrop';
import { WhiskSeam } from '../components/whisks/WhiskAccent';
import GroupHero from '../components/grupuRituali/GroupHero';
import GroupTabs, { type GroupId } from '../components/grupuRituali/GroupTabs';
import GroupPanel from '../components/grupuRituali/GroupPanel';
import { Reveal } from '../components/pirtsRituali/ritualUi';
import { EASE, glass } from '../components/pirtsRituali/ritualStyles';

// "Grupu Pirts Rituāli", built like "Īpašie Pirts Piedzīvojumi": the group
// hero, the three group rituals as tabs, and the chosen one's programme
// opening below them. Arriving from the rituals page's group cards
// (state.tab) opens that ritual and scrolls to it; arriving otherwise opens
// none.

export type TabType = GroupId;
const PANEL_ID = 'group-panel';

const GrupuRitualiPage = () => {
  const { t } = useTranslation('groupRituals');
  const location = useLocation();
  const asked = (location.state as { tab?: GroupId } | null)?.tab ?? null;
  const [selected, setSelected] = useState<GroupId | null>(asked);
  const panelRef = useRef<HTMLDivElement>(null);
  // Scroll to the programme only when it was asked for (a deep link, a click).
  const reveal = useRef(asked !== null);

  useEffect(() => {
    if (asked) {
      setSelected(asked);
      reveal.current = true;
    }
  }, [asked]);

  useEffect(() => {
    if (!selected || !reveal.current) return;
    reveal.current = false;
    const timer = window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
    return () => window.clearTimeout(timer);
  }, [selected]);

  const choose = (id: GroupId) => {
    if (id === selected) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    reveal.current = selected === null;
    setSelected(id);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-[#0a0a0a]">
        <HeaderSection />
        <main>
          {/* The site's drifting leaves, behind the whole page. */}
          <LeafBackdrop className="!bg-transparent">
          <GroupHero>
            <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:pb-24 lg:pt-20">
              <Reveal className="max-w-2xl">
                <Link
                  to="/pirts-rituali"
                  className="tap-area group inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-green-300"
                >
                  <ArrowLeft aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  {t('ui.back')}
                </Link>
                <span className={`mt-6 flex w-max items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-green-300 ${glass}`}>
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {t('ui.eyebrow')}
                </span>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">{t('hero.title')}</h1>
                <p className="mt-5 text-lg leading-relaxed text-white/80 sm:text-xl">{t('hero.subtitle')}</p>
                <p className="mt-8 text-sm font-medium text-white/60">{t('ui.pick')}</p>
              </Reveal>
              <div className="mt-6 lg:mt-8">
                <GroupTabs selected={selected} onSelect={choose} panelId={PANEL_ID} />
              </div>
            </div>
          </GroupHero>
          {/* A birch whisk from the left, behind the group tabs' glass (the
              photo has the right side). */}
          <WhiskSeam behind asset="birch-left" width="33vw" shiftY="-114%" rotate={3} hideOnPhones />

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
                      <GroupPanel id={selected} />
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

export default GrupuRitualiPage;
