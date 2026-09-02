import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
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
    const lastWeekday = (lastDay.getDay() + 6) % 7;
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

  return (
    <div className="relative lg:max-h-[80vh] lg:overflow-y-auto lg:pr-3 custom-scroll">
      <div className="space-y-5 text-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">{t('calendar.select_date')}</h3>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigateMonth('prev')} className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-gray-300" />
          </button>
          <h4 className="text-base font-medium text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button onClick={() => navigateMonth('next')} className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-[3px] mb-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-[3px] mb-4 min-h-[200px]">
          {generateCalendarDays().map((day, index) => (
            <button
              key={index}
              onClick={() => day.isAvailable && selectDate(day.date)}
              disabled={!day.isAvailable}
              className={`aspect-square text-[13px] flex items-center justify-center rounded-md transition-all
                ${day.isAvailable
                  ? day.isSelected
                    ? 'bg-green-600 text-white font-bold shadow-md shadow-green-500/20'
                    : day.isToday
                      ? 'bg-green-600/20 text-green-400 font-semibold hover:bg-green-600/30'
                      : day.isCurrentMonth
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-500 hover:bg-gray-800 hover:text-gray-400'
                  : day.isCurrentMonth
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 cursor-not-allowed'}
              `}
            >
              {day.date.getDate()}
            </button>
          ))}
        </div>

        {/* Time Slots - phones render these in the popup header instead, so they
            stay visible while the calendar and the form scroll past. */}
        {selectedDate && (
          <div className="hidden lg:block space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
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
      `}</style>
    </div>
  );
};

export default CalendarCode;