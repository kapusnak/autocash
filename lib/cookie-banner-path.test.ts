import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import {
  isCookieBannerHiddenPath,
  shouldShowCookieBanner,
  shouldShowLeadPopup,
} from "./cookie-banner-path.ts"

test("cookie banner shows on content pages", () => {
  for (const path of [
    "/",
    "/kontakty",
    "/jak-to-funguje",
    "/zasady-cookies",
    "/ochrana-osobnich-udaju",
    "/neexistuje",
  ]) {
    assert.equal(shouldShowCookieBanner(path), true, path)
    assert.equal(isCookieBannerHiddenPath(path), false, path)
  }
})

test("cookie banner is hidden on QR, collector, and photo routes including subpaths", () => {
  for (const path of [
    "/qr",
    "/qr/",
    "/qr/extra",
    "/qrposta",
    "/qrposta/",
    "/qrposta/extra",
    "/qr-gtag",
    "/qr-gtag/",
    "/qr-gtag/extra",
    "/fotky",
    "/fotky/",
    "/fotky/share-token",
    "/fotky/eyJhbGciOiJIUzI1NiJ9",
  ]) {
    assert.equal(shouldShowCookieBanner(path), false, path)
    assert.equal(isCookieBannerHiddenPath(path), true, path)
  }
})

test("similar prefixes still show the cookie banner", () => {
  for (const path of ["/qrpostavy", "/fotograf", "/q", "/foto", "/qr-gtag-extra"]) {
    assert.equal(shouldShowCookieBanner(path), true, path)
  }
})

test("lead popup stays on the homepage only", () => {
  assert.equal(shouldShowLeadPopup("/"), true)
  assert.equal(shouldShowLeadPopup("/?x=1"), true)
  assert.equal(shouldShowLeadPopup("/kontakty"), false)
  assert.equal(shouldShowLeadPopup("/fotky/abc"), false)
  assert.equal(shouldShowLeadPopup("/qr"), false)
  assert.equal(shouldShowLeadPopup(null), false)
})

test("cookie bar is mounted from the root layout, not only the homepage", () => {
  const layout = readFileSync(fileURLToPath(new URL("../app/layout.tsx", import.meta.url)), "utf8")
  const home = readFileSync(fileURLToPath(new URL("../app/page.tsx", import.meta.url)), "utf8")
  const chrome = readFileSync(
    fileURLToPath(new URL("../components/bottom-chrome.tsx", import.meta.url)),
    "utf8",
  )
  assert.match(layout, /BottomChrome/)
  assert.equal(home.includes("BottomChrome"), false)
  assert.match(chrome, /shouldShowCookieBanner/)
  assert.match(chrome, /shouldShowLeadPopup/)
  assert.match(chrome, /cookieBarVisible/)
})
