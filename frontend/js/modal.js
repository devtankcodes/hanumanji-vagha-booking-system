import { assignBooking, getNextAvailableFriday, isDateFull } from "./service.js";
import { showToast } from "./notifications.js";

let selectedId = null;
let onAssigned = () => {};

const modal = () => document.getElementById("modal");
const dateInput = () => document.getElementById("modalDate");
const suggestionEl = () => document.getElementById("modalSuggestion");

export function initModal({ onSuccess }) {
  onAssigned = onSuccess;

  document.getElementById("confirmDateBtn").addEventListener("click", handleConfirm);
  document.getElementById("cancelDateBtn").addEventListener("click", closeModal);
  modal().addEventListener("click", (e) => {
    if (e.target === modal()) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal().classList.contains("hidden")) closeModal();
  });
}

export function openModal(id) {
  selectedId = id;
  const suggestion = getNextAvailableFriday();
  dateInput().value = suggestion || "";
  dateInput().min = new Date().toISOString().split("T")[0];
  suggestionEl().textContent = suggestion
    ? `Suggested next available Friday: ${suggestion}`
    : "No suggestion available — please choose a date manually.";
  modal().classList.remove("hidden");
  dateInput().focus();
}

function closeModal() {
  modal().classList.add("hidden");
  selectedId = null;
}

function handleConfirm() {
  const date = dateInput().value;

  if (!date) {
    showToast("Please select a date.", "error");
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