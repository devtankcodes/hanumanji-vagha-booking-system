import { getBookings, setBookings } from "./state.js";
import { capitalizeWords } from "./validators.js";

// Max devotees allowed on a single vagha date. Adjust to match real capacity.
export const MAX_PER_DATE = 1;

export function isPhoneAlreadyRegistered(phone, excludeId = null) {
  return getBookings().some(
    b => b.phone === phone && b.status !== "cancelled" && b.id !== excludeId
  );
}

export function isDateFull(date, excludeId = null) {
  const count = getBookings().filter(
    b => b.status === "confirmed" && b.date === date && b.id !== excludeId
  ).length;
  return count >= MAX_PER_DATE;
}

export function addBooking({ name, phone, countryCode = "+91", dayType }) {
  if (isPhoneAlreadyRegistered(phone)) {
    throw new Error("This phone number is already registered.");
  }

  const bookings = getBookings();
  const newBooking = {
    id: Date.now(),
    name: capitalizeWords(name.trim()),
    phone: phone.trim(),
    countryCode,
    dayType,
    status: "waiting",
    date: null,
    createdAt: Date.now()
  };

  setBookings([...bookings, newBooking]);
  return newBooking;
}

// Updates name/phone/dayType on an existing booking. Day type may only be
// changed while the booking is still "waiting" — a confirmed booking already
// has a date tied to its type, so changing type there could leave a Friday
// date attached to a "Special" booking or vice versa.
export function updateBooking(id, { name, phone, dayType }) {
  if (isPhoneAlreadyRegistered(phone, id)) {
    throw new Error("This phone number is already registered.");
  }

  const bookings = getBookings();
  const target = bookings.find(b => b.id === id);

  if (target && target.status === "confirmed" && dayType && dayType !== target.dayType) {
    throw new Error("Day type can't be changed after a booking is confirmed.");
  }

  const updated = bookings.map(b =>
    b.id === id
      ? {
          ...b,
          name: name.trim(),
          phone: phone.trim(),
          ...(b.status === "waiting" && dayType ? { dayType } : {})
        }
      : b
  );
  setBookings(updated);
}

export function deleteBooking(id) {
  const bookings = getBookings();
  setBookings(bookings.filter(b => b.id !== id));
}

// Removes confirmed bookings whose Vagha date has already passed.
// Call this once on app startup so completed bookings never linger
// in the Confirmed List. Waiting-list entries are untouched since
// they have no date yet.
export function removeCompletedBookings() {
  const today = getTodayLocal();
  const bookings = getBookings();
  const stillRelevant = bookings.filter(
    b => !(b.status === "confirmed" && b.date < today)
  );

  if (stillRelevant.length !== bookings.length) {
    setBookings(stillRelevant);
  }
}

export function assignBooking(id, date) {
  if (isDateFull(date, id)) {
    throw new Error("That date is already fully booked. Please pick another.");
  }

  const bookings = getBookings();
  const updated = bookings.map(b =>
    b.id === id ? { ...b, date, status: "confirmed" } : b
  );
  setBookings(updated);
}

// Suggests the next Friday that isn't already fully booked.
export function getNextAvailableFriday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  for (let i = 0; i < 366; i++) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 5) {
      const formatted = formatDate(date);
      if (!isDateFull(formatted)) {
        return formatted;
      }
    }
  }
  return null;
}

/**
 * Formats a Date object as YYYY-MM-DD using LOCAL date parts (never
 * toISOString/UTC — that silently shifts the date back a day for any
 * timezone ahead of UTC, like India).
 *
 * This is the INTERNAL/storage format. It must stay YYYY-MM-DD because:
 *  - native <input type="date"> always reads/writes YYYY-MM-DD
 *  - every date comparison in this app (capacity checks, sorting,
 *    "next available Friday", calendar highlighting) relies on that
 *    string sorting/comparing correctly, which only YYYY-MM-DD does.
 *
 * For anything shown to the user, use `formatDateDisplay` instead —
 * never render this value directly in the UI.
 */
export function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Converts a stored YYYY-MM-DD date string to DD-MM-YYYY for display.
 * Use this everywhere a booking date is shown on screen (lists,
 * calendar tooltips, etc.) — never change the stored/internal format.
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
}

// Returns today's date as YYYY-MM-DD in local time (internal format).
export function getTodayLocal() {
  return formatDate(new Date());
}