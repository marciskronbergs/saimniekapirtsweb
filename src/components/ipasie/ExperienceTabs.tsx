import { useRef } from 'react';
import { ChevronDown, Clock, Crown, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../pirtsRituali/ritualUi';
import { glass, glassGreen } from '../pirtsRituali/ritualStyles';

// The two experiences as tabs: big glass blocks, each with its photograph
// fading in from the right, the price and the length. Choosing one opens its
// programme below (the panel is the tab's aria-controls target). Arrow keys
// move between the tabs.

export type ExperienceId = 'vecmeitas' | 'viru';

const EXPERIENCES: { id: ExperienceId; ns: ExperienceId; nameKey: string; descKey: string; photo: string; Icon: typeof Crown }[] = [
  { id: 'vecmeitas', ns: 'vecmeitas', nameKey: 'bachelorette', descKey: 'bachelorette_desc', photo: '/media/events/bachelorette-1080.webp', Icon: Crown },
  { id: 'viru', ns: 'viru', nameKey: 'bachelor', descKey: 'bachelor_desc', photo: '/media/events/bachelor-1080.webp', Icon: Users },
];

// "360€, līdz 8 cilvēkiem vienlaicīgi" → "360€" and "līdz 8 cilvēkiem vienlaicīgi".
const splitPrice = (price: string) => {
  const i = price.indexOf(',');
  return i > 0 ? { amount: price.slice(0, i).trim(), people: price.slice(i + 1).trim() } : { amount: price, people: '' };
};
// "Procedūras Ilgums: 4 h" → "4 h".
const afterColon = (text: string) => text.split(':').slice(1).join(':').trim() || text;

const ExperienceTabs: React.FC<{ selected: ExperienceId | null; onSelect: (id: ExperienceId) => void; panelId: string }> = ({
  selected,
  onSelect,
  panelId,
}) => {
  const { t } = useTranslation('special');
  const { t: tPkg } = useTranslation(['vecmeitas', 'viru']);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + EXPERIENCES.length) % EXPERIENCES.length;
    refs.current[next]?.focus();
    onSelect(EXPERIENCES[next].id);
  };

  return (
    <div role="tablist" aria-label={t('title')} className="grid gap-5 md:grid-cols-2 lg:gap-6">
      {EXPERIENCES.map((exp, i) => {
        const active = selected === exp.id;
        const { amount, people } = splitPrice(tPkg('price', { ns: exp.ns }));
        const duration = afterColon(tPkg('details.duration', { ns: exp.ns }));
        const { Icon } = exp;
        return (
          <Reveal key={exp.id} delay={0.1 * i} y={36}>
            <button
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="tab"
              id={`tab-${exp.id}`}
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={selected === null ? 0 : active ? 0 : -1}
              onClick={() => onSelect(exp.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`group relative block w-full overflow-hidden rounded-[2rem] text-left transition-[box-shadow,transform] duration-500 hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400/60 ${
                active ? `${glassGreen} ring-2 !ring-green-500/70` : glass
              }`}
            >
              {/* The photograph, fading in from the right. */}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[68%]">
                <img
                  src={exp.photo}
                  alt=""
                  decoding="async"
                  className={`h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out [mask-image:linear-gradient(to_left,black_20%,transparent_95%)] group-hover:scale-105 ${
                    active ? 'opacity-70' : 'opacity-45 group-hover:opacity-60'
                  }`}
                />
              </span>
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />

              <span className="relative flex min-h-[15rem] flex-col p-6 sm:min-h-[17rem] sm:p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600/25 ring-1 ring-green-400/40">
                  <Icon aria-hidden className="h-6 w-6 text-green-300" strokeWidth={1.75} />
                </span>
                <span className="mt-5 block text-3xl font-bold tracking-tight text-white sm:text-4xl">{t(exp.nameKey)}</span>
                <span className="mt-2 block max-w-[22rem] text-base leading-relaxed text-white/80">{t(exp.descKey)}</span>
                <span className="mt-5 flex flex-wrap gap-2 text-sm font-medium text-white/90">
                  <span className="rounded-full bg-black/45 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-md">{amount}</span>
                  {people && <span className="rounded-full bg-black/45 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-md">{people}</span>}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-md">
                    <Clock aria-hidden className="h-3.5 w-3.5 text-green-400" />
                    {duration}
                  </span>
                </span>
                <span className={`mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold ${active ? 'text-green-300' : 'text-white'}`}>
                  {active ? t('ui.opened') : t('ui.open')}
                  <ChevronDown aria-hidden className={`h-4 w-4 transition-transform duration-500 ${active ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                </span>
              </span>
            </button>
          </Reveal>
        );
      })}
    </div>
  );
};

export default ExperienceTabs;
