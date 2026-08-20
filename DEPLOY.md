# Autocash — nasazení (Railway)

## Lokální vývoj

1. Zkopírujte `.env.example` → `.env.local` a vyplňte EmailJS klíče.
2. `npm install`
3. `npm run dev`

## Railway

Web běží jako **Node server** (`next start`), ne jako static export.

```bash
npm install
npm run build
npm start   # next start -p ${PORT:-3000}
```

- Builder: Nixpacks (`nixpacks.toml` → Node 20)
- Start: `railway.json` → `npm start`
- `NEXT_PUBLIC_*` musí být nastavené **před** buildem (Railway Variables)

## Smoke test po nasazení

- [ ] Homepage se vykreslí jako HTML (ne „rozbitý“ binární text)
- [ ] Header CTA „Chci peníze za auto“ → `#formular`
- [ ] Formulář odesílá (EmailJS)
- [ ] Pop-up po ~12 s
- [ ] Cookie lišta
- [ ] `/jak-to-funguje`, `/kontakty`, GDPR, cookies
- [ ] Mobilní menu
