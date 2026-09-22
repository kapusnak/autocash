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

Tištěný QR kód míří na `https://autocash.cz/qr` (ne na homepage). `/qr` vloží GTM-free iframe s oficiálním `gtag/js` (fronta `js`/`config`/`event` před skriptem) a pošle `gtag('event', 'qr_letak')` na `G-DXBBY6TFGG`, pak přesměruje na čisté `/`. GTM dál vlastní page_view; tag `GA4 - qr_letak` nechte paused. Pending flag se smaže až po `event_callback`. Cestu neodkazujte v menu ani v sitemapě.
