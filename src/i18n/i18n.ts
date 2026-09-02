import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enHero from './locales/en/hero.json';
import lvHero from './locales/lv/hero.json';
import enNavbar from './locales/en/navbar.json';
import lvNavbar from './locales/lv/navbar.json';
import enFooter from './locales/en/footer.json';
import lvFooter from './locales/lv/footer.json';
import enServices from './locales/en/services.json';
import lvServices from './locales/lv/services.json';
import enCards from './locales/en/cards.json';
import lvCards from './locales/lv/cards.json';
import enEvents from './locales/en/events.json';
import lvEvents from './locales/lv/events.json';
import enRental from './locales/en/rental.json';
import lvRental from './locales/lv/rental.json';
import enRituali from './locales/en/rituali.json';
import lvRituali from './locales/lv/rituali.json';
import enRitualiPreview from './locales/en/rituali-preview.json';
import lvRitualiPreview from './locales/lv/rituali-preview.json';
import enNoma from './locales/en/noma.json';
import lvNoma from './locales/lv/noma.json';
import enSpecial from './locales/en/special.json';
import lvSpecial from './locales/lv/special.json';
import enVecmeitas from './locales/en/vecmeitas.json';
import lvVecmeitas from './locales/lv/vecmeitas.json';
import enViru from './locales/en/viru.json';
import lvViru from './locales/lv/viru.json';
import enAccommodation from './locales/en/accommodation.json';
import lvAccommodation from './locales/lv/accommodation.json';
import enGiftcards from './locales/en/giftcards.json';
import lvGiftcards from './locales/lv/giftcards.json';
import enForms from './locales/en/forms.json';
import lvForms from './locales/lv/forms.json';
import enReserve from './locales/en/reserve.json';
import lvReserve from './locales/lv/reserve.json';
import enFaq from './locales/en/faq.json';
import lvFaq from './locales/lv/faq.json';
import enPrivacy from './locales/en/privacy.json';
import lvPrivacy from './locales/lv/privacy.json';
import enRules from './locales/en/rules.json';
import lvRules from './locales/lv/rules.json';
import enGroupRituals from './locales/en/groupRituals.json';
import lvGroupRituals from './locales/lv/groupRituals.json';
import enReviews from './locales/en/reviews.json';
import lvReviews from './locales/lv/reviews.json';
import enLocation from './locales/en/location.json';
import lvLocation from './locales/lv/location.json';
import enCommon from './locales/en/common.json';
import lvCommon from './locales/lv/common.json';

const resources = {
  en: {
    hero: enHero,
    navbar: enNavbar,
    footer: enFooter,
    services: enServices,
    cards: enCards,
    events: enEvents,
    rental: enRental,
    rituali: enRituali,
    'rituali-preview': enRitualiPreview,
    noma: enNoma,
    special: enSpecial,
    vecmeitas: enVecmeitas,
    viru: enViru,
    accommodation: enAccommodation,
    giftcards: enGiftcards,
    forms: enForms,
    reserve: enReserve,
    rules: enRules,
    privacy: enPrivacy,
    faq: enFaq,
    groupRituals: enGroupRituals,
    reviews: enReviews,
    location: enLocation,
    common: enCommon
  },
  lv: {
    hero: lvHero,
    navbar: lvNavbar,
    footer: lvFooter,
    services: lvServices,
    cards: lvCards,
    events: lvEvents,
    rental: lvRental,
    rituali: lvRituali,
    'rituali-preview': lvRitualiPreview,
    noma: lvNoma,
    special: lvSpecial,
    vecmeitas: lvVecmeitas,
    viru: lvViru,
    accommodation: lvAccommodation,
    giftcards: lvGiftcards,
    forms: lvForms,
    reserve: lvReserve,
    rules: lvRules,
    privacy: lvPrivacy,
    faq: lvFaq,
    groupRituals: lvGroupRituals,
    reviews: lvReviews,
    location: lvLocation,
    common: lvCommon
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'lv', // default language
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;