import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MessageSquare, Home, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import priceCatalog from '../../data/priceCatalog.json';
import BookingConfirmation, { type ConfirmedBooking } from './BookingConfirmation';
import TransportChoice from './TransportChoice';
import PaymentChoice, { type PaymentMethod } from './PaymentChoice';
import { goToCardPayment, paymentLabel, useCardPayments } from '../../lib/cardPayments';
import { scrollIntoPopup } from './scrollIntoPopup';
import { cancelUrl } from './cancelUrl';

const allSaunaTypes = ['Baltā pirts', 'Pelēkā pirts'];

// Labels come from the shared price list, the same one the invoice function
// prices bookings from. They are stored verbatim and sent to Make, so they must
// not be reworded here without updating the list.
const rentalOptions = priceCatalog.rental.map((r) => r.label);
const baseExtraOptions = priceCatalog.extras.filter((e) => !e.overnight).map((e) => e.label);
const overnightOption = priceCatalog.extras.find((e) => e.overnight)!.label;

interface FormNomaProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onClose: () => void;
}

const FormNoma: React.FC<FormNomaProps> = ({ selectedDate, selectedTime, onClose }) => {
  const { t, i18n } = useTranslation('forms');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    saunaType: '',
    rentalType: '',
    extras: [] as string[],
    message: '',
    transport: '',
    paymentMethod: 'transfer' as PaymentMethod
  });
  // How many of each ticked extra. Without it an invoice could not total a
  // booking of "whisks, 4 € each" or "overnight, per person".
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const cardPayments = useCardPayments();
  // The button is disabled through state, which only takes effect on the next
  // render; a quick double click lands before that and used to book twice.
  const submittingRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // The message sits above the form, out of sight of the button just pressed.
  useEffect(() => {
    if (submitError) scrollIntoPopup(errorRef.current);
  }, [submitError]);
  const [availableSaunas, setAvailableSaunas] = useState<string[]>(allSaunaTypes);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate || !selectedTime) return;

      const formattedDate = selectedDate.toLocaleDateString('en-CA');
      const timesToCheck = selectedTime === '17:00' || selectedTime === '18:00'
        ? ['17:00', '18:00']
        : [selectedTime];

      const { data, error } = await supabase
        .from('reservations')
        .select('sauna_type')
        .eq('reservation_date', formattedDate)
        .in('reservation_time', timesToCheck);

      if (error) {
        console.error('Failed to fetch sauna reservations:', error);
        return;
      }

      const saunaCount: Record<string, number> = {};
      data?.forEach(entry => {
        if (entry.sauna_type) {
          saunaCount[entry.sauna_type] = (saunaCount[entry.sauna_type] || 0) + 1;
        }
      });

      const filtered = allSaunaTypes.filter(type => (saunaCount[type] || 0) < 1);
      setAvailableSaunas(filtered);
    };

    fetchAvailability();
  }, [selectedDate, selectedTime]);

  const handleCheckboxChange = (option: string) => {
    setFormData(prev => {
      const alreadySelected = prev.extras.includes(option);
      const updatedExtras = alreadySelected
        ? prev.extras.filter(o => o !== option)
        : [...prev.extras, option];
      return { ...prev, extras: updatedExtras };
    });
    // Ticking an extra means at least one of it; unticking forgets the count.
    setExtraQuantities(prev => {
      const next = { ...prev };
      if (next[option]) delete next[option];
      else next[option] = 1;
      return next;
    });
  };

  const handleQuantityChange = (option: string, value: string) => {
    const quantity = Math.max(1, Math.min(20, Math.floor(Number(value)) || 1));
    setExtraQuantities(prev => ({ ...prev, [option]: quantity }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setSubmitError('Lūdzu izvēlieties datumu un laiku!');
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const cleanedExtras = formData.extras.filter(extra =>
        extra !== overnightOption || (selectedTime === '17:00' || selectedTime === '18:00')
      );

      // The id is made here rather than read back after saving: it is the
      // secret in the office's cancel link, so the public cannot read ids.
      const id = crypto.randomUUID();
      const reservationData = {
        id,
        form_type: 'noma',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        reservation_date: selectedDate.toLocaleDateString('en-CA'),
        reservation_time: selectedTime,
        ritual_type: '',
        ritual_participants: null,
        overnight_stay: false,
        ritual_message: '',
        sauna_type: formData.saunaType,
        rental_type: formData.rentalType,
        // Kept exactly as before: Make's email reads this list.
        rental_extras: cleanedExtras,
        // What the invoice needs and the list above cannot hold. Only the label
        // and count are sent; the price is looked up on the server.
        rental_extras_detail: cleanedExtras.map(label => ({
          label,
          quantity: extraQuantities[label] ?? 1,
        })),
        locale: i18n.language === 'en' ? 'en' : 'lv',
        rental_message: formData.message || '',
        transport: formData.transport || null,
        payment_method: formData.paymentMethod
      };

      const { error } = await supabase.from('reservations').insert([reservationData]);
      // The database allows one booking per sauna and time, so a second guest
      // who picked the same slot a moment later is told so plainly.
      if (error?.code === '23505') {
        setSubmitError(t('confirmation.slot_taken'));
        return;
      }
      if (error) throw new Error(`Supabase error: ${error.message}`);

      // The booking is saved at this point. If the notification fails the guest
      // must still see it confirmed, or they would try again and book twice.
      try {
        await fetch('https://hook.eu2.make.com/4lyknzb8yu44wvfojo9eahoju5q16zif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // cancel_url: the office's calendar can link to it to cancel the
          // booking, which frees the slot and annuls its advance invoice.
          body: JSON.stringify({
            ...reservationData,
            cancel_url: cancelUrl(id),
            payment_label: paymentLabel(formData.paymentMethod),
          })
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      // Paying by card: on to Stripe's page. If that cannot be opened, the
      // booking stands and is paid by bank transfer instead.
      if (formData.paymentMethod === 'card') {
        await goToCardPayment('reservation', id);
        setConfirmed({ ...reservationData, payment_method: 'transfer' });
        return;
      }
      setConfirmed(reservationData);

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Radās kļūda. Lūdzu mēģiniet vēlreiz.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (confirmed) {
    return <BookingConfirmation booking={confirmed} onClose={onClose} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Home className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold text-white">{t('noma.title')}</h3>
      </div>

      {submitError && (
        <div ref={errorRef} className="mb-4 p-4 bg-red-600/20 border border-red-500 rounded-lg">
          <p className="text-red-400">{submitError}</p>
        </div>
      )}

      {(!selectedDate || !selectedTime) && (
        <div className="mb-4 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg">
          <p className="text-yellow-400">{t('noma.date_warning')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-green-400">{t('noma.personal_info')}</h4>

          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('noma.name_placeholder')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder={t('noma.email_placeholder')}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              placeholder={t('noma.phone_placeholder')}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>

        {/* Booking Details */}
<div className="space-y-4">
  <h4 className="text-lg font-semibold text-green-400">{t('noma.details')}</h4>

  {/* Sauna Selection */}
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{t('noma.select_sauna_label')}</label>
    <select
      value={formData.saunaType}
      onChange={(e) => handleInputChange('saunaType', e.target.value)}
      required
      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
    >
      <option value="">{t('noma.select_sauna_placeholder')}</option>
      {availableSaunas.length > 0 ? (
        availableSaunas.map(type => (
          <option key={type} value={type}>
            {type === 'Baltā pirts' ? t('noma.saunas.baltā') : t('noma.saunas.pelēkā')}
          </option>
        ))
      ) : (
        <option disabled>{t('noma.no_saunas_available')}</option>
      )}
    </select>
  </div>

  {/* Rental Type */}
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{t('noma.select_type_label')}</label>
    <select
      value={formData.rentalType}
      onChange={(e) => handleInputChange('rentalType', e.target.value)}
      required
      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
    >
      <option value="">{t('noma.select_type_placeholder')}</option>
      {rentalOptions.map((option, index) => (
        <option key={option} value={option}>
          {t(`noma.rentalOptions.option${index + 1}`)}
        </option>
      ))}
    </select>
  </div>

  {/* Extras */}
  <div>
    <label className="flex items-center text-gray-300 font-medium mb-4">
      <Plus className="w-5 h-5 mr-2 text-green-400" />
      {t('noma.addons')}
    </label>
    <div className="space-y-3">
      {[...baseExtraOptions, ...(selectedTime === '17:00' || selectedTime === '18:00' ? [overnightOption] : [])].map(option => {
        const checked = formData.extras.includes(option);
        const isOvernight = option === overnightOption;
        return (
          <div key={option} className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleCheckboxChange(option)}
                className="w-5 h-5 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="ml-3 text-white">
                {option === baseExtraOptions[0] ? t('noma.extras.whisks') :
                 option === baseExtraOptions[1] ? t('noma.extras.scrubs') :
                 isOvernight ? t('noma.extras.overnight') :
                 option}
              </span>
            </label>
            {checked && (
              <label className="flex items-center gap-2 text-sm text-gray-300">
                {isOvernight ? t('noma.extras.people') : t('noma.extras.quantity')}
                <input
                  type="number"
                  min={1}
                  max={20}
                  inputMode="numeric"
                  value={extraQuantities[option] ?? 1}
                  onChange={(e) => handleQuantityChange(option, e.target.value)}
                  className="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </label>
            )}
          </div>
        );
      })}
    </div>
  </div>
</div>


        <TransportChoice value={formData.transport} onChange={(label) => setFormData((prev) => ({ ...prev, transport: label }))} />

        <PaymentChoice
          card={cardPayments}
          value={formData.paymentMethod}
          onChange={(method) => setFormData((prev) => ({ ...prev, paymentMethod: method }))}
        />

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">{t('noma.message_label')}</label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              placeholder={t('noma.message_placeholder')}
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
            />
          </div>
        </div>


        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedDate || !selectedTime}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
        >
          {isSubmitting ? t('noma.submitting') : t('noma.submit')}
        </button>
      </form>
    </div>
  );
};

export default FormNoma;