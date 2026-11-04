import priceCatalog from '../../data/priceCatalog.json';

// The first rental of the price list with the herbal tub, or without it: what
// a "book" button for the tub, or for the prices with or without it, opens
// the rental form with (FormNoma's initialChoice).
export const firstRental = (withTub: boolean) =>
  priceCatalog.rental.find((r) => /bez kubla/i.test(r.lv) !== withTub)!.label;
