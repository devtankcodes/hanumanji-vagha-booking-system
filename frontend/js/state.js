const STORAGE_KEY = "vagha_bookings";

function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Could not read saved bookings, starting fresh:", err);
    return [];
  }
}

let bookings = loadBookings();

export function getBookings() {
  return bookings;
}

export function setBookings(newBookings) {
  bookings = newBookings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error("Could not save bookings:", err);
  }
}