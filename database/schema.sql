-- Schema for the future server-backed version of this app.
-- NOT YET CONNECTED to anything — the live app currently stores all data
-- in the browser via localStorage (see frontend/js/state.js). This file
-- exists so the data model is ready when backend/server.js grows real
-- REST routes (see the "Upcoming" section in README.md).
--
-- Kept in sync with the shape of the booking objects the frontend
-- actually produces (see service.js addBooking/updateBooking) — if you
-- change what a booking stores client-side, mirror it here too.

CREATE TABLE devotees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    country_code VARCHAR(5) NOT NULL DEFAULT '+91',
    phone VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- A phone number should only be tied to one active devotee record.
    UNIQUE KEY uniq_country_phone (country_code, phone)
);

CREATE TABLE vagha_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    devotee_id INT NOT NULL,
    status ENUM('waiting', 'confirmed', 'cancelled') NOT NULL DEFAULT 'waiting',
    vagha_date DATE NULL,
    day_type ENUM('Friday', 'Special') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (devotee_id) REFERENCES devotees(id) ON DELETE CASCADE,
    -- Mirrors the MAX_PER_DATE capacity check in service.js — only one
    -- confirmed booking per date is allowed at the database level too.
    UNIQUE KEY uniq_confirmed_date (vagha_date, status)
);