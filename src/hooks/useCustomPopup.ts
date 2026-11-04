import { useState } from 'react';
import { trackBookingStart } from '../lib/analytics';

type PopupType = 'noma' | 'ritual';

export const useCustomPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formType, setFormType] = useState<PopupType>('ritual');
  // The option already chosen where the booking was opened (a price list
  // label), picked in the form to start with.
  const [preset, setPreset] = useState<string | undefined>(undefined);

  const openCustomPopup = (type: PopupType, choice?: string) => {
    setFormType(type);
    setPreset(choice);
    setIsOpen(true);
    trackBookingStart(type);
  };

  const closeCustomPopup = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    formType,
    preset,
    openCustomPopup,
    closeCustomPopup
  }; 
};