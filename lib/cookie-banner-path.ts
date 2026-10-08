/** Routes that must not show the cookie notice (QR landings, collector, photo links). */
const COOKIE_BANNER_HIDDEN_ROOTS = ["/qr", "/qrposta", "/qr-gtag", "/fotky"] as const

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1)
  return path || "/"
}

export function isCookieBannerHiddenPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const path = normalizePathname(pathname)
  return COOKIE_BANNER_HIDDEN_ROOTS.some((root) => path === root || path.startsWith(`${root}/`))
}

export function shouldShowCookieBanner(pathname: string | null | undefined): boolean {
  return !isCookieBannerHiddenPath(pathname)
}

/** Lead popup stays on the homepage, coordinated with the cookie bar there. */
export function shouldShowLeadPopup(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return normalizePathname(pathname) === "/"
}
