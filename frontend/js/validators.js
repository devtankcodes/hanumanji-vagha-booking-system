export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 50;

export function isNameLongEnough(name) {
  return name.trim().length >= NAME_MIN_LENGTH;
}

export function isNameShortEnough(name) {
  return name.trim().length <= NAME_MAX_LENGTH;
}

// Capitalizes the first letter of each word (e.g. "dev tank" -> "Dev Tank").
// Only touches letters right after the start of the string or a space —
// leaves everything else untouched, so it's safe to run on every keystroke.
export function capitalizeWords(value) {
  return value.replace(/(^|\s)([a-z])/g, (_, sep, char) => sep + char.toUpperCase());
}

export function hasOnlyLetterCharacters(name) {
  return /^[A-Za-z\s]*$/.test(name.trim());
}

// Strips digits and special characters as the user types, so the name
// field can never contain them in the first place (letters and spaces
// only). Same "clean on every keystroke" pattern as cleanPhoneInput —
// this replaces the need to catch bad input only at submit time.
export function cleanNameInput(value) {
  return value.replace(/[^A-Za-z\s]/g, "").slice(0, NAME_MAX_LENGTH);
}

// Kept for anywhere that just needs a single true/false check.
export function isValidName(name) {
  return isNameLongEnough(name) && isNameShortEnough(name) && hasOnlyLetterCharacters(name);
}

// India (+91) keeps the strict 10-digit, starts-with-6-9 mobile rule.
// Other country codes get a general digit-length check since mobile
// number formats vary too widely to hardcode per-country.
export function isValidPhone(phone, countryCode = "+91") {
  const trimmed = phone.trim();
  if (countryCode === "+91") {
    return /^[6-9]\d{9}$/.test(trimmed);
  }
  return /^\d{6,14}$/.test(trimmed);
}

export function cleanPhoneInput(value, countryCode = "+91") {
  const maxLen = countryCode === "+91" ? 10 : 14;
  return value.replace(/^\+?91/, "").replace(/\D/g, "").slice(0, maxLen);
}