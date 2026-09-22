import { NextResponse } from "next/server"

import { getMailer, leadNotifyTo, mailFromAddress } from "@/lib/mailer"
import { processSharePhotos } from "@/lib/photo-share-upload"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return "unknown"
}

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Neplatný formulář." }, { status: 400 })
  }

  const result = await processSharePhotos(form, clientIp(req), {
    sendMail: async (mail) => {
      const mailer = getMailer()
      await mailer.sendMail({
        from: mailFromAddress(),
        to: leadNotifyTo(),
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        attachments: mail.attachments,
      })
    },
  })

  return NextResponse.json(result.body, { status: result.status })
}
