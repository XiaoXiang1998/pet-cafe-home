export const RESERVATION_START_MINUTES = 10 * 60;
export const RESERVATION_END_MINUTES = 21 * 60;
export const RESERVATION_SLOT_MINUTES = 30;

export const RESERVATION_TIME_OPTIONS = Array.from(
  { length: (RESERVATION_END_MINUTES - RESERVATION_START_MINUTES) / RESERVATION_SLOT_MINUTES + 1 },
  (_, index) => {
    const totalMinutes = RESERVATION_START_MINUTES + index * RESERVATION_SLOT_MINUTES;
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');

    return `${hours}:${minutes}`;
  },
);

export const normalizeSlotTime = (value) => String(value ?? '').slice(0, 5);

export const buildAvailabilityByTime = (rows = []) =>
  rows.reduce((slots, row) => {
    slots[normalizeSlotTime(row.slot_time)] = {
      ...row,
      slot_time: normalizeSlotTime(row.slot_time),
      booked_count: Number(row.booked_count ?? 0),
      remaining_count: Number(row.remaining_count ?? 0),
      is_available: Boolean(row.is_available),
    };
    return slots;
  }, {});

export const isAvailabilitySlotOpen = (slot) =>
  Boolean(slot?.is_available) && Number(slot?.remaining_count ?? 0) > 0;
