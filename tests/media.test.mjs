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
  assert.equal(await (await second.get(id)).blob.text(), "test-audio-bytes");
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
