import { getBookings } from "./state.js";
import { getWhatsAppLink } from "./whatsapp.js";

function buildEntry(item, { showDate, actions }) {
  const entry = document.createElement("div");
  entry.className = "entry";

  const info = document.createElement("div");
  info.className = "entry-info";

  const name = document.createElement("strong");
  name.textContent = item.name; // textContent: safe, no HTML injection

  const meta = document.createElement("p");
  meta.textContent = showDate
    ? `${item.date} • ${item.dayType}`
    : `${item.phone} • ${item.dayType}`;

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

export function render({ onAssign, onDelete }) {
  const waitingContainer = document.getElementById("waitingList");
  const confirmedContainer = document.getElementById("confirmedList");
  const waitingCount = document.getElementById("waitingCount");
  const confirmedCount = document.getElementById("confirmedCount");

  const bookings = getBookings();
  const waiting = bookings.filter(b => b.status === "waiting");
  const confirmed = bookings.filter(b => b.status === "confirmed")
    .sort((a, b) => (a.date > b.date ? 1 : -1));

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
      actions: [
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
      actions: [
        makeButton("WhatsApp", "whatsapp-btn", () => window.open(getWhatsAppLink(item), "_blank")),
        makeButton("Delete", "delete-btn", () => onDelete(item.id))
      ]
    }));
    confirmedContainer.appendChild(li);
  });
}