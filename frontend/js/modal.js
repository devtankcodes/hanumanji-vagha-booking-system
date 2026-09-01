import { assignBooking, getNextAvailableFriday, isDateFull, getTodayLocal, formatDateDisplay } from "./service.js";
import { getBookings } from "./state.js";
import { showToast } from "./notifications.js";

let selectedId = null;
let selectedDayType = null;
let onAssigned = () => {};

const modal = () => document.getElementById("modal");
const dateInput = () => document.getElementById("modalDate");
const suggestionEl = () => document.getElementById("modalSuggestion");
const dateErrorEl = () => document.getElementById("modalDateError");

export function initModal({ onSuccess }) {
  onAssigned = onSuccess;

  document.getElementById("confirmDateBtn").addEventListener("click", handleConfirm);
  document.getElementById("cancelDateBtn").addEventListener("click", closeModal);
  dateInput().addEventListener("change", validateDateChoice);
  modal().addEventListener("click", (e) => {
    if (e.target === modal()) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal().classList.contains("hidden")) closeModal();
  });
}

function isFriday(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 5;
}

function validateDateChoice() {
  const date = dateInput().value;
  dateErrorEl().textContent = "";

  if (!date) return;

  if (selectedDayType === "Friday" && !isFriday(date)) {
    dateErrorEl().textContent = "This devotee is registered for Friday - please pick a Friday date.";
  }
}

export function openModal(id) {
  selectedId = id;

  const booking = getBookings().find(b => b.id === id);
  selectedDayType = booking ? booking.dayType : null;
  const isReassign = booking && booking.status === "confirmed";

  const suggestion = selectedDayType === "Friday" ? getNextAvailableFriday() : null;

  dateInput().value = isReassign ? booking.date : (suggestion || "");
  dateInput().min = getTodayLocal();
  dateErrorEl().textContent = "";

  document.getElementById("modalTitle").textContent = isReassign
    ? "Reassign Date"
    : "Select Date";
  document.getElementById("confirmDateBtn").textContent = isReassign
    ? "Save New Date"
    : "Confirm Booking";

  suggestionEl().textContent = isReassign
    ? "Choose a new date for this booking."
    : suggestion
      ? `Suggested next available Friday: ${formatDateDisplay(suggestion)}`
      : selectedDayType === "Friday"
        ? "No suggestion available — please choose a Friday manually."
        : "Choose the confirmed date for this special-day booking.";

  modal().classList.remove("hidden");
  dateInput().focus();
}

function closeModal() {
  modal().classList.add("hidden");
  selectedId = null;
  selectedDayType = null;
}

function handleConfirm() {
  const date = dateInput().value;

  if (!date) {
    showToast("Please select a date.", "error");
    return;
  }

  if (selectedDayType === "Friday" && !isFriday(date)) {
    showToast("Please pick a Friday date.", "error");
    return;
  }

  if (isDateFull(date, selectedId)) {
    showToast("That date is already fully booked.", "error");
    return;
  }

  try {
    assignBooking(selectedId, date);
    showToast("Booking confirmed!", "success");
    closeModal();
    onAssigned();
  } catch (err) {
    showToast(err.message, "error");
  }
}