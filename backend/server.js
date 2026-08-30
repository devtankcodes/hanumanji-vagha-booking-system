// Static file server for the Vagha Management frontend.
// The app currently runs entirely on localStorage in the browser (see
// frontend/js/state.js) — this server just hosts those files.
//
// A real database layer (matching database/schema.sql) is listed as
// "Upcoming" in the README and is not implemented yet. Wiring it in would
// mean adding REST routes here (GET/POST/DELETE /api/bookings) backed by
// a MySQL/Postgres/Supabase client, and switching frontend/js/state.js
// and service.js to call fetch() instead of localStorage.

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Vagha Management server running at http://localhost:${PORT}`);
});