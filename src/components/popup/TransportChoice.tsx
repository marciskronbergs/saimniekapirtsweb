import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bus } from 'lucide-react';
import priceCatalog from '../../data/priceCatalog.json';
import { busTimetableUrl } from './transport';
import { asLanguage } from '../../utils/locale';
import { OptionCard, SubLabel, splitOption } from './bookingUi';

// How the guest gets here. The value is the price list's label ('' when they
// come on their own); the transfer is priced from the list like any extra.
// The free pick-up from the "Dzimtmisa" bus stop is a tick under "on my own"
// rather than an option of its own: the guest still gets here themselves,
// and the tick tells us to meet their bus.
interface TransportChoiceProps {
  value: string;
  onChange: (label: string) => void;
}

const busPickup = priceCatalog.transport.find((option) => option.price === 0 && !('custom' in option && option.custom));

const TransportChoice: React.FC<TransportChoiceProps> = ({ value, onChange }) => {
  const { t, i18n } = useTranslation('forms');
  const locale = asLanguage(i18n.language);
  const byBus = !!busPickup && value === busPickup.label;
  const transfers = priceCatalog.transport
    .filter((option) => option !== busPickup)
    .map((option) => ({
      label: option.label,
      text: `${option[locale]} – ${
        'custom' in option && option.custom ? t('transport.by_agreement') : `${option.price} €`
      }`,
    }));
  const transfer = priceCatalog.transport.find((option) => option !== busPickup && option.label === value);
  return (
    <div>
      <SubLabel icon={Bus}>{t('transport.label')}</SubLabel>
      <div className="space-y-2.5">
        <OptionCard
          name="transport"
          checked={value === '' || byBus}
          onChange={() => onChange('')}
          title={t('transport.own')}
        />
        {busPickup && (
          <div className="ml-5 space-y-2 border-l border-white/10 pl-4">
            <OptionCard
              type="checkbox"
              name="transport-bus"
              checked={byBus}
              onChange={() => onChange(byBus ? '' : busPickup.label)}
              title={t('transport.by_bus')}
            />
            <p className="text-sm">
              <a
                href={busTimetableUrl(i18n.language)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-300 underline decoration-green-300/40 underline-offset-4 hover:text-green-200"
              >
                {t('transport.timetable')}
              </a>
            </p>
            {byBus && <p className="text-sm text-green-200/90">{t('transport.pickup_note')}</p>}
          </div>
        )}
        {transfers.map((option) => {
          const { name, price } = splitOption(option.text);
          return (
            <OptionCard
              key={option.label}
              name="transport"
              checked={value === option.label}
              onChange={() => onChange(option.label)}
              title={name}
              price={price}
            />
          );
        })}
      </div>
      {transfer && (
        <p className="mt-2.5 text-sm text-green-200/90">
          {'custom' in transfer && transfer.custom ? t('transport.custom_note') : t('transport.transfer_note')}
        </p>
      )}
    </div>
  );
};

export default TransportChoice;
