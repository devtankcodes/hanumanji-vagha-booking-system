// =====================================================================
// Reminders.gs — emails each devotee the evening before their Vagha seva
//
// Add as a NEW file in the same Apps Script project as Code.gs
// (Editor > + > Script > "Reminders"). It reuses formatCellDate() from
// Code.gs and does not touch doGet/doPost.
//
// Sheet layout:
// ID | DEVOTEE_NAME | PHONE | EMAIL | BOOKING_DATE | SEVA_TYPE | STATUS | EMAIL_SENT | CREATED_AT
// Columns are looked up by header name (see getColumnIndexes in Code.gs),
// so their order in the sheet doesn't matter.
// =====================================================================

var REMINDER_CONFIG = {
  // Optional. When a devotee replies to the reminder, the reply goes here.
  // Leave "" to let replies go to the sending Google account instead.
  REPLY_TO_EMAIL: "shreechamatkarikdham@gmail.com",
  SENDER_NAME: "Shree Chamatkarik Dham",
  // Leave "" to use the same sheet Code.gs uses (getActiveSheet()).
  SHEET_NAME: "",
  HOUR: 21,
  MINUTE: 30,
  REQUIRED_TIMEZONE: "Asia/Kolkata",
  VENUE: "A.G. Chowk, Kalawad Road, Rajkot – 360005",
  INSTAGRAM_URL: "https://www.instagram.com/shreechamatkarikdham/"
};

// ---------------------------------------------------------------------
// Entry point for the time-driven trigger.
// ---------------------------------------------------------------------
function sendTomorrowReminder() {
  var tz = Session.getScriptTimeZone();
  // No double-send guard needed here: every row's EMAIL_SENT cell records
  // who has already been emailed, so a retried run skips them.
  sendRemindersForDate_(getTomorrowIso_(tz), tz);
}

// Run ONCE from the editor to install the ~9:30 PM daily trigger.
// Safe to re-run: it replaces any older copy.
function setupDailyReminderTrigger() {
  var tz = Session.getScriptTimeZone();
  if (tz !== REMINDER_CONFIG.REQUIRED_TIMEZONE) {
    throw new Error(
      "Project time zone is '" + tz + "', expected '" + REMINDER_CONFIG.REQUIRED_TIMEZONE +
      "'. Fix it in Project Settings > Time zone, then run this again."
    );
  }

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "sendTomorrowReminder") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("sendTomorrowReminder")
    .timeBased()
    .everyDays(1)
    .atHour(REMINDER_CONFIG.HOUR)
    .nearMinute(REMINDER_CONFIG.MINUTE)
    .inTimezone(tz)
    .create();

  Logger.log("Daily reminder trigger installed for ~%s:%s (%s).", REMINDER_CONFIG.HOUR, REMINDER_CONFIG.MINUTE, tz);
}

// Manual test: runs the reminder for TOMORROW right now. Also use it the
// first time to grant permissions.
// WARNING: this really emails the devotee booked for tomorrow, if any, and
// marks them in EMAIL_SENT. To test again, clear that cell in the sheet.
function testSendReminderNow() {
  var tz = Session.getScriptTimeZone();
  var result = sendRemindersForDate_(getTomorrowIso_(tz), tz);
  Logger.log("Sent: %s | No email on file: %s | Failed: %s", result.sent.length, result.noEmail.length, result.failed.length);
}

// ---------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------
function sendRemindersForDate_(targetIso, tz) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = REMINDER_CONFIG.SHEET_NAME
    ? spreadsheet.getSheetByName(REMINDER_CONFIG.SHEET_NAME)
    : spreadsheet.getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var cols = getColumnIndexes(rows[0]);

  var parts = targetIso.split("-");
  var dateLabel = Utilities.formatDate(
    new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])),
    tz,
    "EEEE, dd-MM-yyyy"
  );

  var result = { sent: [], noEmail: [], failed: [] };
  var nowLabel = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm");

  for (var i = 1; i < rows.length; i++) { // row 0 is the header
    var row = rows[i];
    if (!row[cols.id]) continue;
    if ((row[cols.status] || "").toString().toLowerCase() !== "confirmed") continue;
    if (formatCellDate(row[cols.date]) !== targetIso) continue; // formatCellDate lives in Code.gs
    if (isAlreadySent_(row[cols.emailSent])) continue;

    var booking = {
      name: String(row[cols.name] || ""),
      phone: String(row[cols.phone] || ""),
      seva: row[cols.sevaType] === "Friday" ? "Friday Vagha Seva" : "Special Day Vagha Seva",
      email: String(row[cols.email] || "").trim()
    };

    if (!isPlausibleEmail_(booking.email)) {
      result.noEmail.push(booking);
      continue;
    }

    var emailSentCell = sheet.getRange(i + 1, cols.emailSent + 1); // getRange is 1-based
    try {
      sendDevoteeEmail_(booking, dateLabel);
      // Written immediately after each send, so a crash part-way through
      // can never cause the same devotee to be emailed twice.
      emailSentCell.setValue("Sent " + nowLabel);
      result.sent.push(booking);
    } catch (err) {
      booking.error = String(err);
      emailSentCell.setValue("Failed");
      result.failed.push(booking);
    }
  }

  return result;
}

function sendDevoteeEmail_(b, dateLabel) {
  var venue = REMINDER_CONFIG.VENUE;
  var insta = REMINDER_CONFIG.INSTAGRAM_URL;

  var options = {
    to: b.email,
    name: REMINDER_CONFIG.SENDER_NAME,
    subject: "Vagha Seva Reminder — Tomorrow, " + dateLabel,
    body:
      "🙏 Jai Siyaram, " + b.name + " ji,\n\n" +
      "This is a gentle reminder that your Vagha seva at Shree Chamatkarik Hanumanji Mandir is tomorrow.\n\n" +
      "Date: " + dateLabel + "\n" +
      "Seva: " + b.seva + "\n" +
      "Venue: " + venue + "\n\n" +
      "Your Vagha seva may be featured on our official Instagram page:\n" + insta + "\n\n" +
      "For any queries or changes, please reply to this email.\n\n" +
      "🙏 Jai Hanumanji Maharaj 🚩\n— Shree Chamatkarik Dham",
    htmlBody:
      "<div style='font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222'>" +
      "<p>🙏 Jai Siyaram, <b>" + escapeHtml_(b.name) + "</b> ji,</p>" +
      "<p>This is a gentle reminder that your Vagha seva at <b>Shree Chamatkarik Hanumanji Mandir</b> is tomorrow.</p>" +
      "<p>📅 <b>Date:</b> " + escapeHtml_(dateLabel) + "<br>" +
      "🕉️ <b>Seva:</b> " + escapeHtml_(b.seva) + "<br>" +
      "📍 <b>Venue:</b> " + escapeHtml_(venue) + "</p>" +
      "<p>📸 Your Vagha seva may be featured on our official Instagram page:<br>" +
      "<a href='" + insta + "'>" + insta + "</a></p>" +
      "<p>For any queries or changes, please reply to this email.</p>" +
      "<p>🙏 Jai Hanumanji Maharaj 🚩<br>— <b>Shree Chamatkarik Dham</b></p></div>"
  };
  if (REMINDER_CONFIG.REPLY_TO_EMAIL) options.replyTo = REMINDER_CONFIG.REPLY_TO_EMAIL;

  MailApp.sendEmail(options);
}

// EMAIL_SENT counts as "not sent yet" when blank or an obvious placeholder
// ("No", "Failed", ...), so you can pre-fill the column however you like.
function isAlreadySent_(value) {
  var v = String(value || "").trim().toLowerCase();
  return ["", "no", "false", "0", "pending", "failed"].indexOf(v) === -1;
}

function isPlausibleEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

// Calendar-date math on plain Y/M/D parts in UTC, so it never depends on
// timezone offsets (no toISOString() on local dates).
function getTomorrowIso_(tz) {
  var t = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd").split("-");
  var next = new Date(Date.UTC(Number(t[0]), Number(t[1]) - 1, Number(t[2]) + 1));
  return Utilities.formatDate(next, "UTC", "yyyy-MM-dd");
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}