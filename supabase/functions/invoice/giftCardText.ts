// What a gift card says, in both languages.
//
// The invoice Edge Function draws the card as a PDF with these words, and the
// gift card page shows a preview of it with them. The function keeps a copy of
// this file (the build fails if the copy drifts), so it imports only a type.
//
// The card is the owner's own "Dāvanu karte – PIRTS PRIEKIEM" (the gold
// ribbon on navy, its title set in the picture); the words here fill in the
// rest. A value card shows its amount; a ritual card names the ritual in its
// place, and comes with an A4 version too (the owner's two-page layout).
// Every card carries its number (its advance invoice's) and a short code:
// with both, the card can be used when booking online.

import type { GiftCardRitual, Locale } from './pricing.ts';

export type GiftCardKind = 'value' | 'ritual' | 'a4';

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
  // The value card's amount line: "300 EUR vērtībā".
  valueWord: string;
  // Beside the number: the code, asked for when booking online.
  codeLine: string;
  ritual: string;
  tub: (tub: boolean) => string;
  facts: (r: GiftCardRitual) => string;
  // Under the amount (or the ritual): what the card is for.
  usage: string;
  ritualUsage: (r: GiftCardRitual) => string;
  // A card may go towards a dearer service: the rest is paid on the day.
  payMore: string;
  // The footer: the address, and how to book (online, or by phone).
  address: string;
  book: string;
  photos: { front: string; back: string };
}

export const giftCardWords: Record<Locale, GiftCardWords> = {
  lv: {
    giftCard: 'Dāvanu karte',
    valueWord: 'vērtībā',
    codeLine: 'Kods online rezervācijai:',
    ritual: 'Pirts rituāls',
    tub: (tub: boolean) => (tub ? 'ar zāļu kublu' : 'bez zāļu kubla'),
    facts: (r: GiftCardRitual) => `${r.people.lv} · līdz ${r.hours} stundām`,
    usage: 'Izmantojama pirts rituālam, pirts nomai vai nakšņošanai',
    ritualUsage: (r: GiftCardRitual) => `${r.people.lv} · līdz ${r.hours} stundām · sertificēta pirtnieka vadībā`,
    payMore: PAY_MORE_LV,
    address: '„SARMA NR. 123“, BALDONES PAGASTS, ĶEKAVAS NOVADS, LV-2125',
    book: `REZERVĀCIJA: SAIMNIEKAPIRTS.LV/REZERVET (NR. + KODS) | TĀLR. ${nb('+371 26 752 661')}`,
    photos: {
      front: 'Dāvanu karte – zelta lente uz tumša fona',
      back: 'Zāļu kubls, pirts slotas, pēriens un dīķis pie pirts',
    },
  },
  en: {
    giftCard: 'Gift card',
    valueWord: 'value',
    codeLine: 'Code for booking online:',
    ritual: 'Sauna ritual',
    tub: (tub: boolean) => (tub ? 'with herbal hot tub' : 'without herbal hot tub'),
    facts: (r: GiftCardRitual) => `${r.people.en} · up to ${r.hours} hours`,
    usage: 'For a sauna ritual, sauna rental or an overnight stay',
    ritualUsage: (r: GiftCardRitual) => `${r.people.en} · up to ${r.hours} hours · led by a certified sauna master`,
    payMore: PAY_MORE_EN,
    address: '“SARMA NR. 123”, BALDONE PARISH, ĶEKAVA MUNICIPALITY, LV-2125, LATVIA',
    book: `BOOKING: SAIMNIEKAPIRTS.LV/REZERVET (NO. + CODE) | TEL. ${nb('+371 26 752 661')}`,
    photos: {
      front: 'Gift card – a gold ribbon on navy',
      back: 'The herbal hot tub, sauna whisks, a whisk massage and the pond by the sauna',
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
  // Under the card's number: its code, for booking online.
  codeLine: (code: string) => string;
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
    bookLines: [`Online: ${nb('saimniekapirts.lv/rezervet')}${DASH}kartes Nr. un kods`, `Pa tālruni: ${PHONE} · info@saimniekapirts.lv`],
    people: 'Personu skaits',
    duration: 'Ilgums',
    hours: (hours) => `līdz ${hours} stundām`,
    cardNo: 'Kartes Nr.',
    valid: 'Derīga līdz',
    codeLine: (code) => `kods online rezervācijai: ${code}`,
    photos: ['Zāļu kubls un zāļu tēja', 'Slotu pēriens pirtī', 'Zāļu skrubja iestrādāšana'],
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
    bookLines: [`Online: ${nb('saimniekapirts.lv/rezervet')}${DASH}card no. and code`, `By phone: ${PHONE} · info@saimniekapirts.lv`],
    people: 'Number of people',
    duration: 'Duration',
    hours: (hours) => `up to ${hours} hours`,
    cardNo: 'Card no.',
    valid: 'Valid until',
    codeLine: (code) => `code for booking online: ${code}`,
    photos: ['The herbal hot tub and herbal tea', 'A whisk massage in the sauna', 'An herbal scrub'],
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

// "2027-09-30" → "30.09.2027"
export const formatCardDate = (iso: string) => iso.split('-').reverse().join('.');
