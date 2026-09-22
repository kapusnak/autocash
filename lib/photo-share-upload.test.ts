import assert from "node:assert/strict"
import { test } from "node:test"

import { PHOTO_SLOTS } from "./photo-slots.ts"
import { PHOTO_WIZARD_SHARE_SECRET_ENV } from "./photo-share.ts"
import { processSharePhotos } from "./photo-share-upload.ts"
import { createSlidingWindowLimiter } from "./rate-limit.ts"

const SECRET = "test-share-secret-token-ok-24plus"

function jpegFile(name = "x.jpg") {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd8, 0x00])], name, { type: "image/jpeg" })
}

function filledForm(overrides?: { token?: string; name?: string; phone?: string; note?: string; skipPhotos?: boolean }) {
  const form = new FormData()
  form.append("token", overrides?.token ?? SECRET)
  if (overrides?.name != null) form.append("name", overrides.name)
  if (overrides?.phone != null) form.append("phone", overrides.phone)
  if (overrides?.note != null) form.append("note", overrides.note)
  if (!overrides?.skipPhotos) {
    for (const slot of PHOTO_SLOTS) {
      form.append(slot, jpegFile(`${slot}.jpg`))
    }
  }
  return form
}

function withSecret(fn: () => Promise<void>) {
  const prev = process.env[PHOTO_WIZARD_SHARE_SECRET_ENV]
  process.env[PHOTO_WIZARD_SHARE_SECRET_ENV] = SECRET
  return fn().finally(() => {
    if (prev === undefined) delete process.env[PHOTO_WIZARD_SHARE_SECRET_ENV]
    else process.env[PHOTO_WIZARD_SHARE_SECRET_ENV] = prev
  })
}

test("wrong or missing secret returns 404 and does not send mail", async () => {
  await withSecret(async () => {
    const sent: unknown[] = []
    const missing = await processSharePhotos(filledForm({ token: "" }), "1.1.1.1", {
      sendMail: async (mail) => {
        sent.push(mail)
      },
      ipLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
      tokenLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
    })
    assert.equal(missing.status, 404)
    assert.deepEqual(missing.body, { error: "Not found." })

    const wrong = await processSharePhotos(filledForm({ token: "totally-wrong-secret-value-xx" }), "1.1.1.2", {
      sendMail: async (mail) => {
        sent.push(mail)
      },
      ipLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
      tokenLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
    })
    assert.equal(wrong.status, 404)
    assert.deepEqual(wrong.body, { error: "Not found." })
    assert.equal(sent.length, 0)
  })
})

test("submit succeeds with empty optional fields", async () => {
  await withSecret(async () => {
    let subject = ""
    let text = ""
    const result = await processSharePhotos(filledForm(), "2.2.2.2", {
      createCode: () => "SD-TEST",
      sendMail: async (mail) => {
        subject = mail.subject
        text = mail.text
        assert.equal(mail.attachments.length, PHOTO_SLOTS.length)
      },
      ipLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
      tokenLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
    })
    assert.equal(result.status, 200)
    assert.deepEqual(result.body, { ok: true, code: "SD-TEST" })
    assert.match(subject, /sdílený odkaz/)
    assert.match(subject, /SD-TEST/)
    assert.doesNotMatch(subject, /AC-/)
    assert.match(text, /Jméno: —/)
  })
})

test("includes optional pairing fields in the notification email", async () => {
  await withSecret(async () => {
    let text = ""
    let html = ""
    const result = await processSharePhotos(
      filledForm({
        name: "Míša Test",
        phone: "+420 776 000 111",
        note: "K obchodu od Zdeňi",
      }),
      "3.3.3.3",
      {
        createCode: () => "SD-PAIR",
        sendMail: async (mail) => {
          text = mail.text
          html = mail.html
        },
        ipLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
        tokenLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
      },
    )
    assert.equal(result.status, 200)
    assert.match(text, /Míša Test/)
    assert.match(text, /\+420 776 000 111/)
    assert.match(text, /K obchodu od Zdeňi/)
    assert.match(html, /Míša Test/)
  })
})

test("missing photos after a valid secret is 400, not 404", async () => {
  await withSecret(async () => {
    const result = await processSharePhotos(filledForm({ skipPhotos: true }), "4.4.4.4", {
      sendMail: async () => {
        throw new Error("should not send")
      },
      ipLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
      tokenLimiter: createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 }),
    })
    assert.equal(result.status, 400)
    assert.match(String(result.body.error), /Chybí fotka/)
  })
})

test("rate-limits repeated uploads from the same IP", async () => {
  await withSecret(async () => {
    const ipLimiter = createSlidingWindowLimiter({ limit: 2, windowMs: 60_000 })
    const tokenLimiter = createSlidingWindowLimiter({ limit: 20, windowMs: 60_000 })
    const deps = {
      sendMail: async () => {},
      createCode: () => "SD-RL",
      ipLimiter,
      tokenLimiter,
    }
    const first = await processSharePhotos(filledForm(), "9.9.9.9", deps)
    const second = await processSharePhotos(filledForm(), "9.9.9.9", deps)
    const third = await processSharePhotos(filledForm(), "9.9.9.9", deps)
    assert.equal(first.status, 200)
    assert.equal(second.status, 200)
    assert.equal(third.status, 429)
  })
})
