import { getBookings, setBookings } from "./state.js";

// Max devotees allowed on a single vagha date. Adjust to match real capacity.
export const MAX_PER_DATE = 1;

export function isPhoneAlreadyRegistered(phone) {
  return getBookings().some(b => b.phone === phone && b.status !== "cancelled");
}

export function isDateFull(date) {
  const count = getBookings().filter(b => b.status === "confirmed" && b.date === date).length;
  return count >= MAX_PER_DATE;
}

export function addBooking({ name, phone, dayType }) {
  if (isPhoneAlreadyRegistered(phone)) {
    throw new Error("This phone number is already registered.");
  }

  const bookings = getBookings();
  const newBooking = {
    id: Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    dayType,
    status: "waiting",
    date: null,
    createdAt: Date.now()
  };

  setBookings([...bookings, newBooking]);
  return newBooking;
}

export function deleteBooking(id) {
  const bookings = getBookings();
  setBookings(bookings.filter(b => b.id !== id));
}

export function assignBooking(id, date) {
  if (isDateFull(date)) {
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

export function formatDate(date) {
  return date.toISOString().split("T")[0];
}