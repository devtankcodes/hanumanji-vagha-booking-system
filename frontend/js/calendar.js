import { getBookings } from "./state.js";

let calendar = null;

function getCalendarEvents() {
  return getBookings()
    .filter(b => b.status === "confirmed")
    .map(b => ({
      title: b.name,
      start: b.date,
      color: b.dayType === "Friday" ? "#f59e0b" : "#3b82f6"
    }));
}

export function initCalendar() {
  const el = document.getElementById("calendar");
  if (!el || typeof FullCalendar === "undefined") return;

  calendar = new FullCalendar.Calendar(el, {
    initialView: "dayGridMonth",
    selectable: false, // read-only view
    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: ""
    },
    height: "auto",
    events: getCalendarEvents()
  });

  calendar.render();
}

export function refreshCalendar() {
  if (!calendar) return;
  calendar.removeAllEvents();
  calendar.addEventSource(getCalendarEvents());
}