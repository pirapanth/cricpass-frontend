/**
 * Enforces "+94" country code prefix and strips any leading "0" or non-digits,
 * capping the subscriber portion to 9 digits (e.g., "+94770000000").
 */
export function handlePlus94PhoneInput(rawValue) {
  if (!rawValue) return '+94';
  const str = String(rawValue).trim();
  if (str === '+' || str === '+9') return '+94';

  let subscriber;
  if (str.startsWith('+94')) {
    subscriber = str.slice(3);
  } else if (/^94\d{9,10}$/.test(str.replace(/\D/g, ''))) {
    subscriber = str.replace(/\D/g, '').slice(2);
  } else {
    subscriber = str;
  }

  const cleanDigits = subscriber.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
  return `+94${cleanDigits}`;
}

/**
 * Prevents deleting the locked "+94" prefix or entering a leading "0" right after "+94".
 */
export function handlePlus94KeyDown(e) {
  const { selectionStart, selectionEnd } = e.target;
  if (e.ctrlKey || e.metaKey) return;

  // Allow operations when a range spanning past the prefix is selected (e.g., Ctrl+A + Paste/Backspace)
  if (selectionStart === 0 && selectionEnd >= 3) return;

  if (e.key === 'Backspace' && selectionStart <= 3 && selectionEnd <= 3) {
    e.preventDefault();
    return;
  }
  if (e.key === 'Delete' && selectionStart < 3) {
    e.preventDefault();
    return;
  }
  if (e.key === '0' && selectionStart <= 3 && selectionEnd <= 3) {
    e.preventDefault();
  }
}

/**
 * Validates strictly "+94" followed by 9 non-zero-leading digits (e.g., "+94770000000").
 */
export function isValidPlus94Phone(phone) {
  if (!phone) return false;
  return /^\+94[1-9]\d{8}$/.test(String(phone).trim());
}

/**
 * Formats any stored Sri Lankan phone number to "+94XXXXXXXXX" display format.
 * Examples:
 * - "0771454651" -> "+94770000000"
 * - "94770000000" -> "+94770000000"
 * - "+940771454651" -> "+94770000000"
 * - "771454651" -> "+94770000000"
 */
export function formatDisplayPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('940') && digits.length === 12) {
    return `+94${digits.slice(3)}`;
  }
  if (digits.startsWith('94') && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+94${digits.slice(1)}`;
  }
  if (digits.length === 9 && !digits.startsWith('0')) {
    return `+94${digits}`;
  }
  return String(phone).trim().startsWith('+') ? String(phone).trim() : `+${digits}`;
}

/**
 * Masks the middle digits of a formatted phone number for UI privacy
 * (e.g. "+94770000000" -> "+9477****651").
 */
export function maskDisplayPhone(phone) {
  const formatted = formatDisplayPhone(phone);
  if (!formatted) return '';
  if (/^\+94\d{9}$/.test(formatted)) {
    return `${formatted.slice(0, 5)}****${formatted.slice(-3)}`;
  }
  if (formatted.length > 7) {
    return `${formatted.slice(0, 4)}****${formatted.slice(-3)}`;
  }
  return formatted;
}
