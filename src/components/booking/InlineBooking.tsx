import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock, X } from 'lucide-react';
import CalendarCode from '../popup/CalendarCode';
import TimeSlotPicker from '../popup/TimeSlotPicker';
import { useSlotAvailability } from '../popup/timeSlots';
import FormRitual from '../popup/FormRitual';
import FormNoma from '../popup/FormNoma';
import { asLanguage } from '../../utils/locale';

// The booking popup's calendar, times and form, set into the page instead of
// a popup: the same three parts (CalendarCode, TimeSlotPicker, FormRitual /
// FormNoma) with the same booking logic, on a glass panel. On wide screens
// the calendar (with its times) sits beside the form; on phones the chosen
// date and the times come first, as a bar, then the calendar, then the form.
// What opens it, and how it opens, is the page's business (see PriceTable).

interface Props {
  formType: 'ritual' | 'noma';
  // A short line above the calendar, e.g. the plan that was picked.
  chosen?: string;
  // The option chosen with it (a price list label, or for a rental a sauna):
  // the form starts with it picked.
  preset?: string;
  onClose: () => void;
}

// A photograph fading out behind the panel's top, per kind of booking.
const BANNER = { ritual: '/media/booking/two-tub.webp', noma: '/media/booking/tub.webp' };

const InlineBooking: React.FC<Props> = ({ formType, chosen, preset, onClose }) => {
  const { t, i18n } = useTranslation('common');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const availability = useSlotAvailability(selectedDate);

  const monthNames = t('calendar.months', { returnObjects: true }) as string[];
  const formatDate = (date: Date) => {
    const month = Array.isArray(monthNames) ? monthNames[date.getMonth()] : undefined;
    if (!month) return date.toLocaleDateString();
    if (i18n.language === 'ru') return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return i18n.language === 'lv' ? `${date.getDate()}. ${month.toLowerCase()}` : `${month} ${date.getDate()}`;
  };

  return (
    <div className="ib relative overflow-hidden rounded-[2rem] bg-white/[0.05] ring-1 ring-green-300/25 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_40px_90px_-40px_rgba(0,0,0,0.95),0_0_80px_-30px_rgba(34,197,94,0.45)]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56">
        <img
          src={BANNER[formType]}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-25"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.45) 45%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.45) 45%, transparent 100%)',
          }}
        />
      </div>
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/4 h-72 w-[40rem] rounded-full bg-green-500/15 blur-3xl" />

      {/* Top: what was picked, and the way to close. */}
      <div className="relative flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600/25 ring-1 ring-green-400/40">
            <CalendarDays aria-hidden className="h-5 w-5 text-green-300" />
          </span>
          {chosen && <span className="truncate text-base font-semibold text-white sm:text-lg">{chosen}</span>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={({ lv: 'Aizvērt', en: 'Close', ru: 'Закрыть' } as const)[asLanguage(i18n.language)]}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/80 ring-1 ring-white/15 transition-colors hover:bg-white/[0.14] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Phones: the chosen date and the times, first. */}
      <div className="relative border-b border-white/10 px-5 pb-3 pt-4 lg:hidden">
        <div className="mb-2 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-green-400" />
          {selectedDate ? (
            <>
              <span className="truncate text-sm font-semibold text-white">{formatDate(selectedDate)}</span>
              <Clock className="ml-1 h-4 w-4 shrink-0 text-green-400" />
              <span className="text-sm text-gray-400">{selectedTime ?? t('calendar.select_time')}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">{t('calendar.pick_date_first')}</span>
          )}
        </div>
        <TimeSlotPicker
          variant="bar"
          selectedTime={selectedTime}
          onTimeChange={setSelectedTime}
          availability={availability}
          disabled={!selectedDate}
        />
      </div>

      <div className="relative grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="p-4 sm:p-7 lg:border-r lg:border-white/10">
          <CalendarCode
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            availability={availability}
          />
        </div>
        <div className="p-4 sm:p-7">
          {formType === 'noma' ? (
            <FormNoma selectedDate={selectedDate} selectedTime={selectedTime} onClose={onClose} initialChoice={preset} />
          ) : (
            <FormRitual selectedDate={selectedDate} selectedTime={selectedTime} onClose={onClose} initialRitualType={preset} />
          )}
        </div>
      </div>

      {/* The popup's scrollbars, for the calendar's own scroll area. */}
      <style>{`
        .ib .custom-scroll::-webkit-scrollbar { width: 6px; }
        .ib .custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(34, 197, 94, 0.7); border-radius: 6px; }
        .ib .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default InlineBooking;

// Asks the page's inline ritual booking (if there is one) to open, at a plan
// (index into the rituals' price plans) or at its default; without one on
// the page, opens the booking popup instead.
export const OPEN_INLINE_RITUAL = 'inline-ritual-booking:open';
export const openInlineRitualBooking = (plan?: number) => {
  if (typeof plan !== 'number') plan = undefined;
  const event = new CustomEvent<{ plan?: number; handled: boolean }>(OPEN_INLINE_RITUAL, { detail: { plan, handled: false } });
  window.dispatchEvent(event);
  if (!event.detail.handled) {
    (window as unknown as { openCustomPopup?: (type: 'ritual') => void }).openCustomPopup?.('ritual');
  }
};
