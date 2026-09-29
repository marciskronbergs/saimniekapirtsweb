// The total written out in words, as Latvian invoices customarily state it:
// "Simts septiņdesmit septiņi eiro, 00 centi". Amounts up to 999 999.99.

const lvOnes = ['', 'viens', 'divi', 'trīs', 'četri', 'pieci', 'seši', 'septiņi', 'astoņi', 'deviņi'];
const lvTeens = [
  'desmit', 'vienpadsmit', 'divpadsmit', 'trīspadsmit', 'četrpadsmit',
  'piecpadsmit', 'sešpadsmit', 'septiņpadsmit', 'astoņpadsmit', 'deviņpadsmit',
];
const lvTens = ['', '', 'divdesmit', 'trīsdesmit', 'četrdesmit', 'piecdesmit', 'sešdesmit', 'septiņdesmit', 'astoņdesmit', 'deviņdesmit'];

function lvBelowThousand(n: number): string[] {
  const words: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds === 1) words.push('simts');
  else if (hundreds > 1) words.push(lvOnes[hundreds], 'simti');
  if (rest >= 10 && rest < 20) words.push(lvTeens[rest - 10]);
  else {
    if (rest >= 20) words.push(lvTens[Math.floor(rest / 10)]);
    if (rest % 10) words.push(lvOnes[rest % 10]);
  }
  return words;
}

function lvNumber(n: number): string {
  if (n === 0) return 'nulle';
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const words: string[] = [];
  if (thousands === 1) words.push('tūkstotis');
  else if (thousands > 1) {
    // "divdesmit viens tūkstotis", but "divi tūkstoši"
    const t = lvBelowThousand(thousands);
    const singular = thousands % 10 === 1 && thousands % 100 !== 11;
    words.push(...t, singular ? 'tūkstotis' : 'tūkstoši');
  }
  words.push(...lvBelowThousand(rest));
  return words.join(' ');
}

const enOnes = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const enTens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function enBelowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${enOnes[hundreds]} hundred`);
  if (rest) {
    const tail = rest < 20
      ? enOnes[rest]
      : enTens[Math.floor(rest / 10)] + (rest % 10 ? `-${enOnes[rest % 10]}` : '');
    parts.push(hundreds ? `and ${tail}` : tail);
  }
  return parts.join(' ');
}

function enNumber(n: number): string {
  if (n === 0) return 'zero';
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (thousands) parts.push(`${enBelowThousand(thousands)} thousand`);
  if (rest) parts.push(rest < 100 && thousands ? `and ${enBelowThousand(rest)}` : enBelowThousand(rest));
  return parts.join(' ');
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function amountInWords(amount: number, locale: 'lv' | 'en'): string {
  const totalCents = Math.round(amount * 100);
  const euros = Math.floor(totalCents / 100);
  const cents = String(totalCents % 100).padStart(2, '0');
  if (locale === 'lv') {
    const centWord = cents.endsWith('1') && cents !== '11' ? 'cents' : 'centi';
    return `${capitalise(lvNumber(euros))} eiro, ${cents} ${centWord}`;
  }
  return `${capitalise(enNumber(euros))} ${euros === 1 ? 'euro' : 'euros'} and ${cents} ${cents === '01' ? 'cent' : 'cents'}`;
}
