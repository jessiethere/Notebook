// V10.40 · C2: a backup that lists the files it could not include restores
// with those references kept; any other gap is still refused.
import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { readFileSync } from "node:fs";
import { MediaStore } from "../Public/js/media.mjs";
import { Store } from "../Public/js/model.mjs";

const seed = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json", import.meta.url)));
const memory = () => { let raw = null; return { getItem: () => raw, setItem: (k, v) => (raw = v) }; };

const backupOf = (extra) => {
  const state = structuredClone(new Store(memory(), seed, "2026-11-07").state);
  state.entries[0].media = [
    { source: "media:kept", id: "a", kind: "audio", name: "Voice", mime: "audio/webm" },
    { source: "media:gone", id: "b", kind: "audio", name: "Lost", mime: "audio/webm" },
  ];
  return { format: "little-days-backup", version: 1, state, media: [{ id: "kept", kind: "audio", name: "Voice", data: "data:audio/webm;base64,AQID" }], ...extra };
};

test("an incomplete backup that says which file is missing restores; that reference is kept as it was", async () => {
  const media = new MediaStore(new IDBFactory());
  const restored = await media.restore(backupOf({ complete: false, missing: [{ id: "gone", kind: "audio", name: "Lost" }] }));
  const sources = restored.entries[0].media.map((m) => m.source);
  assert.ok(sources[0].startsWith("media:") && sources[0] !== "media:kept", "the included file is restored under a new id");
  assert.equal(sources[1], "media:gone", "the missing one keeps its reference (shown as missing, not removed)");
  media.close();
});

test("a gap the backup does not declare is still refused (nothing replaced)", async () => {
  const media = new MediaStore(new IDBFactory());
  await assert.rejects(media.restore(backupOf({})), /Incomplete media backup/);
  // A missing list without complete: false does not count.
  await assert.rejects(media.restore(backupOf({ missing: [{ id: "gone" }] })), /Incomplete media backup/);
  media.close();
});
