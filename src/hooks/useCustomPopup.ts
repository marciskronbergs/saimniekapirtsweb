import { useState } from 'react';
import { trackBookingStart } from '../lib/analytics';

type PopupType = 'noma' | 'ritual';

export const useCustomPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formType, setFormType] = useState<PopupType>('ritual');

  const openCustomPopup = (type: PopupType) => {
    setFormType(type);
    setIsOpen(true);
    trackBookingStart(type);
  };

  const closeCustomPopup = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    formType,
    openCustomPopup,
    closeCustomPopup
  }; 
};