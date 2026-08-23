import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

let transporter: Transporter | null = null

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Chybí proměnná prostředí ${name}.`)
  }
  return value
}

/** Hostname for From display name, e.g. autocash.cz (not local-part "info"). */
function fromDisplayDomain(smtpUser: string): string {
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
  const at = smtpUser.lastIndexOf("@")
  if (at > 0 && at < smtpUser.length - 1) return smtpUser.slice(at + 1)
  return smtpUser
}

/** Lazy Nodemailer transport — created on first send, not at import/build time. */
export function getMailer(): Transporter {
  if (transporter) return transporter

  const host = requireEnv("SMTP_HOST")
  const port = Number(process.env.SMTP_PORT ?? "465")
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("SMTP_PORT musí být platné číslo (např. 465 nebo 587).")
  }
  const user = requireEnv("SMTP_USER")
  const pass = requireEnv("SMTP_PASS")
  const secure = port === 465

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  return transporter
}

/**
 * From header. Prefer MAIL_FROM; otherwise `"domain" <SMTP_USER>` so inboxes
 * show e.g. autocash.cz instead of just "info".
 */
export function mailFromAddress(): string {
  const from = process.env.MAIL_FROM?.trim()
  if (from) return from
  const user = requireEnv("SMTP_USER")
  const domain = fromDisplayDomain(user)
  return `"${domain}" <${user}>`
}

export function leadNotifyTo(): string {
  return requireEnv("LEAD_NOTIFY_TO")
}
