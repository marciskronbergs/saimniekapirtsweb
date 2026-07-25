import { useState } from 'react';

type PopupType = 'noma' | 'ritual';

export const useCustomPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formType, setFormType] = useState<PopupType>('ritual');

  const openCustomPopup = (type: PopupType) => {
    setFormType(type);
    setIsOpen(true);
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