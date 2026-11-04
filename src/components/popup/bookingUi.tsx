import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';

// The booking forms' look, shared by the popup and the booking set into the
// pages: glass fields, numbered steps, choices as compact rows, and the longer
// lists as a picker that opens like a dropdown. Only the look lives here: every
// row is a real <input> (radio or checkbox) covering it, so the values,
// `required`, keyboard use and the browser's own "please choose" message all
// work as they did with the dropdowns.

// The forms' accent colour: the booking forms' green, or gold on the gift
// card page (whose forms were amber before they took this look). A form sets
// it by wrapping itself in <Accent.Provider value="gold">.
type Tone = 'green' | 'gold';
export const Accent = React.createContext<Tone>('green');
const TONES = {
  green: {
    fieldIcon: 'group-focus-within:text-green-300',
    step: 'bg-green-500/15 text-green-300 ring-green-400/40 shadow-[0_0_18px_-4px_rgba(34,197,94,0.6)]',
    subIcon: 'text-green-400',
    tickOn: 'bg-green-500 text-black ring-green-300 shadow-[0_0_14px_rgba(34,197,94,0.7)]',
    cardOn: 'bg-green-500/[0.12] ring-green-400/70 shadow-[0_10px_30px_-18px_rgba(34,197,94,0.7),inset_0_1px_0_rgba(255,255,255,0.1)]',
    focus: 'has-[:focus-visible]:ring-green-300 focus-visible:ring-green-300',
    price: 'text-green-200',
    titleTile: 'from-green-400/25 to-green-700/20 ring-green-300/40 shadow-[0_0_30px_-8px_rgba(34,197,94,0.7)]',
    titleIcon: 'text-green-200',
  },
  gold: {
    fieldIcon: 'group-focus-within:text-amber-300',
    step: 'bg-amber-500/15 text-amber-300 ring-amber-400/40 shadow-[0_0_18px_-4px_rgba(217,119,6,0.6)]',
    subIcon: 'text-amber-400',
    tickOn: 'bg-amber-500 text-black ring-amber-300 shadow-[0_0_14px_rgba(217,119,6,0.7)]',
    cardOn: 'bg-amber-500/[0.12] ring-amber-400/70 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.7),inset_0_1px_0_rgba(255,255,255,0.1)]',
    focus: 'has-[:focus-visible]:ring-amber-300 focus-visible:ring-amber-300',
    price: 'text-amber-200',
    titleTile: 'from-amber-400/25 to-amber-700/20 ring-amber-300/40 shadow-[0_0_30px_-8px_rgba(217,119,6,0.7)]',
    titleIcon: 'text-amber-200',
  },
};
const useTone = () => TONES[React.useContext(Accent)];

// A text field on glass, with room for an icon on its left.
export const fieldClass =
  'w-full rounded-2xl bg-white/[0.045] py-3.5 pl-11 pr-4 text-[15px] text-white placeholder-white/35 ring-1 ring-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition-[background-color,box-shadow] duration-300 hover:bg-white/[0.06] focus:bg-white/[0.07] focus:ring-2 focus:ring-green-400/60';

// The field in gold, for the gift card page.
export const goldFieldClass = fieldClass.replace('focus:ring-green-400/60', 'focus:ring-amber-400/60');

export const Field: React.FC<{ icon: LucideIcon; children: React.ReactNode; top?: boolean }> = ({ icon: Icon, children, top }) => (
  <div className="group relative">
    <Icon
      aria-hidden
      className={`pointer-events-none absolute left-4 h-[18px] w-[18px] text-white/40 transition-colors ${useTone().fieldIcon} ${
        top ? 'top-4' : 'top-1/2 -translate-y-1/2'
      }`}
    />
    {children}
  </div>
);

// A numbered step: "1 Personal information", "2 Ritual details"...
export const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-3">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${useTone().step}`}>
        {n}
      </span>
      <h4 className="text-[15px] font-semibold uppercase tracking-[0.14em] text-white/85">{title}</h4>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
    </div>
    {children}
  </section>
);

export const SubLabel: React.FC<{ icon?: LucideIcon; children: React.ReactNode }> = ({ icon: Icon, children }) => (
  <div className="mb-2.5 flex items-center gap-2 text-sm font-medium text-white/70">
    {Icon && <Icon aria-hidden className={`h-4 w-4 ${useTone().subIcon}`} />}
    {children}
  </div>
);

// The tick in a card's corner.
const Tick: React.FC<{ on: boolean; round?: boolean }> = ({ on, round = true }) => (
  <span
    aria-hidden
    className={`flex h-5 w-5 shrink-0 items-center justify-center ${round ? 'rounded-full' : 'rounded-md'} ring-1 transition-all duration-300 ${
      on ? useTone().tickOn : 'bg-black/30 text-transparent ring-white/25'
    }`}
  >
    <Check className="h-3.5 w-3.5" strokeWidth={3} />
  </span>
);

const cardBase =
  'group relative flex overflow-hidden rounded-xl ring-1 transition-[background-color,box-shadow] duration-300 has-[:focus-visible]:ring-2';
const cardOff = 'bg-white/[0.04] ring-white/[0.12] hover:bg-white/[0.07] hover:ring-white/25';

interface OptionCardProps {
  type?: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: () => void;
  required?: boolean;
  disabled?: boolean;
  title: string;
  meta?: string;
  price?: string;
  // A small photograph beside the title.
  image?: string;
  children?: React.ReactNode;
  className?: string;
}

// One choice as a compact row: the tick, a small photo, the title with a line
// under it, the price on the right.
export const OptionCard: React.FC<OptionCardProps> = ({
  type = 'radio',
  name,
  checked,
  onChange,
  required,
  disabled,
  title,
  meta,
  price,
  image,
  children,
  className = '',
}) => (
  <label className={`${cardBase} ${useTone().focus} ${checked ? useTone().cardOn : cardOff} ${disabled ? 'pointer-events-none opacity-40' : 'cursor-pointer'} ${className}`}>
    <input
      type={type}
      name={name}
      checked={checked}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0"
    />
    <OptionBody on={checked} round={type === 'radio'} title={title} meta={meta} price={price} image={image}>
      {children}
    </OptionBody>
  </label>
);

// What a row shows: for the rows above, and the picker's closed face.
const OptionBody: React.FC<{
  on?: boolean;
  round?: boolean;
  title: string;
  meta?: string;
  price?: string;
  image?: string;
  muted?: boolean;
  children?: React.ReactNode;
}> = ({ on, round = true, title, meta, price, image, muted, children }) => (
  <span className="relative flex w-full items-center gap-3 px-3.5 py-2.5">
    {on !== undefined && <Tick on={on} round={round} />}
    {image && (
      <img
        src={image}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className={`h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/15 transition-opacity ${on === false ? 'opacity-75' : 'opacity-100'}`}
      />
    )}
    <span className="min-w-0 flex-1">
      <span className={`block text-[14.5px] font-semibold leading-snug ${muted ? 'text-white/45' : 'text-white'}`}>{title}</span>
      {meta && <span className="mt-0.5 block text-[12.5px] leading-snug text-white/55">{meta}</span>}
      {children}
    </span>
    {price && <span className={`shrink-0 text-sm font-bold tabular-nums ${useTone().price}`}>{price}</span>}
  </span>
);

export interface PickerOption {
  value: string;
  title: string;
  meta?: string;
  price?: string;
  image?: string;
}

// A choice from a longer list as a dropdown: closed, one row showing what is
// chosen (or what to choose); open, the options as compact rows, in the order
// given. Picking one closes it. A hidden required field stands in for the
// choice, so the browser's "please choose" still stops the form, and opens it.
export const ChoicePicker: React.FC<{
  name: string;
  label: string;
  placeholder: string;
  options: PickerOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ name, label, placeholder, options, value, onChange, required }) => {
  const tone = useTone();
  const [open, setOpen] = React.useState(false);
  const chosen = options.find((o) => o.value === value);
  const listId = `${name}-options`;
  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`${label}: ${chosen?.title ?? placeholder}`}
          className={`${cardBase} w-full text-left focus:outline-none focus-visible:ring-2 ${tone.focus} ${chosen ? tone.cardOn : cardOff}`}
        >
          <OptionBody title={chosen?.title ?? placeholder} meta={chosen?.meta} price={chosen?.price} image={chosen?.image} muted={!chosen} />
          <ChevronDown
            aria-hidden
            className={`mr-3.5 h-4 w-4 shrink-0 self-center text-white/60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <input
          aria-hidden
          tabIndex={-1}
          required={required}
          value={value}
          onChange={() => {}}
          onInvalid={() => setOpen(true)}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div id={listId} role="radiogroup" aria-label={label} className="mt-2 space-y-1.5 rounded-2xl bg-black/30 p-1.5 ring-1 ring-white/10">
              {options.map((o) => (
                <OptionCard
                  key={o.value}
                  name={name}
                  checked={o.value === value}
                  onChange={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  title={o.title}
                  meta={o.meta}
                  price={o.price}
                  image={o.image}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// A small choice as a pill (people counts and the like).
export const ChipOption: React.FC<{
  name: string;
  checked: boolean;
  onChange: () => void;
  required?: boolean;
  label: string;
  title?: string;
}> = ({ name, checked, onChange, required, label, title }) => (
  <label
    title={title}
    className={`relative flex h-11 min-w-[2.75rem] cursor-pointer items-center justify-center rounded-xl px-3 text-[15px] font-semibold tabular-nums ring-1 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-green-300 ${
      checked
        ? 'bg-green-500 text-black ring-green-300 shadow-[0_8px_24px_-8px_rgba(34,197,94,0.9)]'
        : 'bg-white/[0.05] text-white/85 ring-white/[0.12] hover:bg-white/[0.1] hover:text-white'
    }`}
  >
    <input
      type="radio"
      name={name}
      checked={checked}
      onChange={onChange}
      required={required}
      className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
    />
    {label}
  </label>
);

// A plain message above the form.
export const Notice: React.FC<{ tone: 'warn' | 'error'; children: React.ReactNode; innerRef?: React.Ref<HTMLDivElement> }> = ({
  tone,
  children,
  innerRef,
}) => (
  <div
    ref={innerRef}
    className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm ring-1 backdrop-blur-md ${
      tone === 'error' ? 'bg-red-500/10 text-red-200 ring-red-400/40' : 'bg-amber-400/10 text-amber-100 ring-amber-300/30'
    }`}
  >
    <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone === 'error' ? 'bg-red-400' : 'bg-amber-300'} shadow-[0_0_10px_currentColor]`} />
    <div>{children}</div>
  </div>
);

// The form's title, with its icon on a lit tile.
export const FormTitle: React.FC<{ icon: LucideIcon; children: React.ReactNode }> = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-3">
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b ring-1 ${useTone().titleTile}`}>
      <Icon aria-hidden className={`h-5 w-5 ${useTone().titleIcon}`} />
    </span>
    <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{children}</h3>
  </div>
);

export const submitClass =
  'group relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-green-500 to-green-600 px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_-14px_rgba(34,197,94,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition-[transform,box-shadow,filter] duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 disabled:shadow-none';

// The same in gold, for the gift card page.
export const goldSubmitClass =
  'group relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 px-6 py-4 text-base font-semibold text-white shadow-[0_18px_40px_-14px_rgba(217,119,6,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition-[transform,box-shadow,filter] duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 disabled:shadow-none';

// Splits a price-list option, "Name 🌿 – 280€", into its name (without the
// emoji) and its price, for a card.
export const splitOption = (text: string) => {
  const clean = text.replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/\s{2,}/g, ' ').trim();
  const at = clean.indexOf(' – ');
  return at > 0 ? { name: clean.slice(0, at).trim(), price: clean.slice(at + 3).trim() } : { name: clean, price: '' };
};
