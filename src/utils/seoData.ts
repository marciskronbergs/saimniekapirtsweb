// SEO data for all pages in both languages
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
      description: 'Certified sauna master-led rituals for individuals, couples or families. Herbal hot tubs, whisk beatings & rejuvenating treatments.',
      keywords: 'sauna ritual, sauna master, whisk beating, herbal hot tub, traditional sauna, latvian sauna, sauna treatments, relaxation',
      ogTitle: 'Sauna Rituals - Traditional Latvian Sauna',
      ogDescription: 'Certified sauna master-led rituals for individuals, couples or families. Herbal hot tubs, whisk beatings & rejuvenating treatments.',
      twitterTitle: 'Sauna Rituals - Traditional Latvian Sauna',
      twitterDescription: 'Certified sauna master-led rituals with herbal hot tubs and whisk beatings. Authentic Latvian sauna experience.'
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
      description: 'Rent the White or Gray sauna for private relaxation. Option to add herbal hot tub. Perfect for families and friend groups.',
      keywords: 'sauna rental, private sauna, white sauna, gray sauna, herbal hot tub, sauna hire, family relaxation, friend events',
      ogTitle: 'Sauna Rental - Private Sauna Relaxation',
      ogDescription: 'Rent the White or Gray sauna for private relaxation. Option to add herbal hot tub. Perfect for families and friend groups.',
      twitterTitle: 'Sauna Rental - Private Sauna Relaxation',
      twitterDescription: 'Private sauna rental with option to add herbal hot tub. Perfect for families and friend groups.'
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
      description: 'Masculine sauna experience for bachelor parties. Traditional rituals, whisk beatings and friendly atmosphere for groom celebration.',
      keywords: 'bachelor pack, bachelor party, groom ritual, masculine sauna, traditional beatings, friends event',
      ogTitle: 'Bachelor Pack - Traditional Bachelor Party',
      ogDescription: 'Masculine sauna experience for bachelor parties. Traditional rituals, whisk beatings and friendly atmosphere.',
      twitterTitle: 'Bachelor Pack - Traditional Bachelor Party',
      twitterDescription: 'Masculine sauna experience for bachelor parties with traditional rituals and whisk beatings.'
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
      description: 'Stay overnight after sauna rituals. Warm and comfortable accommodation in White and Gray saunas. Extend your relaxation experience.',
      keywords: 'accommodation, overnight stay, sauna hotel, night rest, white sauna, gray sauna, extended relaxation',
      ogTitle: 'Accommodation - Comfortable Overnight Stay',
      ogDescription: 'Stay overnight after sauna rituals. Warm and comfortable accommodation in White and Gray saunas.',
      twitterTitle: 'Accommodation - Comfortable Overnight Stay',
      twitterDescription: 'Warm and comfortable accommodation after sauna rituals. Extend your relaxation experience.'
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
    }
  }
};

// Function to get current page SEO data
export const getCurrentPageSEO = (pathname: string, language: 'lv' | 'en'): SEOData => {
  // Since every route is prerendered to its own directory, the same page is
  // reachable as /pirts-rituali and /pirts-rituali/. Without trimming the
  // trailing slash the second form finds no entry above, and the page
  // silently adopts the homepage title, description and canonical.
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const pageSEO = seoData[normalized] || seoData['/'];
  return pageSEO[language];
};