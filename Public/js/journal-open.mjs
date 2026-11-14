// A1 (P0 data safety): decide, before anything is drawn or saved, what the
// app may do with the journal it found at start.
//
// The journal is written to two places: LocalStorage (a mirror, while it
// fits) and IndexedDB (the durable copy, V7.5). A blank journal must only be
// created for a real first start. If a journal exists but cannot be read
// right now, has a format this version does not know, or is damaged, the app
// stops on a recovery panel instead, and nothing is written until the person
// chooses a safe way on. Nothing here deletes or overwrites a copy.

import { validateStateSnapshot } from "./model.mjs";

// Rescue slot in the journal database: a copy that is about to be replaced
// (a damaged newest copy when the person goes on with an earlier one).
export const RESCUE_KEY = "little-days.v1.rescue";

// Signs that this device used Capiday before (any of them means a
// missing journal is not a first start).
export const TRACE_KEYS = [
  "little-days.account",
  "little-days.v1-mirror",
  "little-days.seen-version",
  "little-days.events",
  "little-days.last-backup",
];

// "ok" | "incompatible" | "damaged"
export function checkJournal(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "damaged" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return { status: "damaged" };
  // A different schema (for example written by a newer version of the app)
  // is kept as it is: this version must not rewrite it.
  if (parsed.schemaVersion !== 1)
    return Number.isFinite(parsed.schemaVersion)
      ? { status: "incompatible", schemaVersion: parsed.schemaVersion }
      : { status: "damaged" };
  if (
    !["entries", "habits", "checks", "books"].every((key) => Array.isArray(parsed[key])) ||
    !parsed.drafts ||
    Array.isArray(parsed.drafts) ||
    typeof parsed.drafts !== "object"
  )
    return { status: "damaged" };
  try {
    validateStateSnapshot(parsed);
  } catch {
    return { status: "damaged" };
  }
  return { status: "ok", pages: parsed.entries.length };
}

// input: { local, durable, durableError, mirrorOff, traces }
//   local: the LocalStorage copy (string or null; null when the mirror is off)
//   durable: the IndexedDB copy (string or null)
//   durableError: true when IndexedDB could not be read at all
//   mirrorOff: LocalStorage was full, so IndexedDB alone holds the journal
//   traces: this device used the app before
// returns one of
//   { kind: "journal", source: "local" | "durable" }
//   { kind: "new", volatile }          volatile: IndexedDB is unavailable
//   { kind: "blocked", reason, earlier? , copies }
//     reason: "unavailable" | "missing" | "incompatible" | "damaged"
//     earlier: "durable" when a complete earlier copy can be used instead
//     copies: [{ source, text }] the raw copies the person can save
export function decideJournalOpen(input) {
  const { local = null, durable = null, durableError = false, mirrorOff = false, traces = false } = input;
  const copies = [];
  if (local) copies.push({ source: "local", text: local });
  if (durable && durable !== local) copies.push({ source: "durable", text: durable });

  if (local) {
    const localCheck = checkJournal(local);
    if (localCheck.status === "ok") return { kind: "journal", source: "local" };
    if (localCheck.status === "incompatible")
      return { kind: "blocked", reason: "incompatible", copies };
    // The newest copy is damaged. An earlier complete copy may still exist.
    const durableCheck = durable && durable !== local ? checkJournal(durable) : null;
    return {
      kind: "blocked",
      reason: "damaged",
      ...(durableCheck?.status === "ok" ? { earlier: "durable", earlierPages: durableCheck.pages } : {}),
      copies,
    };
  }

  if (durableError) {
    // IndexedDB could not be opened. Only a device with no sign of earlier use
    // may start fresh, and then without touching IndexedDB at all.
    if (mirrorOff || traces) return { kind: "blocked", reason: "unavailable", copies };
    return { kind: "new", volatile: true };
  }

  if (durable) {
    const durableCheck = checkJournal(durable);
    if (durableCheck.status === "ok") return { kind: "journal", source: "durable" };
    return { kind: "blocked", reason: durableCheck.status, copies };
  }

  // No copy anywhere. The mirror flag says IndexedDB should have one.
  if (mirrorOff) return { kind: "blocked", reason: "missing", copies };
  return { kind: "new", volatile: false };
}

export function hasTraces(storage) {
  try {
    return TRACE_KEYS.some((key) => storage.getItem(key) != null);
  } catch {
    return true;
  }
}
