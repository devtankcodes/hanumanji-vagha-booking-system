import { getBookings } from "./state.js";
import { updateBooking } from "./service.js";
import { isNameLongEnough, isNameShortEnough, hasOnlyLetterCharacters, isValidPhone, cleanPhoneInput, cleanNameInput, capitalizeWords, getPhoneErrorMessage, getPhoneMaxLength, getPhonePlaceholder, NAME_MIN_LENGTH, NAME_MAX_LENGTH } from "./validators.js";
import { showToast } from "./notifications.js";

let selectedId = null;
let onUpdated = () => {};

const modal = () => document.getElementById("editModal");
const nameInput = () => document.getElementById("editName");
const phoneInput = () => document.getElementById("editPhone");
const countryCodeInput = () => document.getElementById("editCountryCode");
const dayTypeInput = () => document.getElementById("editDayType");
const nameError = () => document.getElementById("editNameError");
const phoneError = () => document.getElementById("editPhoneError");

function updatePhoneMaxLength() {
  phoneInput().maxLength = getPhoneMaxLength(countryCodeInput().value);
  phoneInput().placeholder = getPhonePlaceholder(countryCodeInput().value);
}

/**
 * Wires up the Edit Devotee modal's event listeners. Call once on app
 * startup, before any call to openEditModal.
 *
 * @param {Object} params
 * @param {() => void} params.onSuccess - Called after a successful save, to refresh the list/calendar.
 */
export function initEditModal({ onSuccess }) {
  onUpdated = onSuccess;

  document.getElementById("saveEditBtn").addEventListener("click", handleSave);
  document.getElementById("cancelEditBtn").addEventListener("click", closeEditModal);
  modal().addEventListener("click", (e) => {
    if (e.target === modal()) closeEditModal();
  });
  document.addEventListener("keydown", (e) => {
    if (modal().classList.contains("hidden")) return;
    if (e.key === "Escape") closeEditModal();
    if (e.key === "Enter" && (e.target === nameInput() || e.target === phoneInput())) {
      e.preventDefault();
      handleSave();
    }
  });

  phoneInput().addEventListener("input", () => {
    phoneInput().value = cleanPhoneInput(phoneInput().value, countryCodeInput().value);
    phoneError().textContent = "";
    phoneInput().classList.remove("invalid");
  });

  countryCodeInput().addEventListener("change", () => {
    updatePhoneMaxLength();
    phoneInput().value = cleanPhoneInput(phoneInput().value, countryCodeInput().value);
    phoneError().textContent = "";
    phoneInput().classList.remove("invalid");
  });

  nameInput().addEventListener("input", () => {
    const cursorPos = nameInput().selectionStart;
    const original = nameInput().value;
    const cleaned = cleanNameInput(original);
    const capitalized = capitalizeWords(cleaned);
    if (capitalized !== original) {
      const removedBeforeCursor = original.slice(0, cursorPos).length - cleanNameInput(original.slice(0, cursorPos)).length;
      nameInput().value = capitalized;
      const newPos = Math.max(0, cursorPos - removedBeforeCursor);
      nameInput().setSelectionRange(newPos, newPos);
    }
    nameError().textContent = "";
    nameInput().classList.remove("invalid");
  });
}

/**
 * Opens the Edit Devotee modal pre-filled with an existing booking's data.
 * Day type is only editable while the booking is still "waiting" (see
 * comment in service.js's updateBooking for why).
 *
 * @param {number} id - The booking id to edit.
 */
export function openEditModal(id) {
  const booking = getBookings().find(b => b.id === id);
  if (!booking) return;

  selectedId = id;
  nameInput().value = booking.name;
  phoneInput().value = booking.phone;
  countryCodeInput().value = booking.countryCode || "+91";
  updatePhoneMaxLength();
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
  const phone = cleanPhoneInput(phoneInput().value, countryCodeInput().value);
  const countryCode = countryCodeInput().value;
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
    nameError().textContent = `Name must be at least ${NAME_MIN_LENGTH} characters.`;
    nameInput().classList.add("invalid");
    hasError = true;
  } else if (!isNameShortEnough(name)) {
    nameError().textContent = `Name must be under ${NAME_MAX_LENGTH} characters.`;
    nameInput().classList.add("invalid");
    hasError = true;
  }

  if (!phone) {
    phoneError().textContent = "Phone number is required.";
    phoneInput().classList.add("invalid");
    hasError = true;
  } else if (!isValidPhone(phone, countryCode)) {
    phoneError().textContent = getPhoneErrorMessage(countryCode);
    phoneInput().classList.add("invalid");
    hasError = true;
  }

  if (hasError) return;

  try {
    updateBooking(selectedId, { name, phone, countryCode, dayType });
    showToast(`${name}'s details updated.`, "success");
    closeEditModal();
    onUpdated();
  } catch (err) {
    phoneError().textContent = err.message;
    phoneInput().classList.add("invalid");
  }
}