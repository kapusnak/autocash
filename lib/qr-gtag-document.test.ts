import assert from "node:assert/strict"
import { test } from "node:test"
import {
  gaGtagJsSrc,
  isGaMeasurementId,
  isQrGtagMessage,
  qrGtagDocument,
  QR_GTAG_MESSAGE_SOURCE,
} from "./qr-gtag-document.ts"
import { GA_EVENT_QR_LETAK, QR_LETAK_CAMPAIGN } from "./track-qr-letak.ts"

const GA_ID = "G-DXBBY6TFGG"

test("gaGtagJsSrc is default-layer gtag.js with no custom l=", () => {
  const src = gaGtagJsSrc(GA_ID)
  assert.equal(src, `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`)
  assert.equal(src.includes("l="), false)
})

test("isGaMeasurementId accepts G- ids only", () => {
  assert.equal(isGaMeasurementId(GA_ID), true)
  assert.equal(isGaMeasurementId(" AW-17721640948 "), false)
  assert.equal(isGaMeasurementId("GTM-P6VZJXTQ"), false)
  assert.equal(isGaMeasurementId(""), false)
})

test("collector HTML queues js/config/event before gtag/js and never uses GTM or Ads", () => {
  const html = qrGtagDocument({
    measurementId: GA_ID,
    eventName: GA_EVENT_QR_LETAK,
    campaign: {
      source: QR_LETAK_CAMPAIGN.campaign_source,
      medium: QR_LETAK_CAMPAIGN.campaign_medium,
      name: QR_LETAK_CAMPAIGN.campaign_name,
    },
    callbackTimeoutMs: 8000,
  })

  const stubIdx = html.indexOf("function gtag(){window.dataLayer.push(arguments);}")
  const consentIdx = html.indexOf('gtag("consent", "default"')
  const jsIdx = html.indexOf('gtag("js", new Date())')
  const configIdx = html.indexOf('gtag("config"')
  const eventIdx = html.indexOf(`gtag("event", payload.eventName`)
  const srcIdx = html.indexOf(`src="${gaGtagJsSrc(GA_ID)}"`)

  assert.ok(stubIdx >= 0)
  assert.ok(consentIdx > stubIdx)
  assert.ok(jsIdx > consentIdx)
  assert.ok(configIdx > jsIdx)
  assert.ok(eventIdx > configIdx)
  assert.ok(srcIdx > eventIdx, "gtag/js tag must come after the queued event")
  assert.match(html, /analytics_storage: "granted"/)
  assert.match(html, /send_page_view: false/)
  assert.match(html, /event_callback/)
  assert.match(html, /transport_type: "beacon"/)
  assert.match(html, /send_to: payload.measurementId/)
  assert.equal(html.includes("GTM-"), false)
  assert.equal(html.includes("AW-"), false)
  assert.equal(html.includes("autocashGaDl"), false)
  assert.equal(html.includes("__autocashGtag"), false)
  assert.equal(html.includes("{ event:"), false)
  assert.ok(html.includes(QR_GTAG_MESSAGE_SOURCE))
  assert.ok(html.includes(GA_EVENT_QR_LETAK))
  assert.ok(html.includes(GA_ID))
})

test("isQrGtagMessage requires source, event name, and sent boolean", () => {
  assert.equal(
    isQrGtagMessage({ source: QR_GTAG_MESSAGE_SOURCE, event: GA_EVENT_QR_LETAK, sent: true }),
    true,
  )
  assert.equal(isQrGtagMessage({ source: QR_GTAG_MESSAGE_SOURCE, event: GA_EVENT_QR_LETAK, sent: false }), true)
  assert.equal(isQrGtagMessage({ event: GA_EVENT_QR_LETAK, sent: true }), false)
  assert.equal(isQrGtagMessage({ source: QR_GTAG_MESSAGE_SOURCE, event: "page_view", sent: true }), true)
  assert.equal(isQrGtagMessage({ source: "other", event: GA_EVENT_QR_LETAK, sent: true }), false)
})
