import { getBookings } from "./state.js";
import { getNextAvailableFriday } from "./service.js";

let calendar = null;

function truncateName(name, maxLen = 10) {
  return name.length > maxLen ? name.slice(0, maxLen).trim() + "…" : name;
}

function getCalendarEvents() {
  const confirmedEvents = getBookings()
    .filter(b => b.status === "confirmed")
    .map(b => ({
      title: truncateName(b.name),
      start: b.date,
      color: b.dayType === "Friday" ? "#f59e0b" : "#3b82f6",
      extendedProps: {
        fullName: b.name // kept for the tooltip, not truncated
      }
    }));

  const nextFriday = getNextAvailableFriday();
  const highlightEvent = nextFriday
    ? [{
        start: nextFriday,
        display: "background",
        color: "#fde68a" // soft highlight, doesn't cover booking dots
      }]
    : [];

  return [...confirmedEvents, ...highlightEvent];
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
    dayMaxEventRows: 2, // overflow collapses into a "+N more" link instead of squeezing
    events: getCalendarEvents(),
    eventDidMount: (info) => {
      const fullName = info.event.extendedProps.fullName;
      if (fullName) {
        info.el.title = fullName; // native tooltip shows the untruncated name
      }
    },
    dayCellDidMount: (info) => {
      const nextFriday = getNextAvailableFriday();
      if (nextFriday && info.date.toISOString().split("T")[0] === nextFriday) {
        info.el.classList.add("next-friday-cell");
      }
    }
  });

  calendar.render();
}

export function refreshCalendar() {
  if (!calendar) return;
  calendar.removeAllEvents();
  calendar.addEventSource(getCalendarEvents());
  calendar.render(); // re-runs dayCellDidMount so the highlight stays in sync
}