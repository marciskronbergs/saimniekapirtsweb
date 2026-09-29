// The office's link for cancelling a booking, sent to Make with each booking so
// the calendar event can carry it. The booking's id is the link's secret; the
// page also asks for the office PIN before it cancels anything.
export const cancelUrl = (reservationId: string | undefined) =>
  reservationId ? `https://saimniekapirts.lv/rekins?r=${reservationId}` : '';
