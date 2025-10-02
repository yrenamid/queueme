

export function normalizePhoneDigits(input: string | number | null | undefined): string {
  if (input == null) return '';
  return String(input).replace(/\D/g, '');
}

export function isValidPHPhone(digits: string | null | undefined): boolean {
  if (!digits) return false;
  const s = String(digits);
  return s.length === 11 && s.startsWith('09');
}

export function isPasswordStrong(pw: string | null | undefined): boolean {
  if (!pw) return false;
  const s = String(pw);

  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(s);
}

export function hasNoInternalSpaces(s: string | null | undefined): boolean {
  if (s == null) return true;
  return !(/\s/.test(String(s)));
}

export function isNotBlank(s: string | null | undefined): boolean {
  if (s == null) return false;
  return String(s).trim().length > 0;
}
