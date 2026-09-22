# Autocash

Lead-gen web pro financování výměnou za přepis vozidla (cars-only).

## Stack

- Next.js 16 (App Router) na Railway (`next start`)
- Tailwind CSS 4 + Plus Jakarta Sans / DM Sans
- Nodemailer → Spacemail (`POST /api/lead`), Zod, react-hook-form

## Start

```bash
cp .env.example .env.local
# doplňte SMTP_PASS, PHOTO_TOKEN_SECRET (a případně analytics)
npm install
npm run dev
```

Bez SMTP credentials `/api/lead` vrátí 500 — očekávané.

Nasazení: viz [DEPLOY.md](./DEPLOY.md).

## Leták QR (`/qr`)

Tištěný QR kód míří na `https://autocash.cz/qr` (ne na homepage). `GoogleAnalytics` vždy načte `gtag/js?id=NEXT_PUBLIC_GA_MEASUREMENT_ID` (i vedle GTM). Když je GTM nastavené, config je jen `gtag('config', id, { send_page_view: false })` — page_view vlastní GTM. `/qr` počká až 8 s na **vykonaný** measurement `gtag/js` (URL musí obsahovat `/gtag/js` a measurement ID — GTM `gtm.js` nestačí; ne jen inline stub `window.gtag`), odešle `gtag('event', 'qr_letak')` s `send_to` a až potom přesměruje na čisté `/`. Pending flag se smaže až po `event_callback`. Cestu neodkazujte v menu ani v sitemapě.
