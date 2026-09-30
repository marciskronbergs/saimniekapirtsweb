// What a gift card says, in both languages.
//
// The invoice Edge Function draws the card as a PDF with these words, and the
// gift card page shows a preview of it with them. The function keeps a copy of
// this file (the build fails if the copy drifts), so it imports only a type.
//
// There are three cards: a ritual card, which names the ritual and shows no
// price; a value card, which shows its amount; and the same value card without
// the amount, for a gift that does not say what it cost. A value card order
// gets both of the last two, and the buyer gives whichever they like.

import type { GiftCardRitual, Locale } from './pricing.ts';

export type GiftCardKind = 'ritual' | 'value' | 'plain';

// Lines on the backs wrap, so the phone number and a few word pairs are held
// together with no-break spaces, and a dash never starts a line.
const nb = (text: string) => text.replace(/ /g, '\u00a0');
const PHONE = nb('+371 26 752 661');
const DASH = '\u00a0– ';

export interface GiftCardWords {
  giftCard: string;
  no: string;
  validUntil: string;
  contact: string;
  tagline: string;
  plainTitle: string;
  plainLine: string;
  plainFacts: string;
  // Tells the two value card PDFs apart: "Dāvanu karte M-… · bez summas".
  withoutAmount: string;
  ritual: string;
  tub: (tub: boolean) => string;
  facts: (r: GiftCardRitual) => string;
  howTo: string;
  steps: string[];
  anyService: string;
  anyServicePlain: string;
  course: string;
  led: string;
  ritualSteps: string[];
  book: string;
  validity: (date: string) => string;
  address: string;
  photos: { valueFront: string; valueBack: string; ritualFront: string; ritualBack: string };
}

export const giftCardWords: Record<Locale, GiftCardWords> = {
  lv: {
    giftCard: 'Dāvanu karte',
    no: 'Nr.',
    validUntil: 'Derīga līdz',
    contact: `saimniekapirts.lv · ${PHONE}`,
    // The value card: the amount, then this line under it.
    tagline: 'pirts priekiem',
    // The value card without its amount.
    plainTitle: 'Pirts priekiem',
    plainLine: 'pēc Jūsu izvēles',
    plainFacts: 'rituāls · pirts noma · nakšņošana',
    withoutAmount: 'bez summas',
    // The ritual card.
    ritual: 'Pirts rituāls',
    tub: (tub: boolean) => (tub ? 'ar zāļu kublu' : 'bez zāļu kubla'),
    facts: (r: GiftCardRitual) => `${r.people.lv} · līdz ${r.hours} stundām`,
    // The backs.
    howTo: 'Kā izmantot dāvanu karti',
    steps: [
      `Piesakiet apmeklējumu: zvaniet ${PHONE} vai rakstiet uz info@saimniekapirts.lv un nosauciet kartes numuru.`,
      'Vienosimies par Jums ērtu dienu un laiku.',
      `Ierodoties uzrādiet dāvanu karti${DASH}izdrukātu vai telefonā.`,
    ],
    anyService: `Kartes vērtību var izmantot jebkuram mūsu pakalpojumam${DASH}${nb('pirts rituālam')}, ${nb('pirts nomai')} vai nakšņošanai.`,
    anyServicePlain: `Karti var izmantot jebkuram mūsu pakalpojumam${DASH}${nb('pirts rituālam')}, ${nb('pirts nomai vai nakšņošanai')}.`,
    course: 'Rituāla gaita',
    led: 'sertificēta pirtnieka vadībā',
    ritualSteps: [
      'Sildīšanās zāļu kublā',
      'Zāļu tējas baudīšana',
      'Slotu pēriens',
      'Zāļu skrubja iestrādāšana',
      'Siltā medus masāža',
      'Peldināšana vēsā dīķī',
      'Guldīšana pledos',
    ],
    book: `Lai pieteiktos, zvaniet ${PHONE} vai rakstiet uz info@saimniekapirts.lv un nosauciet kartes numuru. Ierodoties uzrādiet karti${DASH}izdrukātu vai telefonā.`,
    validity: (date: string) => `Derīga līdz ${date} · nav apmaināma pret naudu`,
    address: '„Sarma Nr. 123“, Baldones pagasts, Ķekavas novads, LV-2125',
    // What the photos show, for the preview on the site.
    photos: {
      valueFront: 'Viesi zāļu kublā, saimnieks lej zāļu tēju',
      valueBack: 'Peldēšana dīķī starp ūdensrozēm',
      ritualFront: 'Pirtnieks pērienā ar bērza slotām',
      ritualBack: 'Zāļu skrubis koka bļodā uz papardēm',
    },
  },
  en: {
    giftCard: 'Gift card',
    no: 'No.',
    validUntil: 'Valid until',
    contact: `saimniekapirts.lv · ${PHONE}`,
    tagline: 'a sauna treat',
    plainTitle: 'A sauna treat',
    plainLine: 'of your choosing',
    plainFacts: 'ritual · sauna rental · overnight stay',
    withoutAmount: 'without the amount',
    ritual: 'Sauna ritual',
    tub: (tub: boolean) => (tub ? 'with herbal hot tub' : 'without herbal hot tub'),
    facts: (r: GiftCardRitual) => `${r.people.en} · up to ${r.hours} hours`,
    howTo: 'How to use your gift card',
    steps: [
      `Book your visit: call ${PHONE} or write to info@saimniekapirts.lv and quote the ${nb('card number')}.`,
      'We will agree on a day and time that suits you.',
      `When you arrive, show the gift card${DASH}printed or on your phone.`,
    ],
    anyService: `The value can be used for any of our services${DASH}${nb('a sauna ritual')}, ${nb('sauna rental')} or ${nb('an overnight stay')}.`,
    anyServicePlain: `The card can be used for any of our services${DASH}${nb('a sauna ritual')}, ${nb('sauna rental')} or ${nb('an overnight stay')}.`,
    course: 'The ritual, step by step',
    led: 'led by a certified sauna master',
    ritualSteps: [
      'Warming in herbal hot tub',
      'Enjoying herbal tea',
      'Whisk massage',
      'Herbal scrub',
      'Warm honey massage',
      'Dip in the cool pond',
      'Resting in warm blankets',
    ],
    book: `To book, call ${PHONE} or write to info@saimniekapirts.lv and quote the ${nb('card number')}. On arrival, show the card${DASH}printed or on your phone.`,
    validity: (date: string) => `Valid until ${date} · not exchangeable for cash`,
    address: '“Sarma Nr. 123”, Baldone parish, Ķekava municipality, LV-2125, Latvia',
    photos: {
      valueFront: 'Guests in the herbal hot tub, the host pouring herbal tea',
      valueBack: 'Floating in the pond among water lilies',
      ritualFront: 'A sauna master with birch whisks',
      ritualBack: 'Herbal scrub in a wooden bowl on ferns',
    },
  },
};


// "diviem · ar zāļu kublu" / "for two · with herbal hot tub"
export const ritualLine = (r: GiftCardRitual, locale: Locale) =>
  `${r.who[locale]} · ${giftCardWords[locale].tub(r.tub)}`;

// "Pirts rituāls diviem ar zāļu kublu" / "Sauna ritual for two with herbal hot tub"
export const ritualName = (r: GiftCardRitual, locale: Locale) =>
  `${giftCardWords[locale].ritual} ${r.who[locale]} ${giftCardWords[locale].tub(r.tub)}`;

// Without the herbal hot tub the ritual starts with the tea.
export const ritualSteps = (r: GiftCardRitual, locale: Locale) =>
  r.tub ? giftCardWords[locale].ritualSteps : giftCardWords[locale].ritualSteps.slice(1);

// "2027-09-30" → "30.09.2027"
export const formatCardDate = (iso: string) => iso.split('-').reverse().join('.');
