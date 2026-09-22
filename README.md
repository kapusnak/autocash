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

Tištěný QR kód míří na `https://autocash.cz/qr` (ne na homepage). Prohlížeč počká až 8 s na GTM (`google_tag_manager` / `gtm.load`), zaregistruje GA4 přes `gtag('config', id, { send_page_view: false })`, odešle `gtag('event', 'qr_letak')` s `send_to` na `NEXT_PUBLIC_GA_MEASUREMENT_ID` a až potom přesměruje na čisté `/`. Když je nastavené `NEXT_PUBLIC_GTM_ID`, `GoogleAnalytics` nenačítá druhý gtag.js — page_view vlastní GTM. Cestu neodkazujte v menu ani v sitemapě.
