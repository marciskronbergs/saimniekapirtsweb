import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bus } from 'lucide-react';
import priceCatalog from '../../data/priceCatalog.json';
import { busTimetableUrl } from './transport';
import { asLanguage } from '../../utils/locale';

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
  const radioClass = 'mt-1 w-4 h-4 text-green-600 bg-gray-800 border-gray-600 focus:ring-green-500';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        <Bus className="inline w-4 h-4 mr-2 text-green-400" />
        {t('transport.label')}
      </label>
      <div className="space-y-2">
        <label className="flex items-start gap-3 text-gray-300 cursor-pointer">
          <input
            type="radio"
            name="transport"
            checked={value === '' || byBus}
            onChange={() => onChange('')}
            className={radioClass}
          />
          <span>{t('transport.own')}</span>
        </label>
        {busPickup && (
          <div className="ml-7">
            <label className="flex items-start gap-3 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={byBus}
                onChange={(e) => onChange(e.target.checked ? busPickup.label : '')}
                className="mt-0.5 w-5 h-5 shrink-0 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span>{t('transport.by_bus')}</span>
            </label>
            <p className="ml-8 mt-1 text-sm">
              <a
                href={busTimetableUrl(i18n.language)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 underline underline-offset-2 hover:text-green-300"
              >
                {t('transport.timetable')}
              </a>
            </p>
            {byBus && <p className="ml-8 mt-1 text-sm text-green-300">{t('transport.pickup_note')}</p>}
          </div>
        )}
        {transfers.map((option) => (
          <label key={option.label} className="flex items-start gap-3 text-gray-300 cursor-pointer">
            <input
              type="radio"
              name="transport"
              checked={value === option.label}
              onChange={() => onChange(option.label)}
              className={radioClass}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </div>
      {transfer && (
        <p className="mt-2 text-sm text-green-300">
          {'custom' in transfer && transfer.custom ? t('transport.custom_note') : t('transport.transfer_note')}
        </p>
      )}
    </div>
  );
};

export default TransportChoice;
