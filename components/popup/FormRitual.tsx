import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Users,
  Home
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ritualTypes = [
  'Pirts Rituāls Individuāli ar zāļu kublu 🌿😊 – 280€',
  'Pirts Rituāls Individuāli bez zāļu kubla 🌿 – 220€',
  'Pirts Rituāls Diviem ar zāļu kublu 🌿❤️ – 360€',
  'Pirts Rituāls Diviem bez zāļu kubla 🌿 – 300€',
  'Pirts Rituāls Ģimenei ar zāļu kublu 🌿😊 – 380€',
  'Pirts piedzīvojums ar pirts meistaru 🌿💆‍♀️ – (70€ /no personas, Min 360€)',
  'Pirts kūre "Draugu pirts" 🌿🧘 – (100€ /no personas, Min 360€)',
  'Pirts kūre "Draugu pirts +" 🌿🧘 – (140€ /no personas, Min 360€)',
  'VECMEITAS PŪRS 🌿🧔 – 360€ (līdz 8 cilvēkiem)',
  'VĪRU PAKA 🌿💪 – 360€ (līdz 8 cilvēkiem)',
];

const groupRitualsLarge = [
  'Pirts piedzīvojums ar pirts meistaru 🌿💆‍♀️ – (70€ /no personas, Min 360€)',
  'Pirts kūre "Draugu pirts" 🌿🧘 – (100€ /no personas, Min 360€)',
  'Pirts kūre "Draugu pirts +" 🌿🧘 – (140€ /no personas, Min 360€)',
];

const groupRitualsSmall = [
  'VECMEITAS PŪRS 🌿🧔 – 360€ (līdz 8 cilvēkiem)',
  'VĪRU PAKA 🌿💪 – 360€ (līdz 8 cilvēkiem)',
];

const groupRituals = [...groupRitualsLarge, ...groupRitualsSmall];

const timeSlotsForStay = ['17:00', '18:00'];

interface FormRitualProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onClose: () => void;
}

const FormRitual: React.FC<FormRitualProps> = ({ selectedDate, selectedTime, onClose }) => {
  const { t } = useTranslation(['forms', 'common']);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ritualType: '',
    participants: '',
    overnightStay: false,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);


  // Auto-reset overnightStay if time is changed to a non-evening slot
React.useEffect(() => {
  if (!timeSlotsForStay.includes(selectedTime || '') && formData.overnightStay) {
    setFormData(prev => ({
      ...prev,
      overnightStay: false
    }));
  }
}, [selectedTime]);


  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isGroupRitual = groupRituals.includes(formData.ritualType);
  const showOvernight = timeSlotsForStay.includes(selectedTime || '');


  const fetchSaunaType = async (): Promise<string> => {
  if (!selectedDate || !selectedTime) return 'Pelēkā pirts';

  const formattedDate = selectedDate.toLocaleDateString('en-CA');

  const timesToCheck =
    selectedTime === '17:00' || selectedTime === '18:00'
      ? ['17:00', '18:00']
      : [selectedTime];

  const { data, error } = await supabase
    .from('reservations')
    .select('sauna_type')
    .eq('reservation_date', formattedDate)
    .in('reservation_time', timesToCheck);

  if (error) {
    console.error('Failed to fetch existing reservations:', error);
    return 'Pelēkā pirts'; // fallback
  }

  const usedTypes = new Set(data.map((r: any) => r.sauna_type));

  if (!usedTypes.has('Pelēkā pirts')) return 'Pelēkā pirts';
  if (!usedTypes.has('Baltā pirts')) return 'Baltā pirts';

  // fallback: both are taken
  return '';
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
      // Prepare data for Supabase
     const assignedSaunaType = await fetchSaunaType();
if (!assignedSaunaType) {
  setSubmitError('Diemžēl abas pirtis jau ir rezervētas šim laikam.');
  setIsSubmitting(false);
  return;
}

const reservationData = {
  form_type: 'ritual',
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  reservation_date: selectedDate.toLocaleDateString('en-CA'),
  reservation_time: selectedTime,
  ritual_type: formData.ritualType,
  ritual_participants: formData.participants ? parseInt(formData.participants) : null,
  overnight_stay: formData.overnightStay,
  ritual_message: formData.message || '',
  sauna_type: assignedSaunaType,
  rental_type: '',
  rental_extras: [],
  rental_message: ''
};

      // Insert into Supabase
      const { data, error } = await supabase
        .from('reservations')
        .insert([reservationData])
        .select();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Prepare data for Make.com webhook
      const webhookData = {
  form_type: 'ritual',
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  reservation_date: selectedDate.toLocaleDateString('en-CA'),
  reservation_time: selectedTime,
  ritual_type: formData.ritualType,
  ritual_participants: formData.participants ? parseInt(formData.participants) : null,
  overnight_stay: formData.overnightStay,
  ritual_message: formData.message || '',
  sauna_type: assignedSaunaType, // ← Send correct type
  rental_type: '',             // <- Empty for rituals
  rental_extras: [],           // <- Empty for rituals
  rental_message: ''           // <- Empty for rituals
};

      // Send to Make.com webhook
      const webhookResponse = await fetch('https://hook.eu2.make.com/4lyknzb8yu44wvfojo9eahoju5q16zif', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!webhookResponse.ok) {
        console.warn('Webhook failed, but reservation was saved to database');
      }

      // Success - close popup and reset form
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
        <Sparkles className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold text-white">{t('forms:ritual.title')}</h3>
      </div>

      {submitError && (
        <div className="mb-4 p-4 bg-red-600/20 border border-red-500 rounded-lg">
          <p className="text-red-400">{submitError}</p>
        </div>
      )}

      {(!selectedDate || !selectedTime) && (
        <div className="mb-4 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg">
          <p className="text-yellow-400">{t('common:calendar.please_select_date_time')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-green-400">{t('forms:ritual.personal_info')}</h4>

          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('forms:ritual.name_placeholder')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder={t('forms:ritual.email_placeholder')}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              required
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              placeholder={t('forms:ritual.phone_placeholder')}
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>

        {/* Ritual Type */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-green-400">{t('forms:ritual.ritual_details')}</h4>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('forms:ritual.ritual_type')}</label>
            <select
  value={formData.ritualType}
  onChange={(e) => handleInputChange('ritualType', e.target.value)}
  className="w-full max-w-full truncate px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
  required
>
              <option value="">{t('forms:ritual.ritual_type_placeholder')}</option>
              {ritualTypes.map((option, index) => (
                <option key={option} value={option}>
                  {t(`forms:ritual.options.option${index + 1}`)}
                </option>
              ))}
            </select>
          </div>

         {isGroupRitual && (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{t('forms:ritual.participants')}</label>
    <select
      value={formData.participants}
      onChange={(e) => handleInputChange('participants', e.target.value)}
      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 appearance-none"
      required
    >
      <option value="">{t('forms:ritual.participants_placeholder')}</option>
      {(groupRitualsLarge.includes(formData.ritualType)
        ? Array.from({ length: 14 }, (_, i) => i + 3) // 3–16
        : groupRitualsSmall.includes(formData.ritualType)
        ? Array.from({ length: 6 }, (_, i) => i + 3)  // 3–8
        : []).map((num) => {
          const valueKey = `${num} cilvēki`;
          return (
          <option key={num} value={valueKey}>
            {t(`forms:ritual.people.${num}`)}
          </option>
        );
      })}
    </select>
  </div>
)}



          {showOvernight && (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="overnightStay"
                checked={formData.overnightStay}
                onChange={(e) => handleInputChange('overnightStay', e.target.checked)}
                className="w-5 h-5 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
              />
              <label htmlFor="overnightStay" className="text-gray-300">{t('forms:ritual.overnight')}</label>
            </div>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">{t('forms:ritual.message')}</label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              placeholder={t('forms:ritual.message_placeholder')}
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
            />
          </div>
       
        </div>
        {submitSuccess && (
  <div className="mb-4 p-4 bg-green-600/20 border border-green-500 rounded-lg text-green-300 text-sm text-center">
    {t('forms:ritual.success')}
  </div>
)}

        <button
          type="submit"
          disabled={isSubmitting || !selectedDate || !selectedTime}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
        >
          {isSubmitting ? t('forms:ritual.submitting') : t('forms:ritual.submit')}
        </button>
      </form>
    </div>
  );
};

export default FormRitual;
