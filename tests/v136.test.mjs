// V10.36 · A1: a blank journal only for a real first start.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createInitialState, Store } from "../Public/js/model.mjs";
import { checkJournal, decideJournalOpen, hasTraces } from "../Public/js/journal-open.mjs";

const seed = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json", import.meta.url)));
const good = JSON.stringify(createInitialState(seed, "2026-11-07"));
const older = (() => { const s = createInitialState(seed, "2026-11-01"); s.entries = s.entries.slice(0, 1); return JSON.stringify(s); })();
const newer = JSON.stringify({ ...JSON.parse(good), schemaVersion: 2 });
const damaged = good.slice(0, Math.floor(good.length / 2));

test("checkJournal tells ok, incompatible and damaged apart", () => {
  assert.equal(checkJournal(good).status, "ok");
  assert.equal(checkJournal(newer).status, "incompatible");
  assert.equal(checkJournal(damaged).status, "damaged");
  assert.equal(checkJournal("null").status, "damaged");
  assert.equal(checkJournal(JSON.stringify({ schemaVersion: 1, entries: [] })).status, "damaged");
});

test("a real first start is the only way to a new journal", () => {
  assert.deepEqual(decideJournalOpen({}), { kind: "new", volatile: false });
  // IndexedDB fails on a device with no sign of earlier use: new, but never written to IndexedDB.
  assert.deepEqual(decideJournalOpen({ durableError: true }), { kind: "new", volatile: true });
  // A device that opened the app before but never saved a page has nothing to lose.
  assert.equal(decideJournalOpen({ traces: true }).kind, "new");
});

test("an existing journal that cannot be read now is never treated as new", () => {
  assert.equal(decideJournalOpen({ durableError: true, mirrorOff: true }).reason, "unavailable");
  assert.equal(decideJournalOpen({ durableError: true, traces: true }).reason, "unavailable");
  assert.equal(decideJournalOpen({ mirrorOff: true }).reason, "missing");
  assert.equal(decideJournalOpen({ durable: newer, mirrorOff: true }).reason, "incompatible");
  assert.equal(decideJournalOpen({ local: newer, durable: good }).reason, "incompatible");
  assert.equal(decideJournalOpen({ durable: damaged, mirrorOff: true }).reason, "damaged");
  const local = decideJournalOpen({ local: damaged, durable: older });
  assert.equal(local.reason, "damaged");
  assert.equal(local.earlier, "durable");
  assert.equal(local.earlierPages, 1);
  assert.deepEqual(local.copies.map((c) => c.source), ["local", "durable"]);
  assert.equal(decideJournalOpen({ local: damaged, durable: damaged }).earlier, undefined);
  for (const d of [local, decideJournalOpen({ durable: newer })]) assert.equal(d.kind, "blocked");
});

test("readable copies open as before", () => {
  assert.deepEqual(decideJournalOpen({ local: good, durable: older }), { kind: "journal", source: "local" });
  assert.deepEqual(decideJournalOpen({ local: good, durableError: true }), { kind: "journal", source: "local" });
  assert.deepEqual(decideJournalOpen({ durable: good, mirrorOff: true }), { kind: "journal", source: "durable" });
});

test("useDurable opens the earlier copy without reading the damaged one", () => {
  const map = new Map([["little-days.v1", damaged]]);
  const storage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
  const writes = [];
  const store = new Store(storage, seed, "2026-11-07", { durableRaw: older, useDurable: true, persist: (raw) => writes.push(raw) });
  assert.ok(store.state.entries.length >= 1);
  // Opening writes nothing over the damaged copy; only a real change does.
  assert.equal(map.get("little-days.v1"), damaged);
  assert.equal(writes.length, 0);
  store.update((s) => { s.entries[0].title = "after"; });
  assert.notEqual(map.get("little-days.v1"), damaged);
});

test("hasTraces sees earlier use, and an unreadable storage counts as earlier use", () => {
  assert.equal(hasTraces({ getItem: () => null }), false);
  assert.equal(hasTraces({ getItem: (k) => (k === "little-days.account" ? "{}" : null) }), true);
  assert.equal(hasTraces({ getItem: () => { throw new Error("denied"); } }), true);
});
