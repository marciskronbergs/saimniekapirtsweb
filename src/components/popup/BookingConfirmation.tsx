import React, { useEffect, useRef } from 'react';
import { CheckCircle2, CalendarDays, Clock, Home, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import priceCatalog from '../../data/priceCatalog.json';
import { scrollIntoPopup } from './scrollIntoPopup';
import { priceReservation, formatEuro, type ReservationForPricing, type Locale } from '../../lib/pricing';

export interface ConfirmedBooking extends ReservationForPricing {
  name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  sauna_type: string;
  payment_method?: 'transfer' | 'cash';
}

interface BookingConfirmationProps {
  booking: ConfirmedBooking;
  onClose: () => void;
}

// Shown in place of the form once a booking is saved. With the form gone there
// is nothing left to press twice, and the guest sees plainly what they booked.
const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ booking, onClose }) => {
  const { t, i18n } = useTranslation('forms');
  const locale: Locale = i18n.language === 'en' ? 'en' : 'lv';
  const ref = useRef<HTMLDivElement>(null);

  // The form was taller than this; bring the confirmation into view within the
  // popup's own scroll area rather than leaving the guest looking at empty space.
  useEffect(() => scrollIntoPopup(ref.current), []);

  const priced = priceReservation(priceCatalog, booking);
  const date = new Date(`${booking.reservation_date}T12:00:00`).toLocaleDateString(
    locale === 'lv' ? 'lv-LV' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );
  // A free pick-up, or a transfer priced by agreement, is no price line, so it
  // is named here instead.
  const pickup = priceCatalog.transport.find(
    (option) => option.label === booking.transport && (option.price === 0 || ('custom' in option && option.custom))
  );
  const sauna = booking.sauna_type === 'Baltā pirts' ? t('noma.saunas.baltā') : t('noma.saunas.pelēkā');

  return (
    <div ref={ref} className="space-y-6" role="status" aria-live="polite">
      <div className="text-center space-y-3">
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
        <h3 className="text-2xl font-bold text-white">{t('confirmation.title')}</h3>
        <p className="text-gray-300">{t('confirmation.thanks', { name: booking.name })}</p>
      </div>

      <div className="rounded-xl border border-green-500/30 bg-gray-900/60 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-white">
            <CalendarDays className="w-4 h-4 text-green-400 shrink-0" />
            <span className="first-letter:uppercase">{date}</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4 text-green-400 shrink-0" />
            <span>{booking.reservation_time}</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Home className="w-4 h-4 text-green-400 shrink-0" />
            <span>{sauna}</span>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 space-y-2">
          {priced.items.map((item, index) => (
            <div key={index} className="flex justify-between gap-4 text-sm">
              <span className="text-gray-300">
                {item.name[locale]}
                {item.quantity > 1 && (
                  <span className="text-gray-500">
                    {' '}× {item.quantity} ({formatEuro(item.unitPrice, locale)})
                  </span>
                )}
              </span>
              <span className="text-white whitespace-nowrap">{formatEuro(item.amount, locale)}</span>
            </div>
          ))}
          {pickup && (
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-300">{pickup[locale]}</span>
              <span className="text-white whitespace-nowrap">
                {'custom' in pickup && pickup.custom ? t('transport.by_agreement') : t('transport.free')}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-gray-700 pt-3 font-semibold">
            <span className="text-white">{t('confirmation.total')}</span>
            <span className="text-green-400 text-lg whitespace-nowrap">
              {priced.problems.length === 0 ? formatEuro(priced.total, locale) : t('confirmation.total_tbc')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-300">
        <p>{t('confirmation.contact', { email: booking.email, phone: booking.phone })}</p>
        <p>{booking.payment_method === 'cash' ? t('confirmation.payment_cash') : t('confirmation.payment')}</p>
        <p className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-400 shrink-0" />
          <span>{t('confirmation.changes')}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full bg-green-600 hover:bg-green-500 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
      >
        {t('confirmation.close')}
      </button>
    </div>
  );
};

export default BookingConfirmation;
