import { addBooking, deleteBooking, removeCompletedBookings } from "./service.js";
import { getBookings } from "./state.js";
import { render } from "./ui.js";
import { isNameLongEnough, hasOnlyLetterCharacters, isValidPhone, cleanPhoneInput, cleanNameInput, capitalizeWords } from "./validators.js";
import { showToast, confirmDialog } from "./notifications.js";
import { initModal, openModal } from "./modal.js";
import { initEditModal, openEditModal } from "./edit-modal.js";
import { initCalendar, refreshCalendar } from "./calendar.js";

const form = document.getElementById("bookingForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const countryCodeInput = document.getElementById("countryCode");
const dayTypeInput = document.getElementById("dayType");
const nameError = document.getElementById("nameError");
const phoneError = document.getElementById("phoneError");

function refresh() {
  render({ onAssign: handleAssign, onDelete: handleDelete, onEdit: handleEdit });
  refreshCalendar();
}

function setFieldError(input, errorEl, message) {
  errorEl.textContent = message;
  input.classList.toggle("invalid", Boolean(message));
}

function clearFieldErrors() {
  setFieldError(nameInput, nameError, "");
  setFieldError(phoneInput, phoneError, "");
}

function handleSubmit(e) {
  e.preventDefault();
  clearFieldErrors();

  const name = nameInput.value.trim();
  const phone = cleanPhoneInput(phoneInput.value);
  const countryCode = countryCodeInput.value;
  const dayType = dayTypeInput.value;

  let hasError = false;

  if (!name) {
    setFieldError(nameInput, nameError, "Enter full name.");
    hasError = true;
  } else if (!hasOnlyLetterCharacters(name)) {
    setFieldError(nameInput, nameError, "Name should contain only letters and spaces.");
    hasError = true;
  } else if (!isNameLongEnough(name)) {
    setFieldError(nameInput, nameError, "Enter full name (at least 2 characters).");
    hasError = true;
  } else if (name.length > 60) {
    setFieldError(nameInput, nameError, "Name is too long.");
    hasError = true;
  }

  if (!phone) {
    setFieldError(phoneInput, phoneError, "Phone number is required.");
    hasError = true;
  } else if (!isValidPhone(phone, countryCode)) {
    setFieldError(
      phoneInput,
      phoneError,
      countryCode === "+91"
        ? "Enter a valid 10-digit mobile number starting with 6–9."
        : "Enter a valid mobile number."
    );
    hasError = true;
  }

  if (hasError) return;

  try {
    addBooking({ name, phone, countryCode, dayType });
    showToast(`${name} added to the waiting list.`, "success");
    form.reset();
    countryCodeInput.value = "+91";
    updatePhoneMaxLength();
    clearFieldErrors();
    refresh();
  } catch (err) {
    setFieldError(phoneInput, phoneError, err.message);
  }
}

function handleAssign(id) {
  openModal(id);
}

function handleEdit(id) {
  openEditModal(id);
}

async function handleDelete(id) {
  const booking = getBookings().find(b => b.id === id);
  const label = booking ? booking.name : "this devotee";

  const confirmed = await confirmDialog(`Delete ${label}'s booking?`);
  if (!confirmed) return;

  deleteBooking(id);
  showToast(`${label}'s booking deleted.`, "success");
  refresh();
}

function updatePhoneMaxLength() {
  const maxLen = countryCodeInput.value === "+91" ? 10 : 14;
  phoneInput.maxLength = maxLen;
  phoneInput.placeholder = countryCodeInput.value === "+91" ? "10-digit number" : "Mobile number";
}

phoneInput.addEventListener("input", () => {
  phoneInput.value = cleanPhoneInput(phoneInput.value, countryCodeInput.value);
  setFieldError(phoneInput, phoneError, "");
});

countryCodeInput.addEventListener("change", () => {
  updatePhoneMaxLength();
  phoneInput.value = cleanPhoneInput(phoneInput.value, countryCodeInput.value);
  setFieldError(phoneInput, phoneError, "");
});

updatePhoneMaxLength();

nameInput.addEventListener("input", () => {
  const cursorPos = nameInput.selectionStart;
  const original = nameInput.value;
  const cleaned = cleanNameInput(original);
  const capitalized = capitalizeWords(cleaned);
  if (capitalized !== original) {
    // Characters may have been stripped before the cursor, so shift the
    // cursor back by however many were removed rather than pinning it
    // to the original position (which could now be past the new end).
    const removedBeforeCursor = original.slice(0, cursorPos).length - cleanNameInput(original.slice(0, cursorPos)).length;
    nameInput.value = capitalized;
    const newPos = Math.max(0, cursorPos - removedBeforeCursor);
    nameInput.setSelectionRange(newPos, newPos);
  }
  setFieldError(nameInput, nameError, "");
});

form.addEventListener("submit", handleSubmit);

initModal({ onSuccess: refresh });
initEditModal({ onSuccess: refresh });
initCalendar();
removeCompletedBookings();
refresh();