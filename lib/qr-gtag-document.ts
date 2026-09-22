/** postMessage `source` from the GTM-free collector document. */
export const QR_GTAG_MESSAGE_SOURCE = "autocash-qr-gtag"

/** `https://www.googletagmanager.com/gtag/js?id=G-…` on the default dataLayer. */
export function gaGtagJsSrc(measurementId: string): string {
  const params = new URLSearchParams({ id: measurementId.trim() })
  return `https://www.googletagmanager.com/gtag/js?${params.toString()}`
}

export type QrGtagCampaign = {
  source: string
  medium: string
  name: string
}

export type QrGtagMessage = {
  source: typeof QR_GTAG_MESSAGE_SOURCE
  event: string
  sent: boolean
}

export function isGaMeasurementId(id: string): boolean {
  return /^G-[A-Z0-9]+$/i.test(id.trim())
}

export function isQrGtagMessage(data: unknown): data is QrGtagMessage {
  if (!data || typeof data !== "object") return false
  const entry = data as Record<string, unknown>
  return (
    entry.source === QR_GTAG_MESSAGE_SOURCE &&
    typeof entry.event === "string" &&
    typeof entry.sent === "boolean"
  )
}

/**
 * GTM-free document that owns script order: stub + `js` timestamp + config +
 * event are queued **before** the `gtag/js` tag. Live #21 preloaded
 * `gtag/js?l=autocashGaDl` as a Next.js Script, so the library could execute
 * on an empty layer and the inline stub then overwrote the collector.
 */
export function qrGtagDocument(options: {
  measurementId: string
  eventName: string
  campaign: QrGtagCampaign
  callbackTimeoutMs: number
}): string {
  const measurementId = options.measurementId.trim()
  if (!isGaMeasurementId(measurementId)) {
    throw new Error("qrGtagDocument requires a GA4 measurement id")
  }

  const eventName = options.eventName
  const src = gaGtagJsSrc(measurementId)
  const payload = {
    measurementId,
    eventName,
    campaign: options.campaign,
    callbackTimeoutMs: options.callbackTimeoutMs,
    messageSource: QR_GTAG_MESSAGE_SOURCE,
  }

  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<title>qr_letak</title>
<script>
(function(){
  var payload = ${JSON.stringify(payload)};
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  function notify(sent){
    if (window.__autocashQrNotified) return;
    window.__autocashQrNotified = true;
    try {
      parent.postMessage({
        source: payload.messageSource,
        event: payload.eventName,
        sent: !!sent
      }, location.origin === "null" ? "*" : location.origin);
    } catch (e) {}
  }
  gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  gtag("js", new Date());
  gtag("config", payload.measurementId, { send_page_view: false });
  gtag("set", {
    campaign: {
      source: payload.campaign.source,
      medium: payload.campaign.medium,
      name: payload.campaign.name
    }
  });
  gtag("event", payload.eventName, {
    campaign_source: payload.campaign.source,
    campaign_medium: payload.campaign.medium,
    campaign_name: payload.campaign.name,
    send_to: payload.measurementId,
    transport_type: "beacon",
    event_callback: function(){ notify(true); }
  });
  setTimeout(function(){ notify(false); }, payload.callbackTimeoutMs);
})();
</script>
<script async src="${src}"></script>
</head>
<body></body>
</html>`
}
