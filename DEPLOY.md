# Autocash — nasazení (Railway)

## Lokální vývoj

1. Zkopírujte `.env.example` → `.env.local` a vyplňte `SMTP_PASS` (a volitelně `PHOTO_WIZARD_SHARE_SECRET` pro sdílený odkaz na fotky).
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
- `/qr` `qr_letak`: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-DXBBY6TFGG` (GTM-free iframe collector; GTM tag `GA4 - qr_letak` stays paused)

### Server env (tajné)

```
SMTP_HOST=mail.spacemail.com
SMTP_PORT=465
SMTP_USER=info@docasnyvykup.cz
SMTP_PASS=
LEAD_NOTIFY_TO=info@docasnyvykup.cz
PHOTO_TOKEN_SECRET=
PHOTO_WIZARD_SHARE_SECRET=
# MAIL_FROM="autocash.cz <info@docasnyvykup.cz>"
```

`PHOTO_WIZARD_SHARE_SECRET` je **přesně ta cesta v URL**, kterou bratři posílají zákazníkům:

`https://autocash.cz/fotky/<PHOTO_WIZARD_SHARE_SECRET>`

Vygenerujte jednou (min. 8 znaků, jen `A–Z a–z 0–9 _ -`, bez tečky — ať se neplete s HMAC tokenem po leadu):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Hodnotu vložte do Railway Variables a po deployi ten URL uložte do WhatsApp / poznámek. Rotace = nová hodnota + redeploy. Bez této proměnné sdílený odkaz nefunguje (ukáže „odkaz už neplatí“); poptávky po leadu (`PHOTO_TOKEN_SECRET`) fungují dál.

Lokální zkouška: stejnou hodnotu do `.env.local`, `npm run dev`, otevřít `http://localhost:3000/fotky/<secret>`, nahrát 6 fotek (jméno / telefon / poznámka můžou zůstat prázdné), zkontrolovat mail na `LEAD_NOTIFY_TO` — předmět obsahuje **„sdílený odkaz“**, ne kód `AC-XXXX`.

Po cutoveru z Railway odstraňte `NEXT_PUBLIC_EMAILJS_*`. Bez rebuildu by se staré klíče stejně inlinovaly.

## Smoke test po nasazení

- [ ] Homepage se vykreslí jako HTML (ne „rozbitý“ binární text)
- [ ] Header CTA „Chci peníze za auto“ → `#formular`
- [ ] Calculator → mail na `LEAD_NOTIFY_TO` včetně IP
- [ ] Popup + CTA → callback mail
- [ ] Calculator s e-mailem → klientské potvrzení s odkazem na fotky
- [ ] `/fotky/…` wizard po leadu (HMAC) → 6 fotek → jeden mail s 6 přílohami a kódem AC-XXXX
- [ ] Sdílený odkaz `/fotky/<PHOTO_WIZARD_SHARE_SECRET>` → 6 fotek + volitelné jméno/telefon/poznámka → mail „sdílený odkaz“
- [ ] Pop-up po ~12 s
- [ ] Cookie lišta
- [ ] `/jak-to-funguje`, `/kontakty`, GDPR, cookies
- [ ] Mobilní menu
- [ ] `/qr` (leták) → event `qr_letak` → čisté `/` (Googlebot jen redirect, bez eventu)
