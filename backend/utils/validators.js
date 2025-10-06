//only digits from a phone-like string
function normalizePhoneDigits(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}

// Validate PH mobile numbers 
function isValidPHPhone(val) {
  const d = normalizePhoneDigits(val);
  return d.length === 11 && d.startsWith('09');
}

// password strength check 
function isPasswordStrong(pw) {
  if (!pw || typeof pw !== 'string') return false;
  return pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);
}

// value no whitespace characters
function hasNoInternalSpaces(val) {
  if (val == null) return true;
  return !(/\s/.test(String(val)));
}

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
