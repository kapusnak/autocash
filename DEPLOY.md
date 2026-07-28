# Autocash — nasazení (static export)

## Lokální vývoj

1. Zkopírujte `.env.example` → `.env.local` a vyplňte EmailJS klíče.
2. `npm install`
3. `npm run dev`

## Build pro Wedos / FTP

`NEXT_PUBLIC_*` se pečou do JS při buildu — musí být nastavené **před** `npm run build`.

```bash
npm install
npm run build
```

Výstup: složka `out/`. Nahrajte **obsah** `out/` na hosting (`www` / `public_html`).

**Nenahrávejte** `.env`, `.env.local` ani `node_modules`.

## Smoke test po nasazení

- [ ] Homepage + formulář odesílá (EmailJS)
- [ ] Pop-up po ~12 s
- [ ] Cookie lišta
- [ ] `/jak-to-funguje`, `/kontakty`, GDPR, cookies
- [ ] Mobilní menu a CTA „Chci peníze“

## Volitelné: Apache pretty URLs

Pokud server neobsluhuje `/cesta` → `/cesta.html`, přidejte rewrite pravidla podle hostingu (stejně jako u hnedpenize).
