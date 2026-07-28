const PREFIX = "+420 "
const MAX_DIGITS = 9

/** National part only (9 digits), grouped with spaces — for input next to a fixed +420 label. */
export function formatNationalDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, MAX_DIGITS)
  const groups = d.match(/.{1,3}/g) ?? []
  return groups.join(" ")
}

/**
 * Format 0–9 digits as "+420 XXX XXX XXX" (spaces every 3 digits).
 */
export function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, MAX_DIGITS)
  const groups = d.match(/.{1,3}/g) ?? []
  return PREFIX + groups.join(" ")
}

/**
 * From raw input, return only the digits the user entered after +420 (max 9).
 * Strips the +420 prefix first so we never treat it as user input.
 */
export function parsePhoneDigits(raw: string): string {
  let d = raw.replace(/^\s*\+420\s*/, "").replace(/\D/g, "")
  if (d.length > MAX_DIGITS && d.startsWith("420")) {
    d = d.slice(3)
  }
  return d.slice(0, MAX_DIGITS)
}

/**
 * Full number for submit / tel: links: "+420" + 9 digits, no spaces.
 */
export function toFullPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, MAX_DIGITS)
  return d.length === MAX_DIGITS ? "+420" + d : ""
}
