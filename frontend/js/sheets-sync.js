import { CONFIG } from "./config.js";
import { showToast } from "./notifications.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postToSheet(payload, { attempt = 1 } = {}) {
  try {
    await fetch(CONFIG.SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, secret: CONFIG.SYNC_SECRET }),
    });
    return true;
  } catch (err) {
    if (attempt <= CONFIG.SHEET_SYNC_MAX_RETRIES) {
      await sleep(CONFIG.SHEET_SYNC_RETRY_DELAY_MS);
      return postToSheet(payload, { attempt: attempt + 1 });
    }
    console.error(`Google Sheet sync failed after ${attempt} attempts:`, err);
    showToast(
      "Saved locally, but couldn't reach Google Sheets. Check your connection.",
      "error",
    );
    return false;
  }
}

// Maps a booking object to the sheet's column layout:
// ID | DEVOTEE NAME | PHONE NUMBER | BOOKING DATE | OCCASION | STATUS | CREATED AT
export function syncBookingToSheet(booking) {
  return postToSheet({
    id: booking.id,
    name: booking.name,
    // Space after the country code for readability in the sheet, e.g.
    // "+91 9876543210" instead of "+919876543210".
    phone: `${booking.countryCode || "+91"} ${booking.phone}`,
    date: booking.date || "",
    occasion: booking.dayType || "",
    status: booking.status || "",
    createdAt: booking.createdAt || null,
  });
}

export function deleteBookingFromSheet(id) {
  return postToSheet({ id, action: "delete" });
}

// Country codes offered in the Add Devotee form (see the #countryCode
// <select> in index.html). Longest-first so a search for a matching
// prefix below never stops early at a shorter code that happens to
// also match (none currently overlap, but this keeps it correct even
// if a code sharing a prefix is added later).
const KNOWN_COUNTRY_CODES = ["+971", "+91", "+65", "+61", "+44", "+1"];

// The sheet stores phone as one merged string (e.g. "+919876543210") since
// that's simplest for a human glancing at the spreadsheet. The app's data
// model needs country code and number as separate fields, so this splits
// it back apart on the way in.
function splitPhone(combined) {
  const str = String(combined || "").trim();
  for (const code of KNOWN_COUNTRY_CODES) {
    if (str.startsWith(code)) {
      // Strip the code, then any space(s) left behind before the number.
      return { countryCode: code, phone: str.slice(code.length).replace(/^\s+/, "") };
    }
  }
  // Unknown/missing prefix: fall back to +91 rather than guessing, and
  // strip a leading "+" if present so the raw digits are at least usable.
  return { countryCode: "+91", phone: str.replace(/^\+/, "").trim() };
}

function normalizeBooking(row) {
  const { countryCode, phone } = splitPhone(row.phone);
  return {
    id: row.id,
    name: row.name || "",
    phone,
    countryCode,
    dayType: row.dayType || "Friday",
    status: row.status || "waiting",
    date: row.date || null,
    createdAt: row.createdAt || null,
  };
}

// Fetches every devotee row from the sheet and maps it back into the
// app's booking shape. Unlike postToSheet, this is a plain GET (no
// no-cors) so the response can actually be read — Apps Script Web Apps
// deployed with "Anyone" access serve GET responses with the necessary
// headers for this to work cross-origin. If you see a CORS error in the
// browser console instead of data, double-check the deployment's access
// setting is "Anyone", not "Anyone with Google account".
export async function fetchBookingsFromSheet() {
  const url = `${CONFIG.SHEET_API_URL}?secret=${encodeURIComponent(CONFIG.SYNC_SECRET)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Sheet request failed (HTTP ${response.status}).`);
  }

  const data = await response.json();
  if (data.result !== "success") {
    throw new Error(data.message || "Unknown error loading bookings from Google Sheets.");
  }

  return (data.bookings || []).map(normalizeBooking);
}