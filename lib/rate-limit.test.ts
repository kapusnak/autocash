import assert from "node:assert/strict"
import { test } from "node:test"

import { createSlidingWindowLimiter } from "./rate-limit.ts"

test("allows up to the limit then rejects", () => {
  let now = 1_000
  const limiter = createSlidingWindowLimiter({
    limit: 2,
    windowMs: 1_000,
    now: () => now,
  })
  assert.equal(limiter.allow("a"), true)
  assert.equal(limiter.allow("a"), true)
  assert.equal(limiter.allow("a"), false)
  assert.equal(limiter.allow("b"), true)
})

test("window expiry frees a slot", () => {
  let now = 0
  const limiter = createSlidingWindowLimiter({
    limit: 1,
    windowMs: 100,
    now: () => now,
  })
  assert.equal(limiter.allow("ip:1"), true)
  assert.equal(limiter.allow("ip:1"), false)
  now = 99
  assert.equal(limiter.allow("ip:1"), false)
  now = 100
  assert.equal(limiter.allow("ip:1"), true)
})
