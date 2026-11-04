import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MessageSquare, Home, Plus, Minus, Clock } from 'lucide-react';
import { ChoicePicker, Field, FormTitle, Notice, OptionCard, Step, SubLabel, fieldClass, splitOption, submitClass } from './bookingUi';
import { supabase } from '../../lib/supabase';
import { sameSlot } from './timeSlots';
import { useTranslation } from 'react-i18next';
import priceCatalog from '../../data/priceCatalog.json';
import BookingConfirmation, { type ConfirmedBooking } from './BookingConfirmation';
import TransportChoice from './TransportChoice';
import PaymentChoice, { type PaymentMethod } from './PaymentChoice';
import GiftCardChoice from './GiftCardChoice';
import { emptyGiftCard, type GiftCardEntry } from './giftCardEntry';
import CompanyChoice from './CompanyChoice';
import { useContactCheck, ContactCheckNotice } from './ContactCheck';
import { companyForBooking, type CompanyEntry } from './companyEntry';
import { goToCardPayment, paymentLabel, useCardPayments } from '../../lib/cardPayments';
import { scrollIntoPopup } from './scrollIntoPopup';
import { cancelUrl } from './cancelUrl';
import { trackBookingSaved } from '../../lib/analytics';
import { asLanguage } from '../../utils/locale';

const allSaunaTypes = ['Baltā pirts', 'Pelēkā pirts'];

// Labels come from the shared price list, the same one the invoice function
// prices bookings from. They are stored verbatim and sent to Make, so they must
// not be reworded here without updating the list.
const rentalOptions = priceCatalog.rental.map((r) => r.label);
const baseExtraOptions = priceCatalog.extras.filter((e) => !e.overnight).map((e) => e.label);
const overnightOption = priceCatalog.extras.find((e) => e.overnight)!.label;

// Photographs for the cards (public/media/booking): each sauna, and a rental
// with the herbal tub or without it (by the price list's own wording); the
// tub for two shows the two of them in it.
const SAUNA_PHOTOS: Record<string, string> = {
  'Baltā pirts': '/media/booking/balta.webp',
  'Pelēkā pirts': '/media/booking/peleka.webp',
};
const rentalPhoto = (index: number) => {
  const lv = priceCatalog.rental[index]?.lv ?? '';
  if (/bez kubla/i.test(lv)) return '/media/booking/sauna.webp';
  return /diviem/i.test(lv) ? '/media/booking/two-tub.webp' : '/media/booking/tub.webp';
};

// "4h – 150€ (Pirts & Kubls diviem)" as its parts, for a card; the price may
// have a space in it ("150 €" in Russian).
const splitRental = (text: string) => {
  const m = text.match(/^(.+?)\s+[–-]\s+([^(]+?)\s*\((.*)\)\s*$/);
  if (m) return { duration: m[1], price: m[2], what: m[3] };
  const { name, price } = splitOption(text);
  return { duration: '', price, what: name };
};

interface FormNomaProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onClose: () => void;
  // What was already chosen where the booking was opened: a sauna ('Baltā
  // pirts') or a rental (a price list label), picked in the form to start with.
  initialChoice?: string;
}

const FormNoma: React.FC<FormNomaProps> = ({ selectedDate, selectedTime, onClose, initialChoice }) => {
  const { t, i18n } = useTranslation('forms');
  // A message in the visitor's language.
  const say = (lv: string, en: string, ru: string) => ({ lv, en, ru })[asLanguage(i18n.language)];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    saunaType: initialChoice && allSaunaTypes.includes(initialChoice) ? initialChoice : '',
    rentalType: initialChoice && rentalOptions.includes(initialChoice) ? initialChoice : '',
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
  // A gift card given with the booking: its remainder, if any, is invoiced.
  const [giftCard, setGiftCard] = useState<GiftCardEntry>(emptyGiftCard);
  // The company the invoice is made out to, if not the guest.
  const [company, setCompany] = useState<CompanyEntry | null>(null);
  // A mistyped email or phone, caught before the booking is saved.
  const contact = useContactCheck(formData.email, formData.phone);
  const withGiftCard = !!giftCard.code.trim();
  const paymentMethod: PaymentMethod = withGiftCard ? 'transfer' : formData.paymentMethod;
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

      // The day's bookings in the same part of the day: the evening slots,
      // and a time the office booked off the list, share the saunas.
      const { data: day, error } = await supabase
        .from('reservations')
        .select('sauna_type, reservation_time')
        .eq('reservation_date', formattedDate);
      const data = day?.filter((r) => sameSlot(r.reservation_time, selectedTime));

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
      // A sauna chosen earlier that is taken at this time is let go.
      setFormData(prev => (prev.saunaType && !filtered.includes(prev.saunaType) ? { ...prev, saunaType: '' } : prev));
    };

    fetchAvailability();
  }, [selectedDate, selectedTime]);

  // Another option picked on the page while the form is open: choose it here.
  useEffect(() => {
    if (!initialChoice) return;
    if (allSaunaTypes.includes(initialChoice)) setFormData(prev => ({ ...prev, saunaType: initialChoice }));
    if (rentalOptions.includes(initialChoice)) setFormData(prev => ({ ...prev, rentalType: initialChoice }));
  }, [initialChoice]);

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

  // The overnight stay is only offered from the evening slots.
  const cleanedExtras = formData.extras.filter(extra =>
    extra !== overnightOption || (selectedTime === '17:00' || selectedTime === '18:00')
  );


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setSubmitError(say('Lūdzu izvēlieties datumu un laiku!', 'Please choose a date and time.', 'Пожалуйста, выберите дату и время.'));
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!(await contact.confirmBeforeSubmit())) return;

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
        locale: asLanguage(i18n.language),
        rental_message: formData.message || '',
        transport: formData.transport || null,
        payment_method: paymentMethod,
        gift_card_code: withGiftCard ? giftCard.code.trim() : null,
        gift_card_pin: withGiftCard ? giftCard.pin.trim() : null,
        company: companyForBooking(company),
      };

      const { error } = await supabase.from('reservations').insert([reservationData]);
      // The database allows one booking per sauna and time, so a second guest
      // who picked the same slot a moment later is told so plainly.
      if (error?.code === '23505') {
        setSubmitError(t('confirmation.slot_taken'));
        return;
      }
      if (error) throw new Error(`Supabase error: ${error.message}`);

      // Counted as soon as the booking is saved, whatever happens after.
      trackBookingSaved(reservationData);

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
            gift_card_pin: undefined,
            gift_card: withGiftCard ? giftCard.code.trim() : '',
            cancel_url: cancelUrl(id),
            payment_label: paymentLabel(paymentMethod),
          })
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      // Paying by card: on to Stripe's page. If that cannot be opened, the
      // booking stands and is paid by bank transfer instead.
      if (paymentMethod === 'card') {
        await goToCardPayment('reservation', id);
        setConfirmed({ ...reservationData, payment_method: 'transfer' });
        return;
      }
      setConfirmed(reservationData);

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error instanceof Error ? error.message : say('Radās kļūda. Lūdzu mēģiniet vēlreiz.', 'Something went wrong. Please try again.', 'Произошла ошибка. Пожалуйста, попробуйте ещё раз.'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (confirmed) {
    return <BookingConfirmation booking={confirmed} onClose={onClose} />;
  }

  const extraOptions = [...baseExtraOptions, ...(selectedTime === '17:00' || selectedTime === '18:00' ? [overnightOption] : [])];

  return (
    <div className="space-y-7">
      <FormTitle icon={Home}>{t('noma.title')}</FormTitle>

      {submitError && (
        <Notice tone="error" innerRef={errorRef}>{submitError}</Notice>
      )}

      {(!selectedDate || !selectedTime) && (
        <Notice tone="warn">{t('noma.date_warning')}</Notice>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* As in the earlier form: who is booking first, then what. */}
        <Step n={1} title={t('noma.personal_info')}>
          <div className="grid gap-3">
            <Field icon={User}>
              <input
                type="text"
                placeholder={t('noma.name_placeholder')}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                autoComplete="name"
                required
                className={fieldClass}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field icon={Mail}>
                <input
                  type="email"
                  placeholder={t('noma.email_placeholder')}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={contact.onEmailBlur}
                  autoComplete="email"
                  required
                  className={fieldClass}
                />
              </Field>
              <Field icon={Phone}>
                <input
                  type="tel"
                  placeholder={t('noma.phone_placeholder')}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  autoComplete="tel"
                  className={fieldClass}
                />
              </Field>
            </div>
          </div>

          <ContactCheckNotice notice={contact.notice} onUse={(email) => handleInputChange('email', email)} />

          <CompanyChoice value={company} onChange={setCompany} />
        </Step>

        {/* Booking Details: the sauna, the rental, the extras. */}
        <Step n={2} title={t('noma.details')}>
          {/* Sauna Selection: only the saunas still free at the chosen time. */}
          <div>
            <SubLabel icon={Home}>{t('noma.select_sauna_label')}</SubLabel>
            {availableSaunas.length > 0 ? (
              <div role="radiogroup" aria-label={t('noma.select_sauna_label')} className="grid gap-2 sm:grid-cols-2">
                {availableSaunas.map((type) => (
                  <OptionCard
                    key={type}
                    name="saunaType"
                    checked={formData.saunaType === type}
                    onChange={() => handleInputChange('saunaType', type)}
                    required
                    title={type === 'Baltā pirts' ? t('noma.saunas.baltā') : t('noma.saunas.pelēkā')}
                    image={SAUNA_PHOTOS[type]}
                  />
                ))}
              </div>
            ) : (
              <>
                <Notice tone="warn">{t('noma.no_saunas_available')}</Notice>
                {/* As with the dropdown it replaces: no sauna, no booking. */}
                <input aria-hidden tabIndex={-1} required value="" onChange={() => {}} className="pointer-events-none absolute h-px w-px opacity-0" />
              </>
            )}
          </div>

          {/* Rental Type: the price list's order, as a dropdown. */}
          <div>
            <SubLabel icon={Clock}>{t('noma.select_type_label')}</SubLabel>
            <ChoicePicker
              name="rentalType"
              label={t('noma.select_type_label')}
              placeholder={t('noma.select_type_placeholder')}
              value={formData.rentalType}
              onChange={(option) => handleInputChange('rentalType', option)}
              required
              options={rentalOptions.map((option, index) => {
                const { duration, price, what } = splitRental(t(`noma.rentalOptions.option${index + 1}`));
                return { value: option, title: what, meta: duration, price, image: rentalPhoto(index) };
              })}
            />
          </div>

          {/* Extras */}
          <div>
            <SubLabel icon={Plus}>{t('noma.addons')}</SubLabel>
            <div className="space-y-2">
              {extraOptions.map(option => {
                const checked = formData.extras.includes(option);
                const isOvernight = option === overnightOption;
                const { name, price } = splitOption(
                  option === baseExtraOptions[0] ? t('noma.extras.whisks') :
                  option === baseExtraOptions[1] ? t('noma.extras.scrubs') :
                  isOvernight ? t('noma.extras.overnight') :
                  option
                );
                const quantity = extraQuantities[option] ?? 1;
                return (
                  <div key={option}>
                    <OptionCard
                      type="checkbox"
                      name="extras"
                      checked={checked}
                      onChange={() => handleCheckboxChange(option)}
                      title={name}
                      price={price}
                    />
                    {checked && (
                      <div className="mt-1.5 flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3.5 py-1.5 ring-1 ring-white/10">
                        <span className="text-sm text-white/70">{isOvernight ? t('noma.extras.people') : t('noma.extras.quantity')}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(option, String(quantity - 1))}
                            aria-label="−"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white ring-1 ring-white/15 transition hover:bg-white/[0.14]"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            inputMode="numeric"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(option, e.target.value)}
                            className="w-12 rounded-lg bg-black/30 py-1.5 text-center text-base font-semibold tabular-nums text-white ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-green-400/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(option, String(quantity + 1))}
                            aria-label="+"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-200 ring-1 ring-green-400/40 transition hover:bg-green-500/30"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Step>

        <Step n={3} title={say('Ceļš un apmaksa', 'Getting here and payment', 'Дорога и оплата')}>
          <TransportChoice value={formData.transport} onChange={(label) => setFormData((prev) => ({ ...prev, transport: label }))} />

          <GiftCardChoice value={giftCard} onChange={setGiftCard} date={selectedDate ? selectedDate.toLocaleDateString('en-CA') : null} />

          {withGiftCard ? (
            <p className="text-sm text-white/60">{t('forms:giftCard.paymentNote')}</p>
          ) : (
            <PaymentChoice
              card={cardPayments}
              value={formData.paymentMethod}
              onChange={(method) => setFormData((prev) => ({ ...prev, paymentMethod: method }))}
            />
          )}

          {/* Message */}
          <div>
            <SubLabel icon={MessageSquare}>{t('noma.message_label')}</SubLabel>
            <Field icon={MessageSquare} top>
              <textarea
                placeholder={t('noma.message_placeholder')}
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                className={`${fieldClass} resize-none`}
              />
            </Field>
          </div>
        </Step>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedDate || !selectedTime}
          className={submitClass}
        >
          <span className="relative">{isSubmitting ? t('noma.submitting') : t('noma.submit')}</span>
        </button>
      </form>
    </div>
  );
};

export default FormNoma;
