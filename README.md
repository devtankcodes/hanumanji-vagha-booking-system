# 🙏 Hanumanji Vagha Booking System

A lightweight devotee booking tracker for **Shree Chamatkarik Hanumanji Mandir's** weekly and special Vagha days — waiting list, confirmed list, a visual calendar, and one-tap WhatsApp confirmations, backed by a Google Sheet so the temple admin can manage everything from a spreadsheet they already know.

![Stack](https://img.shields.io/badge/frontend-vanilla%20JS%20(ES%20modules)-f7df1e)
![Build](https://img.shields.io/badge/build%20step-none-success)
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
- [Configuration](#configuration)
- [Validation Rules](#validation-rules)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Devotees are added to a **waiting list** with a name and phone number, then assigned a Vagha date to move them to the **confirmed list**. The app suggests the next available Friday automatically, prevents double-booking a date or a phone number, and generates a ready-to-send WhatsApp confirmation message once a booking is confirmed. A read-only calendar view shows every confirmed date at a glance.

There is no login and no backend database in the current version — see [How It Works](#how-it-works) for what actually persists the data.

## How It Works

```
┌────────────┐        REST-ish JSON        ┌──────────────────────┐        ┌───────────────┐
│  Browser    │  ────────────────────────▶ │  Google Apps Script  │ ─────▶ │  Google Sheet  │
│ (this app)  │ ◀──────────────────────── │  Web App (Code.gs)   │ ◀───── │  (source of    │
└────────────┘        fetch() GET/POST     └──────────────────────┘        │   truth)       │
                                                                            └───────────────┘
```

- The Google Sheet is the **single source of truth**. There is no `localStorage` and nothing is cached across reloads — `frontend/js/state.js` fetches the full booking list from the sheet on every page load.
- `frontend/js/sheets-sync.js` talks to a Google Apps Script Web App (`google-apps-script/Code.gs`) deployed against that sheet, using `fetch()` for reads and a `no-cors` `POST` for writes/deletes (with automatic retry on failure).
- A shared secret (`SYNC_SECRET`, checked in `Code.gs` and sent from `frontend/js/config.js`) gates the endpoint against casual/automated abuse. It is **not real authentication** — see [Known Limitations](#known-limitations).
- `backend/` and `database/schema.sql` are an **unrelated, unfinished path**: an optional static file server and a schema for a possible future real-database version. Neither is wired up to the Google Sheet integration above.

## Features

- **Add a devotee** to the waiting list, with name and phone validation (selectable country code, defaulting to `+91`; strict 10-digit rule for India, general length check for other countries)
- Name is auto-capitalized per word as it's typed (`"dev tank"` → `"Dev Tank"`)
- **Edit** a waiting or confirmed devotee's name/phone/country code (day type is only editable while still waiting — confirming a booking locks it in, see `updateBooking` in `service.js`)
- **Assign** a confirmed Vagha date, with:
  - a smart "next available Friday" suggestion
  - a Friday-only check for Friday-type bookings
  - a per-date capacity check (`MAX_PER_DATE` in `service.js`, currently `1`)
- Duplicate-phone and duplicate-date protection
- Confirmed list highlights the soonest upcoming booking and includes a **one-tap WhatsApp confirmation message** (venue, occasion, and the temple's Instagram page)
- Bookings whose Vagha date has already passed are automatically removed on app load
- Read-only **calendar view** of all confirmed bookings (FullCalendar), with the next available Friday and every confirmed date highlighted
- **Delete** a booking, with a named confirmation prompt and toast feedback
- Every add/edit/assign/delete is synced to the Google Sheet in real time

## Tech Stack

| Layer          | Choice                                                              |
| -------------- | -------------------------------------------------------------------- |
| Frontend       | Vanilla JavaScript (ES modules), no framework, no build step          |
| Styling        | Plain CSS, split by concern (`base`, `layout`, `forms`, `buttons`, `entries`, `calendar`, `overlays`, `responsive`) |
| Calendar UI    | [FullCalendar 6](https://fullcalendar.io/) via CDN                    |
| Data store     | Google Sheets, via a Google Apps Script Web App                       |
| Optional server| Express (`backend/`) — static file hosting only                       |
| Future/unused  | MySQL/Postgres-style schema (`database/schema.sql`), not yet connected |

## Project Structure

```
hanumanji-vagha-booking-system/
├── index.html                    # Single-page entry point
├── frontend/
│   ├── assets/
│   │   └── logo.png
│   ├── css/
│   │   ├── base.css              # Resets, typography, shared elements
│   │   ├── layout.css            # Header, cards, section headings
│   │   ├── forms.css             # Add/edit devotee form
│   │   ├── buttons.css           # Button variants (WhatsApp/assign/delete/edit)
│   │   ├── entries.css           # Confirmed/waiting list entry rows
│   │   ├── calendar.css          # FullCalendar theme overrides
│   │   ├── overlays.css          # Modals, toasts
│   │   └── responsive.css        # Breakpoints only
│   └── js/
│       ├── main.js               # Wires up the form, startup sequence
│       ├── state.js              # In-memory booking list, loaded from the sheet
│       ├── service.js            # Business rules: add/update/assign/delete, date logic
│       ├── validators.js         # Name/phone validation and input cleaning
│       ├── sheets-sync.js        # Talks to the Apps Script Web App
│       ├── config.js             # Sheet API URL + shared secret
│       ├── ui.js                 # Renders the waiting/confirmed lists
│       ├── calendar.js           # FullCalendar setup and event mapping
│       ├── modal.js              # "Assign date" modal
│       ├── edit-modal.js         # "Edit devotee" modal
│       ├── notifications.js      # Toasts + confirm dialogs
│       ├── whatsapp.js           # Builds the WhatsApp confirmation link/message
│       └── icons.js              # Inline SVG icon set
├── google-apps-script/
│   └── Code.gs                   # doGet/doPost handlers deployed as the Web App
├── backend/
│   ├── server.js                 # Optional Express static file server
│   └── package.json
├── database/
│   └── schema.sql                # Schema for a possible future DB-backed version (unused)
└── README.md
```

## Getting Started

### Prerequisites

- Any modern browser
- [Node.js](https://nodejs.org/) 18+ — only needed if you want to run the optional Express server instead of opening the file directly

### Run it

The app is fully static — the simplest way to run it is to open `index.html` directly in a browser. Since it fetches from Google Sheets, you'll need your own deployment configured first (see [Configuration](#configuration)).

Or, via the optional static server:

```bash
cd backend
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Configuration

The app talks to **your own** Google Sheet, not a shared one. To set it up:

1. Create a Google Sheet with a header row: `ID | DEVOTEE NAME | PHONE NUMBER | BOOKING DATE | OCCASION | STATUS | CREATED AT`.
2. In the sheet, go to **Extensions → Apps Script** and paste in `google-apps-script/Code.gs`.
3. In the Apps Script editor, go to **Project Settings → Script Properties** and add a property named `SYNC_SECRET` with a long random value. (Deliberately kept out of the script source so it never has to live in a public repo.)
4. Deploy the script as a **Web App**: Deploy → New deployment → type "Web app" → execute as yourself → who has access: **Anyone**. (It must be "Anyone", not "Anyone with a Google account," or the frontend's cross-origin `GET` requests will fail.)
5. Copy the deployment URL and your `SYNC_SECRET`, then update `frontend/js/config.js`:

   ```js
   export const CONFIG = {
     SHEET_API_URL: "<your deployment URL>",
     SYNC_SECRET: "<the same value you set in Script Properties>",
     SHEET_SYNC_MAX_RETRIES: 2,
     SHEET_SYNC_RETRY_DELAY_MS: 1500,
   };
   ```

6. To point the WhatsApp message and venue details at a different temple/event, edit the template string in `frontend/js/whatsapp.js`.

> **Note:** `SYNC_SECRET` in `config.js` ships to every visitor's browser since this is a static site — treat it as abuse-deterrence, not real access control. See [Known Limitations](#known-limitations).

## Validation Rules

| Field | Rule |
| --- | --- |
| Name | Letters and spaces only, 2–60 characters, auto-capitalized per word |
| Phone (`+91`) | Exactly 10 digits, must start with 6–9 |
| Phone (other codes) | 6–14 digits |
| Phone uniqueness | One active (non-cancelled) booking per phone number + country code |
| Date capacity | One confirmed booking per date by default (`MAX_PER_DATE` in `service.js`) |
| Day type | Locked once a booking is confirmed; only editable while waiting |

## Deployment

### GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings, go to **Pages → Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Your site will be live at `https://<username>.github.io/<repo-name>/`.

No build step is needed — `index.html` at the repo root is the entry point. Just make sure `frontend/js/config.js` points at your own Apps Script deployment before publishing.

## Known Limitations

- **No real authentication.** `SYNC_SECRET` is a basic gatekeeping check against the bare Apps Script endpoint, not a login system — anyone who reads the shipped JS can find it. Real protection would mean routing writes through a server you control instead of hitting Apps Script directly from the browser.
- **No offline support.** Every load re-fetches the full booking list from the sheet; there's no local cache or retry-on-reconnect for the initial load.
- **Single-sheet, single-tenant.** The app assumes one active sheet/tab and one temple's booking rules baked into `service.js` and `whatsapp.js`.
- **`backend/` and `database/schema.sql` are inert.** They describe a possible future server-backed version and are not used by the app as it runs today.

## Roadmap

- Real database persistence (`database/schema.sql` → MySQL/Postgres/Supabase) with REST routes in `backend/server.js`, as an alternative to the Google Sheets integration
- Admin login
- Automated tests and CI

## License

No license file is currently included — all rights reserved by the project owner. Add a `LICENSE` file if you intend to open-source this.