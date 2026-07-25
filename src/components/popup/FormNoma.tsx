import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MessageSquare, Home, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

const allSaunaTypes = ['Baltā pirts', 'Pelēkā pirts'];

const rentalOptions = [
  '4h – 150€ (Pirts & Kubls diviem)',
  '3h – 80€ (Pirts bez kubla diviem)',
  '4h – 90€ (Pirts bez kubla diviem)',
  '5h – 170€ (Pirts & Kubls / līdz 5 cilvēkiem)',
  '5h – 120€ (Pirts bez kubla / līdz 5 cilvēkiem)',
  '5h – 200€ (Pirts & Kubls / 6–10 cilvēkiem)',
  '5h – 150€ (Pirts bez kubla / 6–10 cilvēkiem)',
];

const baseExtraOptions = [
  'Pirts slotiņas – 4€ /gab (bērza & ozola)',
  'Augu skrubji – 15€ / 200ml',
];
const overnightOption = 'Nakšņošana – 19.99 €/persona';

interface FormNomaProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onClose: () => void;
}

const FormNoma: React.FC<FormNomaProps> = ({ selectedDate, selectedTime, onClose }) => {
  const { t } = useTranslation('forms');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    saunaType: '',
    rentalType: '',
    extras: [] as string[],
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setSubmitError('Lūdzu izvēlieties datumu un laiku!');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const cleanedExtras = formData.extras.filter(extra =>
        extra !== overnightOption || (selectedTime === '17:00' || selectedTime === '18:00')
      );

      const reservationData = {
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
        rental_extras: cleanedExtras,
        rental_message: formData.message || ''
      };

      const { error } = await supabase.from('reservations').insert([reservationData]);
      if (error) throw new Error(`Supabase error: ${error.message}`);

      await fetch('https://hook.eu2.make.com/4lyknzb8yu44wvfojo9eahoju5q16zif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });

      setSubmitSuccess(true);

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Radās kļūda. Lūdzu mēģiniet vēlreiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Home className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold text-white">{t('noma.title')}</h3>
      </div>

      {submitError && (
        <div className="mb-4 p-4 bg-red-600/20 border border-red-500 rounded-lg">
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
      {[...baseExtraOptions, ...(selectedTime === '17:00' || selectedTime === '18:00' ? [overnightOption] : [])].map(option => (
        <label key={option} className="flex items-center">
          <input
            type="checkbox"
            checked={formData.extras.includes(option)}
            onChange={() => handleCheckboxChange(option)}
            className="w-5 h-5 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
          />
          <span className="ml-3 text-white">
            {option === 'Pirts slotiņas – 4€ /gab (bērza & ozola)' ? t('noma.extras.whisks') :
             option === 'Augu skrubji – 15€ / 200ml' ? t('noma.extras.scrubs') :
             option === 'Nakšņošana – 19.99 €/persona' ? t('noma.extras.overnight') :
             option}
          </span>
        </label>
      ))}
    </div>
  </div>
</div>


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

        {submitSuccess && (
  <div className="mb-4 p-4 bg-green-600/20 border border-green-500 rounded-lg text-green-300 text-sm text-center">
    {t('noma.success')}
  </div>
)}

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