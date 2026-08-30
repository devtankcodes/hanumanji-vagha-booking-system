import { addBooking, deleteBooking } from "./service.js";
import { render } from "./ui.js";
import { isValidName, isValidPhone, cleanPhoneInput } from "./validators.js";
import { showToast, confirmDialog } from "./notifications.js";
import { initModal, openModal } from "./modal.js";
import { initCalendar, refreshCalendar } from "./calendar.js";

const form = document.getElementById("bookingForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const dayTypeInput = document.getElementById("dayType");

function refresh() {
  render({ onAssign: handleAssign, onDelete: handleDelete });
  refreshCalendar();
}

function handleSubmit(e) {
  e.preventDefault();

  const name = nameInput.value.trim();
  const phone = cleanPhoneInput(phoneInput.value);
  const dayType = dayTypeInput.value;

  if (!name || !phone) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  if (!isValidName(name)) {
    showToast("Name should contain only letters and spaces.", "error");
    return;
  }

  if (!isValidPhone(phone)) {
    showToast("Enter a valid 10-digit mobile number.", "error");
    return;
  }

  try {
    addBooking({ name, phone, dayType });
    showToast(`${name} added to the waiting list.`, "success");
    form.reset();
    refresh();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function handleAssign(id) {
  openModal(id);
}

async function handleDelete(id) {
  const confirmed = await confirmDialog("Delete this devotee's booking?");
  if (!confirmed) return;

  deleteBooking(id);
  showToast("Booking deleted.", "success");
  refresh();
}

// Keep only digits in the phone field as the user types
phoneInput.addEventListener("input", () => {
  phoneInput.value = cleanPhoneInput(phoneInput.value);
});

form.addEventListener("submit", handleSubmit);

initModal({ onSuccess: refresh });
initCalendar();
refresh();