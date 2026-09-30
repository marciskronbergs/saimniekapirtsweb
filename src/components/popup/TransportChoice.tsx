import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bus } from 'lucide-react';
import priceCatalog from '../../data/priceCatalog.json';
import { busTimetableUrl } from './transport';

// How the guest gets here. The value is the price list's label ('' when they
// come on their own); the transfer is priced from the list like any extra.
interface TransportChoiceProps {
  value: string;
  onChange: (label: string) => void;
}

const TransportChoice: React.FC<TransportChoiceProps> = ({ value, onChange }) => {
  const { t, i18n } = useTranslation('forms');
  const en = i18n.language === 'en';
  const options = [
    { label: '', text: t('transport.own') },
    ...priceCatalog.transport.map((option) => ({
      label: option.label,
      text: `${en ? option.en : option.lv} – ${
        'custom' in option && option.custom ? t('transport.by_agreement') : option.price > 0 ? `${option.price} €` : t('transport.free')
      }`,
    })),
  ];
  const chosen = priceCatalog.transport.find((option) => option.label === value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        <Bus className="inline w-4 h-4 mr-2 text-green-400" />
        {t('transport.label')}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.label || 'own'} className="flex items-start gap-3 text-gray-300 cursor-pointer">
            <input
              type="radio"
              name="transport"
              checked={value === option.label}
              onChange={() => onChange(option.label)}
              className="mt-1 w-4 h-4 text-green-600 bg-gray-800 border-gray-600 focus:ring-green-500"
            />
            <span>{option.text}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-sm text-gray-400">
        {t('transport.bus_hint')}{' '}
        <a
          href={busTimetableUrl(i18n.language)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 underline underline-offset-2 hover:text-green-300"
        >
          {t('transport.timetable')}
        </a>
      </p>
      {chosen && (
        <p className="mt-1 text-sm text-green-300">
          {'custom' in chosen && chosen.custom
            ? t('transport.custom_note')
            : chosen.price > 0
              ? t('transport.transfer_note')
              : t('transport.pickup_note')}
        </p>
      )}
    </div>
  );
};

export default TransportChoice;
