# Autocash

Lead-gen web pro financování výměnou za přepis vozidla (cars-only).

## Stack

- Next.js 16 (App Router) na Railway (`next start`)
- Tailwind CSS 4 + Plus Jakarta Sans / DM Sans
- Nodemailer → Spacemail (`POST /api/lead`), Zod, react-hook-form

## Start

```bash
cp .env.example .env.local
# doplňte SMTP_PASS, PHOTO_TOKEN_SECRET, PHOTO_WIZARD_SHARE_SECRET (a případně analytics)
npm install
npm run dev
```

Bez SMTP credentials `/api/lead` vrátí 500 — očekávané.

### Sdílený odkaz na fotky (bratři)

Jeden stabilní URL pro WhatsApp / SMS — bez přihlášení a bez „vygenerovat odkaz“.

1. Do `.env.local` (lokálně) a do Railway Variables (produkce) nastavte `PHOTO_WIZARD_SHARE_SECRET` — min. 8 znaků (`A–Z a–z 0–9 _ -`, bez tečky), ne slug jako `fotky` nebo `upload`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. Veřejná adresa k odeslání zákazníkovi je **`https://<doména>/fotky/<hodnota PHOTO_WIZARD_SHARE_SECRET>`**, tedy na produkci:

   `https://autocash.cz/fotky/<PHOTO_WIZARD_SHARE_SECRET>`

3. Rotace odkazu = změna env + redeploy. Starý odkaz přestane fungovat.

Po leadu s e-mailem dál platí HMAC odkaz `/fotky/<token>` (kód AC-XXXX). Ten tok se nemění.

Nasazení: viz [DEPLOY.md](./DEPLOY.md).

## Leták QR (`/qr`)

Tištěný QR kód míří na `https://autocash.cz/qr` (ne na homepage). `/qr` vloží GTM-free iframe s oficiálním `gtag/js` (fronta `js`/`config`/`event` před skriptem) a pošle `gtag('event', 'qr_letak')` na `G-DXBBY6TFGG`, pak přesměruje na čisté `/`. GTM dál vlastní page_view; tag `GA4 - qr_letak` nechte paused. Pending flag se smaže až po `event_callback`. Cestu neodkazujte v menu ani v sitemapě.
