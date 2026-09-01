import { getBookings } from "./state.js";
import { updateBooking } from "./service.js";
import { isNameLongEnough, hasOnlyLetterCharacters, isValidPhone, cleanPhoneInput } from "./validators.js";
import { showToast } from "./notifications.js";

let selectedId = null;
let onUpdated = () => {};

const modal = () => document.getElementById("editModal");
const nameInput = () => document.getElementById("editName");
const phoneInput = () => document.getElementById("editPhone");
const dayTypeInput = () => document.getElementById("editDayType");
const dayTypeField = () => dayTypeInput().closest("label")?.parentElement || dayTypeInput();
const nameError = () => document.getElementById("editNameError");
const phoneError = () => document.getElementById("editPhoneError");

export function initEditModal({ onSuccess }) {
  onUpdated = onSuccess;

  document.getElementById("saveEditBtn").addEventListener("click", handleSave);
  document.getElementById("cancelEditBtn").addEventListener("click", closeEditModal);
  modal().addEventListener("click", (e) => {
    if (e.target === modal()) closeEditModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal().classList.contains("hidden")) closeEditModal();
  });

  phoneInput().addEventListener("input", () => {
    phoneInput().value = cleanPhoneInput(phoneInput().value);
    phoneError().textContent = "";
    phoneInput().classList.remove("invalid");
  });

  nameInput().addEventListener("input", () => {
    nameError().textContent = "";
    nameInput().classList.remove("invalid");
  });
}

export function openEditModal(id) {
  const booking = getBookings().find(b => b.id === id);
  if (!booking) return;

  selectedId = id;
  nameInput().value = booking.name;
  phoneInput().value = booking.phone;
  dayTypeInput().value = booking.dayType;
  nameError().textContent = "";
  phoneError().textContent = "";
  nameInput().classList.remove("invalid");
  phoneInput().classList.remove("invalid");

  // Day type is only editable while the booking is still waiting.
  const isWaiting = booking.status === "waiting";
  dayTypeInput().disabled = !isWaiting;
  document.getElementById("editDayType").previousElementSibling.style.display = isWaiting ? "" : "none";
  dayTypeInput().style.display = isWaiting ? "" : "none";

  modal().classList.remove("hidden");
  nameInput().focus();
}

function closeEditModal() {
  modal().classList.add("hidden");
  selectedId = null;
}

function handleSave() {
  const name = nameInput().value.trim();
  const phone = cleanPhoneInput(phoneInput().value);
  const dayType = dayTypeInput().disabled ? undefined : dayTypeInput().value;

  let hasError = false;

  if (!name) {
    nameError().textContent = "Enter full name.";
    nameInput().classList.add("invalid");
    hasError = true;
  } else if (!hasOnlyLetterCharacters(name)) {
    nameError().textContent = "Name should contain only letters and spaces.";
    nameInput().classList.add("invalid");
    hasError = true;
  } else if (!isNameLongEnough(name)) {
    nameError().textContent = "Enter full name (at least 2 characters).";
    nameInput().classList.add("invalid");
    hasError = true;
  } else if (name.length > 60) {
    nameError().textContent = "Name is too long.";
    nameInput().classList.add("invalid");
    hasError = true;
  }

  if (!phone) {
    phoneError().textContent = "Phone number is required.";
    phoneInput().classList.add("invalid");
    hasError = true;
  } else if (!isValidPhone(phone)) {
    phoneError().textContent = "Enter a valid 10-digit mobile number starting with 6–9.";
    phoneInput().classList.add("invalid");
    hasError = true;
  }

  if (hasError) return;

  try {
    updateBooking(selectedId, { name, phone, dayType });
    showToast("Devotee details updated.", "success");
    closeEditModal();
    onUpdated();
  } catch (err) {
    phoneError().textContent = err.message;
    phoneInput().classList.add("invalid");
  }
}