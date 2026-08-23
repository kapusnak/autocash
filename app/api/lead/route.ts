import { NextResponse } from "next/server"

import { buildLeadEmails, type LeadPayload, type LeadSource } from "@/lib/lead-email"
import { getMailer, leadNotifyTo, mailFromAddress } from "@/lib/mailer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SOURCES: LeadSource[] = ["calculator", "popup", "cta"]

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return "neznámá"
}

function parseBody(raw: unknown): LeadPayload | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const source = o.source
  if (typeof source !== "string" || !SOURCES.includes(source as LeadSource)) return null
  const phone = typeof o.phone === "string" ? o.phone.trim() : ""
  if (!phone) return null

  const amountRaw = o.amount
  let amount: number | undefined
  if (typeof amountRaw === "number" && Number.isFinite(amountRaw)) {
    amount = amountRaw
  } else if (typeof amountRaw === "string" && amountRaw.trim() !== "") {
    const n = Number(amountRaw)
    if (Number.isFinite(n)) amount = n
  }

  return {
    source: source as LeadSource,
    phone,
    ...(typeof o.email === "string" ? { email: o.email } : {}),
    ...(typeof o.name === "string" ? { name: o.name } : {}),
    ...(amount != null ? { amount } : {}),
    ...(typeof o.assetType === "string" ? { assetType: o.assetType } : {}),
    ...(typeof o.serviceType === "string" ? { serviceType: o.serviceType } : {}),
    ...(typeof o.propertyAddress === "string" ? { propertyAddress: o.propertyAddress } : {}),
    ...(typeof o.pagePath === "string" ? { pagePath: o.pagePath } : {}),
  }
}

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 })
  }

  const payload = parseBody(json)
  if (!payload) {
    return NextResponse.json(
      { error: "Chybí povinné údaje (source, phone)." },
      { status: 400 },
    )
  }

  const ip = clientIp(req)
  const built = buildLeadEmails({ ...payload, ip })

  try {
    const mailer = getMailer()
    const from = mailFromAddress()
    const to = leadNotifyTo()

    await mailer.sendMail({
      from,
      to,
      replyTo: built.clientEmail || undefined,
      subject: built.notifySubject,
      text: built.notifyText,
      html: built.notifyHtml,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[lead] Notifikace selhala:", message, err)
    return NextResponse.json(
      { error: `Odeslání poptávky selhalo: ${message}` },
      { status: 500 },
    )
  }

  if (built.clientEmail) {
    try {
      const mailer = getMailer()
      await mailer.sendMail({
        from: mailFromAddress(),
        to: built.clientEmail,
        subject: built.clientSubject,
        text: built.clientText,
        html: built.clientHtml,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(
        "[lead] Klientské potvrzení se nepovedlo (poptávka už mohla dorazit vám):",
        message,
        err,
      )
    }
  }

  return NextResponse.json({ ok: true })
}
