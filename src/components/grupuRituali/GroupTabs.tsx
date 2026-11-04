import { useRef } from 'react';
import { ChevronDown, Clock, Flame, Sparkles, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../pirtsRituali/ritualUi';
import { glass, glassGreen } from '../pirtsRituali/ritualStyles';

// The three group rituals as tabs, like the Īpašie page's experiences: big
// glass blocks, each with its photograph fading in from the right, the price
// per person and the length. Choosing one opens its programme below (the
// panel is the tab's aria-controls target). Arrow keys move between them.

export type GroupId = 'meistaru' | 'draugu' | 'draugu-plus';

// The photos the rituals page's group cards use (GroupOptions), in order.
export const GROUPS: { id: GroupId; photo: string; Icon: typeof Users }[] = [
  { id: 'meistaru', photo: '/media/rituals/group/option-1.webp', Icon: Users },
  { id: 'draugu', photo: '/media/rituals/group/option-2.webp', Icon: Flame },
  { id: 'draugu-plus', photo: '/media/rituals/group/option-3.webp', Icon: Sparkles },
];

// "70€ /no personas (Min 360€)" → "70€ /no personas" and "Min 360€".
export const splitPrice = (price: string) => {
  const m = price.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { amount: m[1], min: m[2] } : { amount: price, min: '' };
};
// "Procedūras Ilgums: 4 h – 5 h" → "4 h – 5 h".
const afterColon = (text: string) => text.split(':').slice(1).join(':').trim() || text;

const GroupTabs: React.FC<{ selected: GroupId | null; onSelect: (id: GroupId) => void; panelId: string }> = ({
  selected,
  onSelect,
  panelId,
}) => {
  const { t } = useTranslation('groupRituals');
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + GROUPS.length) % GROUPS.length;
    refs.current[next]?.focus();
    onSelect(GROUPS[next].id);
  };

  return (
    <div role="tablist" aria-label={t('hero.title')} className="grid gap-4 md:grid-cols-3 lg:gap-5">
      {GROUPS.map((group, i) => {
        const active = selected === group.id;
        const { amount, min } = splitPrice(t(`${group.id}.price`));
        const features = t(`${group.id}.features`, { returnObjects: true }) as string[];
        const duration = afterColon(features[0] ?? '');
        const { Icon } = group;
        return (
          <Reveal key={group.id} delay={0.08 * i} y={36}>
            <button
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="tab"
              id={`tab-${group.id}`}
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={selected === null ? 0 : active ? 0 : -1}
              onClick={() => onSelect(group.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`group relative block h-full w-full overflow-hidden rounded-[2rem] text-left transition-[box-shadow,transform] duration-500 hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400/60 ${
                active ? `${glassGreen} ring-2 !ring-green-500/70` : glass
              }`}
            >
              {/* The photograph, fading in from the right. */}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[80%]">
                <img
                  src={group.photo}
                  alt=""
                  decoding="async"
                  className={`h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out [mask-image:linear-gradient(to_left,black_15%,transparent_95%)] group-hover:scale-105 ${
                    active ? 'opacity-70' : 'opacity-40 group-hover:opacity-55'
                  }`}
                />
              </span>
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />

              <span className="relative flex min-h-[16rem] flex-col p-6 sm:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600/25 ring-1 ring-green-400/40">
                  <Icon aria-hidden className="h-6 w-6 text-green-300" strokeWidth={1.75} />
                </span>
                <span className="mt-5 block text-2xl font-bold leading-tight tracking-tight text-white">{t(`${group.id}.cardTitle`)}</span>
                <span className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-white/90">
                  <span className="rounded-full bg-black/45 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-md">{amount}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-md">
                    <Clock aria-hidden className="h-3.5 w-3.5 text-green-400" />
                    {duration}
                  </span>
                  {min && <span className="rounded-full bg-black/45 px-3 py-1.5 text-white/70 ring-1 ring-white/15 backdrop-blur-md">{min}</span>}
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

export default GroupTabs;
