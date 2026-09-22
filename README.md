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

Tištěný QR kód míří na `https://autocash.cz/qr` (ne na homepage). Vedle GTM se measurement `gtag/js` načte na izolovaný dataLayer `autocashGaDl` (`l=autocashGaDl`) — stejný `G-` na GTM `dataLayer` `send_to` nedoručí (hnedpenize to řeší Ads `gtag/js?id=AW-…`). Config je `send_page_view: false`. `/qr` počká na vykonaný isolated `gtag/js`, odešle `gtag('event', 'qr_letak')` s `send_to` a až potom přesměruje na čisté `/`. Pending flag se smaže až po `event_callback`. Cestu neodkazujte v menu ani v sitemapě.
