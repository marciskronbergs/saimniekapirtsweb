// A gift card given on a booking form (GiftCardChoice): its number, the code
// printed beside it, and what the last check said.
export interface GiftCardEntry {
  code: string;
  pin: string;
  // The last check: 'ok', why the card does not hold, or 'error' (no answer).
  status: string | null;
}

export const emptyGiftCard: GiftCardEntry = { code: '', pin: '', status: null };
