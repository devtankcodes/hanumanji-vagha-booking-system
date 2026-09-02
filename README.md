# Hanumanji Vagha Booking System

A lightweight devotee booking tracker for weekly/special Vagha days, with a
waiting list, confirmed list, calendar view, and WhatsApp confirmation.

## Status

The app runs entirely client-side: all data is stored in the browser's
`localStorage` (see `frontend/js/state.js`). `backend/` is an optional
static file server; `database/schema.sql` is the intended schema for a
future server-backed version and is not yet connected to anything.

## Features

- Add a devotee to the waiting list, with name and phone validation
  (selectable country code, defaulting to +91; strict 10-digit rule for
  India, general length check for other countries)
- Name is auto-capitalized per word as it's typed ("dev tank" → "Dev Tank")
- Edit a waiting or confirmed devotee's name/phone/country code (day type
  is only editable while still waiting — see the comment on
  `updateBooking` in `service.js` for why)
- Assign a confirmed Vagha date, with a smart "next available Friday"
  suggestion, a Friday-only check for Friday-type bookings, and a per-date
  capacity check
- Duplicate-phone and duplicate-date protection
- Confirmed list highlights the soonest upcoming booking and includes a
  one-tap WhatsApp confirmation message (with venue, occasion, and the
  temple's Instagram page)
- Bookings whose Vagha date has already passed are automatically removed
  from the Confirmed List on app load
- Read-only calendar view of all confirmed bookings, with the next
  available Friday and every confirmed date highlighted
- Delete a booking, with a named confirmation prompt and toast feedback

## Running locally

Open `index.html` directly in a browser — no server required.

Or, to run it through the optional Express static server:

```bash
cd backend
npm install
npm start
```

Then open http://localhost:3000.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings, go to **Pages** → **Build and deployment** →
   set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Your site will be live at `https://<username>.github.io/<repo-name>/`.

No build step is needed — `index.html` at the repo root is the entry point.

## Upcoming

- Real database persistence (`database/schema.sql` → MySQL/Postgres/Supabase)
  with REST routes in `backend/server.js`
- Admin login
- Automated tests and CI