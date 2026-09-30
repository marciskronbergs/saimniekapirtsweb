// Prices a booking or a gift card order from the price list.
//
// The same code runs in the browser, for the summary a guest sees after booking,
// and in the invoice Edge Function, which keeps a copy of this file and of the
// price list (the build fails if a copy drifts). It therefore imports nothing:
// the caller passes the price list in.
//
// Only labels and counts are trusted from a booking, and only after they are
// found in the list. Anything that cannot be priced is reported in `problems`
// rather than guessed, so an invoice is held for a person to check instead.

export type Locale = 'lv' | 'en';

interface Named {
  lv: string;
  en: string;
}

interface CatalogRitual extends Named {
  label: string;
  price?: number;
  perPerson?: number;
  minimum?: number;
  people?: number;
}

interface CatalogRental extends Named {
  label: string;
  price: number;
}

interface CatalogTransport extends Named {
  label: string;
  price: number;
}

interface CatalogExtra extends Named {
  label: string;
  unitPrice: number;
  minimum?: number;
  unit: string;
  overnight?: boolean;
}

export interface PriceCatalog {
  ritual: CatalogRitual[];
  rental: CatalogRental[];
  extras: CatalogExtra[];
  transport: CatalogTransport[];
  giftCard: {
    rituals: { value: string; price: number; label: Named }[];
    custom: { min: number; max: number; step: number };
  };
}

export interface PricedItem {
  name: Named;
  quantity: number;
  unit: 'pcs' | 'person' | 'service';
  unitPrice: number;
  amount: number;
}

export interface PricedOrder {
  items: PricedItem[];
  total: number;
  problems: string[];
}

export interface ReservationForPricing {
  form_type: string | null;
  ritual_type?: string | null;
  ritual_participants?: number | null;
  overnight_stay?: boolean | null;
  rental_type?: string | null;
  rental_extras?: string[] | null;
  rental_extras_detail?: { label: string; quantity: number }[] | null;
  transport?: string | null;
}

export interface GiftCardForPricing {
  ritual_type?: string | null;
  custom_price_value?: string | null;
}

const cents = (value: number) => Math.round(value * 100) / 100;

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 50;

// A per-person price with a floor, such as the overnight stay (19.99 € a head,
// 36 € at least). Below the floor it becomes one line at the floor price, so
// quantity × unit price always equals the amount shown.
const perPersonItem = (
  name: Named,
  people: number,
  unitPrice: number,
  minimum = 0
): PricedItem => {
  const amount = cents(unitPrice * people);
  if (amount >= minimum) {
    return { name, quantity: people, unit: 'person', unitPrice, amount };
  }
  return {
    name: {
      lv: `${name.lv} (${people} pers., minimālā cena)`,
      en: `${name.en} (${people} ${people === 1 ? 'person' : 'people'}, minimum price)`,
    },
    quantity: 1,
    unit: 'service',
    unitPrice: minimum,
    amount: minimum,
  };
};

// Getting here: a free pick-up from the bus stop is no invoice line; the
// transfer from Riga is.
const addTransport = (
  catalog: PriceCatalog,
  booking: ReservationForPricing,
  items: PricedItem[],
  problems: string[]
) => {
  if (!booking.transport) return;
  const option = catalog.transport.find((entry) => entry.label === booking.transport);
  if (!option) {
    problems.push(`Unknown transport: ${booking.transport}`);
    return;
  }
  if (option.price > 0) {
    items.push({ name: { lv: option.lv, en: option.en }, quantity: 1, unit: 'service', unitPrice: option.price, amount: option.price });
  }
};

const finish = (items: PricedItem[], problems: string[]): PricedOrder => ({
  items,
  total: cents(items.reduce((sum, item) => sum + item.amount, 0)),
  problems,
});

export function priceReservation(
  catalog: PriceCatalog,
  booking: ReservationForPricing
): PricedOrder {
  const items: PricedItem[] = [];
  const problems: string[] = [];
  const overnight = catalog.extras.find((extra) => extra.overnight);

  if (booking.form_type === 'ritual') {
    const ritual = catalog.ritual.find((entry) => entry.label === booking.ritual_type);
    if (!ritual) {
      problems.push(`Unknown ritual: ${booking.ritual_type ?? '(none)'}`);
      return finish(items, problems);
    }
    const name = { lv: ritual.lv, en: ritual.en };
    const participants = booking.ritual_participants;

    if (ritual.price !== undefined) {
      items.push({ name, quantity: 1, unit: 'service', unitPrice: ritual.price, amount: ritual.price });
    } else if (ritual.perPerson !== undefined) {
      if (isCount(participants)) {
        items.push(perPersonItem(name, participants, ritual.perPerson, ritual.minimum));
      } else {
        problems.push(`Group ritual without a number of people: ${ritual.label}`);
      }
    }

    if (booking.overnight_stay && overnight) {
      const people = ritual.people ?? participants;
      if (isCount(people)) {
        items.push(
          perPersonItem({ lv: overnight.lv, en: overnight.en }, people, overnight.unitPrice, overnight.minimum)
        );
      } else {
        problems.push('Overnight stay without a number of people');
      }
    }
    addTransport(catalog, booking, items, problems);
    return finish(items, problems);
  }

  if (booking.form_type === 'noma') {
    const rental = catalog.rental.find((entry) => entry.label === booking.rental_type);
    if (rental) {
      const name = { lv: rental.lv, en: rental.en };
      items.push({ name, quantity: 1, unit: 'service', unitPrice: rental.price, amount: rental.price });
    } else {
      problems.push(`Unknown rental: ${booking.rental_type ?? '(none)'}`);
    }

    // Bookings made before quantities were recorded only have the plain list.
    const ordered =
      Array.isArray(booking.rental_extras_detail) && booking.rental_extras_detail.length > 0
        ? booking.rental_extras_detail
        : (booking.rental_extras ?? []).map((label) => ({ label, quantity: 1 }));

    for (const { label, quantity } of ordered) {
      const extra = catalog.extras.find((entry) => entry.label === label);
      if (!extra) {
        problems.push(`Unknown extra: ${label}`);
        continue;
      }
      if (!isCount(quantity)) {
        problems.push(`Bad quantity for ${label}: ${quantity}`);
        continue;
      }
      const name = { lv: extra.lv, en: extra.en };
      if (extra.minimum !== undefined) {
        items.push(perPersonItem(name, quantity, extra.unitPrice, extra.minimum));
      } else {
        items.push({
          name,
          quantity,
          unit: extra.unit === 'person' ? 'person' : 'pcs',
          unitPrice: extra.unitPrice,
          amount: cents(extra.unitPrice * quantity),
        });
      }
    }
    addTransport(catalog, booking, items, problems);
    return finish(items, problems);
  }

  problems.push(`Unknown booking type: ${booking.form_type ?? '(none)'}`);
  return finish(items, problems);
}

export function priceGiftCard(catalog: PriceCatalog, order: GiftCardForPricing): PricedOrder {
  const items: PricedItem[] = [];
  const problems: string[] = [];
  const stripPrice = (label: string) => label.replace(/\s*–\s*[\d.,]+\s*€\s*$/, '');

  const ritual = catalog.giftCard.rituals.find(
    (entry) => entry.label.lv === order.ritual_type || entry.label.en === order.ritual_type
  );
  if (ritual) {
    items.push({
      name: {
        lv: `Dāvanu karte: ${stripPrice(ritual.label.lv)}`,
        en: `Gift card: ${stripPrice(ritual.label.en)}`,
      },
      quantity: 1,
      unit: 'pcs',
      unitPrice: ritual.price,
      amount: ritual.price,
    });
    return finish(items, problems);
  }

  const { min, max, step } = catalog.giftCard.custom;
  const match = /^\s*(\d+)\s*€\s*$/.exec(order.custom_price_value ?? '');
  const value = match ? Number(match[1]) : NaN;
  if (Number.isInteger(value) && value >= min && value <= max && (value - min) % step === 0) {
    items.push({
      name: { lv: `Dāvanu karte, vērtība ${value} €`, en: `Gift card, value €${value}` },
      quantity: 1,
      unit: 'pcs',
      unitPrice: value,
      amount: value,
    });
  } else {
    problems.push(
      `Unknown gift card: ${order.ritual_type ?? '(none)'} / ${order.custom_price_value ?? '(none)'}`
    );
  }
  return finish(items, problems);
}

export const formatEuro = (amount: number, locale: Locale) =>
  new Intl.NumberFormat(locale === 'lv' ? 'lv-LV' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
