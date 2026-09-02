import React from 'react';
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

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedTime,
  onTimeChange,
  availability,
  disabled = false,
  variant = 'panel',
}) => (
  <div className={variant === 'bar' ? 'grid grid-cols-3 gap-2' : 'flex gap-2'}>
    {timeSlots.map((time) => {
      const available = !disabled && availability.isTimeAvailable(time);
      const badgeColor = availability.getBadgeColor(time);
      return (
        <button
          key={time}
          type="button"
          onClick={() => available && onTimeChange(time)}
          disabled={!available}
          className={`relative rounded-md font-medium text-center transition
            ${variant === 'bar' ? 'py-2.5 px-2 text-[15px]' : 'flex-1 py-2 px-3 text-sm'}
            ${selectedTime === time
              ? 'bg-green-600 text-white shadow-md shadow-green-500/20'
              : available
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                : disabled
                  ? 'bg-gray-800/60 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed line-through'}
          `}
        >
          {time}
          <span
            className={`absolute top-1 right-2 w-2 h-2 rounded-full ${
              disabled
                ? 'bg-gray-600'
                : badgeColor === 'green'
                ? 'bg-green-400'
                : badgeColor === 'yellow'
                ? 'bg-yellow-400'
                : 'bg-red-400'
            }`}
          />
        </button>
      );
    })}
  </div>
);

export default TimeSlotPicker;
