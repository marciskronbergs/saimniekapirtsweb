import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';

export type PaymentMethod = 'transfer' | 'cash' | 'card';

// How the guest will pay. A card is paid straight away on Stripe's page; a
// bank transfer gets an advance invoice by email; cash is paid on site after
// the visit and gets no invoice. Card is offered only while card payments are
// switched on, and cash only for bookings.
interface PaymentChoiceProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  card: boolean;
  cash?: boolean;
}

const PaymentChoice: React.FC<PaymentChoiceProps> = ({ value, onChange, card, cash = true }) => {
  const { t } = useTranslation('forms');
  const options: { method: PaymentMethod; text: string }[] = [
    ...(card ? [{ method: 'card' as const, text: t('payment.card') }] : []),
    { method: 'transfer', text: t('payment.transfer') },
    ...(cash ? [{ method: 'cash' as const, text: t('payment.cash') }] : []),
  ];
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        <CreditCard className="inline w-4 h-4 mr-2 text-green-400" />
        {t('payment.label')}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.method} className="flex items-start gap-3 text-gray-300 cursor-pointer">
            <input
              type="radio"
              name="payment"
              checked={value === option.method}
              onChange={() => onChange(option.method)}
              className="mt-1 w-4 h-4 text-green-600 bg-gray-800 border-gray-600 focus:ring-green-500"
            />
            <span>{option.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PaymentChoice;
