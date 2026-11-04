import React from 'react';
import { Clock } from 'lucide-react';
import { timeSlots, SlotAvailability } from './timeSlots';

interface TimeSlotPickerProps {
  selectedTime: string | null;
  onTimeChange: (time: string | null) => void;
  availability: SlotAvailability;
  /** Set while no date is chosen yet: the times stay readable but cannot be picked. */
  disabled?: boolean;
  /** "bar" is the compact row used in the popup header on phones. */
  variant?: 'panel' | 'bar';
}

// The times as glass chips (21st.dev's "time slot" picker): a clock, the
// time, and a dot for how full the slot is (green free, amber filling, red
// full); the chosen one lit green, a full one struck through.
const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedTime,
  onTimeChange,
  availability,
  disabled = false,
  variant = 'panel',
}) => (
  <div className={variant === 'bar' ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-3 gap-2.5'}>
    {timeSlots.map((time) => {
      const available = !disabled && availability.isTimeAvailable(time);
      const badgeColor = availability.getBadgeColor(time);
      const chosen = selectedTime === time;
      return (
        <button
          key={time}
          type="button"
          onClick={() => available && onTimeChange(time)}
          disabled={!available}
          aria-pressed={chosen}
          className={`relative flex items-center justify-center gap-2 rounded-2xl font-semibold tabular-nums ring-1 transition-all duration-300
            ${variant === 'bar' ? 'py-2.5 px-2 text-[15px]' : 'py-3.5 px-3 text-base'}
            ${chosen
              ? 'bg-gradient-to-b from-green-400 to-green-600 text-black ring-green-200/70 shadow-[0_10px_26px_-8px_rgba(34,197,94,0.9)]'
              : available
                ? 'bg-white/[0.05] text-white/90 ring-white/[0.12] hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-white'
                : disabled
                  ? 'bg-white/[0.03] text-white/35 ring-white/[0.06] cursor-not-allowed'
                  : 'bg-white/[0.02] text-white/30 ring-white/[0.05] cursor-not-allowed line-through'}
          `}
        >
          <Clock aria-hidden className={`h-4 w-4 ${chosen ? 'text-black/70' : 'text-green-300/80'} ${variant === 'bar' ? 'hidden min-[380px]:block' : ''}`} />
          {time}
          <span
            className={`absolute top-1.5 right-2 h-2 w-2 rounded-full ${
              disabled
                ? 'bg-white/20'
                : badgeColor === 'green'
                ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]'
                : badgeColor === 'yellow'
                ? 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]'
                : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]'
            }`}
          />
        </button>
      );
    })}
  </div>
);

export default TimeSlotPicker;
