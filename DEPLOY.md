# Autocash — nasazení (Railway)

## Lokální vývoj

1. Zkopírujte `.env.example` → `.env.local` a vyplňte `SMTP_PASS`.
2. `npm install`
3. `npm run dev`

Schránka je **info@docasnyvykup.cz** (From v inboxu ukáže `autocash.cz`). Nový mailbox `info@autocash.cz` se nezakládá.

## Railway

Web běží jako **Node server** (`next start`), ne jako static export. Bez serveru nefunguje `POST /api/lead`.

```bash
npm install
npm run build
npm start   # next start -p ${PORT:-3000}
```

- Builder: Nixpacks (`nixpacks.toml` → Node 20)
- Start: `railway.json` → `npm start`
- `NEXT_PUBLIC_*` musí být nastavené **před** buildem (Railway Variables)

### Server env (tajné)

```
SMTP_HOST=mail.spacemail.com
SMTP_PORT=465
SMTP_USER=info@docasnyvykup.cz
SMTP_PASS=
LEAD_NOTIFY_TO=info@docasnyvykup.cz
# MAIL_FROM="autocash.cz <info@docasnyvykup.cz>"
```

Po cutoveru z Railway odstraňte `NEXT_PUBLIC_EMAILJS_*`. Bez rebuildu by se staré klíče stejně inlinovaly.

## Smoke test po nasazení

- [ ] Homepage se vykreslí jako HTML (ne „rozbitý“ binární text)
- [ ] Header CTA „Chci peníze za auto“ → `#formular`
- [ ] Calculator → mail na `LEAD_NOTIFY_TO` včetně IP
- [ ] Popup + CTA → callback mail
- [ ] Calculator s e-mailem → klientské potvrzení
- [ ] Pop-up po ~12 s
- [ ] Cookie lišta
- [ ] `/jak-to-funguje`, `/kontakty`, GDPR, cookies
- [ ] Mobilní menu
