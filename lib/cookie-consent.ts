export const COOKIE_CONSENT_STORAGE_KEY = "autocash-cookie-consent"
export const COOKIE_CONSENT_ACCEPTED = "accepted"
export const COOKIE_CONSENT_CHANGED_EVENT = "autocash-cookie-consent-changed"

export function hasCookieConsent(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === COOKIE_CONSENT_ACCEPTED
  } catch {
    return false
  }
}

export function persistCookieConsentAccepted(): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, COOKIE_CONSENT_ACCEPTED)
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT))
}
