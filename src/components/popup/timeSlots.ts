import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const timeSlots = ['12:00', '17:00', '18:00'];

const maxPerSlot = 2;
const eveningSlots = ['17:00', '18:00'];

export type SlotBadge = 'green' | 'yellow' | 'red';

export interface SlotAvailability {
  isTimeAvailable: (time: string) => boolean;
  getBadgeColor: (time: string) => SlotBadge;
}

type Counts = { [time: string]: number };

/**
 * Booked counts for the chosen day plus the rules that decide whether a slot can
 * still be taken. It lives outside CalendarCode because the phone layout shows
 * the same slots in the popup header, and both places must agree.
 */
export const useSlotAvailability = (selectedDate: Date | null): SlotAvailability => {
  const [availability, setAvailability] = useState<Counts>({});

  useEffect(() => {
    setAvailability({});
    if (!selectedDate) return;

    // Guards against an earlier request answering after a later one and
    // painting another day's bookings over the current selection.
    let cancelled = false;
    const isoDate = selectedDate.toLocaleDateString('en-CA'); // e.g. "2025-07-14"

    (async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('reservation_time')
        .eq('reservation_date', isoDate);

      if (cancelled) return;

      if (error) {
        console.error(error);
        return;
      }

      const counts: Counts = {};
      data?.forEach((r) => {
        const time = r.reservation_time as string;
        counts[time] = (counts[time] || 0) + 1;
      });

      setAvailability(counts);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // The two evening slots share the same saunas, so they are counted together.
  const bookedCount = (time: string): number =>
    eveningSlots.includes(time)
      ? (availability['17:00'] ?? 0) + (availability['18:00'] ?? 0)
      : availability[time] ?? 0;

  // Reservations need a day's notice.
  const isTooSoon = (time: string): boolean => {
    if (!selectedDate) return true;
    const dateStr = selectedDate.toLocaleDateString('en-CA');
    const slotDateTime = new Date(`${dateStr}T${time}:00`);
    return slotDateTime.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  };

  const isTimeAvailable = (time: string): boolean =>
    !!selectedDate && !isTooSoon(time) && bookedCount(time) < maxPerSlot;

  const getBadgeColor = (time: string): SlotBadge => {
    if (!selectedDate || isTooSoon(time)) return 'red';
    const count = bookedCount(time);
    if (count >= maxPerSlot) return 'red';
    if (count === 1) return 'yellow';
    return 'green';
  };

  return { isTimeAvailable, getBadgeColor };
};
