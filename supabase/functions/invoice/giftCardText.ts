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

export type GiftCardKind = 'ritual' | 'a4' | 'value' | 'plain';

// Lines on the backs wrap, so the phone number and a few word pairs are held
// together with no-break spaces, and a dash never starts a line.
const nb = (text: string) => text.replace(/ /g, '\u00a0');
const PHONE = nb('+371 26 752 661');
const DASH = '\u00a0– ';
// A value card may go towards a dearer service: the rest is paid on the day.
const PAY_MORE_LV = `Ja izvēlaties dārgāku pakalpojumu, ${nb('starpību var piemaksāt uz vietas')}.`;
const PAY_MORE_EN = `If you choose a dearer service, ${nb('you can pay the difference on site')}.`;

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
    anyService: `Kartes vērtību var izmantot jebkuram mūsu pakalpojumam${DASH}${nb('pirts rituālam')}, ${nb('pirts nomai')} vai nakšņošanai. ${PAY_MORE_LV}`,
    anyServicePlain: `Karti var izmantot jebkuram mūsu pakalpojumam${DASH}${nb('pirts rituālam')}, ${nb('pirts nomai vai nakšņošanai')}. ${PAY_MORE_LV}`,
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
    anyService: `The value can be used for any of our services${DASH}${nb('a sauna ritual')}, ${nb('sauna rental')} or ${nb('an overnight stay')}. ${PAY_MORE_EN}`,
    anyServicePlain: `The card can be used for any of our services${DASH}${nb('a sauna ritual')}, ${nb('sauna rental')} or ${nb('an overnight stay')}. ${PAY_MORE_EN}`,
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


// The A4 ritual gift card: the owner's own two-page layout. Page 1 says what
// the ritual is, what to know before it and what is included; page 2 lists
// the card's facts in tagged rows.
export interface GiftCardA4Words {
  title: string;
  giftCard: string;
  web: string;
  more: string;
  belief: string;
  beliefText: string;
  invite: string;
  important: string;
  water: string;
  health: string;
  included: string;
  // The ritual's steps with a few words on each; without the hot tub the first is left out.
  steps: [string, string][];
  place: string;
  placeLines: [string, string];
  book: string;
  bookLines: [string, string];
  people: string;
  duration: string;
  hours: (hours: number) => string;
  cardNo: string;
  valid: string;
  validNote: string;
  photos: [string, string, string];
}

export const giftCardA4Words: Record<Locale, GiftCardA4Words> = {
  lv: {
    title: 'Latviskais pirts rituāls',
    giftCard: 'Dāvanu karte',
    web: 'www.saimniekapirts.lv',
    more: 'Vairāk informācijas',
    belief: 'Ticējums:',
    beliefText: `Pirtī jāperas ar jauna bērza slotiņu${DASH}tad miesa paliekot balta.`,
    invite: 'Ļaujieties relaksējošam pirts rituālam mūsu mājīgajā un siltajā pirtī. No Jums vajadzīgas tikai pozitīvas domas un apziņa, ka šis laiks ir tikai Jums. Par visu pārējo parūpēsimies mēs.',
    important: 'Svarīga informācija',
    water: `Dienu pirms rituāla un rituāla dienā dzeriet pietiekami daudz ūdens${DASH}svīstot organisms zaudē daudz šķidruma. Iesakām neēst gaļas produktus un visu, kas rada smaguma sajūtu.`,
    health: 'Pārliecinieties, ka Jūsu veselība ļauj apmeklēt pirti. Ja šaubāties, pirms rituāla konsultējieties ar ārstu.',
    included: 'Piedāvājumā iekļauts',
    steps: [
      ['Sildīšanās zāļu kublā', 'silts kubls ar aromātiskām zālītēm palīdz atslābināties'],
      ['Zāļu tējas baudīšana', 'silta ārstniecības augu tēja atpūtas brīžos'],
      ['Slotu pēriens', 'bērza vai ozola slotas atslābina un attīra ķermeni'],
      ['Zāļu skrubja iestrādāšana', 'augu un sāls skrubis maigi atjauno ādu'],
      ['Siltā medus masāža', 'medus dziļi mitrina ādu un nomierina prātu'],
      ['Peldināšana vēsā dīķī', 'kontrasta pelde atsvaidzina un stimulē asinsriti'],
      ['Guldīšana pledos', 'atpūta siltos pledos svaigā gaisā noslēdz rituālu'],
    ],
    place: 'Pakalpojuma vieta',
    placeLines: [`SaimniekaPirts, „Sarma ${nb('Nr. 123')}“`, 'Baldones pagasts, Ķekavas novads, LV-2125'],
    book: 'Pieteikšanās',
    bookLines: [`${PHONE} · info@saimniekapirts.lv`, 'nosauciet kartes numuru'],
    people: 'Personu skaits',
    duration: 'Ilgums',
    hours: (hours) => `līdz ${hours} stundām`,
    cardNo: 'Kartes Nr.',
    valid: 'Derīga līdz',
    validNote: 'nav apmaināma pret naudu',
    photos: ['Pirtniece ar bērza slotām', 'Pelde dīķī starp ūdensrozēm', 'Ietīšana siltā pledā'],
  },
  en: {
    title: 'Latvian sauna ritual',
    giftCard: 'Gift card',
    web: 'www.saimniekapirts.lv',
    more: 'About the ritual',
    belief: 'Folk belief:',
    beliefText: 'Bathe in the sauna with a young birch whisk, and your body will stay white.',
    invite: 'Give yourself over to a relaxing sauna ritual in our cosy, warm sauna. All we ask of you is a positive mind and the knowledge that this time is yours alone. We will take care of everything else.',
    important: 'Good to know',
    water: `Drink plenty of water the day before and on the day of the ritual${DASH}you lose a lot of fluid when you sweat. We suggest avoiding meat and anything that leaves you feeling heavy.`,
    health: 'Please make sure your health allows a sauna visit. If in doubt, consult a doctor before the ritual.',
    included: 'What is included',
    steps: [
      ['Warming in herbal hot tub', 'a warm tub of fragrant herbs helps you unwind'],
      ['Enjoying herbal tea', 'warm medicinal herbal tea between the steps'],
      ['Whisk massage', 'birch or oak whisks improve circulation'],
      ['Herbal scrub', 'herbs and salt gently renew the skin'],
      ['Warm honey massage', 'honey deeply moisturises the skin and calms the mind'],
      ['Dip in the cool pond', 'a contrast bath that refreshes and gets the circulation going'],
      ['Resting in warm blankets', 'wrapped up warm in the fresh air to close the ritual'],
    ],
    place: 'Venue',
    placeLines: [`SaimniekaPirts, “Sarma ${nb('Nr. 123')}”`, 'Baldone parish, Ķekava municipality, LV-2125, Latvia'],
    book: 'Booking',
    bookLines: [`${PHONE} · info@saimniekapirts.lv`, 'quote the card number'],
    people: 'Number of people',
    duration: 'Duration',
    hours: (hours) => `up to ${hours} hours`,
    cardNo: 'Card no.',
    valid: 'Valid until',
    validNote: 'not exchangeable for cash',
    photos: ['A sauna master with birch whisks', 'Floating in the pond among water lilies', 'Wrapping in a warm blanket'],
  },
};

// Without the herbal hot tub the ritual starts with the tea.
export const a4Steps = (r: GiftCardRitual, locale: Locale) =>
  r.tub ? giftCardA4Words[locale].steps : giftCardA4Words[locale].steps.slice(1);

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
