// V7.4 app lock helpers: SHA-256, passcode check, re-lock timing, pauses.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { sha256, makeLock, checkPin, validPin, readLock, saveLock, shouldRelock, pauseLeft, LOCK_KEY, MAX_TRIES, PAUSE_SECONDS } from "../Public/js/app-lock.mjs";

const memory = () => {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k), data };
};

test("sha256 matches Node's crypto, including Chinese text and long input", () => {
  for (const text of ["", "abc", "a".repeat(55), "a".repeat(56), "a".repeat(64), "密码1234", "x".repeat(1000)])
    assert.equal(sha256(text), createHash("sha256").update(text).digest("hex"));
});

test("a lock keeps only a salted hash, never the passcode", () => {
  const lock = makeLock("2580", { salt: "s1" });
  assert.equal(lock.hash, sha256("s1:2580"));
  assert.ok(!JSON.stringify(lock).includes("2580"));
  assert.ok(checkPin(lock, "2580"));
  assert.ok(!checkPin(lock, "2581"));
  assert.ok(!checkPin(lock, "258"));
  assert.notEqual(makeLock("2580").hash, makeLock("2580").hash, "a fresh salt each time");
  assert.throws(() => makeLock("12a4"));
  assert.ok(validPin("0000") && !validPin("12345") && !validPin(""));
});

test("stored locks are read back; broken ones are ignored", () => {
  const storage = memory();
  assert.equal(readLock(storage), null);
  saveLock(makeLock("1234", { salt: "x", grace: 0 }), storage);
  assert.equal(readLock(storage).grace, 0);
  storage.setItem(LOCK_KEY, "{not json");
  assert.equal(readLock(storage), null);
  storage.setItem(LOCK_KEY, JSON.stringify({ v: 1, salt: "x", hash: "short" }));
  assert.equal(readLock(storage), null);
  saveLock(null, storage);
  assert.equal(storage.getItem(LOCK_KEY), null);
});

test("re-lock after the chosen time away; a pause after too many wrong tries", () => {
  assert.ok(shouldRelock({ grace: 0 }, 0));
  assert.ok(!shouldRelock({ grace: 60 }, 59));
  assert.ok(shouldRelock({ grace: 60 }, 60));
  assert.ok(!shouldRelock(null, 999));
  assert.equal(pauseLeft(MAX_TRIES - 1, 1000, 1000), 0);
  assert.equal(pauseLeft(MAX_TRIES, 1000, 1000), PAUSE_SECONDS);
  assert.equal(pauseLeft(MAX_TRIES, 1000, 1000 + PAUSE_SECONDS * 1000), 0);
});
