import { getBookings, setBookings } from "./state.js";
import { capitalizeWords } from "./validators.js";
import { syncBookingToSheet, deleteBookingFromSheet } from "./sheets-sync.js";

// Max devotees allowed on a single vagha date. Adjust to match real capacity.
export const MAX_PER_DATE = 1;

export function isPhoneAlreadyRegistered(phone, countryCode = "+91", excludeId = null) {
  return getBookings().some(
    (b) =>
      b.phone === phone &&
      (b.countryCode || "+91") === countryCode &&
      b.status !== "cancelled" &&
      b.id !== excludeId,
  );
}

export function isDateFull(date, excludeId = null) {
  const count = getBookings().filter(
    (b) => b.status === "confirmed" && b.date === date && b.id !== excludeId,
  ).length;
  return count >= MAX_PER_DATE;
}

export function addBooking({ name, phone, countryCode = "+91", dayType }) {
  if (isPhoneAlreadyRegistered(phone, countryCode)) {
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
    createdAt: Date.now(),
  };

  setBookings([...bookings, newBooking]);
  syncBookingToSheet(newBooking);
  return newBooking;
}

export function updateBooking(id, { name, phone, countryCode, dayType }) {
  const bookings = getBookings();
  const target = bookings.find((b) => b.id === id);
  const effectiveCountryCode = countryCode || (target ? target.countryCode : "+91") || "+91";

  if (isPhoneAlreadyRegistered(phone, effectiveCountryCode, id)) {
    throw new Error("This phone number is already registered.");
  }

  if (
    target &&
    target.status === "confirmed" &&
    dayType &&
    dayType !== target.dayType
  ) {
    throw new Error("Day type can't be changed after a booking is confirmed.");
  }

  const updated = bookings.map((b) =>
    b.id === id
      ? {
          ...b,
          name: name.trim(),
          phone: phone.trim(),
          ...(countryCode ? { countryCode } : {}),
          ...(b.status === "waiting" && dayType ? { dayType } : {}),
        }
      : b,
  );
  setBookings(updated);

  const editedBooking = updated.find((b) => b.id === id);
  if (editedBooking) {
    syncBookingToSheet(editedBooking);
  }
}

export function deleteBooking(id) {
  const bookings = getBookings();
  setBookings(bookings.filter((b) => b.id !== id));
  deleteBookingFromSheet(id);
}

export function removeCompletedBookings() {
  const today = getTodayLocal();
  const bookings = getBookings();
  const completed = bookings.filter(
    (b) => b.status === "confirmed" && b.date < today,
  );

  if (completed.length === 0) return;

  setBookings(bookings.filter((b) => !completed.includes(b)));

  // The sheet is the source of truth and gets re-fetched on every page
  // load, so these also need to be deleted there — otherwise a reload
  // would bring them right back even though they've been filtered out
  // of this session's local copy.
  completed.forEach((b) => deleteBookingFromSheet(b.id));
}

export function assignBooking(id, date) {
  if (isDateFull(date, id)) {
    throw new Error("That date is already fully booked. Please pick another.");
  }

  const bookings = getBookings();
  const updated = bookings.map((b) =>
    b.id === id ? { ...b, date, status: "confirmed" } : b,
  );
  setBookings(updated);

  const confirmedBooking = updated.find((b) => b.id === id);
  if (confirmedBooking) {
    syncBookingToSheet(confirmedBooking);
  }
}

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

export function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
}

export function getTodayLocal() {
  return formatDate(new Date());
}