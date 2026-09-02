import { getBookings } from "./state.js";
import { getWhatsAppLink } from "./whatsapp.js";
import { formatDateDisplay, getTodayLocal } from "./service.js";

/**
 * Returns the id of the confirmed booking with the soonest upcoming date,
 * or null if there are no upcoming confirmed bookings. Used to apply the
 * "next up" highlight in the Confirmed List.
 *
 * Uses getTodayLocal() (not toISOString/UTC) — the rest of the app
 * standardized on local-time date comparisons to avoid the date rolling
 * back a day for IST users; this must stay consistent with that.
 */
function getNextUpcomingId(confirmed) {
  const today = getTodayLocal();
  const upcoming = confirmed
    .filter(b => b.date >= today)
    .sort((a, b) => (a.date > b.date ? 1 : -1));
  return upcoming.length ? upcoming[0].id : null;
}

function buildEntry(item, { showDate, actions, highlight }) {
  const entry = document.createElement("div");
  entry.className = "entry" + (highlight ? " entry-next" : "");

  const info = document.createElement("div");
  info.className = "entry-info";

  const name = document.createElement("strong");
  name.textContent = item.name; // textContent: safe, no HTML injection

  const meta = document.createElement("p");
  meta.textContent = showDate
    ? `${formatDateDisplay(item.date)} • ${item.dayType}`
    : `${item.countryCode || "+91"} ${item.phone} • ${item.dayType}`;

  info.append(name, meta);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "entry-actions";
  actions.forEach(btn => actionsWrap.appendChild(btn));

  entry.append(info, actionsWrap);
  return entry;
}

function makeButton(label, className, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = className;
  btn.type = "button";
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * Renders both the Waiting List and Confirmed List into the DOM from
 * current storage state. Call after any mutation (add/edit/assign/delete)
 * to keep the UI in sync.
 *
 * @param {Object} handlers
 * @param {(id: number) => void} handlers.onAssign - Opens the assign/reassign modal.
 * @param {(id: number) => void} handlers.onDelete - Deletes a booking (with confirmation).
 * @param {(id: number) => void} handlers.onEdit - Opens the edit modal.
 */
export function render({ onAssign, onDelete, onEdit }) {
  const waitingContainer = document.getElementById("waitingList");
  const confirmedContainer = document.getElementById("confirmedList");
  const waitingCount = document.getElementById("waitingCount");
  const confirmedCount = document.getElementById("confirmedCount");

  const bookings = getBookings();
  const waiting = bookings.filter(b => b.status === "waiting");
  const confirmed = bookings.filter(b => b.status === "confirmed")
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const nextUpcomingId = getNextUpcomingId(confirmed);

  waitingContainer.innerHTML = "";
  confirmedContainer.innerHTML = "";
  waitingCount.textContent = waiting.length;
  confirmedCount.textContent = confirmed.length;

  if (waiting.length === 0) {
    waitingContainer.innerHTML = `<li class="empty-state">No one is waiting right now.</li>`;
  }
  waiting.forEach(item => {
    const li = document.createElement("li");
    li.appendChild(buildEntry(item, {
      showDate: false,
      highlight: false,
      actions: [
        makeButton("Edit", "edit-btn", () => onEdit(item.id)),
        makeButton("Assign", "assign-btn", () => onAssign(item.id)),
        makeButton("Delete", "delete-btn", () => onDelete(item.id))
      ]
    }));
    waitingContainer.appendChild(li);
  });

  if (confirmed.length === 0) {
    confirmedContainer.innerHTML = `<li class="empty-state">No confirmed bookings yet.</li>`;
  }
  confirmed.forEach(item => {
    const li = document.createElement("li");
    li.appendChild(buildEntry(item, {
      showDate: true,
      highlight: item.id === nextUpcomingId,
      actions: [
        makeButton("WhatsApp", "whatsapp-btn", () => window.open(getWhatsAppLink(item), "_blank")),
        makeButton("Reassign", "assign-btn", () => onAssign(item.id)),
        makeButton("Delete", "delete-btn", () => onDelete(item.id))
      ]
    }));
    confirmedContainer.appendChild(li);
  });
}