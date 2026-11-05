import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeaderSection from '../components/HeaderSection';
import FooterSection from '../components/FooterSection';
import { useSearchParams } from 'react-router-dom';
import LeafBackdrop from '../components/leaves/LeafBackdrop';
import GiftCardVisual from '../components/giftcards/GiftCardVisual';
import ZalktisScene, { HERO_AFTER } from '../components/zalktis/ZalktisScene';
import { ChevronDown, ChevronUp, Check, Eye, Gift, Mail, Phone, User } from 'lucide-react';
import { Accent, ChoicePicker, Field, FormTitle, Step, goldFieldClass, goldSubmitClass, splitOption } from '../components/popup/bookingUi';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import priceCatalog from '../data/priceCatalog.json';
import PaymentChoice from '../components/popup/PaymentChoice';
import CompanyChoice from '../components/popup/CompanyChoice';
import { useContactCheck, ContactCheckNotice } from '../components/popup/ContactCheck';
import { companyForBooking, type CompanyEntry } from '../components/popup/companyEntry';
import { goToCardPayment, useCardPayments } from '../lib/cardPayments';
import GiftCardPreview from '../components/giftcards/GiftCardPreview';
import { preloadGiftCard } from '../components/giftcards/giftCardAssets';
import { trackGiftCardOrdered, trackGiftCardStart } from '../lib/analytics';
import { newEventId, recordSignals } from '../lib/attribution';
import { asLanguage } from '../utils/locale';

// A photograph for each ritual in the order form's dropdown, as the booking
// form shows them (public/media/booking).
const RITUAL_PHOTOS: Record<string, string> = {
  'individuali-ar': '/media/booking/solo-tub.webp',
  'individuali-bez': '/media/booking/solo.webp',
  'diviem-ar': '/media/booking/two-tub.webp',
  'diviem-bez': '/media/booking/two.webp',
  gimenei: '/media/booking/family.webp',
};

// The cards and the order forms on glass.
const GLASS_CARD =
  'group relative h-full overflow-hidden rounded-[2rem] bg-white/[0.05] ring-1 ring-white/[0.12] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_30px_70px_-30px_rgba(0,0,0,0.9)] transition-[opacity,box-shadow] duration-700 hover:ring-white/20';
const GLASS_FORM =
  'relative overflow-hidden rounded-[2rem] bg-white/[0.045] ring-1 ring-amber-300/20 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_40px_90px_-40px_rgba(0,0,0,0.95),0_0_80px_-40px_rgba(217,119,6,0.5)]';

// On wide screens the two cards rise further into the hero than its own
// overlap takes them (HERO_AFTER: its 240 px tail and 110 px more), so their
// tops are in view on arrival: a third of the window more.
const CARDS_UP = 'lg:!mt-[calc(-350px_-_33svh)]';

const DavanuKartesPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<'none' | 'ritual' | 'custom'>('none');
  const [customValue, setCustomValue] = useState(150);
  const [selectedRitual, setSelectedRitual] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Which card the buyer is looking at in the preview, if any.
  const [preview, setPreview] = useState<'ritual' | 'custom' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+371'
  });
  const sectionRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation('giftcards');
  const locale = asLanguage(i18n.language);
  // Paid by card, the gift card comes straight back as a PDF; by transfer, it
  // is sent once the invoice is paid. Card is the default while it is offered.
  const cardPayments = useCardPayments();
  const [chosenPayment, setChosenPayment] = useState<'card' | 'transfer' | null>(null);
  // The company the invoice is made out to, if not the buyer.
  const [company, setCompany] = useState<CompanyEntry | null>(null);
  // A mistyped email or phone, caught before the order is saved.
  const contact = useContactCheck(formData.email, formData.phone);
  const paymentMethod = chosenPayment ?? (cardPayments ? 'card' : 'transfer');

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

  // Arriving from a gift card elsewhere on the site (GiftCardVisual): its
  // order form open, ?forma=ritual or ?forma=custom.
  const [searchParams] = useSearchParams();
  const asked = searchParams.get('forma');
  useEffect(() => {
    if (asked !== 'ritual' && asked !== 'custom') return;
    setActiveSection(asked);
    setShowSuccess(false);
    trackGiftCardStart(asked);
  }, [asked]);

  // Smooth scroll to form when section changes
  useEffect(() => {
    if (activeSection !== 'none' && formRef.current) {
      // The form grows as it opens (and the hero settles on arrival), moving
      // the target: aimed once now and again when it is open.
      const go = () => {
        const form = formRef.current;
        if (form) window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
      };
      const timers = [window.setTimeout(go, 300), window.setTimeout(go, 1100)];
      return () => timers.forEach((id) => window.clearTimeout(id));
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

  // The labels come from the price list, which is what the invoice is priced
  // from, so the figure a guest picks is the figure they are billed.
  const ritualOptions = priceCatalog.giftCard.rituals.map(ritual => ({
    value: ritual.value,
    label: ritual.label[locale]
  }));
  const { min: customMin, max: customMax, step: customStep } = priceCatalog.giftCard.custom;

  const closePreview = useCallback(() => setPreview(null), []);
  const previewRitual = priceCatalog.giftCard.rituals.find((ritual) => ritual.value === selectedRitual)
    ?? priceCatalog.giftCard.rituals.find((ritual) => ritual.value === 'diviem-ar')
    ?? priceCatalog.giftCard.rituals[0];
  // An open form is likely to be previewed: fetch its card's fonts and photos.
  useEffect(() => {
    if (activeSection === 'custom') preloadGiftCard('value');
    if (activeSection === 'ritual') preloadGiftCard('ritual');
  }, [activeSection]);
  const previewButtonClass =
    'mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/60 bg-black/30 hover:bg-amber-600/20 px-4 py-2.5 text-amber-200 font-semibold transition-colors min-h-[44px]';

  const handleSectionToggle = (section: 'ritual' | 'custom') => {
    if (activeSection === section) {
      setActiveSection('none');
    } else {
      setActiveSection(section);
      setShowSuccess(false); // Reset success state when switching sections
      trackGiftCardStart(section);
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
      if (!(await contact.confirmBeforeSubmit())) return;
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

      // The id is made here, as the public cannot read orders back; it is the
      // order's reference for the card payment.
      const id = crypto.randomUUID();
      const submissionData = {
        id,
        vards_uzvards: submissionPayload.vards_uzvards,
        epasts: submissionPayload.epasts,
        talrunis: submissionPayload.talrunis,
        ritual_type: submissionPayload.ritual_type,
        specific_ritual_type: submissionPayload.specific_ritual_type,
        custom_price_value: submissionPayload.custom_price_value,
        payment_method: paymentMethod,
        locale,
        company: companyForBooking(company),
      };

      const { error } = await supabase
        .from('davanu_kartes_pasutijumi')
        .insert([submissionData]);

      if (error) {
        console.error('Error submitting form:', error);
        alert('Radās kļūda. Lūdzu mēģiniet vēlreiz.');
      } else {
        // Counted as soon as the order is saved, whatever happens after.
        const leadEventId = newEventId();
        trackGiftCardOrdered(submissionData, leadEventId);
        await recordSignals('gift_card', id, leadEventId);

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
              created_at: submissionPayload.created_at,
              // Lets Make answer in the language the order was placed in.
              locale,
              payment_method: paymentMethod,
            })
          });
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          // Don't show error to user as the main submission was successful
        }

        // On to Stripe's page; if it cannot be opened, the order is paid by
        // bank transfer instead and its invoice is emailed.
        if (paymentMethod === 'card') await goToCardPayment('gift_card', id);
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

  // The rituals as the booking form shows them: a photo, the name, the price;
  // in the price list's order, as the dropdown had them.
  // The price list spells the tub "kubulu"; shown as "kublu". Only the words
  // on screen change: the order still records the price list's label, which
  // the invoice function finds the ritual by.
  const ritualPickerOptions = ritualOptions.map((option) => {
    const { name, price } = splitOption(option.label);
    return { value: option.value, title: name.replace(/([Kk])ubulu/g, '$1ublu'), price, image: RITUAL_PHOTOS[option.value] };
  });

  // Who is buying, as both order forms ask it: the booking form's fields.
  const phoneSelect = goldFieldClass.replace('w-full', 'w-auto').replace('pl-11', 'pl-3').replace('pr-4', 'pr-2');
  const contactStep = (
    <Step n={2} title={({ lv: 'Jūsu kontaktinformācija', en: 'Your contact details', ru: 'Ваши контактные данные' })[locale]}>
      <div className="grid gap-3">
        <Field icon={User}>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('form.name')}
            autoComplete="name"
            required
            className={goldFieldClass}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={Mail}>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={contact.onEmailBlur}
              placeholder={t('form.email')}
              autoComplete="email"
              required
              className={goldFieldClass}
            />
          </Field>
          <div className="flex gap-2">
            <select
              value={formData.countryCode}
              onChange={(e) => handleInputChange('countryCode', e.target.value)}
              aria-label={t('form.phone')}
              className={`${phoneSelect} shrink-0 country-select-dropdown`}
            >
              {europeanCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.code} ({country.country})
                </option>
              ))}
            </select>
            <div className="min-w-0 flex-1">
              <Field icon={Phone}>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('form.phone')}
                  autoComplete="tel-national"
                  required
                  className={goldFieldClass}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <ContactCheckNotice notice={contact.notice} onUse={(email) => handleInputChange('email', email)} />

      <CompanyChoice value={company} onChange={setCompany} />

      {cardPayments && (
        <PaymentChoice
          card
          cash={false}
          value={paymentMethod}
          onChange={(method) => setChosenPayment(method === 'card' ? 'card' : 'transfer')}
        />
      )}
    </Step>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <HeaderSection />
      
      <main>
        {/* The zalktis as the hero, the heading in its glass; the two cards
            rise out of its darkening lower edge, as the booking page's
            choices do. */}
        <ZalktisScene hero edge="#0a0a0a" headingId="giftcards-page-heading" title={t('title')} text={t('description')} />
        {/* The site's drifting leaves, behind the whole page; transparent, so
            the hero shows through. */}
        <LeafBackdrop className={`!bg-transparent ${HERO_AFTER} ${CARDS_UP}`}>
        <section ref={sectionRef} className="pb-12 sm:pb-16 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-2">
            {/* Left Block - Pirts Rituāls Gift Card */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0' : '-translate-x-12'
            }`} style={{ transitionDelay: '200ms' }}>
              <div className={`${GLASS_CARD} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                {/* The card itself; pressing it opens its order form. */}
                <div className="p-4 sm:p-6 pb-0 sm:pb-0">
                  <GiftCardVisual kind="ritual" onClick={() => handleSectionToggle('ritual')} />
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
                    {t('ritualCard.title')}
                  </h2>
                  
                  <p className="text-sm sm:text-base lg:text-lg text-white/70 leading-relaxed mb-6 sm:mb-8">
                    {t('ritualCard.description')}
                  </p>

                  <button 
                    onClick={() => handleSectionToggle('ritual')}
                    className={`w-full py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 min-h-[48px] ${
                      activeSection === 'ritual'
                        ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-white shadow-[0_14px_34px_-12px_rgba(217,119,6,0.9),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-amber-300/60'
                        : 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_14px_34px_-14px_rgba(217,119,6,0.8),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110'
                    }`}
                  >
                    {t('ritualCard.cta')}
                    {activeSection === 'ritual' ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  {/* The cards can be seen before ordering: a sample. */}
                  <button
                    type="button"
                    onClick={() => { preloadGiftCard('ritual'); setPreview('ritual'); }}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] ring-1 ring-amber-300/40 backdrop-blur-md hover:bg-amber-500/15 hover:ring-amber-300/70 px-4 py-3 text-amber-100 font-semibold transition-colors min-h-[48px]"
                  >
                    <Eye className="w-5 h-5" />
                    {t('preview.open')}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Block - Custom Value Gift Card */}
            <div className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0' : 'translate-x-12'
            }`} style={{ transitionDelay: '400ms' }}>
              <div className={`${GLASS_CARD} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                {/* The card itself; pressing it opens its order form. */}
                <div className="p-4 sm:p-6 pb-0 sm:pb-0">
                  <GiftCardVisual kind="value" onClick={() => handleSectionToggle('custom')} />
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
                    {t('valueCard.title')}
                  </h2>
                  
                  <p className="text-sm sm:text-base lg:text-lg text-white/70 leading-relaxed mb-6 sm:mb-8">
                    {t('valueCard.description')}
                  </p>

                  <button 
                    onClick={() => handleSectionToggle('custom')}
                    className={`w-full py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 min-h-[48px] ${
                      activeSection === 'custom'
                        ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-white shadow-[0_14px_34px_-12px_rgba(217,119,6,0.9),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-amber-300/60'
                        : 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_14px_34px_-14px_rgba(217,119,6,0.8),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110'
                    }`}
                  >
                    {t('valueCard.cta')}
                    {activeSection === 'custom' ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  {/* The cards can be seen before ordering: a sample. */}
                  <button
                    type="button"
                    onClick={() => { preloadGiftCard('value'); setPreview('custom'); }}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] ring-1 ring-amber-300/40 backdrop-blur-md hover:bg-amber-500/15 hover:ring-amber-300/70 px-4 py-3 text-amber-100 font-semibold transition-colors min-h-[48px]"
                  >
                    <Eye className="w-5 h-5" />
                    {t('preview.open')}
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
              ? 'max-h-[2400px] opacity-100 py-8 sm:py-12' 
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

            {/* The order forms in the booking form's look, in the page's gold. */}
            <Accent.Provider value="gold">
            {/* Pirts Rituāls Form: the booking form's look (bookingUi), the
                ritual chosen from the same photo dropdown. */}
            {activeSection === 'ritual' && !showSuccess && (
              <div className={`${GLASS_FORM} p-5 sm:p-8 lg:p-10`}>
                <form onSubmit={(e) => handleSubmit('ritual', e)} className="space-y-8">
                  <FormTitle icon={Gift}>{t('form.ritualTitle')}</FormTitle>

                  <Step n={1} title={t('form.selectRitual')}>
                    <ChoicePicker
                      name="giftRitual"
                      label={t('form.selectRitual')}
                      placeholder={t('form.selectRitualPlaceholder')}
                      value={selectedRitual}
                      onChange={setSelectedRitual}
                      required
                      options={ritualPickerOptions}
                    />
                    {selectedRitual && (
                      <button type="button" onClick={() => setPreview('ritual')} className={previewButtonClass}>
                        <Eye className="w-5 h-5" />
                        {t('preview.open')}
                      </button>
                    )}
                  </Step>

                  {contactStep}

                  <button type="submit" disabled={isSubmitting} className={goldSubmitClass}>
                    <span className="relative">{isSubmitting ? t('form.submitting') : t('form.submit')}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Custom Value Form */}
            {activeSection === 'custom' && !showSuccess && (
              <div className={`${GLASS_FORM} p-5 sm:p-8 lg:p-10`}>
                <form onSubmit={(e) => handleSubmit('custom', e)} className="space-y-8">
                  <FormTitle icon={Gift}>{t('form.valueTitle')}</FormTitle>

                  <Step n={1} title={t('form.valueLabel').replace(/:\s*$/, '')}>
                    <div className="rounded-2xl bg-white/[0.04] p-4 sm:p-5 ring-1 ring-white/[0.12]">
                      <p className="text-center text-4xl sm:text-5xl font-extrabold tabular-nums text-green-400">{customValue}€</p>
                      <input
                        type="range"
                        min={customMin}
                        max={customMax}
                        step={customStep}
                        value={customValue}
                        onChange={(e) => setCustomValue(Number(e.target.value))}
                        aria-label={t('form.valueLabel')}
                        className="mt-4 w-full h-2 sm:h-3 bg-black/30 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-white/50 text-xs sm:text-sm mt-2">
                        <span>{customMin}€</span>
                        <span>{customMax}€</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setPreview('custom')} className={previewButtonClass}>
                      <Eye className="w-5 h-5" />
                      {t('preview.open')}
                    </button>
                  </Step>

                  {contactStep}

                  <button type="submit" disabled={isSubmitting} className={goldSubmitClass}>
                    <span className="relative">{isSubmitting ? t('form.submitting') : t('form.submit')}</span>
                  </button>
                </form>
              </div>
            )}
            </Accent.Provider>
          </div>
        </section>
        </LeafBackdrop>
      </main>

      <FooterSection />

      {preview === 'custom' && <GiftCardPreview value={customValue} onClose={closePreview} />}
      {preview === 'ritual' && (
        <GiftCardPreview
          // The chosen ritual, or before one is chosen a sample of the first.
          ritual={previewRitual.card}
          value={previewRitual.price}
          onClose={closePreview}
        />
      )}

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