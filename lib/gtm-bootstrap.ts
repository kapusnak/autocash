/**
 * Inline bootstrap that runs before gtm.js.
 * Defines the standard dataLayer + gtag stub so later `gtag('event', …)`
 * commands are queued on the same layer GTM's Google tag reads.
 * Does not load a second gtag.js and does not emit a page_view.
 */
export function gtmBootstrapSnippet(gtmId: string): string {
  const id = gtmId.trim()
  return `window.dataLayer = window.dataLayer || [];
if (typeof window.gtag !== 'function') {
  window.gtag = function gtag(){window.dataLayer.push(arguments);};
}
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`
}
