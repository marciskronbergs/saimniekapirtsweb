// What a gift card says, in both languages.
//
// The invoice Edge Function draws the cards as PDFs with these words, and the
// gift card page shows a preview of them with them. The function keeps a copy
// of this file (the build fails if the copy drifts), so it imports only a type.
//
// Every order gets two cards, both with the amount (a ritual card: the
// ritual's price): the owner's own "Dāvanu karte – PIRTS PRIEKIEM" (the gold
// ribbon on navy, its title set in the picture), and a light one (the herbal
// hot tub and a linen panel). A ritual also comes as the A4 card, the one
// version without an amount. Every card carries its number (its advance
// invoice's) and a short code: with both, the card can be used when booking
// online.

import type { GiftCardRitual, Locale } from './pricing.ts';

// The ribbon card, the light card, and a ritual's A4 card.
export type GiftCardKind = 'ribbon' | 'light' | 'a4';

// Lines on the backs wrap, so the phone number and a few word pairs are held
// together with no-break spaces, and a dash never starts a line.
const NBSP = String.fromCharCode(0xa0);
const nb = (text: string) => text.replace(/ /g, NBSP);
const PHONE = nb('+371 26 752 661');
const DASH = `${NBSP}– `;
// A value card may go towards a dearer service: the rest is paid on the day.
const PAY_MORE_LV = `Ja izvēlaties dārgāku pakalpojumu, ${nb('starpību var piemaksāt uz vietas')}.`;
const PAY_MORE_EN = `If you choose a dearer service, ${nb('you can pay the difference on site')}.`;
const PAY_MORE_RU = `Если вы выберете услугу дороже, ${nb('разницу можно доплатить на месте')}.`;

export interface GiftCardWords {
  giftCard: string;
  no: string;
  // The card's code, asked for with its number when booking online.
  code: string;
  validUntil: string;
  ritual: string;
  tub: (tub: boolean) => string;
  facts: (r: GiftCardRitual) => string;
  // The ribbon card: "300 EUR vērtībā", the code beside the number, what
  // the card is for, and the footer (the address, and how to book).
  valueWord: string;
  codeLine: string;
  usage: string;
  ritualUsage: (r: GiftCardRitual) => string;
  payMore: string;
  ribbonAddress: string;
  book: string;
  // The light card: the line under the amount, and its back.
  contact: string;
  tagline: string;
  howTo: string;
  steps: string[];
  anyService: string;
  ritualService: (r: GiftCardRitual) => string;
  validity: (date: string) => string;
  address: string;
  // What the pictures show, for the preview on the site.
  photos: { ribbonFront: string; ribbonBack: string; lightFront: string; lightBack: string };
}

export const giftCardWords: Record<Locale, GiftCardWords> = {
  lv: {
    giftCard: 'Dāvanu karte',
    no: 'Nr.',
    code: 'Kods',
    validUntil: 'Derīga līdz',
    ritual: 'Pirts rituāls',
    tub: (tub: boolean) => (tub ? 'ar zāļu kublu' : 'bez zāļu kubla'),
    facts: (r: GiftCardRitual) => `${r.people.lv} · līdz ${r.hours} stundām`,
    valueWord: 'vērtībā',
    codeLine: 'Kods online rezervācijai:',
    usage: 'Izmantojama pirts rituālam, pirts nomai vai nakšņošanai',
    ritualUsage: (r: GiftCardRitual) =>
      `Pirts rituālam ${r.who.lv} ${giftCardWords.lv.tub(r.tub)} · ${r.people.lv} · līdz ${r.hours} stundām`,
    payMore: PAY_MORE_LV,
    ribbonAddress: '„SARMA NR. 123“, BALDONES PAGASTS, ĶEKAVAS NOVADS, LV-2125',
    book: `REZERVĀCIJA: SAIMNIEKAPIRTS.LV/REZERVET (NR. + KODS) | TĀLR. ${PHONE}`,
    contact: `saimniekapirts.lv · ${PHONE}`,
    tagline: 'pirts priekiem',
    howTo: 'Kā izmantot dāvanu karti',
    steps: [
      `Rezervējiet online ${nb('saimniekapirts.lv/rezervet')}${DASH}ievadiet kartes numuru un kodu, un karte tiks ieskaitīta automātiski.`,
      `Vai rezervējiet pa tālruni ${PHONE} vai e-pastu info@saimniekapirts.lv, nosaucot kartes numuru.`,
      `Ierodoties uzrādiet dāvanu karti${DASH}izdrukātu vai telefonā.`,
    ],
    anyService: `Kartes vērtību var izmantot jebkuram mūsu pakalpojumam${DASH}${nb('pirts rituālam')}, ${nb('pirts nomai')} vai nakšņošanai. ${PAY_MORE_LV}`,
    ritualService: (r: GiftCardRitual) =>
      `Karte dāvināta ${nb('pirts rituālam')} ${nb(`${r.who.lv} ${giftCardWords.lv.tub(r.tub)}`)} sertificēta pirtnieka vadībā. ${PAY_MORE_LV}`,
    validity: (date: string) => `Derīga līdz ${date}`,
    address: '„Sarma Nr. 123“, Baldones pagasts, Ķekavas novads, LV-2125',
    photos: {
      ribbonFront: 'Dāvanu karte – zelta lente uz tumša fona',
      ribbonBack: 'Zāļu kubls, pirts slotas, pēriens un dīķis pie pirts',
      lightFront: 'Viesi zāļu kublā, saimnieks lej zāļu tēju',
      lightBack: 'Pelde dīķī',
    },
  },
  en: {
    giftCard: 'Gift card',
    no: 'No.',
    code: 'Code',
    validUntil: 'Valid until',
    ritual: 'Sauna ritual',
    tub: (tub: boolean) => (tub ? 'with herbal hot tub' : 'without herbal hot tub'),
    facts: (r: GiftCardRitual) => `${r.people.en} · up to ${r.hours} hours`,
    valueWord: 'value',
    codeLine: 'Code for booking online:',
    usage: 'For a sauna ritual, sauna rental or an overnight stay',
    ritualUsage: (r: GiftCardRitual) =>
      `For a sauna ritual ${r.who.en} ${giftCardWords.en.tub(r.tub)} · ${r.people.en} · up to ${r.hours} hours`,
    payMore: PAY_MORE_EN,
    ribbonAddress: '“SARMA NR. 123”, BALDONE PARISH, ĶEKAVA MUNICIPALITY, LV-2125, LATVIA',
    book: `BOOKING: SAIMNIEKAPIRTS.LV/REZERVET (NO. + CODE) | TEL. ${PHONE}`,
    contact: `saimniekapirts.lv · ${PHONE}`,
    tagline: 'a sauna treat',
    howTo: 'How to use your gift card',
    steps: [
      `Book online at ${nb('saimniekapirts.lv/rezervet')}${DASH}enter the card number and code, and the card is applied automatically.`,
      `Or book by phone ${PHONE} or email info@saimniekapirts.lv, quoting the ${nb('card number')}.`,
      `When you arrive, show the gift card${DASH}printed or on your phone.`,
    ],
    anyService: `The value can be used for any of our services${DASH}${nb('a sauna ritual')}, ${nb('sauna rental')} or ${nb('an overnight stay')}. ${PAY_MORE_EN}`,
    ritualService: (r: GiftCardRitual) =>
      `The card was given for ${nb('a sauna ritual')} ${nb(`${r.who.en} ${giftCardWords.en.tub(r.tub)}`)}, led by a certified sauna master. ${PAY_MORE_EN}`,
    validity: (date: string) => `Valid until ${date}`,
    address: '“Sarma Nr. 123”, Baldone parish, Ķekava municipality, LV-2125, Latvia',
    photos: {
      ribbonFront: 'Gift card – a gold ribbon on navy',
      ribbonBack: 'The herbal hot tub, sauna whisks, a whisk massage and the pond by the sauna',
      lightFront: 'Guests in the herbal hot tub, the host pouring herbal tea',
      lightBack: 'A swim in the pond',
    },
  },
  ru: {
    giftCard: 'Подарочная карта',
    no: '№',
    code: 'Код',
    validUntil: 'Действительна до',
    ritual: 'Банный ритуал',
    tub: (tub: boolean) => (tub ? 'с травяным чаном' : 'без травяного чана'),
    facts: (r: GiftCardRitual) => `${r.people.ru} · до ${r.hours} часов`,
    valueWord: 'номинал',
    codeLine: 'Код для онлайн-бронирования:',
    usage: 'Для банного ритуала, аренды бани или ночёвки',
    ritualUsage: (r: GiftCardRitual) =>
      `Банный ритуал ${r.who.ru} ${giftCardWords.ru.tub(r.tub)} · ${r.people.ru} · до ${r.hours} часов`,
    payMore: PAY_MORE_RU,
    ribbonAddress: '«SARMA NR. 123», БАЛДОНСКАЯ ВОЛОСТЬ, КЕКАВСКИЙ КРАЙ, LV-2125',
    book: `БРОНИРОВАНИЕ: SAIMNIEKAPIRTS.LV/REZERVET (№ + КОД) | ТЕЛ. ${PHONE}`,
    contact: `saimniekapirts.lv · ${PHONE}`,
    tagline: 'банное удовольствие',
    howTo: 'Как воспользоваться картой',
    steps: [
      `Забронируйте онлайн на ${nb('saimniekapirts.lv/rezervet')}${DASH}введите номер и код карты, и она будет учтена автоматически.`,
      `Или по телефону ${PHONE} или e-mail info@saimniekapirts.lv, назвав ${nb('номер карты')}.`,
      `При визите покажите карту${DASH}распечатанную или в телефоне.`,
    ],
    anyService: `Номинал карты можно использовать для любой нашей услуги${DASH}${nb('банного ритуала')}, ${nb('аренды бани')} или ночёвки. ${PAY_MORE_RU}`,
    ritualService: (r: GiftCardRitual) =>
      `Карта подарена на ${nb('банный ритуал')} ${nb(`${r.who.ru} ${giftCardWords.ru.tub(r.tub)}`)} под руководством сертифицированного пармастера. ${PAY_MORE_RU}`,
    validity: (date: string) => `Действительна до ${date}`,
    address: '«Sarma Nr. 123», Балдонская волость, Кекавский край, LV-2125, Латвия',
    photos: {
      ribbonFront: 'Подарочная карта – золотая лента на тёмно-синем фоне',
      ribbonBack: 'Травяной чан, банные веники, парение и пруд у бани',
      lightFront: 'Гости в травяном чане, хозяин наливает травяной чай',
      lightBack: 'Окунание в пруд',
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
  // The header photos tell the ritual in order: page 1 the tub, the whisks
  // and the scrub; page 2 the swim, the dousing and the rest in blankets.
  photos: { info: [string, string, string]; details: [string, string, string] };
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
    photos: {
      info: ['Zāļu kubls un zāļu tēja', 'Slotu pēriens pirtī', 'Zāļu skrubja iestrādāšana'],
      details: ['Pelde dīķī', 'Apliešana ar ūdeni pēc kubla', 'Ietīšana pledos ar ozola slotām'],
    },
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
    photos: {
      info: ['The herbal hot tub and herbal tea', 'A whisk massage in the sauna', 'An herbal scrub'],
      details: ['A swim in the pond', 'A cold douse after the tub', 'Wrapped in blankets with oak whisks'],
    },
  },
  ru: {
    title: 'Латышский банный ритуал',
    giftCard: 'Подарочная карта',
    web: 'www.saimniekapirts.lv',
    more: 'О ритуале',
    belief: 'Поверье:',
    beliefText: `Париться в бане нужно молодым берёзовым веником${DASH}тогда тело останется белым.`,
    invite: 'Доверьтесь расслабляющему банному ритуалу в нашей уютной тёплой бане. От вас нужны только хорошие мысли и понимание, что это время – только для вас. Обо всём остальном позаботимся мы.',
    important: 'Важно знать',
    water: `За день до ритуала и в день ритуала пейте достаточно воды${DASH}с потом организм теряет много жидкости. Советуем не есть мясо и всё, что вызывает тяжесть.`,
    health: 'Убедитесь, что здоровье позволяет вам посещать баню. Если сомневаетесь, перед ритуалом посоветуйтесь с врачом.',
    included: 'Что входит',
    steps: [
      ['Прогрев в травяном чане', 'тёплый чан с ароматными травами помогает расслабиться'],
      ['Травяной чай', 'тёплый чай из лечебных трав между этапами'],
      ['Парение вениками', 'берёзовые или дубовые веники расслабляют и очищают тело'],
      ['Травяной скраб', 'скраб из трав и соли мягко обновляет кожу'],
      ['Тёплый медовый массаж', 'мёд глубоко увлажняет кожу и успокаивает ум'],
      ['Окунание в прохладный пруд', 'контраст бодрит и разгоняет кровь'],
      ['Отдых в пледах', 'отдых в тёплых пледах на свежем воздухе завершает ритуал'],
    ],
    place: 'Место',
    placeLines: [`SaimniekaPirts, «Sarma ${nb('Nr. 123')}»`, 'Балдонская волость, Кекавский край, LV-2125'],
    book: 'Бронирование',
    bookLines: [`Онлайн: ${nb('saimniekapirts.lv/rezervet')}${DASH}№ и код карты`, `По телефону: ${PHONE} · info@saimniekapirts.lv`],
    people: 'Количество человек',
    duration: 'Длительность',
    hours: (hours) => `до ${hours} часов`,
    cardNo: 'Карта №',
    valid: 'Действительна до',
    codeLine: (code) => `код для онлайн-бронирования: ${code}`,
    photos: {
      info: ['Травяной чан и травяной чай', 'Парение вениками в бане', 'Травяной скраб'],
      details: ['Окунание в пруд', 'Обливание водой после чана', 'Укутывание в пледы с дубовыми вениками'],
    },
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
