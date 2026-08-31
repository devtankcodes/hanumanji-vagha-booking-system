import { assignBooking, getNextAvailableFriday, isDateFull } from "./service.js";
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
  // Parse as local date, not UTC, to avoid off-by-one day issues.
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 5;
}

function validateDateChoice() {
  const date = dateInput().value;
  dateErrorEl().textContent = "";

  if (!date) return;

  if (selectedDayType === "Friday" && !isFriday(date)) {
    dateErrorEl().textContent = "This devotee is registered for Friday — please pick a Friday date.";
  }
}

export function openModal(id) {
  selectedId = id;

  const booking = getBookings().find(b => b.id === id);
  selectedDayType = booking ? booking.dayType : null;

  const suggestion = selectedDayType === "Friday" ? getNextAvailableFriday() : null;
  dateInput().value = suggestion || "";
  dateInput().min = new Date().toISOString().split("T")[0];
  dateErrorEl().textContent = "";

  suggestionEl().textContent = suggestion
    ? `Suggested next available Friday: ${suggestion}`
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

  if (isDateFull(date)) {
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