// App lock (V7.4): a 4-digit passcode kept on this device, and Face ID in the
// iPhone app. Only a salted SHA-256 of the passcode is stored — never the
// passcode itself. It keeps the journal from casual eyes (someone picking up
// the phone); it is not encryption of the journal itself. Pure helpers, no DOM.

export const LOCK_KEY = "little-days.lock";
export const PIN_LENGTH = 4;
export const GRACE_CHOICES = [0, 60, 300]; // seconds away before it locks again
export const MAX_TRIES = 5; // then a pause
export const PAUSE_SECONDS = 30;

// SHA-256 in plain JavaScript (the iPhone app's own page scheme is not always
// a "secure context", so crypto.subtle may be missing there).
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
export function sha256(text) {
  const bytes = new TextEncoder().encode(String(text));
  const length = bytes.length;
  const padded = new Uint8Array(((length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor((length * 8) / 2 ** 32));
  view.setUint32(padded.length - 4, (length * 8) >>> 0);
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    [a, b, c, d, e, f, g, hh].forEach((value, i) => (h[i] = (h[i] + value) >>> 0));
  }
  return [...h].map((x) => x.toString(16).padStart(8, "0")).join("");
}

export const validPin = (pin) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(String(pin || ""));

function randomSalt() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// A new lock for this passcode (the passcode itself is not kept).
export function makeLock(pin, { salt = randomSalt(), grace = 60, biometric = false } = {}) {
  if (!validPin(pin)) throw new Error("lock.invalidPin");
  return { v: 1, salt, hash: sha256(`${salt}:${pin}`), grace: GRACE_CHOICES.includes(grace) ? grace : 60, biometric: Boolean(biometric) };
}
export function checkPin(lock, pin) {
  return Boolean(lock?.hash && validPin(pin) && sha256(`${lock.salt}:${pin}`) === lock.hash);
}
// A stored lock, or null when there is none (or it is not one we understand).
export function readLock(storage = globalThis.localStorage) {
  try {
    const lock = JSON.parse(storage?.getItem(LOCK_KEY) || "null");
    return lock && lock.v === 1 && typeof lock.hash === "string" && /^[0-9a-f]{64}$/.test(lock.hash) && typeof lock.salt === "string" ? lock : null;
  } catch {
    return null;
  }
}
export function saveLock(lock, storage = globalThis.localStorage) {
  if (lock) storage?.setItem(LOCK_KEY, JSON.stringify(lock));
  else storage?.removeItem(LOCK_KEY);
}
// Back after `away` seconds: lock again?
export function shouldRelock(lock, awaySeconds) {
  return Boolean(lock) && awaySeconds >= (GRACE_CHOICES.includes(lock.grace) ? lock.grace : 60);
}
// After MAX_TRIES wrong passcodes in a row, a pause before the next try.
export function pauseLeft(failures, lastFailAt, now = Date.now()) {
  if (failures < MAX_TRIES) return 0;
  return Math.max(0, Math.ceil((lastFailAt + PAUSE_SECONDS * 1000 - now) / 1000));
}
