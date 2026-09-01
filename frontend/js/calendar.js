import { getBookings } from "./state.js";
import { getNextAvailableFriday, formatDate } from "./service.js";

let calendar = null;

function truncateName(name, maxLen = 16) {
  return name.length > maxLen ? name.slice(0, maxLen).trim() + "…" : name;
}

function getCalendarEvents() {
  const confirmed = getBookings().filter(b => b.status === "confirmed");

  const confirmedEvents = confirmed.map(b => ({
    title: truncateName(b.name),
    start: b.date,
    backgroundColor: b.dayType === "Friday" ? "#fef3c7" : "#dbeafe",
    borderColor: b.dayType === "Friday" ? "#fef3c7" : "#dbeafe",
    textColor: b.dayType === "Friday" ? "#92400e" : "#1e40af",
    extendedProps: {
      fullName: b.name
    }
  }));

  // Highlights the whole cell for any date that has a confirmed booking.
  // Uses a Set so multiple bookings on the same date don't create
  // duplicate overlapping background events.
  const confirmedDates = [...new Set(confirmed.map(b => b.date))];
  const confirmedHighlights = confirmedDates.map(date => ({
    start: date,
    display: "background",
    color: "#dcfce7"
  }));

  const nextFriday = getNextAvailableFriday();
  const highlightEvent = nextFriday
    ? [{
        start: nextFriday,
        display: "background",
        color: "#fde68a"
      }]
    : [];

  return [...confirmedEvents, ...confirmedHighlights, ...highlightEvent];
}

export function initCalendar() {
  const el = document.getElementById("calendar");
  if (!el || typeof FullCalendar === "undefined") return;

  calendar = new FullCalendar.Calendar(el, {
    initialView: "dayGridMonth",
    selectable: false,
    fixedWeekCount: false,
    headerToolbar: {
      left: "prev",
      center: "title",
      right: "next"
    },
    height: "auto",
    dayMaxEventRows: 2,
    events: getCalendarEvents(),
    eventDidMount: (info) => {
      const fullName = info.event.extendedProps.fullName;
      if (fullName) {
        info.el.title = fullName;
      }
    },
    dayCellDidMount: (info) => {
      const nextFriday = getNextAvailableFriday();
      // formatDate (local) instead of toISOString (UTC) — same bug as the modal.
      if (nextFriday && formatDate(info.date) === nextFriday) {
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
  calendar.render();
}