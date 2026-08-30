export function isValidName(name) {
  return /^[A-Za-z\s]{2,60}$/.test(name.trim());
}

// Must be exactly 10 digits, digits only (no letters/symbols allowed through).
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

export function cleanPhoneInput(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}