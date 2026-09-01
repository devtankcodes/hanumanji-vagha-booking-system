export function isNameLongEnough(name) {
  return name.trim().length >= 2;
}

export function hasOnlyLetterCharacters(name) {
  return /^[A-Za-z\s]*$/.test(name.trim());
}

// Kept for anywhere that just needs a single true/false check.
export function isValidName(name) {
  return isNameLongEnough(name) && hasOnlyLetterCharacters(name) && name.trim().length <= 60;
}

// Must be exactly 10 digits, digits only (no letters/symbols allowed through).
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

export function cleanPhoneInput(value) {
  return value.replace(/^\+?91/, "").replace(/\D/g, "").slice(0, 10);
}