# 🙏 Hanumanji Vagha Booking System

A lightweight, login-protected booking tracker for **Shree Chamatkarik Hanumanji
Mandir's** weekly and special Vagha days: waiting list, confirmed list, a visual
calendar, one-tap WhatsApp confirmations and automatic email reminders. Data
lives in a Google Sheet, so the temple admin can manage everything from a
spreadsheet they already know.

![Frontend](<https://img.shields.io/badge/frontend-vanilla%20JS%20(ES%20modules)-f7df1e>)
![Build](https://img.shields.io/badge/build%20step-none-success)
![Auth](https://img.shields.io/badge/auth-Firebase%20Authentication-ffca28)
![Storage](https://img.shields.io/badge/data%20store-Google%20Sheets-34a853)
![Calendar](https://img.shields.io/badge/calendar-FullCalendar%206-4285f4)

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Setup Guide](#setup-guide)
- [Managing Staff Access](#managing-staff-access)
- [Customizing](#customizing)
- [Validation Rules](#validation-rules)
- [Deployment](#deployment)
- [Security Model](#security-model)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Temple staff sign in, then add devotees to a **waiting list** with a name, phone
number and optional email. Assigning a Vagha date moves a devotee to the
**confirmed list**. The app suggests the next available Friday, prevents
double-booking a date or a phone number, and generates a ready-to-send WhatsApp
confirmation. A calendar shows every confirmed date at a glance, and a daily
Google Apps Script job emails devotees a reminder the evening before their seva.

Only staff whose email is on an allowlist can read or change any data.

## How It Works

```
┌──────────┐   1. email + password   ┌────────────────┐
│          │ ──────────────────────▶ │ Firebase Auth  │
│          │ ◀────────────────────── │                │
│ Browser  │      2. ID token        └────────────────┘
│ (static  │
│  site)   │   3. fetch + ID token   ┌───────────────────────┐   ┌────────────┐
│          │ ──────────────────────▶ │ Apps Script Web App   │──▶│   Google   │
│          │ ◀────────────────────── │ verifies token and    │◀──│   Sheet    │
└──────────┘    4. bookings JSON     │ checks email allowlist│   └────────────┘
                                     └───────────────────────┘
```

- **Login:** `login.html` signs in with Firebase Authentication
  (email/password). `index.html` stays hidden and loads no data until Firebase
  confirms a signed-in user.
- **Data:** the Google Sheet is the single source of truth. Nothing is cached in
  `localStorage`; every page load fetches the full booking list.
- **Authorization:** every request to the Apps Script Web App carries the user's
  Firebase ID token. `google-apps-script/Code.gs` has Google verify the token,
  then checks the user's email against `ALLOWED_EMAILS` (a Script Property).
  Anything else gets `Unauthorized.`
- **Reads and writes:** reads are a `GET` (the response is read cross-origin).
  Writes and deletes are a `no-cors` `POST` with automatic retry.
- **Reminders:** `google-apps-script/Reminders.gs` runs on a daily time-driven
  trigger inside the same Apps Script project and does not go through the web
  app.

## Features

- **Staff login** with Firebase Authentication, plus a logout button
- **Add a devotee** to the waiting list with name, phone (selectable country
  code, default `+91`) and an optional email
- Live input cleaning: names are letters-only and auto-capitalized per word
  (`"dev tank"` becomes `"Dev Tank"`); emails get a "Did you mean…?" hint for
  common domain typos
- **Edit** a waiting or confirmed devotee (day type is locked once confirmed)
- **Assign** a Vagha date with a smart "next available Friday" suggestion, a
  Friday-only check for Friday-type bookings, and a per-date capacity check
- Duplicate-phone and duplicate-date protection
- Confirmed list highlights the soonest upcoming booking and offers a **one-tap
  WhatsApp confirmation** (date, seva, venue, Instagram link)
- **Calendar view** (FullCalendar) with confirmed dates and the next available
  Friday highlighted
- **Delete** with a named confirmation prompt and toast feedback
- Past confirmed bookings are removed automatically on app load
- **Daily email reminders** the evening before the seva (Apps Script trigger)
- Every add, edit, assign and delete syncs to the Google Sheet

## Tech Stack

| Layer          | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Frontend       | Vanilla JavaScript (ES modules), no framework, no build step  |
| Styling        | Plain CSS split by concern (`base`, `layout`, `forms`, etc.)  |
| Calendar       | [FullCalendar 6](https://fullcalendar.io/) via CDN            |
| Authentication | [Firebase Authentication](https://firebase.google.com/) (web) |
| Data store     | Google Sheets via a Google Apps Script Web App                |
| Reminders      | Apps Script time-driven trigger + `MailApp`                   |
| Hosting        | GitHub Pages (any static host works)                          |

## Project Structure

```
hanumanji-vagha-booking-system/
├── index.html                  # App (hidden until login is confirmed)
├── login.html                  # Staff sign-in page
├── frontend/
│   ├── assets/logo.png
│   ├── css/                    # base, layout, forms, buttons, entries,
│   │                           # calendar, overlays, responsive (main.css
│   │                           # imports them all)
│   └── js/
│       ├── main.js             # Form wiring and startup sequence
│       ├── auth.js             # Firebase init, login/logout, auth guards,
│       │                       # getIdToken()
│       ├── config/
│       │   ├── config.js       # Apps Script URL + sync retry settings
│       │   └── state.js        # In-memory booking list, loaded from sheet
│       ├── services/
│       │   ├── service.js      # Business rules: add/update/assign/delete,
│       │   │                   # capacity, date logic
│       │   ├── sheets-sync.js  # Talks to the Apps Script Web App
│       │   └── whatsapp.js     # Builds the WhatsApp confirmation link
│       ├── ui/                 # ui.js (lists), calendar.js, modal.js (assign
│       │                       # date), edit-modal.js, notifications.js
│       └── utils/
│           ├── validators.js   # Name, phone and email rules and cleaning
│           └── icons.js        # Inline SVG icon set
├── google-apps-script/
│   ├── Code.gs                 # doGet/doPost + Firebase token verification
│   └── Reminders.gs            # Daily reminder emails
├── backend/                    # Optional Express static server (git-ignored)
├── database/schema.sql         # Unused future schema (git-ignored)
├── email.html                  # Email template draft (git-ignored)
├── .prettierrc / .editorconfig # Formatting rules
└── README.md
```

## Getting Started

### Prerequisites

- A modern browser
- A Google account (Sheet + Apps Script)
- A Firebase project (free Spark plan is enough)
- A local web server for development. The app uses ES modules and Firebase, so
  opening `index.html` by double-clicking (`file://`) does **not** work.

### Run locally

After completing the [Setup Guide](#setup-guide), serve the project root with
any static server, for example the VS Code **Live Server** extension or:

```bash
npx serve .
# or
python -m http.server 5500
```

Open the server's address, for example `http://127.0.0.1:5500/login.html`.
Firebase may log a harmless notice that `127.0.0.1` is not an authorized OAuth
domain. Email/password sign-in still works; add the domain under Authentication
→ Settings → Authorized domains to silence it.

## Setup Guide

Do these in order. You need three things to agree: the Sheet, the Apps Script
project that is attached to it, and the Firebase project.

### 1. Google Sheet

Create a sheet with this header row (row 1). Columns are found **by name**, so
their order does not matter and extra columns are left alone:

```
ID | DEVOTEE_NAME | PHONE | EMAIL | BOOKING_DATE | SEVA_TYPE | STATUS | EMAIL_SENT | CREATED_AT
```

The script uses the sheet's active tab.

### 2. Firebase

1. Create a project at
   [console.firebase.google.com](https://console.firebase.google.com).
2. Add a **Web app** (`</>` icon). Skip Firebase Hosting. Copy the
   `firebaseConfig` values into `frontend/js/auth.js`.
3. Keep the two SDK imports at the top of `auth.js` on the **same version**
   (`firebase-app.js` and `firebase-auth.js`). Mixed versions break login.
4. **Authentication → Sign-in method:** enable **Email/Password** only. Leave
   _Email link (passwordless)_ off.
5. **Authentication → Users → Add user:** create an account for each staff
   member.
6. **Authentication → Settings → User actions:** turn **off** _Enable create
   (sign-up)_ so nobody can self-register.
7. **Authentication → Settings → Authorized domains:** add your hosting domain,
   for example `devtankcodes.github.io`.

### 3. Apps Script

1. In the sheet, choose **Extensions → Apps Script**. (The script must be
   attached to the sheet because it uses the active spreadsheet.)
2. Paste in `google-apps-script/Code.gs`. Add `Reminders.gs` as a second file if
   you want email reminders.
3. In `Code.gs`, set `FIREBASE_API_KEY` to your Firebase web API key (the same
   `apiKey` as in `auth.js`; it is not a secret).
4. **Project Settings → Script properties → Add property:** `ALLOWED_EMAILS` =
   comma-separated staff emails, for example `a@example.com, b@example.com`.
   Without this property nobody is allowed in.
5. Select the `authorizeExternalRequests` function in the editor and click
   **Run** once. Approve the permission prompt (the script contacts Google to
   verify tokens).
6. **Deploy → New deployment → Web app:** _Execute as_ **Me**, _Who has access_
   **Anyone**. (It must be Anyone because the browser calls it directly; the
   Firebase token check is what protects the data.) Copy the Web app URL.

### 4. Frontend config

Put the Web app URL into `frontend/js/config/config.js`:

```js
export const CONFIG = {
  SHEET_API_URL: 'https://script.google.com/macros/s/XXXX/exec',
  SHEET_SYNC_MAX_RETRIES: 2,
  SHEET_SYNC_RETRY_DELAY_MS: 1500,
};
```

**Check the deployment:** open the `/exec` URL in a private window. You should
see `{"result":"error","message":"Error: Unauthorized."}`, not any bookings.

**Updating the script later:** after editing `Code.gs`, use **Deploy → Manage
deployments → pencil → Version: New version → Deploy**. The URL stays the same.
Saving alone does not change the live app.

### 5. Email reminders (optional)

1. In `Reminders.gs`, edit `REMINDER_CONFIG` (sender name, reply-to address,
   venue, Instagram link, send time).
2. Set the Apps Script **Project Settings → Time zone** to `Asia/Kolkata`.
3. Run `setupDailyReminderTrigger` once. It installs a daily trigger (about 9:30
   PM) and is safe to re-run.
4. Each row's `EMAIL_SENT` cell records who was already emailed, so a retried
   run never double-sends. Devotees without an email on file are skipped.

> `testSendReminderNow` sends **real emails** to everyone booked for tomorrow.
> Use it with care.

## Managing Staff Access

Adding someone needs **both** steps, or they cannot use the app:

1. Create their account in **Firebase → Authentication → Users**.
2. Add their email to `ALLOWED_EMAILS` in **Apps Script → Script properties**.

To remove someone, delete them from the allowlist (immediate, apart from a short
cache of up to 5 minutes) and disable or delete their Firebase user.

## Customizing

| What                          | Where                                        |
| ----------------------------- | -------------------------------------------- |
| Devotees allowed per date     | `MAX_PER_DATE` in `services/service.js`      |
| WhatsApp message and venue    | Template in `services/whatsapp.js`           |
| Reminder email text and time  | `REMINDER_CONFIG` and body in `Reminders.gs` |
| Country codes and phone rules | `PHONE_RULES` in `utils/validators.js`       |
| Colors and layout             | `frontend/css/`                              |

Country codes are also listed in the `<select>` elements in `index.html` (the
add form and the edit modal).

## Validation Rules

| Field               | Rule                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Name                | Letters and spaces only, 3–50 characters, auto-capitalized                                                          |
| Phone (`+91`)       | Exactly 10 digits, starting with 6–9                                                                                |
| Phone (other codes) | Per-country rules for `+1 +44 +61 +65 +27 +965 +966 +968 +971 +973 +974`; a general length check for any other code |
| Email               | Optional; validated, stored lowercase, typo hint for common domains                                                 |
| Phone uniqueness    | One active booking per phone number + country code                                                                  |
| Date capacity       | One confirmed booking per date by default                                                                           |
| Friday bookings     | Must be assigned to a Friday                                                                                        |
| Day type            | Editable only while the booking is waiting                                                                          |

## Deployment

### GitHub Pages

1. Push the repo to GitHub.
2. **Settings → Pages:** Source `Deploy from a branch`, branch `main`, folder
   `/ (root)`.
3. The site goes live at
   `https://devtankcodes.github.io/hanumanji-vagha-booking-system/`.
4. Add `devtankcodes.github.io` to Firebase **Authorized domains** (see Setup).

Use relative paths for any new files (for example `frontend/js/...`, not
`/frontend/js/...`), because a project site is served from
`/hanummanji-vagha-booking-system/`. Hard-refresh (`Ctrl+Shift+R`) after pushing
if you still see old files.

## Security Model

- **What protects the data:** the Apps Script Web App. It verifies the Firebase
  ID token with Google and requires the user's email to be in `ALLOWED_EMAILS`.
  Without both, it returns `Unauthorized.`
- **What does not protect the data:** hiding the page in the browser. That is
  only a user-experience gate; the real check is on the server side.
- **Public values that are safe to commit:** the Firebase `firebaseConfig`
  (including `apiKey`) and the Apps Script Web App URL. They identify the
  project; they do not grant access on their own.
- **Keep private:** `ALLOWED_EMAILS` lives in Script Properties, not in the
  repo. Do not commit passwords or service credentials.
- **Account hygiene:** disable self-sign-up in Firebase, use strong passwords,
  and never put a password in a URL.

## Troubleshooting

| Symptom                                                    | Likely cause and fix                                                                                                                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login form reloads and the URL shows `?email=…&password=…` | The page script failed to load, so the form submitted normally. Check the Console for the real error and that the import path in `login.html` is `./frontend/js/auth.js`. Change that account's password afterwards. |
| `Component auth has not been registered yet`               | `firebase-app.js` and `firebase-auth.js` imports in `auth.js` use different versions. Make them identical.                                                                                                           |
| `auth/invalid-credential`                                  | Wrong email or password, or the user does not exist in Firebase.                                                                                                                                                     |
| `Failed to load bookings… Unauthorized.`                   | Token rejected. Check that the email is in `ALLOWED_EMAILS`, that you ran `authorizeExternalRequests`, and that the **deployed** version has your latest code (new version, or a new deployment and URL).            |
| `Server misconfigured: ALLOWED_EMAILS is not set`          | Add the `ALLOWED_EMAILS` Script Property.                                                                                                                                                                            |
| CORS error loading bookings                                | The deployment's access must be **Anyone**, not "Anyone with a Google account".                                                                                                                                      |
| Page blank, then redirects to login                        | Not signed in, or the domain is missing from Firebase Authorized domains.                                                                                                                                            |
| Calendar renders with the wrong size                       | Do not hide the page with `display: none`; the app uses `visibility` for this reason.                                                                                                                                |

## Known Limitations

- **Silent write failures.** Writes use a `no-cors` `POST`, so the browser
  cannot read the server's response. A rejected write (for example after being
  removed from the allowlist) will not show an error. Reloading shows the true
  state from the Sheet.
- **Token in the read URL.** The `GET` request carries the ID token as a query
  parameter. Tokens are short-lived (about an hour), but avoid sharing HAR files
  or screenshots of the Network tab.
- **No offline support.** Every load re-fetches the full booking list.
- **Single sheet, single temple.** One active tab and one set of booking rules
  are assumed.
- **Personal data lives in a Google Sheet.** Limit who can open the Sheet
  itself; app login does not control Sheet sharing.
- **`backend/` and `database/` are inert.** They are git-ignored, describe an
  unfinished server-backed version, and some of their comments still mention
  `localStorage` from an older design. The app does not use them.

## Roadmap

- Role-based access (view-only vs. edit)
- Real database persistence as an alternative to Google Sheets, with a small
  server that verifies Firebase tokens
- Surface write errors by switching writes away from `no-cors`
- Automated tests and CI

## License

No license file is currently included, so all rights are reserved by the project
owner. Add a `LICENSE` file if you intend to open-source this.
