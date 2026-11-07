// =====================================================================
// Reminders.gs — emails each devotee the evening before their Vagha seva
//
// (Editor > + > Script > "Reminders"). It reuses formatCellDate() from
// Code.gs and does not touch doGet/doPost.
//
// Sheet layout:
// ID | DEVOTEE_NAME | PHONE | EMAIL | BOOKING_DATE | SEVA_TYPE | STATUS | EMAIL_SENT | CREATED_AT
// Columns are looked up by header name (see getColumnIndexes in Code.gs),
// so their order in the sheet doesn't matter.
// =====================================================================

var REMINDER_CONFIG = {
  // The one contact address used everywhere: reply-to, the "Request Date
  // Change" button, the email footer and the plain-text version.
  CONTACT_EMAIL: 'shreechamatkarikdham@gmail.com',
  SENDER_NAME: 'Shree Chamatkarik Dham',
  // Leave "" to use the same sheet Code.gs uses (getActiveSheet()).
  SHEET_NAME: '',
  HOUR: 21,
  MINUTE: 30,
  REQUIRED_TIMEZONE: 'Asia/Kolkata',
  LOGO_URL:
    'https://drive.usercontent.google.com/download?id=1wT1ChZocoC5rmFynQ6nY0EIL1VOeZnwx&export=view&authuser=0',
  VENUE: 'A.G. Chowk, Kalawad Road, Rajkot – 360005',
  INSTAGRAM_URL: 'https://www.instagram.com/shreechamatkarikdham/',
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
      "Project time zone is '" +
        tz +
        "', expected '" +
        REMINDER_CONFIG.REQUIRED_TIMEZONE +
        "'. Fix it in Project Settings > Time zone, then run this again.",
    );
  }

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'sendTomorrowReminder') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('sendTomorrowReminder')
    .timeBased()
    .everyDays(1)
    .atHour(REMINDER_CONFIG.HOUR)
    .nearMinute(REMINDER_CONFIG.MINUTE)
    .inTimezone(tz)
    .create();

  Logger.log(
    'Daily reminder trigger installed for ~%s:%s (%s).',
    REMINDER_CONFIG.HOUR,
    REMINDER_CONFIG.MINUTE,
    tz,
  );
}

// Manual test: runs the reminder for TOMORROW right now. Also use it the
// first time to grant permissions.
// WARNING: this really emails the devotee booked for tomorrow, if any, and
// marks them in EMAIL_SENT. To test again, clear that cell in the sheet.
function testSendReminderNow() {
  var tz = Session.getScriptTimeZone();
  var result = sendRemindersForDate_(getTomorrowIso_(tz), tz);
  Logger.log(
    'Sent: %s | No email on file: %s | Failed: %s',
    result.sent.length,
    result.noEmail.length,
    result.failed.length,
  );
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

  var parts = targetIso.split('-');
  var dateLabel = Utilities.formatDate(
    new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])),
    tz,
    'dd / MM / yyyy',
  );

  var result = { sent: [], noEmail: [], failed: [] };
  var nowLabel = Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm');

  for (var i = 1; i < rows.length; i++) {
    // row 0 is the header
    var row = rows[i];
    if (!row[cols.id]) continue;
    if ((row[cols.status] || '').toString().toLowerCase() !== 'confirmed') continue;
    if (formatCellDate(row[cols.date]) !== targetIso) continue; // formatCellDate lives in Code.gs
    if (isAlreadySent_(row[cols.emailSent])) continue;

    var booking = {
      name: String(row[cols.name] || ''),
      phone: String(row[cols.phone] || ''),
      seva: row[cols.sevaType] === 'Friday' ? 'Friday Vagha Seva' : 'Special Day Vagha',
      email: String(row[cols.email] || '').trim(),
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
      emailSentCell.setValue('Sent ' + nowLabel);
      result.sent.push(booking);
    } catch (err) {
      booking.error = String(err);
      emailSentCell.setValue('Failed');
      result.failed.push(booking);
    }
  }

  return result;
}

function sendDevoteeEmail_(booking, dateLabel) {
  var subject = 'Reminder: Your Vagha Seva – ' + dateLabel;

  var options = {
    to: booking.email,
    name: REMINDER_CONFIG.SENDER_NAME,
    subject: subject,
    body: buildReminderText_(booking, dateLabel),
    htmlBody: buildReminderHtml_(booking, dateLabel),
  };

  options.replyTo = REMINDER_CONFIG.CONTACT_EMAIL;

  MailApp.sendEmail(options);
}

// ---------------------------------------------------------------------
// Plain-text email fallback
// ---------------------------------------------------------------------
function buildReminderText_(booking, dateLabel) {
  return [
    'Jai Siyaram, ' + booking.name + ' ji,',
    '',
    'This is a gentle reminder that your Vagha Seva at Shree Chamatkarik Hanumanji Mandir is scheduled for tomorrow.',
    '',
    'YOUR SEVA DETAILS',
    'Seva Date: ' + dateLabel,
    'Seva Type: ' + booking.seva,
    'Location: ' + REMINDER_CONFIG.VENUE,
    '',
    'Please arrive on time for your seva.',
    '',
    'Instagram: ' + REMINDER_CONFIG.INSTAGRAM_URL,
    '',
    'For any queries or date changes, please reply to this email or write to ' +
      REMINDER_CONFIG.CONTACT_EMAIL +
      '.',
    '',
    'Jai Hanumanji Maharaj!',
    'Shree Chamatkarik Dham',
  ].join('\n');
}

// ---------------------------------------------------------------------
// Professional HTML reminder email
// ---------------------------------------------------------------------
function buildReminderHtml_(booking, dateLabel) {
  var name = escapeHtml_(booking.name);
  var date = escapeHtml_(dateLabel);
  var seva = escapeHtml_(booking.seva);
  var venue = escapeHtml_(REMINDER_CONFIG.VENUE);
  var contactEmail = escapeHtml_(REMINDER_CONFIG.CONTACT_EMAIL);

  var insta = REMINDER_CONFIG.INSTAGRAM_URL;
  var logo = REMINDER_CONFIG.LOGO_URL;

  var mapsUrl = 'https://maps.app.goo.gl/4ysJ5XQeTw3BEwF27?g_st=ac';

  // "Request Date Change" button: opens the devotee's mail app with a
  // pre-filled reschedule request addressed to the temple.
  var helpEmail = REMINDER_CONFIG.CONTACT_EMAIL;
  var rescheduleSubject = encodeURIComponent(
    `Reschedule Request: ${booking.seva} (${booking.name})`,
  );
  var rescheduleBody = encodeURIComponent(
    `Jai Siyaram,\n\nI need to change my ${booking.seva} date currently scheduled for ${dateLabel}.\n\nMy preferred new date is: \nReason (optional): \n\nDevotee Name: ${booking.name}`,
  );
  // escapeHtml_ turns the "&" between subject and body into &amp;, which is
  // the correct way to write it inside an href attribute.
  var rescheduleUrl = escapeHtml_(
    `mailto:${helpEmail}?subject=${rescheduleSubject}&body=${rescheduleBody}`,
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Vagha Seva Reminder</title>

  <style>
    @media only screen and (max-width:480px) {
      .email-header {
        padding: 16px 12px !important;
      }

      .header-logo-cell {
        width: 72px !important;
        padding: 5px 10px 5px 0 !important;
      }

      .header-logo {
        width: 62px !important;
        height: 62px !important;
      }

      .header-title {
        font-size: 18px !important;
        line-height: 23px !important;
      }

      .header-subtitle {
        font-size: 12px !important;
        line-height: 18px !important;
      }

      .email-greeting {
        font-size: 20px !important;
        line-height: 27px !important;
      }

      .details-cell {
        padding: 15px 14px !important;
        font-size: 14px !important;
        line-height: 20px !important;
      }

      .details-value {
        font-size: 14px !important;
        line-height: 20px !important;
      }

      .content-cell {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#292929;">

  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    A gentle reminder about your upcoming Vagha Seva.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#f4f5f7;">
    <tr>
      <td align="center" style="padding:30px 12px;">

        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eeeeee;">

          <!-- Header -->
          <tr>
            <td align="center" class="email-header"
              style="padding:30px 24px;background-color:#f36b0b;background-image:linear-gradient(135deg,#f36b0b,#ff8c24);">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="115" valign="middle" align="center"
                    class="header-logo-cell"
                    style="width:115px;padding:5px 15px 5px 0;">

                    <img src="${logo}"
                      alt="Shree Chamatkarik Dham Logo"
                      width="100" height="100"
                      class="header-logo"
                      style="display:block;width:100px;height:100px;object-fit:contain;background:#ffffff;border-radius:50%;padding:5px;border:2px solid #ffe0bd;">
                  </td>

                  <td valign="middle" align="left">
                    <div class="header-title"
                      style="font-size:25px;line-height:33px;font-weight:700;color:#ffffff;">
                      Shree Chamatkarik Dham
                    </div>

                    <div class="header-subtitle"
                      style="font-size:16px;line-height:24px;color:#fff1df;padding-top:4px;">
                      Hanumanji Mandir, Rajkot, Gujarat
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-cell" style="padding:35px 32px 15px;">

              <div class="email-greeting"
                style="font-size:25px;line-height:34px;font-weight:700;color:#292929;">
                🙏 Jai Siyaram, ${name} ji,
              </div>

              <p style="font-size:16px;line-height:26px;color:#555555;margin:18px 0 0;">
                This is a gentle reminder that your
                <strong style="color:#333333;">Vagha Seva</strong>
                at
                <strong style="color:#333333;">Shree Chamatkarik Hanumanji Mandir</strong>
                is scheduled for tomorrow.
              </p>

              <!-- Reminder Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                style="margin-top:22px;">
                <tr>
                  <td style="background:#fff5e9;border:1px solid #f5d5ad;border-radius:20px;padding:7px 14px;">
                    <span style="font-size:12px;font-weight:bold;color:#b45309;">
                      ⏰ VAGHA SEVA REMINDER
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Seva Details -->
          <tr>
            <td class="content-cell" style="padding:15px 32px 10px;">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#fffaf5;border:1px solid #f3dfcc;border-radius:10px;">

                <tr>
                  <td colspan="2" style="padding:19px 20px 13px;">
                    <div style="font-size:12px;letter-spacing:1.5px;font-weight:bold;color:#b45309;">
                      YOUR SEVA DETAILS
                    </div>
                  </td>
                </tr>

                <!-- Seva Date -->
                <tr>
                  <td width="40%" valign="middle" class="details-cell"
                    style="padding:13px 14px;font-size:13px;color:#777777;border-top:1px solid #f1e8df;">
                    Seva Date
                  </td>
                  <td width="60%" align="right" valign="middle"
                    class="details-cell details-value"
                    style="padding:13px 14px;font-size:14px;font-weight:bold;color:#292929;border-top:1px solid #f1e8df;">
                    ${date}
                  </td>
                </tr>

                <!-- Seva Type -->
                <tr>
                  <td width="40%" valign="middle" class="details-cell"
                    style="padding:13px 14px;font-size:13px;color:#777777;border-top:1px solid #f1e8df;">
                    Seva Type
                  </td>
                  <td width="60%" align="right" valign="middle"
                    class="details-cell details-value"
                    style="padding:13px 14px;font-size:14px;font-weight:bold;color:#292929;border-top:1px solid #f1e8df;">
                    ${seva}
                  </td>
                </tr>

                <!-- Location -->
                <tr>
                  <td width="40%" valign="middle" class="details-cell"
                    style="padding:13px 14px;font-size:13px;color:#777777;border-top:1px solid #f1e8df;">
                    Location
                  </td>
                  <td width="60%" align="right" valign="middle"
                    class="details-cell details-value"
                    style="padding:13px 14px;font-size:13px;font-weight:bold;color:#292929;border-top:1px solid #f1e8df;">
                    <a href="${mapsUrl}"
                      target="_blank"
                      style="color:#292929;text-decoration:none;">
                      ${venue}
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td align="center" style="padding:22px 20px 15px;">

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="padding:5px;">
                    <a href="${insta}"
                      style="display:inline-block;background:#ffffff;color:#c13584;text-decoration:none;font-size:14px;font-weight:bold;padding:14px 20px;border:1px solid #e5b5ce;border-radius:7px;"
                      target="_blank">
                      Instagram
                    </a>
                  </td>

                  <td align="center" style="padding:5px;">
                    <a href="${mapsUrl}"
                      style="display:inline-block;background:#f36b0b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:14px 20px;border-radius:7px;"
                      target="_blank">
                      Location
                    </a>
                  </td>
                </tr>

                <tr>
                  <td colspan="2" align="center" style="padding:5px;">
                    <a href="${rescheduleUrl}"
                    style="display:block;background:#ffffff;color:#c45b18;text-decoration:none;font-size:14px;font-weight:bold;padding:14px 20px;border:1px solid #f36b0b;border-radius:7px;text-align:center;">
                    Request Date Change
                    </a>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Instagram Note -->
          <tr>
            <td class="content-cell" style="padding:15px 32px 10px;">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#fafafa;border:1px solid #eeeeee;border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;font-size:13px;line-height:22px;color:#777777;">
                    📸 Your Vagha Seva may be featured on our official
                    <a href="${insta}"
                      style="color:#c45b18;text-decoration:none;font-weight:bold;"
                      target="_blank">
                      Instagram page
                    </a>.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Thank You -->
          <tr>
            <td class="content-cell" style="padding:25px 32px 35px;">

              <p style="font-size:15px;line-height:25px;color:#555555;margin:15px 0 0;">
                🙏 Thank you for your devotion and for being part of Shree Chamatkarik Dham.
              </p>

              <p style="font-size:16px;line-height:24px;font-weight:bold;color:#333333;margin:12px 0 0;">
                Shree Chamatkarik Dham
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
              style="background:#f7f7f7;border-top:1px solid #eeeeee;padding:20px;">

              <div style="font-size:13px;line-height:23px;color:#666666;">
                📍 Rajkot, Gujarat, India
              </div>

              <div style="font-size:13px;line-height:23px;color:#666666;">
                ✉️ <a href="mailto:${contactEmail}" style="color:#c45b18;text-decoration:none;">${contactEmail}</a>
              </div>

              <div style="margin-top:15px;font-size:12px;color:#999999;">
                © 2026 Shree Chamatkarik Dham. All rights reserved.
              </div>

              <div style="margin-top:8px;font-size:11px;color:#aaaaaa;">
                This is an official system-generated Seva communication from Shree Chamatkarik Dham.
              </div>

            </td>
          </tr>

        </table>
        <!-- End Main Container -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// EMAIL_SENT counts as "not sent yet" when blank or an obvious placeholder
// ("No", "Failed", ...), so you can pre-fill the column however you like.
function isAlreadySent_(value) {
  var v = String(value || '')
    .trim()
    .toLowerCase();
  return ['', 'no', 'false', '0', 'pending', 'failed'].indexOf(v) === -1;
}

function isPlausibleEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

// Calendar-date math on plain Y/M/D parts in UTC, so it never depends on
// timezone offsets (no toISOString() on local dates).
function getTomorrowIso_(tz) {
  var t = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd').split('-');
  var next = new Date(Date.UTC(Number(t[0]), Number(t[1]) - 1, Number(t[2]) + 1));
  return Utilities.formatDate(next, 'UTC', 'yyyy-MM-dd');
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------
// DRY RUN: sends NOTHING and changes nothing. Run it from the editor
// (pick checkReminderSetup in the function dropdown > Run), then read the
// Execution log. It shows the setup and, row by row, why each devotee
// would or would not get tomorrow's reminder.
function checkReminderSetup() {
  var tz = Session.getScriptTimeZone();
  var tomorrow = getTomorrowIso_(tz);
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = REMINDER_CONFIG.SHEET_NAME
    ? spreadsheet.getSheetByName(REMINDER_CONFIG.SHEET_NAME)
    : spreadsheet.getActiveSheet();

  Logger.log('Project time zone: %s (expected %s)', tz, REMINDER_CONFIG.REQUIRED_TIMEZONE);
  Logger.log('Checking for booking date: %s', tomorrow);
  Logger.log('Sheet tab being read: %s', sheet ? sheet.getName() : 'NOT FOUND - check SHEET_NAME');
  Logger.log('Emails you can still send today: %s', MailApp.getRemainingDailyQuota());

  var triggers = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === 'sendTomorrowReminder';
  });
  Logger.log('Daily reminder triggers installed: %s (should be 1)', triggers.length);

  if (!sheet) return;

  var rows = sheet.getDataRange().getValues();
  var cols = getColumnIndexes(rows[0]);
  var wouldSend = 0;

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[cols.id]) continue;

    var status = (row[cols.status] || '').toString().toLowerCase();
    var date = formatCellDate(row[cols.date]);
    var email = String(row[cols.email] || '').trim();
    var reason;

    if (status !== 'confirmed') {
      reason = 'skipped: status is "' + status + '", not confirmed';
    } else if (date !== tomorrow) {
      reason = 'skipped: booking date is "' + date + '", not ' + tomorrow;
    } else if (isAlreadySent_(row[cols.emailSent])) {
      reason = 'skipped: EMAIL_SENT already says "' + row[cols.emailSent] + '"';
    } else if (!isPlausibleEmail_(email)) {
      reason = 'skipped: no valid email on file ("' + email + '")';
    } else {
      reason = 'WOULD SEND a reminder';
      wouldSend++;
    }

    Logger.log('Row %s | %s | %s', i + 1, row[cols.name], reason);
  }

  Logger.log('Done. Reminders that would be sent right now: %s', wouldSend);
}
