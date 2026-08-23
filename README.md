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
