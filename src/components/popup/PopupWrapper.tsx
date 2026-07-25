import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import CalendarCode from './CalendarCode';
import FormRitual from './FormRitual';
import FormNoma from './FormNoma';

interface PopupWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  formType: 'noma' | 'ritual';
}

const PopupWrapper: React.FC<PopupWrapperProps> = ({ isOpen, onClose, formType }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

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

        {/* Content Area (scrollable on mobile) */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 h-full overflow-y-auto">
          {/* Left: Calendar */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scroll w-full max-w-full">
            <CalendarCode 
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateChange={setSelectedDate}
              onTimeChange={setSelectedTime}
            />
          </div>

          {/* Right: Form */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scroll">
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
