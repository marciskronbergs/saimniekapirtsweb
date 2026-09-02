import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
}

const PopupWrapper: React.FC<PopupWrapperProps> = ({ isOpen, onClose, formType }) => {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32 overflow-x-hidden w-screen max-w-screen">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
     <div className="relative w-full max-w-6xl mx-2 sm:mx-4 h-[85vh] sm:h-[75vh] bg-[#0a0a0a] rounded-2xl shadow-2xl shadow-green-500/20 border border-green-500/30 overflow-hidden flex flex-col">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center z-10"
        >
          <X className="w-5 h-5 text-gray-300" />
        </button>

        {/* Selected date and the bookable times, pinned above the scroll area on
            phones so they stay readable while the calendar and form scroll. */}
        <div className="lg:hidden shrink-0 border-b border-green-500/25 bg-[#0d0d0d] pl-4 pr-16 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            {selectedDate ? (
              <>
                <CalendarDays className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm font-semibold text-white truncate">
                  {formatSelectedDate(selectedDate)}
                </span>
                <Clock className="w-4 h-4 text-green-400 shrink-0 ml-1" />
                <span className="text-sm text-gray-400">
                  {selectedTime ?? t('calendar.select_time')}
                </span>
              </>
            ) : (
              <>
                <CalendarDays className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm text-gray-400">{t('calendar.pick_date_first')}</span>
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
        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-2 overflow-y-auto custom-scroll">
          {/* Left: Calendar */}
          <div className="p-4 sm:p-6 shrink-0 lg:overflow-y-auto custom-scroll w-full max-w-full">
            <CalendarCode
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateChange={setSelectedDate}
              onTimeChange={handleTimeChange}
              availability={availability}
            />
          </div>

          {/* Right: Form */}
          <div ref={formRef} className="p-4 sm:p-6 shrink-0 lg:overflow-y-auto custom-scroll">
            {formType === 'noma' ? (
              <FormNoma
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onClose={onClose}
              />
            ) : (
              <FormRitual
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onClose={onClose}
              />
            )}
          </div>
        </div>
      </div>

      {/* Scrollbar styling */}
      <style jsx>{`
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
        
        select {
  text-wrap: wrap; /* Modern fallback */
  white-space: normal;
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
