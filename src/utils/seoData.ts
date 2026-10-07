// SEO data for all pages in every language
export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
}

export interface PageSEO {
  lv: SEOData;
  en: SEOData;
  ru: SEOData;
}

export const seoData: Record<string, PageSEO> = {
  '/': {
    lv: {
      title: 'SaimniekaPirts - Tradicionālie Pirts Rituāli un Noma',
      description: 'Izbaudi autentiskos latviešu pirts rituālus ar sertificētiem pirtniekiem. Privāta pirts noma, zāļu kubli un īpaši pasākumi dabas sirdī.',
      keywords: 'pirts rituāli, pirts noma, zāļu kubls, tradicionālā pirts, pirtnieks, latvijas wellness, saimniekapirts, pirts piedzīvojumi',
      ogTitle: 'SaimniekaPirts - Tradicionālie Pirts Rituāli',
      ogDescription: 'Izbaudi autentiskos latviešu pirts rituālus ar sertificētiem pirtniekiem. Privāta pirts noma, zāļu kubli un īpaši pasākumi.',
      twitterTitle: 'SaimniekaPirts - Tradicionālie Pirts Rituāli',
      twitterDescription: 'Izbaudi autentiskos latviešu pirts rituālus ar sertificētiem pirtniekiem. Privāta pirts noma un zāļu kubli.'
    },
    en: {
      title: 'SaimniekaPirts - Traditional Sauna Rituals & Rental',
      description: 'Experience authentic Latvian sauna rituals with certified sauna masters. Private sauna rental, herbal hot tubs & special events in nature.',
      keywords: 'sauna rituals, sauna rental, herbal hot tub, traditional sauna, sauna master, latvia wellness, saimniekapirts, sauna experiences',
      ogTitle: 'SaimniekaPirts - Traditional Sauna Rituals',
      ogDescription: 'Experience authentic Latvian sauna rituals with certified sauna masters. Private sauna rental, herbal hot tubs & special events.',
      twitterTitle: 'SaimniekaPirts - Traditional Sauna Rituals',
      twitterDescription: 'Experience authentic Latvian sauna rituals with certified sauna masters. Private sauna rental & herbal hot tubs.'
    },
    ru: {
      title: 'SaimniekaPirts – банные ритуалы с пармастером и аренда бани под Ригой',
      description: 'Настоящие латышские банные ритуалы с сертифицированным пармастером: парение вениками, травяной чан, пруд. Аренда бани и ночёвка на природе под Ригой.',
      keywords: 'баня рига, баня под ригой, банный ритуал, пармастер, парение вениками, аренда бани, травяной чан, латышская баня, saimniekapirts',
      ogTitle: 'SaimniekaPirts – латышские банные ритуалы',
      ogDescription: 'Банные ритуалы с сертифицированным пармастером, аренда бани, травяной чан и ночёвка на природе под Ригой.',
      twitterTitle: 'SaimniekaPirts – латышские банные ритуалы',
      twitterDescription: 'Банные ритуалы с пармастером, аренда бани и травяной чан под Ригой.'
    }
  },
  '/pirts-rituali': {
    lv: {
      title: 'Pirts Rituāli - Tradicionālā Latviskā Pirts Pieredze',
      description: 'Sertificētu pirtnieku vadīti pirts rituāli individuāli, diviem vai ģimenei. Zāļu kubli, pērieni un atjaunojošas procedūras.',
      keywords: 'pirts rituāls, pirtnieks, pēriens, zāļu kubls, tradicionālā pirts, latviskā pirts, pirts procedūras, relaksācija',
      ogTitle: 'Pirts Rituāli - Tradicionālā Latviskā Pirts',
      ogDescription: 'Sertificētu pirtnieku vadīti pirts rituāli individuāli, diviem vai ģimenei. Zāļu kubli, pērieni un atjaunojošas procedūras.',
      twitterTitle: 'Pirts Rituāli - Tradicionālā Latviskā Pirts',
      twitterDescription: 'Sertificētu pirtnieku vadīti pirts rituāli ar zāļu kubliem un pērieniem. Autentiska latviskā pirts pieredze.'
    },
    en: {
      title: 'Sauna Rituals - Traditional Latvian Sauna Experience',
      description: 'Certified sauna master-led rituals for individuals, couples or families. Herbal hot tubs, sauna whisking and rejuvenating treatments.',
      keywords: 'sauna ritual, sauna master, sauna whisking, herbal hot tub, traditional sauna, latvian sauna, sauna treatments, relaxation',
      ogTitle: 'Sauna Rituals - Traditional Latvian Sauna',
      ogDescription: 'Certified sauna master-led rituals for individuals, couples or families. Herbal hot tubs, sauna whisking and rejuvenating treatments.',
      twitterTitle: 'Sauna Rituals - Traditional Latvian Sauna',
      twitterDescription: 'Certified sauna master-led rituals with herbal hot tubs and sauna whisking. Authentic Latvian sauna experience.'
    },
    ru: {
      title: 'Банный ритуал с пармастером – традиционная латышская баня',
      description: 'Банные ритуалы с сертифицированным пармастером для одного, для двоих или для семьи: травяной чан, парение вениками, скраб, медовый массаж и пруд.',
      keywords: 'банный ритуал, пармастер, парение вениками, баня с вениками, травяной чан, латышская баня, банные процедуры, баня рига',
      ogTitle: 'Банный ритуал с пармастером',
      ogDescription: 'Ритуал для одного, для двоих или для семьи: травяной чан, парение вениками, скраб, медовый массаж и пруд.',
      twitterTitle: 'Банный ритуал с пармастером',
      twitterDescription: 'Традиционная латышская баня: травяной чан, парение вениками и пруд.'
    }
  },
  '/grupu-rituali': {
    lv: {
      title: 'Grupu Pirts Rituāli - Draugu un Kolēģu Piedzīvojumi',
      description: 'Pirts rituāli grupām līdz 10 personām. Dažādi pakalpojumu līmeņi - no draugu pirts līdz pilnam meistara rituālam.',
      keywords: 'grupu pirts, draugu pirts, kolēģu pasākumi, grupu rituāli, pirts meistars, komandas saliedēšana, grupu atpūta',
      ogTitle: 'Grupu Pirts Rituāli - Draugu Piedzīvojumi',
      ogDescription: 'Pirts rituāli grupām līdz 10 personām. Dažādi pakalpojumu līmeņi - no draugu pirts līdz pilnam meistara rituālam.',
      twitterTitle: 'Grupu Pirts Rituāli - Draugu Piedzīvojumi',
      twitterDescription: 'Pirts rituāli grupām ar dažādiem pakalpojumu līmeņiem. Ideāli draugu un kolēģu pasākumiem.'
    },
    en: {
      title: 'Group Sauna Rituals - Friends & Colleagues Experiences',
      description: 'Sauna rituals for groups up to 10 people. Various service levels - from friends sauna to full master ritual experiences.',
      keywords: 'group sauna, friends sauna, corporate events, group rituals, sauna master, team building, group relaxation',
      ogTitle: 'Group Sauna Rituals - Friends Experiences',
      ogDescription: 'Sauna rituals for groups up to 10 people. Various service levels - from friends sauna to full master ritual experiences.',
      twitterTitle: 'Group Sauna Rituals - Friends Experiences',
      twitterDescription: 'Sauna rituals for groups with various service levels. Perfect for friends and corporate events.'
    },
    ru: {
      title: 'Банные ритуалы для компании – баня с друзьями и коллегами',
      description: 'Банные программы для компании с пармастером: от совместного скраба и травяного чана до индивидуального парения для каждого. От 70 € с человека.',
      keywords: 'баня для компании, баня с друзьями, корпоратив в бане, групповой банный ритуал, пармастер, тимбилдинг',
      ogTitle: 'Банные ритуалы для компании',
      ogDescription: 'Банные программы для друзей и коллег с пармастером – от 70 € с человека.',
      twitterTitle: 'Банные ритуалы для компании',
      twitterDescription: 'Баня с друзьями и коллегами под руководством пармастера.'
    }
  },
  '/pirts-noma': {
    lv: {
      title: 'Pirts Noma - Privāta Pirts ar vai bez Zāļu Kubla',
      description: 'Iznomā Balto vai Pelēko pirti privātai atpūtai. Iespēja pievienot zāļu kublu. Ideāli ģimenēm un draugu kompānijām.',
      keywords: 'pirts noma, privāta pirts, baltā pirts, pelēkā pirts, zāļu kubls, pirts īre, ģimenes atpūta, draugu pasākumi',
      ogTitle: 'Pirts Noma - Privāta Pirts Atpūta',
      ogDescription: 'Iznomā Balto vai Pelēko pirti privātai atpūtai. Iespēja pievienot zāļu kublu. Ideāli ģimenēm un draugu kompānijām.',
      twitterTitle: 'Pirts Noma - Privāta Pirts Atpūta',
      twitterDescription: 'Privāta pirts noma ar iespēju pievienot zāļu kublu. Ideāli ģimenēm un draugu kompānijām.'
    },
    en: {
      title: 'Sauna Rental - Private Sauna with or without Hot Tub',
      description: 'Rent the White or Grey sauna for private relaxation. Option to add herbal hot tub. Perfect for families and friend groups.',
      keywords: 'sauna rental, private sauna, white sauna, grey sauna, herbal hot tub, sauna hire, family relaxation, friend events',
      ogTitle: 'Sauna Rental - Private Sauna Relaxation',
      ogDescription: 'Rent the White or Grey sauna for private relaxation. Option to add herbal hot tub. Perfect for families and friend groups.',
      twitterTitle: 'Sauna Rental - Private Sauna Relaxation',
      twitterDescription: 'Private sauna rental with option to add herbal hot tub. Perfect for families and friend groups.'
    },
    ru: {
      title: 'Аренда бани под Ригой – с травяным чаном или без',
      description: 'Аренда Белой или Серой бани для отдыха с семьёй и друзьями. Травяной чан по желанию, веники и скрабы. От 80 € за 3 часа.',
      keywords: 'аренда бани, баня в аренду, частная баня, баня с чаном, белая баня, серая баня, баня рига, баня на природе',
      ogTitle: 'Аренда бани под Ригой',
      ogDescription: 'Белая или Серая баня для отдыха с семьёй и друзьями, травяной чан по желанию.',
      twitterTitle: 'Аренда бани под Ригой',
      twitterDescription: 'Частная баня с травяным чаном по желанию – для семьи и друзей.'
    }
  },
  '/ipasiie-piedzivvojumi': {
    lv: {
      title: 'Īpašie Pirts Piedzīvojumi - Vecmeitu un Vecpuišu Ballītes',
      description: 'Unikāli pirts piedzīvojumi īpašiem pasākumiem. Vecmeitu pūrs un vīru paka ar tradicionāliem rituāliem un svinīgu atmosfēru.',
      keywords: 'vecmeitu ballīte, vecpuišu ballīte, īpaši pasākumi, vīru paka, vecmeitas pūrs, kāzu tradīcijas, svinīgi pasākumi',
      ogTitle: 'Īpašie Pirts Piedzīvojumi - Svinīgi Pasākumi',
      ogDescription: 'Unikāli pirts piedzīvojumi īpašiem pasākumiem. Vecmeitu pūrs un vīru paka ar tradicionāliem rituāliem.',
      twitterTitle: 'Īpašie Pirts Piedzīvojumi - Svinīgi Pasākumi',
      twitterDescription: 'Unikāli pirts piedzīvojumi vecmeitu un vecpuišu ballītēm ar tradicionāliem rituāliem.'
    },
    en: {
      title: 'Special Sauna Experiences - Bachelorette & Bachelor Parties',
      description: 'Unique sauna experiences for special events. Bachelorette sauna and bachelor pack with traditional rituals and festive atmosphere.',
      keywords: 'bachelorette party, bachelor party, special events, bachelor pack, bachelorette sauna, wedding traditions, celebration events',
      ogTitle: 'Special Sauna Experiences - Celebration Events',
      ogDescription: 'Unique sauna experiences for special events. Bachelorette sauna and bachelor pack with traditional rituals.',
      twitterTitle: 'Special Sauna Experiences - Celebration Events',
      twitterDescription: 'Unique sauna experiences for bachelorette and bachelor parties with traditional rituals.'
    },
    ru: {
      title: 'Девичник и мальчишник в бане – особые банные программы',
      description: 'Банные программы для праздников: девичник и мальчишник в бане с пармастером, традиционными обрядами и праздничной атмосферой.',
      keywords: 'девичник в бане, мальчишник в бане, девичник рига, мальчишник рига, баня для праздника, свадебные традиции',
      ogTitle: 'Девичник и мальчишник в бане',
      ogDescription: 'Банные программы для девичника и мальчишника с пармастером и традиционными обрядами.',
      twitterTitle: 'Девичник и мальчишник в бане',
      twitterDescription: 'Праздничные банные программы с пармастером.'
    }
  },
  '/vecmeitas-purs': {
    lv: {
      title: 'Vecmeitas Pūrs - Tradicionālā Vecmeitu Ballīte Pirtī',
      description: 'Īpašs pirts rituāls vecmeitu ballītei ar tradicionāliem elementiem. Līgavas skaistumkopšana un draudzeņu saliedēšana.',
      keywords: 'vecmeitas pūrs, vecmeitu ballīte, līgavas rituāls, tradicionālā pirts, skaistumkopšana, draudzeņu pasākums',
      ogTitle: 'Vecmeitas Pūrs - Tradicionālā Vecmeitu Ballīte',
      ogDescription: 'Īpašs pirts rituāls vecmeitu ballītei ar tradicionāliem elementiem. Līgavas skaistumkopšana un draudzeņu saliedēšana.',
      twitterTitle: 'Vecmeitas Pūrs - Tradicionālā Vecmeitu Ballīte',
      twitterDescription: 'Īpašs pirts rituāls vecmeitu ballītei ar līgavas skaistumkopšanu un tradicionāliem elementiem.'
    },
    en: {
      title: 'Bachelorette Sauna - Traditional Bachelorette Party',
      description: 'Special sauna ritual for bachelorette parties with traditional elements. Bride beauty treatments and friends bonding experience.',
      keywords: 'bachelorette sauna, bachelorette party, bride ritual, traditional sauna, beauty treatments, friends event',
      ogTitle: 'Bachelorette Sauna - Traditional Bachelorette Party',
      ogDescription: 'Special sauna ritual for bachelorette parties with traditional elements. Bride beauty treatments and friends bonding.',
      twitterTitle: 'Bachelorette Sauna - Traditional Bachelorette Party',
      twitterDescription: 'Special sauna ritual for bachelorette parties with bride beauty treatments and traditional elements.'
    },
    ru: {
      title: 'Девичник в бане – банный ритуал для невесты и подруг',
      description: 'Девичник в бане с пармастером: обряд пожеланий, парение вениками и уход для невесты, скрабы и травяной чан для подруг. До 8 человек.',
      keywords: 'девичник в бане, девичник рига, ритуал для невесты, банный девичник, спа девичник',
      ogTitle: 'Девичник в бане',
      ogDescription: 'Банный ритуал для невесты и подруг: парение вениками, скрабы и травяной чан.',
      twitterTitle: 'Девичник в бане',
      twitterDescription: 'Банный девичник с пармастером – до 8 человек.'
    }
  },
  '/viru-paka': {
    lv: {
      title: 'Vīru Paka - Tradicionālā Vecpuišu Ballīte Pirtī',
      description: 'Vīrišķīgs pirts piedzīvojums vecpuišu ballītei. Tradicionālie rituāli, pērieni un draudzīga atmosfēra līgavaiņa godināšanai.',
      keywords: 'vīru paka, vecpuišu ballīte, līgavaiņa rituāls, vīrišķīga pirts, tradicionālie pērieni, draugu pasākums',
      ogTitle: 'Vīru Paka - Tradicionālā Vecpuišu Ballīte',
      ogDescription: 'Vīrišķīgs pirts piedzīvojums vecpuišu ballītei. Tradicionālie rituāli, pērieni un draudzīga atmosfēra.',
      twitterTitle: 'Vīru Paka - Tradicionālā Vecpuišu Ballīte',
      twitterDescription: 'Vīrišķīgs pirts piedzīvojums vecpuišu ballītei ar tradicionāliem rituāliem un pērieniem.'
    },
    en: {
      title: 'Bachelor Pack - Traditional Bachelor Party Sauna',
      description: 'Masculine sauna experience for bachelor parties. Traditional rituals, sauna whisking and a friendly atmosphere to celebrate the groom.',
      keywords: 'bachelor pack, bachelor party, groom ritual, masculine sauna, sauna whisking, friends event',
      ogTitle: 'Bachelor Pack - Traditional Bachelor Party',
      ogDescription: 'Masculine sauna experience for bachelor parties. Traditional rituals, sauna whisking and a friendly atmosphere.',
      twitterTitle: 'Bachelor Pack - Traditional Bachelor Party',
      twitterDescription: 'Masculine sauna experience for bachelor parties with traditional rituals and sauna whisking.'
    },
    ru: {
      title: 'Мальчишник в бане – банный ритуал для жениха и друзей',
      description: 'Мальчишник в бане с пармастером: обряд пожеланий, большое мужское парение вениками для жениха, пруд и травяной чан. До 8 человек.',
      keywords: 'мальчишник в бане, мальчишник рига, ритуал для жениха, мужская баня, парение вениками',
      ogTitle: 'Мальчишник в бане',
      ogDescription: 'Банный ритуал для жениха и друзей: парение вениками, пруд и травяной чан.',
      twitterTitle: 'Мальчишник в бане',
      twitterDescription: 'Банный мальчишник с пармастером – до 8 человек.'
    }
  },
  '/naksnosana': {
    lv: {
      title: 'Nakšņošana - Ērta Naktsmītne pēc Pirts Rituāliem',
      description: 'Paliec pa nakti pēc pirts rituāliem. Siltas un ērtas naktsmītnes Baltajā un Pelēkajā pirtī. Pagarini savu atpūtas pieredzi.',
      keywords: 'nakšņošana, naktsmītne, pirts viesnīca, atpūta pa nakti, baltā pirts, pelēkā pirts, pagarināta atpūta',
      ogTitle: 'Nakšņošana - Ērta Naktsmītne pēc Pirts',
      ogDescription: 'Paliec pa nakti pēc pirts rituāliem. Siltas un ērtas naktsmītnes Baltajā un Pelēkajā pirtī.',
      twitterTitle: 'Nakšņošana - Ērta Naktsmītne pēc Pirts',
      twitterDescription: 'Siltas un ērtas naktsmītnes pēc pirts rituāliem. Pagarini savu atpūtas pieredzi.'
    },
    en: {
      title: 'Accommodation - Comfortable Overnight Stay After Sauna',
      description: 'Stay overnight after sauna rituals. Warm and comfortable accommodation in White and Grey saunas. Extend your relaxation experience.',
      keywords: 'accommodation, overnight stay, sauna hotel, night rest, white sauna, grey sauna, extended relaxation',
      ogTitle: 'Accommodation - Comfortable Overnight Stay',
      ogDescription: 'Stay overnight after sauna rituals. Warm and comfortable accommodation in White and Grey saunas.',
      twitterTitle: 'Accommodation - Comfortable Overnight Stay',
      twitterDescription: 'Warm and comfortable accommodation after sauna rituals. Extend your relaxation experience.'
    },
    ru: {
      title: 'Ночёвка после бани – уютное проживание на природе',
      description: 'Останьтесь на ночь после бани: тёплые и уютные комнаты в Белой и Серой бане. 19,99 € с человека.',
      keywords: 'ночёвка после бани, проживание, баня с ночёвкой, гостевой дом рига, отдых на природе',
      ogTitle: 'Ночёвка после бани',
      ogDescription: 'Тёплые и уютные комнаты в Белой и Серой бане – продлите свой отдых.',
      twitterTitle: 'Ночёвка после бани',
      twitterDescription: 'Баня с ночёвкой – уютные комнаты на природе.'
    }
  },
  '/davanu-kartes': {
    lv: {
      title: 'Dāvanu Kartes - Perfekta Dāvana Pirts Piedzīvojumiem',
      description: 'Iegādājies dāvanu karti pirts rituāliem un nomai. Izvēlies konkrētu rituālu vai pielāgotu vērtību. Tūlītēja piegāde uz e-pastu.',
      keywords: 'dāvanu karte, pirts dāvana, rituālu dāvana, pirts vouchers, dāvanu sertifikāts, pirts piedzīvojumu dāvana',
      ogTitle: 'Dāvanu Kartes - Perfekta Pirts Dāvana',
      ogDescription: 'Iegādājies dāvanu karti pirts rituāliem un nomai. Izvēlies konkrētu rituālu vai pielāgotu vērtību.',
      twitterTitle: 'Dāvanu Kartes - Perfekta Pirts Dāvana',
      twitterDescription: 'Dāvanu kartes pirts rituāliem ar tūlītēju piegādi uz e-pastu. Perfekta dāvana mīļajiem.'
    },
    en: {
      title: 'Gift Cards - Perfect Gift for Sauna Experiences',
      description: 'Purchase gift cards for sauna rituals and rentals. Choose specific rituals or custom values. Instant delivery to email.',
      keywords: 'gift card, sauna gift, ritual gift, sauna vouchers, gift certificate, sauna experience gift',
      ogTitle: 'Gift Cards - Perfect Sauna Gift',
      ogDescription: 'Purchase gift cards for sauna rituals and rentals. Choose specific rituals or custom values.',
      twitterTitle: 'Gift Cards - Perfect Sauna Gift',
      twitterDescription: 'Gift cards for sauna rituals with instant email delivery. Perfect gift for loved ones.'
    },
    ru: {
      title: 'Подарочная карта на банный ритуал – лучший подарок',
      description: 'Подарочные карты на банные ритуалы и аренду бани: выберите ритуал или сумму. Оплата картой онлайн – подарочная карта сразу на e-mail.',
      keywords: 'подарочная карта баня, подарочный сертификат баня, подарок банный ритуал, сертификат пармастер, подарок рига',
      ogTitle: 'Подарочная карта на банный ритуал',
      ogDescription: 'Подарочные карты на банные ритуалы и аренду бани – ритуал или сумма на выбор.',
      twitterTitle: 'Подарочная карта на банный ритуал',
      twitterDescription: 'Подарите незабываемый банный ритуал.'
    }
  },
  '/rezervet': {
    lv: {
      title: 'Rezervēt - Pirts Rituālu un Nomas Rezervācija',
      description: 'Rezervē pirts rituālus vai pirti nomai. Ērti rezervācijas kalendāri, kontaktinformācija un atrašanās vietas karte.',
      keywords: 'rezervācija, pirts rezervēšana, rituālu rezervācija, nomas rezervācija, rezervēt pirti, pirts kalendārs',
      ogTitle: 'Rezervēt - Pirts Rituālu Rezervācija',
      ogDescription: 'Rezervē pirts rituālus vai pirti nomai. Ērti rezervācijas kalendāri un kontaktinformācija.',
      twitterTitle: 'Rezervēt - Pirts Rituālu Rezervācija',
      twitterDescription: 'Rezervē pirts rituālus vai pirti nomai ar ērtiem rezervācijas kalendāriem.'
    },
    en: {
      title: 'Reserve - Sauna Ritual and Rental Booking',
      description: 'Book sauna rituals or sauna rentals. Convenient booking calendars, contact information and location map.',
      keywords: 'reservation, sauna booking, ritual booking, rental booking, book sauna, sauna calendar',
      ogTitle: 'Reserve - Sauna Ritual Booking',
      ogDescription: 'Book sauna rituals or sauna rentals. Convenient booking calendars and contact information.',
      twitterTitle: 'Reserve - Sauna Ritual Booking',
      twitterDescription: 'Book sauna rituals or sauna rentals with convenient booking calendars.'
    },
    ru: {
      title: 'Бронирование – банный ритуал или аренда бани',
      description: 'Забронируйте банный ритуал или аренду бани онлайн: удобный календарь свободного времени, контакты и как добраться.',
      keywords: 'забронировать баню, бронирование бани, банный ритуал бронирование, аренда бани онлайн',
      ogTitle: 'Бронирование банного ритуала',
      ogDescription: 'Банный ритуал или аренда бани – бронирование онлайн по календарю.',
      twitterTitle: 'Бронирование банного ритуала',
      twitterDescription: 'Забронируйте банный ритуал или аренду бани онлайн.'
    }
  },
  '/biezak-uzdotie-jautajumi': {
    lv: {
      title: 'Biežāk Uzdotie Jautājumi - Pirts Rituāli un Noma',
      description: 'Cik ilgs ir pirts rituāls, cik tas maksā, ko ņemt līdzi, kā nokļūt no Rīgas un kad pirti apmeklēt nedrīkst. Atbildes uz biežākajiem jautājumiem.',
      keywords: 'pirts rituāls cena, cik ilgs pirts rituāls, ko ņemt līdzi uz pirti, pirts noma cena, pirts noteikumi, dāvanu kartes derīgums, biežāk uzdotie jautājumi',
      ogTitle: 'Biežāk Uzdotie Jautājumi par Pirts Rituāliem',
      ogDescription: 'Rituāla ilgums un cenas, ko ņemt līdzi, kā nokļūt no Rīgas, drošības noteikumi un dāvanu karšu termiņi.',
      twitterTitle: 'Biežāk Uzdotie Jautājumi',
      twitterDescription: 'Atbildes par pirts rituālu ilgumu, cenām, nokļūšanu un noteikumiem.'
    },
    en: {
      title: 'Frequently Asked Questions - Sauna Rituals and Rental',
      description: 'How long a Latvian sauna ritual lasts, what it costs, what to bring, how to get there from Riga and when the sauna should not be visited.',
      keywords: 'latvian sauna ritual price, how long is a sauna ritual, what to bring to sauna, sauna rental price, sauna rules, gift card validity, faq',
      ogTitle: 'Frequently Asked Questions about Sauna Rituals',
      ogDescription: 'Ritual length and prices, what to bring, getting there from Riga, safety rules and gift card validity.',
      twitterTitle: 'Frequently Asked Questions',
      twitterDescription: 'Answers on sauna ritual length, prices, getting there and the rules.'
    },
    ru: {
      title: 'Частые вопросы – банные ритуалы и аренда бани',
      description: 'Сколько длится банный ритуал и сколько стоит, что взять с собой, как добраться из Риги и когда баню посещать нельзя.',
      keywords: 'сколько стоит банный ритуал, сколько длится ритуал, что взять в баню, цена аренды бани, правила бани, срок подарочной карты',
      ogTitle: 'Частые вопросы о банных ритуалах',
      ogDescription: 'Длительность и цены ритуалов, что взять с собой, как добраться из Риги, правила и подарочные карты.',
      twitterTitle: 'Частые вопросы',
      twitterDescription: 'Ответы о длительности, ценах, дороге и правилах.'
    }
  },
  '/ieksejas-kartibas-noteikumi': {
    lv: {
      title: 'Iekšējās Kārtības Noteikumi - SaimniekaPirts',
      description: 'SaimniekaPirts apmeklējuma noteikumi: drošība pirtī un zāļu kublā, rezervāciju un atcelšanas kārtība, uzvedība teritorijā.',
      keywords: 'iekšējās kārtības noteikumi, pirts noteikumi, drošības noteikumi, rezervācijas noteikumi',
      ogTitle: 'Iekšējās Kārtības Noteikumi',
      ogDescription: 'SaimniekaPirts apmeklējuma noteikumi: drošība, rezervāciju un atcelšanas kārtība.',
      twitterTitle: 'Iekšējās Kārtības Noteikumi',
      twitterDescription: 'SaimniekaPirts apmeklējuma un drošības noteikumi.'
    },
    en: {
      title: 'House Rules - SaimniekaPirts',
      description: 'SaimniekaPirts house rules: safety in the sauna and herbal hot tub, booking and cancellation terms, conduct on the premises.',
      keywords: 'house rules, sauna rules, safety rules, booking terms',
      ogTitle: 'House Rules',
      ogDescription: 'SaimniekaPirts house rules: safety, booking and cancellation terms.',
      twitterTitle: 'House Rules',
      twitterDescription: 'SaimniekaPirts visitor and safety rules.'
    },
    ru: {
      title: 'Правила посещения – SaimniekaPirts',
      description: 'Правила посещения SaimniekaPirts: безопасность в бане и травяном чане, бронирование и отмена, поведение на территории.',
      keywords: 'правила бани, правила посещения, безопасность в бане, условия бронирования',
      ogTitle: 'Правила посещения',
      ogDescription: 'Правила SaimniekaPirts: безопасность, бронирование и отмена.',
      twitterTitle: 'Правила посещения',
      twitterDescription: 'Правила посещения и безопасности SaimniekaPirts.'
    }
  },
  '/privatuma-politika': {
    lv: {
      title: 'Privātuma Politika - SaimniekaPirts',
      description: 'Kā SaimniekaPirts apstrādā un glabā rezervācijās norādītos personas datus, un kādas ir jūsu tiesības attiecībā uz tiem.',
      keywords: 'privātuma politika, personas datu apstrāde, sīkdatnes, GDPR',
      ogTitle: 'Privātuma Politika',
      ogDescription: 'Kā SaimniekaPirts apstrādā rezervācijās norādītos personas datus un kādas ir jūsu tiesības.',
      twitterTitle: 'Privātuma Politika',
      twitterDescription: 'SaimniekaPirts personas datu apstrādes principi.'
    },
    en: {
      title: 'Privacy Policy - SaimniekaPirts',
      description: 'How SaimniekaPirts processes and stores the personal data given when booking, and what rights you have over it.',
      keywords: 'privacy policy, personal data processing, cookies, GDPR',
      ogTitle: 'Privacy Policy',
      ogDescription: 'How SaimniekaPirts processes the personal data given when booking, and your rights.',
      twitterTitle: 'Privacy Policy',
      twitterDescription: 'SaimniekaPirts personal data processing principles.'
    },
    ru: {
      title: 'Политика конфиденциальности – SaimniekaPirts',
      description: 'Как SaimniekaPirts обрабатывает и хранит персональные данные, указанные при бронировании, и какие у вас есть права.',
      keywords: 'политика конфиденциальности, обработка персональных данных, cookies, GDPR',
      ogTitle: 'Политика конфиденциальности',
      ogDescription: 'Как SaimniekaPirts обрабатывает персональные данные и ваши права.',
      twitterTitle: 'Политика конфиденциальности',
      twitterDescription: 'Принципы обработки персональных данных SaimniekaPirts.'
    }
  }
};

// Function to get current page SEO data
export const getCurrentPageSEO = (pathname: string, language: 'lv' | 'en' | 'ru'): SEOData => {
  // Since every route is prerendered to its own directory, the same page is
  // reachable as /pirts-rituali and /pirts-rituali/. Without trimming the
  // trailing slash the second form finds no entry above, and the page
  // silently adopts the homepage title, description and canonical.
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const pageSEO = seoData[normalized] || seoData['/'];
  return pageSEO[language];
};