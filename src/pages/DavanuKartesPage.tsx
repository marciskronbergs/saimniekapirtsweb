import React, { useState, useEffect, useRef } from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { Gift, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const DavanuKartesPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<'none' | 'ritual' | 'custom'>('none');
  const [customValue, setCustomValue] = useState(150);
  const [selectedRitual, setSelectedRitual] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+371'
  });
  const sectionRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation('giftcards');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Smooth scroll to form when section changes
  useEffect(() => {
    if (activeSection !== 'none' && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 300);
    }
  }, [activeSection]);

  const europeanCountries = [
    { code: '+371', country: 'LV', name: 'Latvia' },
    { code: '+372', country: 'EE', name: 'Estonia' },
    { code: '+370', country: 'LT', name: 'Lithuania' },
    { code: '+49', country: 'DE', name: 'Germany' },
    { code: '+33', country: 'FR', name: 'France' },
    { code: '+44', country: 'UK', name: 'United Kingdom' },
    { code: '+39', country: 'IT', name: 'Italy' },
    { code: '+34', country: 'ES', name: 'Spain' },
    { code: '+31', country: 'NL', name: 'Netherlands' },
    { code: '+32', country: 'BE', name: 'Belgium' },
    { code: '+41', country: 'CH', name: 'Switzerland' },
    { code: '+43', country: 'AT', name: 'Austria' },
    { code: '+45', country: 'DK', name: 'Denmark' },
    { code: '+46', country: 'SE', name: 'Sweden' },
    { code: '+47', country: 'NO', name: 'Norway' },
    { code: '+358', country: 'FI', name: 'Finland' },
    { code: '+48', country: 'PL', name: 'Poland' },
    { code: '+420', country: 'CZ', name: 'Czech Republic' },
    { code: '+421', country: 'SK', name: 'Slovakia' },
    { code: '+36', country: 'HU', name: 'Hungary' },
    { code: '+40', country: 'RO', name: 'Romania' },
    { code: '+359', country: 'BG', name: 'Bulgaria' },
    { code: '+385', country: 'HR', name: 'Croatia' },
    { code: '+386', country: 'SI', name: 'Slovenia' },
    { code: '+30', country: 'GR', name: 'Greece' },
    { code: '+351', country: 'PT', name: 'Portugal' },
    { code: '+353', country: 'IE', name: 'Ireland' }
  ];

  const ritualOptions = t('rituals', { returnObjects: true });

  const handleSectionToggle = (section: 'ritual' | 'custom') => {
    if (activeSection === section) {
      setActiveSection('none');
    } else {
      setActiveSection(section);
      setShowSuccess(false); // Reset success state when switching sections
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (type: 'ritual' | 'custom', e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the full label for the selected ritual
      const getSelectedRitualLabel = () => {
        if (type === 'ritual' && selectedRitual) {
          const selectedOption = ritualOptions.find(option => option.value === selectedRitual);
          return selectedOption ? selectedOption.label : selectedRitual;
        }
        return '';
      };

      // Prepare data for both database and webhook
      const submissionPayload = {
        vards_uzvards: formData.name,
        epasts: formData.email,
        talrunis: `${formData.countryCode} ${formData.phone}`,
        ritual_type: type === 'ritual' ? getSelectedRitualLabel() : `Custom Value: ${customValue}€`,
        specific_ritual_type: type === 'ritual' ? getSelectedRitualLabel() : '',
        custom_price_value: type === 'custom' ? `${customValue}€` : '',
        created_at: new Date().toISOString()
      };

      const submissionData = {
        vards_uzvards: submissionPayload.vards_uzvards,
        epasts: submissionPayload.epasts,
        talrunis: submissionPayload.talrunis,
        ritual_type: submissionPayload.ritual_type,
        specific_ritual_type: submissionPayload.specific_ritual_type,
        custom_price_value: submissionPayload.custom_price_value,
        created_at: submissionPayload.created_at
      };

      const { error } = await supabase
        .from('davanu_kartes_pasutijumi')
        .insert([submissionData]);

      if (error) {
        console.error('Error submitting form:', error);
        alert('Radās kļūda. Lūdzu mēģiniet vēlreiz.');
      } else {
        // Send webhook to Make.com
        try {
          await fetch('https://hook.eu2.make.com/unq7hlav49pj5tw8q8r4kqj6p98tsrw0', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vards_uzvards: submissionPayload.vards_uzvards,
              epasts: submissionPayload.epasts,
              talrunis: submissionPayload.talrunis,
              ritual_type: submissionPayload.ritual_type,
              specific_ritual_type: submissionPayload.specific_ritual_type,
              custom_price_value: submissionPayload.custom_price_value,
              form_type: type,
              created_at: submissionPayload.created_at
            })
          });
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          // Don't show error to user as the main submission was successful
        }

        setShowSuccess(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          countryCode: '+371'
        });
        setSelectedRitual('');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Radās kļūda. Lūdzu mēģiniet vēlreiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section ref={sectionRef} className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white mb-6 sm:mb-8 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 sm:mb-16">
            {/* Left Block - Pirts Rituāls Gift Card */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '200ms' }}>
              <div className="bg-gradient-to-br from-[#132d13] to-[#1a3d2e] rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-500 hover:scale-[1.02] group">
                {/* Image Section */}
                <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                  <img
                    src="https://wigoyeorqnssgbrgexku.supabase.co/storage/v1/object/public/websiteassets/bildes/31.png"
                    alt="Pirts Rituāls Dāvanu Karte"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                  
                  {/* Floating Gift Icon */}
                  <div className="absolute top-6 right-6">
                    <div className="w-12 h-12 bg-amber-600/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
                    {t('ritualCard.title')}
                  </h2>
                  
                  <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed mb-6 sm:mb-8">
                    {t('ritualCard.description')}
                  </p>

                  <button 
                    onClick={() => handleSectionToggle('ritual')}
                    className={`w-full py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 min-h-[48px] ${
                      activeSection === 'ritual'
                        ? 'bg-amber-700 text-white shadow-lg shadow-amber-500/25'
                        : 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg hover:shadow-amber-500/25'
                    }`}
                  >
                    {t('ritualCard.cta')}
                    {activeSection === 'ritual' ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Block - Custom Value Gift Card */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            }`} style={{ transitionDelay: '400ms' }}>
              <div className="bg-gradient-to-br from-[#132d13] to-[#1a3d2e] rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-500 hover:scale-[1.02] group">
                {/* Gift Card Visual */}
                <div className="relative h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), 
                                       radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)`
                    }}></div>
                  </div>
                  
                  {/* Gift Card Content */}
                  <div className="relative z-10 text-center">
                    <Gift className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">DĀVANU KARTE</h3>
                    <p className="text-amber-100 text-base sm:text-lg">80€ – 380€</p>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
                    {t('valueCard.title')}
                  </h2>
                  
                  <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed mb-6 sm:mb-8">
                    {t('valueCard.description')}
                  </p>

                  <button 
                    onClick={() => handleSectionToggle('custom')}
                    className={`w-full py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 min-h-[48px] ${
                      activeSection === 'custom'
                        ? 'bg-amber-700 text-white shadow-lg shadow-amber-500/25'
                        : 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg hover:shadow-amber-500/25'
                    }`}
                  >
                    {t('valueCard.cta')}
                    {activeSection === 'custom' ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Revealed Form Sections */}
        <section 
          ref={formRef}
          className={`transition-all duration-700 ease-in-out ${
            activeSection !== 'none' 
              ? 'max-h-screen opacity-100 py-8 sm:py-12' 
              : 'max-h-0 opacity-0 py-0 overflow-hidden'
          }`}
        >
          <div className="px-4 sm:px-6 max-w-4xl mx-auto">
            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-600 rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 text-center transform transition-all duration-700 translate-y-0 opacity-100">
                <div className="flex items-center justify-center mb-4">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">{t('form.success')}</h3>
                <p className="text-base sm:text-lg text-white">
                  {t('form.successMessage')}
                </p>
              </div>
            )}

            {/* Pirts Rituāls Form */}
            {activeSection === 'ritual' && !showSuccess && (
              <div className={`bg-[#132d13] rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl shadow-green-500/10 transform transition-all duration-700 ${
                activeSection === 'ritual' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}>
                <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">
                  {t('form.ritualTitle')}
                </h2>

                <form onSubmit={(e) => handleSubmit('ritual', e)} className="space-y-4 sm:space-y-6">
                  {/* Ritual Selection */}
                  <div>
                    <label className="block text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                      {t('form.selectRitual')}
                    </label>
                    <select
  value={selectedRitual}
  onChange={(e) => setSelectedRitual(e.target.value)}
  required
  className="w-full px-2 sm:px-3 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 min-h-[48px] country-select-dropdown text-sm sm:text-base"
>
                      <option value="">{t('form.selectRitualPlaceholder')}</option>
                      {ritualOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                        {t('form.name')}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder={t('form.namePlaceholder')}
                        required
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                        {t('form.email')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder={t('form.emailPlaceholder')}
                        required
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                      />
                    </div>
                  </div>

                  {/* Phone Number with Country Code */}
                  <div>
                    <label className="block text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                      {t('form.phone')}
                    </label>
                    <div className="flex gap-2 sm:gap-3">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                        className="px-2 sm:px-3 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 min-w-[100px] sm:min-w-[120px] country-select-dropdown text-sm sm:text-base min-h-[48px]"
                      >
                        {europeanCountries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.code} ({country.country})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder={t('form.phonePlaceholder')}
                        required
                        className="flex-1 px-3 sm:px-4 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                      />
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <div className="text-center pt-4 sm:pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:cursor-not-allowed text-white px-8 sm:px-12 py-4 rounded-xl text-base sm:text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25 min-h-[48px]"
                    >
                      {isSubmitting ? t('form.submitting') : t('form.submit')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Custom Value Form */}
            {activeSection === 'custom' && !showSuccess && (
              <div className={`bg-[#132d13] rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl shadow-green-500/10 transform transition-all duration-700 ${
                activeSection === 'custom' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}>
                <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">
                  {t('form.valueTitle')}
                </h2>

                <form onSubmit={(e) => handleSubmit('custom', e)} className="space-y-4 sm:space-y-6">
                  {/* Value Range Selector */}
                  <div>
                    <label className="block text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">
                      {t('form.valueLabel')} <span className="text-green-400 text-xl sm:text-2xl font-bold">{customValue}€</span>
                    </label>
                    
                    <div className="relative">
                      <input
                        type="range"
                        min="80"
                        max="380"
                        step="10"
                        value={customValue}
                        onChange={(e) => setCustomValue(Number(e.target.value))}
                        className="w-full h-2 sm:h-3 bg-black/30 rounded-lg appearance-none cursor-pointer slider"
                      />
                      
                      {/* Range Labels */}
                      <div className="flex justify-between text-gray-400 text-xs sm:text-sm mt-2">
                        <span>80€</span>
                        <span>380€</span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                        {t('form.name')}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder={t('form.namePlaceholder')}
                        required
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                        {t('form.email')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder={t('form.emailPlaceholder')}
                        required
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                      />
                    </div>
                  </div>

                  {/* Phone Number with Country Code */}
                  <div>
                    <label className="block text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                      {t('form.phone')}
                    </label>
                    <div className="flex gap-2 sm:gap-3">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                        className="px-2 sm:px-3 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 min-w-[100px] sm:min-w-[120px] country-select-dropdown text-sm sm:text-base min-h-[48px]"
                      >
                        {europeanCountries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.code} ({country.country})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder={t('form.phonePlaceholder')}
                        required
                        className="flex-1 px-3 sm:px-4 py-3 sm:py-4 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                      />
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <div className="text-center pt-4 sm:pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:cursor-not-allowed text-white px-8 sm:px-12 py-4 rounded-xl text-base sm:text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25 min-h-[48px]"
                    >
                      {isSubmitting ? t('form.submitting') : t('form.submit')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>

      <FooterSection />

      {/* Custom Slider Styles */}
      <style jsx>{`
        .country-select-dropdown {
          max-height: 150px;
          overflow-y: auto;
          font-size: 12px;
          padding: 6px 8px;
          scroll-behavior: smooth;
        }
        
        @media (min-width: 640px) {
          .country-select-dropdown {
            max-height: 200px;
            font-size: 14px;
            padding: 8px 12px;
          }
        }
        
        .country-select-dropdown::-webkit-scrollbar {
          width: 4px;
        }
        
        @media (min-width: 640px) {
          .country-select-dropdown::-webkit-scrollbar {
            width: 6px;
          }
        }
        
        .country-select-dropdown::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }
        
        .country-select-dropdown::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.6);
          border-radius: 3px;
        }
        
        .country-select-dropdown::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.8);
        }
        
        .country-select-dropdown option {
          background-color: #1a1a1a;
          color: white;
          padding: 3px 6px;
          font-size: 12px;
        }
        
        @media (min-width: 640px) {
          .country-select-dropdown option {
            padding: 4px 8px;
            font-size: 14px;
          }
        }
        
        .country-select-dropdown option:hover {
  background-color: #2a2a2a;
}

        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
          transition: all 0.3s ease;
        }
        
        @media (min-width: 640px) {
          .slider::-webkit-slider-thumb {
            height: 24px;
            width: 24px;
          }
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
        }
        
        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 6px;
          background: linear-gradient(to right, #22c55e 0%, #22c55e var(--value), rgba(255,255,255,0.1) var(--value), rgba(255,255,255,0.1) 100%);
        }
        
        @media (min-width: 640px) {
          .slider::-webkit-slider-track {
            height: 12px;
          }
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #22c55e;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
        }
        
        @media (min-width: 640px) {
          .slider::-moz-range-thumb {
            height: 24px;
            width: 24px;
          }
        }
        
        .slider::-moz-range-track {
          height: 8px;
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
        }
        
        @media (min-width: 640px) {
          .slider::-moz-range-track {
            height: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default DavanuKartesPage;