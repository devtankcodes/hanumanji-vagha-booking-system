import { fetchBookingsFromSheet } from "./sheets-sync.js";

// In-memory only — no localStorage. The Google Sheet is now the single
// source of truth: this array is just the current session's local copy,
// (re)populated by loadBookingsFromSheet() on startup. Reloading the page
// re-fetches from the sheet rather than reading a cached local copy, so
// there's nothing here to go stale or get wiped by clearing site data.
let bookings = [];
let hasLoaded = false;

export function getBookings() {
  return bookings;
}

export function setBookings(newBookings) {
  bookings = newBookings;
}

// Call once on startup (see main.js) before the first render. Throws if
// the sheet can't be reached, so the caller can show an error state
// instead of silently rendering an empty list.
export async function loadBookingsFromSheet() {
  const fetched = await fetchBookingsFromSheet();
  bookings = fetched;
  hasLoaded = true;
  return bookings;
}

export function hasLoadedBookings() {
  return hasLoaded;
}