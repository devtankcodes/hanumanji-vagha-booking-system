
import { getBookings } from '../config/state.js';
import { formatDate, getNextAvailableFriday } from '../services/service.js';

let calendar = null;

function truncateName(name, maxLen = 16) {
  return name.length > maxLen
    ? `${name.slice(0, maxLen).trim()}…`
    : name;
}

function getCalendarEvents() {
  const confirmed = getBookings().filter(
    (booking) => booking.status === 'confirmed',
  );

  const confirmedEvents = confirmed.map((booking) => ({
    title: truncateName(booking.name),
    start: booking.date,
    backgroundColor:
      booking.dayType === 'Friday' ? '#fef3c7' : '#dbeafe',
    borderColor:
      booking.dayType === 'Friday' ? '#fef3c7' : '#dbeafe',
    textColor:
      booking.dayType === 'Friday' ? '#166534' : '#1e40af',
    extendedProps: {
      fullName: booking.name,
    },
  }));

  // Highlight confirmed dates in green.
  const confirmedDates = [
    ...new Set(confirmed.map((booking) => booking.date)),
  ];

  const confirmedHighlights = confirmedDates.map((date) => ({
    start: date,
    display: 'background',
    color: '#bbf7d0',
  }));

  // Highlight next available Friday in amber.
  const nextFriday = getNextAvailableFriday();

  const highlightEvent = nextFriday
    ? [
        {
          start: nextFriday,
          display: 'background',
          color: '#fde68a',
        },
      ]
    : [];

  return [
    ...confirmedEvents,
    ...confirmedHighlights,
    ...highlightEvent,
  ];
}

export function initCalendar() {
  const el = document.getElementById('calendar');

  if (!el || typeof FullCalendar === 'undefined') return;

  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    selectable: false,
    fixedWeekCount: false,

    headerToolbar: {
      left: 'prev',
      center: 'title',
      right: 'next',
    },

    height: 'auto',
    dayMaxEventRows: 2,
    events: getCalendarEvents(),

    eventDidMount: (info) => {
      const fullName = info.event.extendedProps.fullName;

      if (fullName) {
        info.el.title = fullName;
      }
    },

    dayCellClassNames: (info) => {
      const date = formatDate(info.date);

      const confirmedDates = new Set(
        getBookings()
          .filter(
            (booking) =>
              booking.status === 'confirmed' && booking.date,
          )
          .map((booking) => booking.date),
      );

      const classNames = [];

      // Confirmed date: green.
      if (confirmedDates.has(date)) {
        classNames.push('confirmed-date-cell');
      }

      // Next available Friday: amber.
      if (date === getNextAvailableFriday()) {
        classNames.push('next-friday-cell');
      }

      return classNames;
    },
  });

  calendar.render();
}

export function refreshCalendar() {
  if (!calendar) return;

  calendar.removeAllEvents();
  calendar.addEventSource(getCalendarEvents());
  calendar.render();
}
