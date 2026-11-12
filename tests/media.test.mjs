import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { readFileSync } from "node:fs";
import {
  MediaStore,
  mediaReferences,
  migrateLegacyPhotos,
} from "../Public/js/media.mjs";
import { Store } from "../Public/js/model.mjs";
const seed = JSON.parse(
  readFileSync(
    new URL(
      "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json",
      import.meta.url,
    ),
  ),
);
const memory = () => {
  let raw = null;
  return { getItem: () => raw, setItem: (key, value) => (raw = value) };
};

test("IndexedDB stores real media bytes and reopens them after object URLs are discarded", async () => {
  const factory = new IDBFactory(),
    first = new MediaStore(factory);
  const id = await first.put(
    new Blob(["test-audio-bytes"], { type: "audio/webm" }),
    { kind: "audio", name: "Voice diary" },
  );
  assert.ok(first.resolve("media:" + id).startsWith("blob:"));
  first.close();
  const second = new MediaStore(factory);
  // V10.21: stored as the bytes themselves (not a Blob / File object).
  const saved = await second.get(id);
  assert.ok(saved.bytes instanceof ArrayBuffer && !saved.blob);
  assert.equal(new TextDecoder().decode(saved.bytes), "test-audio-bytes");
  const snapshot = {
    books: [],
    entries: [{ media: [{ source: "media:" + id }] }],
    drafts: {},
  };
  // V3.1: app-wide hydrate only keeps images; audio/video load per view scope.
  await second.hydrate(snapshot);
  assert.equal(second.resolve("media:" + id), "");
  await second.acquire([id], "day");
  await second.acquire([id], "studio");
  assert.ok(second.resolve("media:" + id).startsWith("blob:"));
  assert.equal(second.release("day"), 0);
  assert.ok(second.resolve("media:" + id).startsWith("blob:"));
  assert.equal(second.release("studio"), 1);
  assert.equal(second.resolve("media:" + id), "");
  second.close();
});
test("legacy data URI photos migrate only after Blob writes complete, preserving text and old fields", async () => {
  const storage = memory(),
    store = new Store(storage, seed, "2026-11-07");
  store.update((s) => {
    s.entries[0].photo = "data:image/jpeg;base64,AQID";
    s.entries[0].customLegacy = { keep: true };
  });
  const media = new MediaStore(new IDBFactory());
  assert.equal(await migrateLegacyPhotos(store, media), 1);
  assert.equal(store.state.entries[0].title, seed.journals[0].title);
  assert.equal(store.state.entries[0].customLegacy.keep, true);
  assert.ok(store.state.entries[0].photo.startsWith("media:"));
  assert.ok(!storage.getItem().includes("data:image/jpeg"));
  media.close();
});
test("failed media migration leaves original metadata and photo bytes unchanged", async () => {
  const storage = memory(),
    store = new Store(storage, seed, "2026-11-07");
  store.update((s) => (s.entries[0].photo = "data:image/jpeg;base64,AQID"));
  const raw = storage.getItem();
  await assert.rejects(
    migrateLegacyPhotos(store, {
      put: async () => {
        throw new Error("quota");
      },
    }),
  );
  assert.equal(storage.getItem(), raw);
  assert.equal(store.state.entries[0].photo, "data:image/jpeg;base64,AQID");
});
test("media reference traversal excludes user prose that merely starts with media:", () => {
  const state = {
    books: [
      {
        id: "book",
        fields: [
          { id: "note", type: "text" },
          { id: "image", type: "image" },
        ],
      },
    ],
    entries: [
      {
        bookId: "book",
        photo: "media:photo-id",
        body: "media:user-words",
        fieldValues: { note: "media:user-words", image: "media:image-id" },
        media: [{ source: "media:video-id" }],
      },
    ],
    drafts: {},
  };
  assert.deepEqual([...mediaReferences(state)].sort(), [
    "image-id",
    "photo-id",
    "video-id",
  ]);
});
test("restore writes media before returning a new private snapshot; incomplete backups cannot replace metadata", async () => {
  const media = new MediaStore(new IDBFactory()),
    store = new Store(memory(), seed, "2026-11-07");
  const original = structuredClone(store.state);
  const snapshot = structuredClone(original);
  snapshot.entries[0].media = [
    {
      source: "media:old",
      id: "clip",
      kind: "audio",
      name: "Voice",
      mime: "audio/webm",
    },
  ];
  snapshot.books[0].visibility = "public";
  const backup = {
    format: "little-days-backup",
    version: 1,
    state: snapshot,
    media: [
      {
        id: "old",
        kind: "audio",
        name: "Voice",
        data: "data:audio/webm;base64,AQID",
      },
    ],
  };
  const restored = await media.restore(backup);
  assert.equal(restored.books[0].visibility, "private");
  assert.notEqual(restored.entries[0].media[0].source, "media:old");
  assert.deepEqual(store.state, original);
  await assert.rejects(media.restore({ ...backup, media: [] }));
  assert.deepEqual(store.state, original);
  media.close();
});

test("oversize backups stop before allocating base64 buffers and preserve all local records", async () => {
  const media = new MediaStore(new IDBFactory());
  media.get = async () => ({ blob: { size: 101 * 1024 * 1024 } });
  await assert.rejects(
    media.backup({
      books: [],
      entries: [{ photo: "media:large" }],
      drafts: {},
    }),
    (error) => error.code === "backup-size",
  );
  media.close();
});

test("nested malformed backup records are rejected before any media write or metadata replacement", async () => {
  const state = new Store(memory(), seed, "2026-11-07").state;
  const media = new MediaStore(new IDBFactory());
  let writes = 0;
  media.put = async () => {
    writes++;
  };
  for (const corrupt of [
    (snapshot) => {
      snapshot.books[0].fields = [null];
    },
    (snapshot) => {
      snapshot.habits = [null];
    },
    (snapshot) => {
      snapshot.checks = [null];
    },
    (snapshot) => {
      snapshot.entries[0].updatedAt = {};
    },
  ]) {
    const backup = {
      format: "little-days-backup",
      version: 1,
      state: structuredClone(state),
      media: [],
    };
    corrupt(backup.state);
    await assert.rejects(media.restore(backup), /invalidData/);
  }
  assert.equal(writes, 0);
  assert.equal(state.books[0].fields.length, 0);
  media.close();
});

// V10.21 · P0: media that showed "Error" after leaving Studio on iPhone.
test("older Blob records are converted to bytes in place (same id) the first time they are read", async () => {
  const factory = new IDBFactory();
  const store = new MediaStore(factory);
  await store.open();
  // A record as V10.20 and earlier wrote it.
  await store.write({ id: "legacy-1", blob: new Blob(["old-photo"], { type: "image/jpeg" }), mime: "image/jpeg", size: 9, kind: "photo" }, "add");
  await store.acquire(["legacy-1"], "app");
  assert.ok(store.resolve("media:legacy-1").startsWith("blob:"), "still shown");
  const after = await store.get("legacy-1");
  assert.ok(after.bytes instanceof ArrayBuffer && !after.blob, "rewritten as bytes");
  assert.equal(new TextDecoder().decode(after.bytes), "old-photo");
  assert.equal(after.kind, "photo", "its other fields kept");
  store.close();
});

test("a record whose bytes are gone is reported missing — never replaced, never deleted", async () => {
  const factory = new IDBFactory();
  const store = new MediaStore(factory);
  await store.open();
  await store.write({ id: "gone-1", mime: "image/jpeg", size: 9, kind: "photo" }, "add");
  await store.acquire(["gone-1"], "app");
  assert.equal(store.resolve("media:gone-1"), "", "nothing invented");
  assert.deepEqual(await store.missing(["gone-1", "no-such-id"]), ["gone-1", "no-such-id"]);
  assert.ok(await store.get("gone-1"), "the record itself is left as it was");
  // A good one is not reported.
  const id = await store.put(new Blob(["ok"], { type: "image/png" }), { kind: "photo" });
  assert.deepEqual(await store.missing([id]), []);
  store.close();
});

test("a write counts as saved only when it reads back with the same size", async () => {
  const store = new MediaStore(new IDBFactory());
  await store.open();
  const realGet = store.get.bind(store);
  store.get = async (id) => ({ ...(await realGet(id)), bytes: new ArrayBuffer(1) }); // a short read
  await assert.rejects(store.put(new Blob(["twelve bytes"], { type: "video/webm" }), { kind: "video" }), (e) => e.code === "media-verify");
  store.close();
});

test("a picture that failed to load gets one fresh URL from its stored bytes", async () => {
  const store = new MediaStore(new IDBFactory());
  const id = await store.put(new Blob(["x"], { type: "image/png" }), { kind: "photo" });
  const first = store.resolve("media:" + id);
  assert.equal(store.idOfUrl(first), id);
  assert.equal(await store.refresh(id), true);
  assert.notEqual(store.resolve("media:" + id), first);
  assert.equal(await store.refresh(id), false, "only once");
  store.close();
});
