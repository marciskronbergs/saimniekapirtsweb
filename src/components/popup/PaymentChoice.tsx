import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';
import { OptionCard, SubLabel } from './bookingUi';

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
      <SubLabel icon={CreditCard}>{t('payment.label')}</SubLabel>
      <div className="grid gap-2.5">
        {options.map((option) => {
          // "By card now – safely through Stripe": the way, then the detail.
          const at = option.text.indexOf(' – ');
          return (
            <OptionCard
              key={option.method}
              name="payment"
              checked={value === option.method}
              onChange={() => onChange(option.method)}
              title={at > 0 ? option.text.slice(0, at) : option.text}
              meta={at > 0 ? option.text.slice(at + 3) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PaymentChoice;
