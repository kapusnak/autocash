import assert from "node:assert/strict"
import { test } from "node:test"

import {
  PHOTO_SHARE_SECRET_MIN_LENGTH,
  PHOTO_WIZARD_SHARE_SECRET_ENV,
  buildSharePhotoEmail,
  isPhotoWizardShareToken,
  parseShareContactFields,
  photoWizardShareUrl,
} from "./photo-share.ts"

function withShareSecret(value: string | undefined, fn: () => void) {
  const prev = process.env[PHOTO_WIZARD_SHARE_SECRET_ENV]
  const prevSite = process.env.NEXT_PUBLIC_SITE_URL
  if (value === undefined) delete process.env[PHOTO_WIZARD_SHARE_SECRET_ENV]
  else process.env[PHOTO_WIZARD_SHARE_SECRET_ENV] = value
  try {
    fn()
  } finally {
    if (prev === undefined) delete process.env[PHOTO_WIZARD_SHARE_SECRET_ENV]
    else process.env[PHOTO_WIZARD_SHARE_SECRET_ENV] = prev
    if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
    else process.env.NEXT_PUBLIC_SITE_URL = prevSite
  }
}

const GOOD_SECRET = "a".repeat(PHOTO_SHARE_SECRET_MIN_LENGTH) + "ShareToken_99"

test("accepts the configured share secret", () => {
  withShareSecret(GOOD_SECRET, () => {
    assert.equal(isPhotoWizardShareToken(GOOD_SECRET), true)
    assert.equal(isPhotoWizardShareToken(`  ${GOOD_SECRET}  `), true)
  })
})

test("rejects wrong, empty, and HMAC-shaped tokens", () => {
  withShareSecret(GOOD_SECRET, () => {
    assert.equal(isPhotoWizardShareToken("wrong-token-value-that-is-long"), false)
    assert.equal(isPhotoWizardShareToken(""), false)
    assert.equal(isPhotoWizardShareToken("eyJjb2RlIjoiQUMtQUJDIn0.sig"), false)
    assert.equal(isPhotoWizardShareToken("fotky"), false)
    assert.equal(isPhotoWizardShareToken("upload"), false)
  })
})

test("rejects when env is missing or too weak", () => {
  withShareSecret(undefined, () => {
    assert.equal(isPhotoWizardShareToken(GOOD_SECRET), false)
    assert.equal(photoWizardShareUrl(), null)
  })
  withShareSecret("fotky", () => {
    assert.equal(isPhotoWizardShareToken("fotky"), false)
  })
  withShareSecret("not.a.valid.secret.because.dots", () => {
    assert.equal(isPhotoWizardShareToken("not.a.valid.secret.because.dots"), false)
  })
  withShareSecret("short", () => {
    assert.equal(isPhotoWizardShareToken("short"), false)
  })
})

test("minimum length is 8: accepts 8, rejects 7", () => {
  assert.equal(PHOTO_SHARE_SECRET_MIN_LENGTH, 8)
  const eight = "Ab12_-xy"
  const seven = "Ab12_-x"
  withShareSecret(eight, () => {
    assert.equal(eight.length, 8)
    assert.equal(isPhotoWizardShareToken(eight), true)
    assert.equal(photoWizardShareUrl()?.endsWith(`/fotky/${eight}`), true)
  })
  withShareSecret(seven, () => {
    assert.equal(seven.length, 7)
    assert.equal(isPhotoWizardShareToken(seven), false)
    assert.equal(photoWizardShareUrl(), null)
  })
})

test("public URL is /fotky/<secret> on the site origin", () => {
  withShareSecret(GOOD_SECRET, () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://autocash.cz"
    assert.equal(photoWizardShareUrl(), `https://autocash.cz/fotky/${GOOD_SECRET}`)
  })
})

test("optional contact fields may all be empty", () => {
  const empty = parseShareContactFields({})
  assert.deepEqual(empty, { name: "", phone: "", note: "" })
  const blanks = parseShareContactFields({ name: "  ", phone: "\n", note: "" })
  assert.deepEqual(blanks, { name: "", phone: "", note: "" })
})

test("trims and truncates optional contact fields", () => {
  const parsed = parseShareContactFields({
    name: "  Jan Novák  ",
    phone: " +420 776 123 456 ",
    note: "Prosím zavolat večer.",
  })
  assert.equal(parsed.name, "Jan Novák")
  assert.equal(parsed.phone, "+420 776 123 456")
  assert.equal(parsed.note, "Prosím zavolat večer.")

  const long = parseShareContactFields({
    name: "N".repeat(500),
    phone: "1".repeat(80),
    note: "x".repeat(5000),
  })
  assert.equal(long.name.length, 120)
  assert.equal(long.phone.length, 40)
  assert.equal(long.note.length, 2000)
})

test("share email subject is distinct from post-lead AC-XXXX subjects", () => {
  const withName = buildSharePhotoEmail({
    code: "SD-AB12",
    name: "Jan Novák",
    phone: "+420 776 123 456",
    note: "K poptávce z pondělí",
    domainTag: "autocash.cz",
  })
  assert.equal(
    withName.subject,
    "[autocash.cz] Fotky vozu — sdílený odkaz — Jan Novák — SD-AB12",
  )
  assert.match(withName.text, /sdílený odkaz/)
  assert.match(withName.text, /Jan Novák/)
  assert.match(withName.text, /\+420 776 123 456/)
  assert.match(withName.text, /K poptávce z pondělí/)
  assert.doesNotMatch(withName.subject, /AC-[A-Z0-9]{4}/)
  assert.match(withName.html, /SDÍLENÝ ODKAZ/)

  const anonymous = buildSharePhotoEmail({
    code: "SD-ZZ99",
    name: "",
    phone: "",
    note: "",
    domainTag: "autocash.cz",
  })
  assert.equal(anonymous.subject, "[autocash.cz] Fotky vozu — sdílený odkaz — SD-ZZ99")
  assert.match(anonymous.text, /Jméno: —/)
  assert.match(anonymous.text, /Telefon: —/)
  assert.match(anonymous.text, /Poznámka: —/)
})
