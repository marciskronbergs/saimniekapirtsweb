import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, CalendarDays, Clock } from 'lucide-react';
import CalendarCode from './CalendarCode';
import TimeSlotPicker from './TimeSlotPicker';
import { useSlotAvailability } from './timeSlots';
import FormRitual from './FormRitual';
import FormNoma from './FormNoma';

interface PopupWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  formType: 'noma' | 'ritual';
  // The option already chosen where the booking was opened (a price list
  // label, or for a rental a sauna); the form starts with it picked.
  preset?: string;
}

// A photograph fading out behind the top of the popup, per kind of booking.
const BANNER = { ritual: '/media/booking/two-tub.webp', noma: '/media/booking/tub.webp' };

const PopupWrapper: React.FC<PopupWrapperProps> = ({ isOpen, onClose, formType, preset }) => {
  const { t, i18n } = useTranslation('common');
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const availability = useSlotAvailability(selectedDate);
  const formRef = useRef<HTMLDivElement>(null);

  const monthNames = t('calendar.months', { returnObjects: true }) as string[];
  const formatSelectedDate = (date: Date) => {
    // A missing translation must not take the booking popup down with it.
    const month = Array.isArray(monthNames) ? monthNames[date.getMonth()] : undefined;
    if (!month) return date.toLocaleDateString();
    if (i18n.language === 'ru') return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return i18n.language === 'lv'
      ? `${date.getDate()}. ${month.toLowerCase()}`
      : `${month} ${date.getDate()}`;
  };

  // On phones the form sits below a full-height calendar, so once the time is
  // set we bring it into view instead of leaving the visitor to guess.
  // The jump is deliberate rather than animated: picking a time reflows the
  // form (the notice goes, the overnight option arrives) and a smooth scroll
  // running through that reflow stops short of the form. It moves the popup's
  // own scroll area, not scrollIntoView, which also reaches the overlay behind.
  const handleTimeChange = (time: string | null) => {
    setSelectedTime(time);
    if (!time || !window.matchMedia('(max-width: 1023px)').matches) return;

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const form = formRef.current;
        const scroller = form?.parentElement;
        if (!form || !scroller) return;
        const top =
          scroller.scrollTop +
          form.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top;
        scroller.scrollTo({ top });
      })
    );
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

   if (isOpen) {
  document.addEventListener('keydown', handleEscape);
  document.body.style.overflow = 'hidden';
  document.body.style.overflowX = 'hidden';
  document.body.style.width = '100%';
}


    return () => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = 'unset';
  document.body.style.overflowX = '';
  document.body.style.width = '';
};
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 overflow-x-hidden w-screen max-w-screen">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container: rises in (a transform only, so the glass inside
          keeps its blur while it moves). */}
      <motion.div
        initial={{ y: 28, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-6xl mx-2 sm:mx-4 h-[85vh] max-sm:h-[calc(100dvh-6rem)] sm:h-[80vh] rounded-[1.75rem] bg-[#070b08] ring-1 ring-green-400/25 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95),0_0_80px_-30px_rgba(34,197,94,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col"
      >
        {/* The photograph fading out at the top, and a green glow. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64">
          <img
            src={BANNER[formType]}
            alt=""
            className="h-full w-full object-cover opacity-30"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.5) 45%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.5) 45%, transparent 100%)',
            }}
          />
          <div className="absolute -top-24 left-1/3 h-56 w-[36rem] rounded-full bg-green-500/15 blur-3xl" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white/80 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/[0.14] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Selected date and the bookable times, pinned above the scroll area on
            phones so they stay readable while the calendar and form scroll. */}
        <div className="relative lg:hidden shrink-0 border-b border-white/10 bg-black/40 backdrop-blur-xl pl-4 pr-16 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2.5">
            {selectedDate ? (
              <>
                <CalendarDays className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm font-semibold text-white truncate">
                  {formatSelectedDate(selectedDate)}
                </span>
                <Clock className="w-4 h-4 text-green-400 shrink-0 ml-1" />
                <span className="text-sm text-white/60">
                  {selectedTime ?? t('calendar.select_time')}
                </span>
              </>
            ) : (
              <>
                <CalendarDays className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm text-white/60">{t('calendar.pick_date_first')}</span>
              </>
            )}
          </div>

          <TimeSlotPicker
            variant="bar"
            selectedTime={selectedTime}
            onTimeChange={handleTimeChange}
            availability={availability}
            disabled={!selectedDate}
          />
        </div>

        {/* Content Area (one scroll region on phones, two columns on desktop) */}
        <div className="relative flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] overflow-y-auto custom-scroll">
          {/* Left: Calendar */}
          <div className="p-4 sm:p-7 shrink-0 lg:overflow-y-auto custom-scroll w-full max-w-full lg:border-r lg:border-white/[0.08]">
            <CalendarCode
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateChange={setSelectedDate}
              onTimeChange={handleTimeChange}
              availability={availability}
            />
          </div>

          {/* Right: Form */}
          <div ref={formRef} className="p-4 sm:p-7 shrink-0 lg:overflow-y-auto custom-scroll">
            {formType === 'noma' ? (
              <FormNoma
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onClose={onClose}
                initialChoice={preset}
              />
            ) : (
              <FormRitual
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onClose={onClose}
                initialRitualType={preset}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Scrollbar styling */}
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(34, 197, 94, 0.7);
          border-radius: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        @media (max-width: 640px) {
          .custom-scroll {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>
  );
};

export default PopupWrapper;
