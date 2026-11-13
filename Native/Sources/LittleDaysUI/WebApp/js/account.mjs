// Local sign-in for this device. There is no server yet: the "account" is a
// small record in this browser (name, avatar, whether the welcome tour was
// seen). Journals are never deleted on sign-out. Real accounts (Apple / phone
// / email) need the Phase 3 server and are shown as "coming soon".
import { isPickable } from "./profile-mark.mjs";

export const ACCOUNT_KEY = "little-days.account";
// The emoji avatars of earlier versions: still accepted and shown as they
// are, but no longer offered (V10.16 offers the marks in js/profile-mark.mjs).
export const AVATARS = ["🌷", "🌼", "🍓", "🐰", "🐱", "🌿", "☁️", "📖", "☕", "🌙"];
export const acceptsAvatar = (value) => AVATARS.includes(value) || isPickable(value);

export function loadAccount(storage) {
  try {
    const raw = storage.getItem(ACCOUNT_KEY);
    const value = raw ? JSON.parse(raw) : null;
    if (value && value.version === 1) return value;
  } catch {}
  return null;
}
function save(storage, account) {
  storage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  return account;
}
export function isSignedIn(account) {
  return Boolean(account?.signedIn);
}
export function signIn(storage, values = {}) {
  const previous = loadAccount(storage);
  const name = String(values.name ?? previous?.name ?? "").trim().slice(0, 30);
  // Anything else keeps the avatar there was (an old emoji is never lost).
  const avatar = acceptsAvatar(values.avatar) ? values.avatar : previous?.avatar || "🌷";
  return save(storage, {
    version: 1,
    method: "local",
    name,
    avatar,
    createdAt: previous?.createdAt || new Date().toISOString(),
    signedInAt: new Date().toISOString(),
    signedIn: true,
    onboarded: Boolean(previous?.onboarded),
  });
}
// Sign out only flips a flag: the journal, media and demo data stay.
export function signOut(storage) {
  const account = loadAccount(storage);
  if (!account) return null;
  return save(storage, { ...account, signedIn: false });
}
export function finishTour(storage) {
  const account = loadAccount(storage);
  if (!account) return null;
  return save(storage, { ...account, onboarded: true });
}
export function replayTour(storage) {
  const account = loadAccount(storage);
  if (!account) return null;
  return save(storage, { ...account, onboarded: false });
}

// The welcome tour: one card per area of the app.
export const TOUR = [
  { id: "welcome", icon: "✿" },
  { id: "write", icon: "✎" },
  { id: "photo", icon: "📷" },
  { id: "growth", icon: "🌱" },
  { id: "shelf", icon: "📚" },
  { id: "theme", icon: "🎨" },
  { id: "private", icon: "🔒" },
];
