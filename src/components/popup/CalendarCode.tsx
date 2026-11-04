import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import TimeSlotPicker from './TimeSlotPicker';
import { SlotAvailability } from './timeSlots';

interface CalendarCodeProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string | null) => void;
  availability: SlotAvailability;
}

const CalendarCode: React.FC<CalendarCodeProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  availability,
}) => {
   const { t } = useTranslation('common');
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(today.getFullYear() + 1);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // Last day of current month
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstWeekday);

    // Calculate how many weeks we need to show all days of the month
    const totalDaysNeeded = firstWeekday + lastDay.getDate();
    const weeksNeeded = Math.ceil(totalDaysNeeded / 7);
    const totalCells = weeksNeeded * 7;

    const days = [];
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const isTooFar = date > maxDate;
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isCurrentMonth = date.getMonth() === month;

      days.push({
        date,
        isToday,
        isPast,
        isTooFar,
        isSelected,
        isCurrentMonth,
        isAvailable: !isPast && !isTooFar,
      });
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      const thisMonth = today.getMonth();
      if (newDate.getMonth() > thisMonth || newDate.getFullYear() > today.getFullYear()) {
        newDate.setMonth(newDate.getMonth() - 1);
      }
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const selectDate = (date: Date) => {
    if (date < today || date > maxDate) return;
    onDateChange(date);
    onTimeChange(null);
  };

  const monthNames = t('calendar.months', { returnObjects: true }) as string[];
  const dayNames = t('calendar.weekdays', { returnObjects: true }) as string[];
  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  const atFirstMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  const dayClass = (day: ReturnType<typeof generateCalendarDays>[number]) =>
    day.isAvailable
      ? day.isSelected
        ? 'bg-gradient-to-b from-green-400 to-green-600 font-bold text-black shadow-[0_8px_22px_-6px_rgba(34,197,94,0.9)] ring-1 ring-green-200/70'
        : day.isToday
          ? 'font-semibold text-green-300 ring-1 ring-green-400/60 hover:bg-green-500/15'
          : day.isCurrentMonth
            ? 'text-white/85 hover:bg-white/[0.09] hover:text-white'
            : 'text-white/35 hover:bg-white/[0.06]'
      : day.isCurrentMonth
        ? 'cursor-not-allowed text-white/20'
        : 'cursor-not-allowed text-white/10';

  // A month grid in the manner of 21st.dev's calendar: the month between
  // round glass arrows, the days as rounded tiles, today ringed and dotted,
  // the chosen day lit green; the grid slides over as the month changes.
  return (
    <div className="relative lg:max-h-[80vh] lg:overflow-y-auto lg:pr-3 custom-scroll">
      <div className="space-y-5 text-sm">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-400/40">
            <Calendar className="h-[18px] w-[18px] text-green-300" />
          </span>
          <h3 className="text-lg font-semibold text-white">{t('calendar.select_date')}</h3>
        </div>

        <div className="rounded-3xl bg-white/[0.035] p-3 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-4">
          {/* Calendar Header */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              disabled={atFirstMonth}
              aria-label="‹"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/15 transition hover:bg-white/[0.12] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4 text-white/80" />
            </button>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h4
                key={monthKey}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-base font-semibold tracking-wide text-white"
              >
                {monthNames[currentDate.getMonth()]} <span className="text-white/50">{currentDate.getFullYear()}</span>
              </motion.h4>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              aria-label="›"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/15 transition hover:bg-white/[0.12]"
            >
              <ChevronRight className="h-4 w-4 text-white/80" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="mb-1.5 grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div key={day} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-white/40">{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={monthKey}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.2 }}
              className="grid min-h-[200px] grid-cols-7 gap-1"
            >
              {generateCalendarDays().map((day, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => day.isAvailable && selectDate(day.date)}
                  disabled={!day.isAvailable}
                  aria-pressed={!!day.isSelected}
                  className={`relative flex aspect-square items-center justify-center rounded-xl text-[14px] tabular-nums transition-all duration-200 ${dayClass(day)}`}
                >
                  {day.date.getDate()}
                  {day.isToday && !day.isSelected && (
                    <span aria-hidden className="absolute bottom-1.5 h-1 w-1 rounded-full bg-green-400" />
                  )}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Time Slots - phones render these in the popup header instead, so they
            stay visible while the calendar and the form scroll past. */}
        {selectedDate && (
          <div className="hidden lg:block space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-400/40">
                <Clock className="h-[18px] w-[18px] text-green-300" />
              </span>
              <h3 className="text-lg font-semibold text-white">{t('calendar.select_time')}</h3>
            </div>

            <TimeSlotPicker
              selectedTime={selectedTime}
              onTimeChange={onTimeChange}
              availability={availability}
            />
          </div>
        )}
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(34, 197, 94, 0.7); border-radius: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default CalendarCode;
