/**
 * Deterministic date and currency formatters that output the exact same string
 * on both server (Node.js) and client (browser) regardless of user locale or timezone.
 * Prevents React SSR hydration mismatches.
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FULL_WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export function formatDate(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const day = d.getUTCDate();
  const month = MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateLongWithWeekday(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const weekday = FULL_WEEKDAY_NAMES[d.getUTCDay()];
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = FULL_MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

export function formatDateWithWeekday(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const weekday = WEEKDAY_NAMES[d.getUTCDay()];
  const day = d.getUTCDate();
  const month = MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

export function formatDateShort(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const day = d.getUTCDate();
  const month = MONTH_NAMES[d.getUTCMonth()];
  return `${day} ${month}`;
}

export function formatDateTime(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const day = d.getUTCDate();
  const month = MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
}

export function formatCurrency(amount: number): string {
  const cleanAmount = Math.round(Number(amount) || 0);
  return "₹" + cleanAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  if (isNaN(diff) || diff < 0) return 0;
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Capitalizes a single word: first letter uppercase, remaining lowercase.
 * Preserves hyphenated subwords (e.g., 'Mary-Jane').
 */
export function capitalizeWord(word: string): string {
  if (!word) return "";
  if (word.includes("-")) {
    return word.split("-").map(capitalizeWord).join("-");
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Automatically format a name so that the first letter of each word is capitalized,
 * and the remaining letters are lowercased:
 * 'khushi patel' -> 'Khushi Patel'
 * 'MRS kavita MEHUL javia' -> 'Mrs Kavita Mehul Javia'
 * 'rahul kumar sharma' -> 'Rahul Kumar Sharma'
 */
export function capitalizeGuestName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map(capitalizeWord)
    .join(" ");
}

/**
 * Format guest full name with title (Mr., Mrs., Ms., Dr., Travel Agent).
 * Automatically capitalizes the guest name and avoids duplicating the title.
 */
export function formatGuestFullName(title?: string | null, name?: string | null): string {
  if (!name) return "";
  const capitalized = capitalizeGuestName(name);
  if (!title) return capitalized;
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return capitalized;

  // Check if capitalized name already begins with the title (case-insensitive, ignoring trailing dot)
  const normalizedTitle = trimmedTitle.replace(/\./g, "").toLowerCase();
  const firstWord = capitalized.split(/\s+/)[0]?.replace(/\./g, "").toLowerCase();

  if (firstWord === normalizedTitle) {
    const rest = capitalized.split(/\s+/).slice(1).join(" ");
    return rest ? `${trimmedTitle} ${rest}` : trimmedTitle;
  }

  return `${trimmedTitle} ${capitalized}`;
}

