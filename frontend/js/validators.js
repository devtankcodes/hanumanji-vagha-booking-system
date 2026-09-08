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

// Per-country mobile number rules. Add a new entry here (and to the
// countryCode <select> options in index.html) to support another country
// with its own strict format. Countries not listed fall back to a general
// digit-length check since mobile number formats vary too widely to
// hardcode for every country.
const PHONE_RULES = {
  // India: exactly 10 digits, must start with 6-9.
  "+91": {
    length: 10,
    pattern: /^[6-9]\d{9}$/,
    placeholder: "10-digit number",
    errorMessage: "Enter a valid 10-digit mobile number starting with 6–9.",
  },
  // UAE: exactly 9 digits (after the +971), must start with 5
  // (e.g. 50, 52, 54, 55, 56, 58 mobile prefixes).
  "+971": {
    length: 9,
    pattern: /^5\d{8}$/,
    placeholder: "9-digit number",
    errorMessage: "Enter a valid 9-digit mobile number starting with 5.",
  },
  // US/Canada (NANP): exactly 10 digits. Area code and exchange code
  // (1st and 4th digits) can't start with 0 or 1.
  "+1": {
    length: 10,
    pattern: /^[2-9]\d{2}[2-9]\d{6}$/,
    placeholder: "10-digit number",
    errorMessage: "Enter a valid 10-digit US/Canada number.",
  },
  // UK: mobile numbers are 10 digits after the +44 (leading 0 dropped),
  // must start with 7 (e.g. 07911 123456 -> 7911123456).
  "+44": {
    length: 10,
    pattern: /^7\d{9}$/,
    placeholder: "10-digit number",
    errorMessage: "Enter a valid 10-digit UK mobile number starting with 7.",
  },
  // Australia: mobile numbers are 9 digits after the +61 (leading 0
  // dropped), must start with 4 (e.g. 0412 345 678 -> 412345678).
  "+61": {
    length: 9,
    pattern: /^4\d{8}$/,
    placeholder: "9-digit number",
    errorMessage: "Enter a valid 9-digit Australian mobile number starting with 4.",
  },
  // Singapore: mobile numbers are exactly 8 digits, must start with 8 or 9.
  "+65": {
    length: 8,
    pattern: /^[89]\d{7}$/,
    placeholder: "8-digit number",
    errorMessage: "Enter a valid 8-digit Singapore mobile number starting with 8 or 9.",
  },
  // Saudi Arabia: mobile numbers are 9 digits after the +966 (leading 0
  // dropped), must start with 5.
  "+966": {
    length: 9,
    pattern: /^5\d{8}$/,
    placeholder: "9-digit number",
    errorMessage: "Enter a valid 9-digit Saudi mobile number starting with 5.",
  },
  // Kuwait: mobile numbers are exactly 8 digits, must start with 5, 6, or 9.
  "+965": {
    length: 8,
    pattern: /^[569]\d{7}$/,
    placeholder: "8-digit number",
    errorMessage: "Enter a valid 8-digit Kuwaiti mobile number starting with 5, 6, or 9.",
  },
  // Qatar: mobile numbers are exactly 8 digits, must start with 3, 5, 6, or 7.
  "+974": {
    length: 8,
    pattern: /^[3567]\d{7}$/,
    placeholder: "8-digit number",
    errorMessage: "Enter a valid 8-digit Qatari mobile number starting with 3, 5, 6, or 7.",
  },
  // Oman: mobile numbers are exactly 8 digits, must start with 7 or 9.
  "+968": {
    length: 8,
    pattern: /^[79]\d{7}$/,
    placeholder: "8-digit number",
    errorMessage: "Enter a valid 8-digit Omani mobile number starting with 7 or 9.",
  },
  // Bahrain: mobile numbers are exactly 8 digits, must start with 3 or 6.
  "+973": {
    length: 8,
    pattern: /^[36]\d{7}$/,
    placeholder: "8-digit number",
    errorMessage: "Enter a valid 8-digit Bahraini mobile number starting with 3 or 6.",
  },
  // South Africa: mobile numbers are 9 digits after the +27 (leading 0
  // dropped), must start with 6, 7, or 8.
  "+27": {
    length: 9,
    pattern: /^[678]\d{8}$/,
    placeholder: "9-digit number",
    errorMessage: "Enter a valid 9-digit South African mobile number starting with 6, 7, or 8.",
  },
};

const DEFAULT_PHONE_RULE = {
  length: 14,
  placeholder: "Mobile number",
  errorMessage: "Enter a valid mobile number.",
};

export function getPhoneMaxLength(countryCode = "+91") {
  return (PHONE_RULES[countryCode] || DEFAULT_PHONE_RULE).length;
}

export function getPhonePlaceholder(countryCode = "+91") {
  return (PHONE_RULES[countryCode] || DEFAULT_PHONE_RULE).placeholder;
}

export function getPhoneErrorMessage(countryCode = "+91") {
  return (PHONE_RULES[countryCode] || DEFAULT_PHONE_RULE).errorMessage;
}

export function isValidPhone(phone, countryCode = "+91") {
  const trimmed = phone.trim();
  const rule = PHONE_RULES[countryCode];
  if (rule) {
    return rule.pattern.test(trimmed);
  }
  return /^\d{6,14}$/.test(trimmed);
}

export function cleanPhoneInput(value, countryCode = "+91") {
  const rule = PHONE_RULES[countryCode];
  const maxLen = rule ? rule.length : 14;
  // Strip a leading copy of the country code's digits if the user pasted
  // the full number including it (e.g. "971501234567" or "+971501234567").
  const codeDigits = countryCode.replace(/\D/g, "");
  const stripped = value.replace(/\D/g, "");
  const withoutCode =
    codeDigits && stripped.startsWith(codeDigits) && stripped.length > maxLen
      ? stripped.slice(codeDigits.length)
      : stripped;
  return withoutCode.slice(0, maxLen);
}