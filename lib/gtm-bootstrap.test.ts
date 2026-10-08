import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { gtmBootstrapSnippet } from "./gtm-bootstrap.ts"

const GTM_ID = "GTM-P6VZJXTQ"

test("gtag stub and dataLayer are defined before the GTM loader", () => {
  const html = gtmBootstrapSnippet(GTM_ID)
  const stubAt = html.indexOf("window.gtag = function gtag()")
  const dataLayerAt = html.indexOf("window.dataLayer = window.dataLayer || []")
  const loaderAt = html.indexOf("https://www.googletagmanager.com/gtm.js?id=")
  assert.ok(dataLayerAt >= 0)
  assert.ok(stubAt > dataLayerAt)
  assert.ok(loaderAt > stubAt)
  assert.match(html, /window\.dataLayer\.push\(arguments\)/)
  assert.match(html, new RegExp(`gtm\\.js\\?id='\\+i\\+dl;[^]*'${GTM_ID}'`))
  assert.match(html, /'dataLayer','GTM-P6VZJXTQ'/)
})

test("bootstrap does not load a second gtag.js or send a page_view", () => {
  const html = gtmBootstrapSnippet(GTM_ID)
  assert.equal(html.includes("gtag/js"), false)
  assert.equal(html.includes("send_page_view"), false)
  assert.equal(html.includes("gtag('config'"), false)
  assert.equal(html.includes('gtag("config"'), false)
  assert.equal(html.includes("consent"), false)
})

test("GoogleTagManager inlines the bootstrap beforeInteractive", () => {
  const src = readFileSync(
    fileURLToPath(new URL("../components/google-tag-manager.tsx", import.meta.url)),
    "utf8",
  )
  assert.match(src, /gtmBootstrapSnippet/)
  assert.match(src, /strategy="beforeInteractive"/)
  assert.equal(src.includes("gtag/js"), false)
})
