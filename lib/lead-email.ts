import { PHOTO_ANGLES_COPY, PHOTO_SLOTS } from "@/lib/photo-slots"

export type LeadSource = "calculator" | "popup" | "cta"

export type LeadPayload = {
  source: LeadSource
  phone: string
  email?: string
  name?: string
  amount?: number
  vehicleModel?: string
  vehicleYear?: string
  vehicleMileage?: string
  vehicleVin?: string
  pagePath?: string
}

/** Brand + contact used in operator/client e-mails for this site. */
const SITE = {
  domain: "autocash.cz",
  brandName: "Autocash",
  contactEmail: "info@docasnyvykup.cz",
  signOff: "Váš tým Autocash",
  phones: [{ tel: "+420776722175", display: "+420 776 722 175" }],
} as const

const ACCENT = "#0d3d32"
const CALLBACK_ONLY_AMOUNT = "--- Pouze požadavek na zavolání ---"
const PLACEHOLDER = "---"

type VehicleDetails = {
  model: string
  year: string
  mileage: string
  vin: string
}

function vehicleDetailsFromPayload(params: LeadPayload, callback: boolean): VehicleDetails | null {
  if (callback) return null
  const model = params.vehicleModel?.trim() ?? ""
  const year = params.vehicleYear?.trim() ?? ""
  const mileage = params.vehicleMileage?.trim() ?? ""
  const vin = params.vehicleVin?.trim() ?? ""
  if (!model && !year && !mileage && !vin) return null
  return {
    model: model || PLACEHOLDER,
    year: year || PLACEHOLDER,
    mileage: mileage ? `${mileage} km` : PLACEHOLDER,
    vin: vin || PLACEHOLDER,
  }
}

function vehicleTextLines(vehicle: VehicleDetails): string[] {
  return [
    `Značka a model vozu: ${vehicle.model}`,
    `Rok výroby: ${vehicle.year}`,
    `Najeté km: ${vehicle.mileage}`,
    `VIN: ${vehicle.vin}`,
  ]
}

function kvRow(label: string, value: string): string {
  return `<tr>
          <td style="padding: 5px 0; width: 45%; vertical-align: top;"><strong>${escapeHtml(label)}:</strong></td>
          <td style="padding: 5px 0; text-align: right; font-weight: 500;">${escapeHtml(value)}</td>
        </tr>`
}

function vehicleHtmlRows(vehicle: VehicleDetails | null): string {
  if (!vehicle) return ""
  return `
        <tr>
          <td colspan="2" style="padding: 5px 0; border-top: 1px dashed #cccccc;"></td>
        </tr>
        ${kvRow("Značka a model vozu", vehicle.model)}
        ${kvRow("Rok výroby", vehicle.year)}
        ${kvRow("Najeté km", vehicle.mileage)}
        ${kvRow("VIN", vehicle.vin)}`
}

/**
 * Compact E.164-style number for `tel:` links (no spaces).
 * `+420 728 020 048` → `+420728020048`
 */
export function normalizePhoneForTel(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return ""
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("420")) return `+${digits}`
  if (digits.length === 9) return `+420${digits}`
  return trimmed.replace(/\s/g, "")
}

/** e.g. `+420728020048` → `+420 728 020 048` for readable e-mail body */
export function formatPhoneDisplayForNotification(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return ""
  let digits = trimmed.replace(/\D/g, "")
  if (digits.length >= 11 && digits.startsWith("420")) digits = digits.slice(3)
  const national = digits.slice(0, 9)
  if (national.length !== 9) return trimmed
  const groups = national.match(/.{1,3}/g)?.join(" ") ?? national
  return `+420 ${groups}`
}

/** Format amount for email: "1 800 000,- Kč" */
export function formatAmountCzk(value: number): string {
  const integer = Math.round(value)
  const withSpaces = integer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${withSpaces},- Kč`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Hostname for notify subject and Zdroj, e.g. `autocash.cz`. */
function notifyDomainTag(): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim()
  if (origin) {
    try {
      const host = new URL(origin.includes("://") ? origin : `https://${origin}`).hostname.replace(
        /^www\./,
        "",
      )
      if (host) return host
    } catch {
      /* fall through */
    }
  }
  return SITE.domain
}

function isCallbackOnly(source: LeadSource): boolean {
  return source === "cta" || source === "popup"
}

/**
 * Operator inbox subject. Client name first (after the domain tag) so it stays
 * visible on mobile, same idea as docasnyvykup / hnedpenize.
 */
export function operatorNotifySubject(options: {
  domainTag: string
  callback: boolean
  name: string
  phoneDisplay: string
}): string {
  const who = options.name !== PLACEHOLDER ? options.name : options.phoneDisplay
  const core = options.callback
    ? options.name !== PLACEHOLDER
      ? `${who} – Callback`
      : `Callback – ${who}`
    : `${who} – Nová poptávka`
  return `[${options.domainTag}] ${core}`
}

export type BuiltLeadEmails = {
  notifySubject: string
  notifyText: string
  notifyHtml: string
  clientSubject: string
  clientText: string
  clientHtml: string
  clientEmail: string
  phoneTel: string
  phoneDisplay: string
}

const PHOTO_COUNT = PHOTO_SLOTS.length
const PHOTO_ANGLES = PHOTO_ANGLES_COPY

/** Operator notification HTML. Field order: source → name → phone → email → IP → rest. */
function buildNotifyHtml(fields: {
  source: string
  name: string
  phoneTel: string
  phoneDisplay: string
  email: string
  amount: string
  ip: string
  vehicle: VehicleDetails | null
  photoCode?: string
  photoUrl?: string
}): string {
  const emailCell = fields.email
    ? `<a href="mailto:${escapeHtml(fields.email)}" style="color: ${ACCENT}; text-decoration: none;">${escapeHtml(fields.email)}</a>`
    : escapeHtml(PLACEHOLDER)
  const phoneCell = fields.phoneTel
    ? `<a href="tel:${escapeHtml(fields.phoneTel)}" style="color: ${ACCENT}; text-decoration: none;">${escapeHtml(fields.phoneDisplay)}</a>`
    : escapeHtml(fields.phoneDisplay || PLACEHOLDER)

  return `
<div style="font-family: system-ui, sans-serif, Arial; font-size: 14px; color: #333333; max-width: 450px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #ffffff;">
  <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid ${ACCENT};">
    <div style="padding: 6px 10px; background-color: #ecfdf5; border-radius: 5px; font-size: 20px; line-height: 1;">
      <span style="color: ${ACCENT};">🚗</span>
    </div>
    <div style="color: ${ACCENT}; font-size: 17px; font-weight: bold; margin-left: 10px;">
      ${escapeHtml(
        fields.name !== PLACEHOLDER
          ? `AUTOCASH — NOVÁ POPTÁVKA — ${fields.name}`
          : "AUTOCASH — NOVÁ POPTÁVKA",
      )}
    </div>
  </div>
  <div style="padding: 10px 0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr>
          <td style="padding: 5px 0; width: 45%; vertical-align: top;"><strong>Zdroj:</strong></td>
          <td style="padding: 5px 0; text-align: right;">${escapeHtml(fields.source)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; width: 45%;"><strong>Jméno klienta:</strong></td>
          <td style="padding: 5px 0; text-align: right;">${escapeHtml(fields.name)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Telefon:</strong></td>
          <td style="padding: 5px 0; text-align: right;">${phoneCell}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>E-mail:</strong></td>
          <td style="padding: 5px 0; text-align: right;">${emailCell}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>IP adresa:</strong></td>
          <td style="padding: 5px 0; text-align: right; font-weight: 500;">${escapeHtml(fields.ip)}</td>
        </tr>
        ${vehicleHtmlRows(fields.vehicle)}
        ${fields.photoCode ? kvRow("Kód poptávky", fields.photoCode) : ""}
      </tbody>
    </table>
  </div>
  ${
    fields.photoUrl
      ? `<div style="margin-top: 16px; padding: 12px; background-color: #f7f7f7; border-radius: 6px;">
    <div style="font-size: 13px; font-weight: bold; color: ${ACCENT}; margin-bottom: 6px;">Fotky vozu</div>
    <div style="font-size: 13px; line-height: 1.5;">Klientovi můžete během další komunikace s ním zaslat <a href="${escapeHtml(fields.photoUrl)}" style="color: ${ACCENT}; font-weight: bold;">tento unikátní odkaz</a>, na kterém nahraje fotografie automobilu.</div>
  </div>`
      : ""
  }
  <div style="margin-top: 20px; padding: 12px; background-color: #ecfdf5; border: 1px solid ${ACCENT}; border-radius: 6px; text-align: center;">
    <div style="font-size: 13px; color: ${ACCENT}; margin-bottom: 3px;">POŽADOVANÁ ČÁSTKA</div>
    <div style="font-size: 22px; font-weight: bold; color: ${ACCENT};">${escapeHtml(fields.amount)}</div>
  </div>
</div>`.trim()
}

/** Client confirmation HTML — cars-only Autocash copy. */
function buildClientHtml(fields: {
  name: string
  amount: string
  vehicle: VehicleDetails | null
  photoUrl?: string
}): string {
  const phoneLines = SITE.phones
    .map(
      (p) =>
        `<a style="color: ${ACCENT}; text-decoration: none;" href="tel:${escapeHtml(p.tel)}">${escapeHtml(p.display)}</a>`,
    )
    .join("<br>\n      ")
  const contactEmail = SITE.contactEmail

  return `
<div style="font-family: system-ui, sans-serif, Arial; font-size: 14px; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #ffffff;">
  <div style="color: ${ACCENT}; font-size: 20px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid ${ACCENT}; padding-bottom: 10px;">Dobrý den, děkujeme za Vaši poptávku!</div>
  <div style="margin-bottom: 25px;">Potvrzujeme, že jsme Vaši žádost o financování zajištěné vozidlem přijali. Brzy se s Vámi spojíme.</div>
  <div style="padding: 15px; background-color: #f7f7f7; border-radius: 6px; border: 1px solid #ecfdf5;">
    <div style="color: #2c3e50; font-size: 16px; font-weight: bold; margin-bottom: 10px;">SHRNUTÍ VAŠÍ ŽÁDOSTI</div>
    <table style="width: 100%; border-collapse: collapse;" role="presentation">
      <tbody>
        <tr>
          <td style="padding: 5px 0; width: 50%;"><strong>Jméno:</strong></td>
          <td style="padding: 5px 0; text-align: right;">${escapeHtml(fields.name)}</td>
        </tr>
        ${
          fields.vehicle
            ? `${kvRow("Značka a model vozu", fields.vehicle.model)}
        ${kvRow("Rok výroby", fields.vehicle.year)}
        ${kvRow("Najeté km", fields.vehicle.mileage)}
        ${kvRow("VIN", fields.vehicle.vin)}`
            : ""
        }
      </tbody>
    </table>
    <div style="margin-top: 15px; padding: 10px; background-color: #ecfdf5; border: 1px solid ${ACCENT}; border-radius: 6px; text-align: center;">
      <div style="font-size: 13px; color: ${ACCENT}; margin-bottom: 3px;">POŽADOVANÁ ČÁSTKA</div>
      <div style="font-size: 20px; font-weight: bold; color: ${ACCENT};">${escapeHtml(fields.amount)}</div>
    </div>
  </div>
  <div style="margin-top: 30px; padding: 15px; border-left: 4px solid ${ACCENT}; background-color: #f0fdf4; border-radius: 4px;">
    <h3 style="color: ${ACCENT}; margin-top: 0; font-size: 17px;">CO BUDE DÁL?</h3>
    <p>Vaši poptávku posoudíme podle vozu a požadované částky. Ozveme se vám telefonicky nebo e-mailem.</p>
    ${
      fields.photoUrl
        ? `<p>Pro urychlení ocenění prosíme o <strong>${PHOTO_COUNT} fotek vozu</strong>: ${escapeHtml(PHOTO_ANGLES)}.</p>
    <p style="margin: 14px 0;">
      <a href="${escapeHtml(fields.photoUrl)}" style="display: inline-block; background-color: ${ACCENT}; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: bold;">Nahrát fotky vozu</a>
    </p>
    <p style="font-size: 13px;">Odkaz můžete použít i později, pokud teď nemáte fotky po ruce.</p>`
        : ""
    }
    <p style="margin: 10px 0 0 0; line-height: 1.5; font-weight: normal;">Obvykle se ozveme během pracovní doby.</p>
  </div>
  <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #cccccc;">
    <h4 style="margin-bottom: 10px; font-size: 15px; color: ${ACCENT};">Spěcháte, nebo máte dotazy?</h4>
    <p style="margin: 5px 0;">📞 Telefon:<br>
      ${phoneLines}
    </p>
    <p style="margin: 5px 0;">📧 E-mail: <a style="color: ${ACCENT}; text-decoration: none;" href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></p>
  </div>
  <div style="margin-top: 30px;">
    <p style="margin: 0;">Těšíme se na spolupráci!</p>
    <p style="margin: 5px 0 0 0;">S pozdravem,</p>
    <p style="margin: 0; font-weight: bold; color: ${ACCENT};">${escapeHtml(SITE.signOff)}</p>
  </div>
</div>`.trim()
}

export function buildLeadEmails(
  params: LeadPayload & { ip: string; photoUrl?: string; photoCode?: string },
): BuiltLeadEmails {
  const callback = isCallbackOnly(params.source)
  const vehicle = vehicleDetailsFromPayload(params, callback)
  const phoneTel = normalizePhoneForTel(params.phone)
  const phoneDisplay = formatPhoneDisplayForNotification(params.phone) || params.phone.trim()
  const name = params.name?.trim() || PLACEHOLDER
  const email = (params.email ?? "").trim()
  const amount =
    params.amount != null
      ? formatAmountCzk(params.amount)
      : callback
        ? CALLBACK_ONLY_AMOUNT
        : PLACEHOLDER
  const ip = params.ip.trim() || "neznámá"
  const sourceDisplay = notifyDomainTag()
  const domainTag = sourceDisplay

  const notifySubject = operatorNotifySubject({
    domainTag,
    callback,
    name,
    phoneDisplay,
  })

  const notifyText = [
    `Zdroj: ${sourceDisplay}`,
    `Jméno klienta: ${name}`,
    `Telefon: ${phoneDisplay}`,
    `E-mail: ${email || PLACEHOLDER}`,
    `IP adresa: ${ip}`,
    ...(vehicle ? vehicleTextLines(vehicle) : []),
    `Částka: ${amount}`,
    ...(params.photoCode ? [`Kód poptávky: ${params.photoCode}`] : []),
    ...(params.photoUrl
      ? [
          `Fotky vozu: Klientovi můžete během další komunikace s ním zaslat tento unikátní odkaz, na kterém nahraje fotografie automobilu: ${params.photoUrl}`,
        ]
      : []),
  ].join("\n")

  const notifyHtml = buildNotifyHtml({
    source: sourceDisplay,
    name,
    phoneTel: phoneTel || params.phone.trim(),
    phoneDisplay,
    email,
    amount,
    ip,
    vehicle,
    ...(params.photoCode ? { photoCode: params.photoCode } : {}),
    ...(params.photoUrl ? { photoUrl: params.photoUrl } : {}),
  })

  const clientNameForBody = callback ? PLACEHOLDER : name
  const clientSubject = `Potvrzení přijetí poptávky – ${SITE.brandName}`
  const phonesText = SITE.phones.map((p) => p.display).join(" / ")
  const clientText = [
    "Dobrý den, děkujeme za Vaši poptávku!",
    "",
    "Potvrzujeme, že jsme Vaši žádost o financování zajištěné vozidlem přijali. Brzy se s Vámi spojíme.",
    "",
    `Jméno: ${clientNameForBody}`,
    ...(vehicle ? vehicleTextLines(vehicle) : []),
    `Požadovaná částka: ${amount}`,
    "",
    "Obvykle se ozveme během pracovní doby.",
    ...(params.photoUrl
      ? [
          "",
          `Pro urychlení ocenění prosíme o ${PHOTO_COUNT} fotek vozu (${PHOTO_ANGLES}):`,
          params.photoUrl,
        ]
      : []),
    "",
    `Telefon: ${phonesText}`,
    `E-mail: ${SITE.contactEmail}`,
    "",
    "S pozdravem,",
    SITE.signOff,
  ].join("\n")

  const clientHtml = buildClientHtml({
    name: clientNameForBody,
    amount,
    vehicle,
    ...(params.photoUrl ? { photoUrl: params.photoUrl } : {}),
  })

  return {
    notifySubject,
    notifyText,
    notifyHtml,
    clientSubject,
    clientText,
    clientHtml,
    clientEmail: email,
    phoneTel: phoneTel || params.phone.trim(),
    phoneDisplay,
  }
}
