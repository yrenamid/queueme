// Keep only digits from a phone-like string
function normalizePhoneDigits(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

// Validate PH mobile numbers (e.g., 09XXXXXXXXX)
function isValidPHPhone(val) {
  const d = normalizePhoneDigits(val);
  return d.length === 11 && d.startsWith('09');
}

// Basic password strength check (length >= 8, letters and numbers)
function isPasswordStrong(pw) {
  if (!pw || typeof pw !== 'string') return false;
  return pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);
}

// Ensure value has no whitespace characters
function hasNoInternalSpaces(val) {
  if (val == null) return true;
  return !(/\s/.test(String(val)));
}

// True if string contains non-whitespace content
function isNotBlank(val) {
  return !!(val && String(val).trim().length > 0);
}

module.exports = {
  normalizePhoneDigits,
  isValidPHPhone,
  isPasswordStrong,
  hasNoInternalSpaces,
  isNotBlank,
};
