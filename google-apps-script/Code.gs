// Header text (row 1) of every column the script uses. Columns are found
// by these NAMES, never by position, so you can reorder columns or insert
// new ones anywhere in the sheet without touching this code. Matching is
// case-insensitive; a missing header throws a clear error.
var COLUMN_HEADERS = {
  id: 'ID',
  name: 'DEVOTEE_NAME',
  phone: 'PHONE',
  email: 'EMAIL',
  date: 'BOOKING_DATE',
  sevaType: 'SEVA_TYPE',
  status: 'STATUS',
  emailSent: 'EMAIL_SENT',
  createdAt: 'CREATED_AT',
};

// Returns { id: 0, name: 1, ... } (0-based positions) from the header row.
function getColumnIndexes(headerRow) {
  var normalized = headerRow.map(function (h) {
    return String(h).trim().toUpperCase();
  });
  var cols = {};
  Object.keys(COLUMN_HEADERS).forEach(function (key) {
    var index = normalized.indexOf(COLUMN_HEADERS[key]);
    if (index === -1) {
      throw new Error('Sheet is missing the "' + COLUMN_HEADERS[key] + '" column header in row 1.');
    }
    cols[key] = index;
  });
  return cols;
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    verifyUser(data.idToken);

    if (!data.id) {
      throw new Error('Missing required field: id.');
    }

    var values = sheet.getDataRange().getValues();
    var cols = getColumnIndexes(values[0]);
    var existingRow = findRowById(values, cols, data.id);

    if (data.action === 'delete') {
      if (existingRow) {
        sheet.deleteRow(existingRow);
      }
      return jsonResponse({ result: 'success', action: 'deleted', id: data.id });
    }

    if (!data.name || !data.phone) {
      throw new Error('Missing required fields (name, phone).');
    }

    // Start from the existing row (so any extra columns you add to the
    // sheet are left alone) or a blank row for a new devotee, then fill
    // in each known column by its header position.
    var width = values[0].length;
    var row = existingRow ? values[existingRow - 1].slice() : new Array(width).fill('');

    // CREATED AT should only be stamped once, on first insert — not
    // overwritten every time an existing devotee is updated/reassigned.
    var createdAt = existingRow ? row[cols.createdAt] : new Date();

    // Remember the old booking date before it's overwritten below, so we
    // can tell whether this save moved the booking to a different day.
    var previousDate = existingRow ? formatCellDate(row[cols.date]) : '';

    row[cols.id] = data.id;
    row[cols.name] = data.name;
    // Leading apostrophe forces Sheets to store this as literal text
    // instead of auto-detecting "+91 9876543210" as a number and
    // silently stripping the "+" (and the space) — this is exactly why
    // freshly-added devotees were showing up without a "+" while
    // edited/reassigned ones weren't: appendRow() on a fresh cell
    // triggers Sheets' auto-number detection, but setValues() on an
    // already-text cell from a prior write doesn't re-trigger it.
    row[cols.phone] = data.phone ? "'" + data.phone : '';
    // EMAIL is optional. Stored trimmed + lowercase; blank clears it.
    row[cols.email] = data.email ? String(data.email).trim().toLowerCase() : '';
    // BOOKING DATE is written as a real Date object (not forced text)
    // built from the incoming "YYYY-MM-DD" string's own year/month/day
    // components — never `new Date(isoString)`, which parses as UTC and
    // can silently shift a day off in IST. Writing a real Date (instead
    // of fighting Sheets' auto-conversion with a leading apostrophe,
    // like phone above) is what lets the setNumberFormat() call below
    // guarantee every row displays the same dd/mm/yyyy format, whether
    // the row was just inserted or is being edited/reassigned.
    row[cols.date] = parseIsoDateLocal(data.date);
    row[cols.sevaType] = data.occasion || '';
    // Stored capitalized ("Waiting" / "Confirmed") purely for a nicer-
    // looking sheet — the app itself works with lowercase status
    // internally (see doGet below, which lowercases it again on the
    // way back in), so this is display-only and doesn't need any
    // changes elsewhere in the app.
    row[cols.status] = capitalize(data.status);
    row[cols.createdAt] = createdAt;
    // EMAIL_SENT is owned by Reminders.gs. It's cleared only for a brand-
    // new row or when the booking date changes (an old reminder no longer
    // applies to the new date); every other edit leaves it untouched.
    if (!existingRow || previousDate !== (data.date || '')) {
      row[cols.emailSent] = '';
    }

    var targetRow;
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, width).setValues([row]);
      targetRow = existingRow;
    } else {
      sheet.appendRow(row);
      targetRow = sheet.getLastRow();
    }

    // Setting the number format explicitly on every write is what keeps
    // the display format identical across appendRow() and setValues() —
    // see the comment on parseIsoDateLocal below for why that distinction
    // otherwise causes mismatched formats. (+1: getRange is 1-based.)
    if (data.date) {
      sheet.getRange(targetRow, cols.date + 1).setNumberFormat('dd/mm/yyyy');
    }

    return jsonResponse({ result: 'success', id: data.id });
  } catch (error) {
    return jsonResponse({ result: 'error', message: error.toString() });
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    verifyUser(params.idToken);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var cols = getColumnIndexes(data[0]);
    var bookings = [];

    // Row 1 is the header, so data rows start at index 1.
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[cols.id]) continue; // skip any stray blank row

      var createdAt = row[cols.createdAt];
      bookings.push({
        id: row[cols.id],
        name: row[cols.name],
        phone: row[cols.phone],
        email: row[cols.email] ? String(row[cols.email]).trim() : '',
        date: formatCellDate(row[cols.date]),
        dayType: row[cols.sevaType],
        // Sheet stores "Waiting"/"Confirmed" for readability; the app's
        // own logic checks lowercase ("waiting"/"confirmed"), so it's
        // normalized back here.
        status: (row[cols.status] || '').toString().toLowerCase(),
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      });
    }

    return jsonResponse({ result: 'success', bookings: bookings });
  } catch (error) {
    return jsonResponse({ result: 'error', message: error.toString() });
  }
}

// Converts the app's "YYYY-MM-DD" string into a real Date built from its
// own year/month/day components (not `new Date(isoString)`, which parses
// as UTC midnight and can display a day early in timezones ahead of UTC,
// like IST). Returns "" untouched for an empty/missing date so a
// still-waiting booking's blank BOOKING DATE cell stays blank.
function parseIsoDateLocal(isoStr) {
  if (!isoStr) return '';
  var parts = String(isoStr).split('-');
  if (parts.length !== 3) return isoStr; // unexpected shape: leave as-is rather than guess
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// Reads BOOKING DATE back out. Rows written after this fix are always a
// real Date (see parseIsoDateLocal + the setNumberFormat call in doPost),
// formatted here using the script's own timezone rather than
// toISOString() (which is UTC and would silently shift the date back a
// day for IST spreadsheets). The plain-string branch below only exists
// for rows written before this fix, which may still hold raw text like
// "2027-01-20" — editing or reassigning one of those bookings resaves it
// as a proper Date and it'll display consistently from then on.
function formatCellDate(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

// "waiting" -> "Waiting", "confirmed" -> "Confirmed". Used only for how
// STATUS looks in the sheet — see the comment at the doPost() call site.
function capitalize(value) {
  var str = (value || '').toString();
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// Returns the 1-based sheet row number for an ID, or null. Works on the
// values already read by the caller (one sheet read per request).
function findRowById(values, cols, id) {
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][cols.id]) === String(id)) {
      return i + 1;
    }
  }
  return null;
}

// ---------------------------------------------------------------------
// Authentication: Firebase ID token + email allowlist
// ---------------------------------------------------------------------
// The Firebase web API key identifies the project and is safe to be
// public (it is already in frontend/js/auth.js).
var FIREBASE_API_KEY = 'AIzaSyBA2EmXaFdCwMXmQYCkgcNflr1ZJ2PW5O8';

// Rejects the request unless it carries a valid Firebase ID token that
// belongs to an allowed staff email. Google verifies the token (signature,
// expiry, project); we then check the email against ALLOWED_EMAILS, a
// comma-separated list in Script Properties (Project Settings > Script
// Properties), so the list never has to live in the public repo.
// Fails closed: no allowlist configured means nobody gets in.
function verifyUser(idToken) {
  if (!idToken) {
    throw new Error('Unauthorized.');
  }

  var allowedRaw = PropertiesService.getScriptProperties().getProperty('ALLOWED_EMAILS');
  if (!allowedRaw) {
    throw new Error('Server misconfigured: ALLOWED_EMAILS is not set in Script Properties.');
  }
  var allowed = allowedRaw.split(',').map(function (e) {
    return e.trim().toLowerCase();
  });

  var cache = CacheService.getScriptCache();
  var cacheKey =
    'u_' +
    Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken),
    );
  var email = cache.get(cacheKey);

  if (!email) {
    var response = UrlFetchApp.fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ idToken: idToken }),
        muteHttpExceptions: true,
      },
    );
    if (response.getResponseCode() !== 200) {
      throw new Error('Unauthorized.');
    }
    var users = JSON.parse(response.getContentText()).users;
    if (!users || !users[0] || !users[0].email) {
      throw new Error('Unauthorized.');
    }
    email = String(users[0].email).toLowerCase();
    cache.put(cacheKey, email, 300);
  }

  if (allowed.indexOf(email) === -1) {
    throw new Error('Unauthorized.');
  }
  return email;
}

// Run this ONCE from the editor (select it in the function dropdown, click
// Run) so Google asks you to approve the "connect to an external service"
// permission that verifyUser() needs.
function authorizeExternalRequests() {
  UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/', { muteHttpExceptions: true });
}
