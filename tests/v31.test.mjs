import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { readFileSync } from "node:fs";
import {
  Store,
  createInitialState,
  normalizeState,
  validateStateSnapshot,
  saveEntry,
  toggleCheck,
  weeklyCount,
} from "../Public/js/model.mjs";
import { MediaStore, mediaReferences } from "../Public/js/media.mjs";
import {
  createMoment,
  moveMoment,
  duplicateMoment,
  removeMoment,
  saveMoment,
  daySummary,
  bookPages,
  coverPhoto,
  saveCheckReflection,
  saveReflection,
  findReflection,
  periodKey,
  autoLayout,
  applyLayout,
  LAYOUT_TEMPLATES,
  suggestLayout,
  photoLayer,
  freeMainPhoto,
  moveLayer,
} from "../Public/js/day.mjs";

const seed = JSON.parse(
  readFileSync(
    new URL(
      "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json",
      import.meta.url,
    ),
  ),
);
const today = "2026-11-07";
const memory = (raw = null) => ({
  getItem: () => raw,
  setItem: (key, value) => (raw = value),
});
const ref = (n) => `media:00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("V1/V3 records without moments, layer sizes or reflections still load and stay intact", () => {
  const legacy = {
    schemaVersion: 1,
    habits: seed.habits,
    books: [{ id: "daily", title: "Daily", category: "Daily Life" }],
    checks: [{ habitId: "reading", date: today, minutes: 0 }],
    drafts: {},
    entries: [
      {
        id: "old",
        date: today,
        title: "旧手帐",
        body: "正文",
        mood: "☀️",
        photo: "/assets/coffee.jpg",
        layers: [{ id: "l1", text: "🌷", x: 50, y: 50, scale: 1, rotation: 0 }],
        legacyField: { keep: true },
      },
    ],
  };
  const store = new Store(memory(JSON.stringify(legacy)), seed, today);
  const entry = store.state.entries[0];
  assert.equal(entry.title, "旧手帐");
  assert.equal(entry.photo, "/assets/coffee.jpg");
  assert.deepEqual(entry.moments, []);
  assert.equal(entry.legacyField.keep, true);
  assert.deepEqual(store.state.reflections, []);
  assert.equal(coverPhoto(entry), "/assets/coffee.jpg");
  // A save round-trips through validation without losing the old layer.
  store.update((next) => saveEntry(next, next.entries[0]));
  assert.equal(store.state.entries[0].layers[0].text, "🌷");
});

test("moments are ordered chapters inside one day, with stable IDs and private visibility", () => {
  const state = createInitialState(seed, today);
  const entry = state.entries.find((item) => item.date === today);
  const gym = createMoment(entry, { title: "Gym", time: "08:00" });
  const coffee = createMoment(entry, { title: "Coffee", time: "14:00" });
  const cooking = createMoment(entry, { title: "Cooking", time: "19:00" });
  entry.moments.push(gym, coffee, cooking);
  assert.ok(moveMoment(entry, cooking.id, -1));
  assert.deepEqual(entry.moments.map((m) => m.title), ["Gym", "Cooking", "Coffee"]);
  assert.equal(moveMoment(entry, gym.id, -1), false);
  gym.layers.push(photoLayer(ref(1), "a.jpg"));
  const copy = duplicateMoment(entry, gym.id);
  assert.notEqual(copy.id, gym.id);
  assert.notEqual(copy.layers[0].id, gym.layers[0].id);
  assert.equal(copy.layers[0].mediaRef, gym.layers[0].mediaRef);
  assert.ok(removeMoment(entry, copy.id));
  saveEntry(state, entry);
  const saved = state.entries.filter((item) => item.date === today);
  assert.equal(saved.length, 1, "a day stays one container, not many entries");
  assert.equal(saved[0].moments.length, 3);
  assert.ok(saved[0].moments.every((m) => m.visibility === "private"));
  validateStateSnapshot(state);
  const summary = daySummary(state, today);
  assert.equal(summary.moments, 3);
  assert.equal(summary.photos, 2); // sample main photo + gym photo
});

test("saving a single moment updates the saved day without committing other draft edits", () => {
  const state = createInitialState(seed, "2026-11-07");
  const draft = structuredClone(state.entries.find((e) => e.date === today));
  draft.title = "unsaved draft title";
  draft.moments = [createMoment(draft, { title: "A" }), createMoment(draft, { title: "B" })];
  saveMoment(state, draft, draft.moments[1].id);
  let saved = state.entries.find((e) => e.date === today);
  assert.notEqual(saved.title, "unsaved draft title");
  assert.deepEqual(saved.moments.map((m) => m.title), ["B"]);
  saveMoment(state, draft, draft.moments[0].id);
  saved = state.entries.find((e) => e.date === today);
  assert.deepEqual(saved.moments.map((m) => m.title), ["A", "B"]);
  // A brand-new day gets a container entry with an empty day page.
  const newDay = { id: "d2", date: "2026-11-01", title: "x", body: "", moments: [createMoment({}, { title: "Only" })] };
  saveMoment(state, newDay, newDay.moments[0].id);
  const created = state.entries.find((e) => e.date === "2026-11-01");
  assert.equal(created.title, "");
  assert.equal(created.moments[0].title, "Only");
  validateStateSnapshot(state);
});

test("moment books link My Books to the right chapter without duplicating days", () => {
  const state = createInitialState(seed, today);
  const entry = state.entries.find((e) => e.date === today);
  entry.moments.push(createMoment(entry, { title: "Recipe", bookId: "food" }));
  const pages = bookPages(state, "food");
  assert.ok(pages.some((page) => page.moment?.title === "Recipe"));
});

test("invalid moment or layer shapes are rejected before they can be stored", () => {
  const state = createInitialState(seed, today);
  state.entries[0].moments = [{ id: "m", title: 3 }];
  assert.throws(() => validateStateSnapshot(state));
  state.entries[0].moments = [{ id: "m", title: "", layers: [{ id: "x", text: "", x: 1, y: 1, scale: 1, rotation: 0, w: "wide" }] }];
  assert.throws(() => validateStateSnapshot(state));
  state.entries[0].moments = [{ id: "m" }, { id: "m" }];
  assert.throws(() => validateStateSnapshot(state), "duplicate moment IDs");
});

test("check-in reflections edit the existing check and never double count", () => {
  const state = createInitialState(seed, today);
  toggleCheck(state, "move", today, 60);
  saveCheckReflection(state, "move", today, { detail: "Lower Body", minutes: 60, note: "左腿发力更好了" });
  saveCheckReflection(state, "move", today, { detail: "Lower Body", note: "改一下感想" });
  assert.equal(state.checks.filter((c) => c.habitId === "move" && c.date === today).length, 1);
  assert.equal(weeklyCount(state, "move", today), 1);
  const check = state.checks.find((c) => c.habitId === "move");
  assert.equal(check.note, "改一下感想");
  assert.equal(check.minutes, 60);
  assert.equal(check.shareNote, false, "notes are private unless explicitly allowed");
  // A note for an unchecked day creates exactly one check-in.
  saveCheckReflection(state, "reading", today, { detail: "Spanish", minutes: 15, note: "终于懂了" });
  assert.equal(state.checks.filter((c) => c.habitId === "reading").length, 1);
  validateStateSnapshot(state);
  assert.throws(() => saveCheckReflection(state, "missing", today, {}));
});

test("weekly and monthly reflections are optional, keyed by period and editable", () => {
  const state = createInitialState(seed, today);
  assert.equal(periodKey("week", "2026-11-08"), "2026-11-02");
  assert.equal(periodKey("month", today), "2026-11");
  saveReflection(state, "week", periodKey("week", today), { wentWell: "3 次训练" });
  saveReflection(state, "week", periodKey("week", today), { wentWell: "4 次训练", nextFocus: "早睡" });
  assert.equal(state.reflections.length, 1);
  assert.equal(findReflection(state, "week", "2026-11-02").nextFocus, "早睡");
  saveReflection(state, "month", "2026-11", {});
  validateStateSnapshot(state);
  state.reflections.push({ id: "x", period: "year", key: "2026" });
  assert.throws(() => validateStateSnapshot(state));
});

test("auto layouts keep every photo on the canvas for 1–9 photos and every template", () => {
  for (const template of LAYOUT_TEMPLATES)
    for (let count = 1; count <= 9; count++) {
      const slots = autoLayout(count, template);
      assert.equal(slots.length, count, `${template}/${count}`);
      for (const slot of slots) {
        for (const key of ["x", "y", "w", "h", "rotation"]) assert.ok(Number.isFinite(slot[key]));
        assert.ok(slot.x >= 0 && slot.x <= 100 && slot.y >= 0 && slot.y <= 100);
        assert.ok(slot.w >= 8 && slot.h >= 8);
      }
    }
  assert.equal(suggestLayout(2), "duo");
  assert.equal(suggestLayout(5), "collage");
});

test("applying a layout moves only photos, frees the main photo, and layer order can change", () => {
  const page = { photo: ref(9), layers: [{ id: "t", kind: "text", text: "hi", x: 10, y: 90, scale: 1, rotation: 0 }] };
  freeMainPhoto(page);
  assert.equal(page.photo, "");
  page.layers.push(photoLayer(ref(2), "b"), photoLayer(ref(3), "c"));
  page.layoutEdited = true;
  applyLayout(page, "trio", { top: 4, bottom: 60 });
  assert.equal(page.layoutEdited, false);
  const text = page.layers.find((l) => l.id === "t");
  assert.deepEqual([text.x, text.y], [10, 90]);
  const photos = page.layers.filter((l) => l.kind === "photo");
  assert.equal(new Set(photos.map((p) => `${p.x},${p.y}`)).size, 3);
  const last = photos.at(-1).id;
  assert.ok(moveLayer(page, last, -1));
  assert.equal(page.layers.at(-2).id, last);
});

test("media references include moment photos/clips and growth photos for backup", () => {
  const state = createInitialState(seed, today);
  const entry = state.entries[0];
  entry.moments = [
    createMoment(entry, {
      layers: [photoLayer(ref(1), "p")],
      media: [{ id: "c", kind: "audio", name: "v", mime: "audio/webm", source: ref(2), poster: "" }],
    }),
  ];
  state.checks.push({ habitId: "move", date: today, minutes: 0, photo: ref(3) });
  const all = mediaReferences(state);
  for (const n of [1, 2, 3]) assert.ok(all.has(ref(n).slice(6)));
  assert.ok(!mediaReferences(state, "image").has(ref(2).slice(6)), "audio is not an app-wide image");
  assert.ok(mediaReferences(state, "clip").has(ref(2).slice(6)));
});

test("backup restore keeps moments, layouts, notes and reflections and remaps their media", async () => {
  const media = new MediaStore(new IDBFactory());
  const state = normalizeState(createInitialState(seed, today));
  const entry = state.entries[0];
  entry.moments = [
    createMoment(entry, {
      title: "Coffee",
      layers: [photoLayer(ref(1), "p", { x: 33, y: 44, w: 50, h: 40, rotation: 7, crop: { x: 20, y: 70, zoom: 1.5 } })],
      media: [{ id: "c", kind: "audio", name: "voice", mime: "audio/webm", source: ref(2), poster: "", origin: "recording" }],
    }),
  ];
  state.checks.push({ habitId: "move", date: today, minutes: 30, note: "good", photo: ref(1), shareNote: false });
  saveReflection(state, "week", "2026-11-02", { learned: "patience" });
  const backup = {
    format: "little-days-backup",
    version: 1,
    state,
    media: [
      { id: ref(1).slice(6), kind: "photo", name: "p", data: "data:image/jpeg;base64,AQID" },
      { id: ref(2).slice(6), kind: "audio", name: "v", data: "data:audio/webm;base64,AQID" },
    ],
  };
  const restored = await media.restore(backup);
  const moment = restored.entries[0].moments[0];
  assert.equal(moment.title, "Coffee");
  assert.equal(moment.visibility, "private");
  assert.deepEqual(
    [moment.layers[0].x, moment.layers[0].y, moment.layers[0].w, moment.layers[0].h, moment.layers[0].rotation, moment.layers[0].crop.zoom],
    [33, 44, 50, 40, 7, 1.5],
  );
  assert.notEqual(moment.layers[0].mediaRef, ref(1));
  assert.equal(moment.media[0].origin, "recording");
  const check = restored.checks.find((c) => c.note === "good");
  assert.equal(check.photo, moment.layers[0].mediaRef);
  assert.equal(restored.reflections[0].learned, "patience");
  // Restore does not create object URLs; views acquire what they show.
  assert.equal(media.urls.size, 0);
  assert.equal(await (await media.get(moment.media[0].source.slice(6))).blob.size, 3);
  media.close();
});

test("habit journey orders check-ins like book pages and counts streaks and minutes", async () => {
  const { habitJourney } = await import("../Public/js/day.mjs");
  const state = createInitialState(seed, today);
  for (const [date, minutes, note] of [
    ["2026-11-01", 30, "第一天"],
    ["2026-11-02", 45, ""],
    ["2026-11-03", 20, "腿酸"],
    ["2026-11-05", 60, "状态很好"],
    ["2026-11-06", 40, ""],
  ])
    saveCheckReflection(state, "move", date, { minutes, note });
  const journey = habitJourney(state, "move", "2026-11-07");
  assert.deepEqual(journey.checks.map((c) => c.date), ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-05", "2026-11-06"]);
  assert.equal(journey.total, 5);
  assert.equal(journey.minutes, 195);
  assert.equal(journey.notes, 3);
  assert.equal(journey.longestStreak, 3);
  assert.equal(journey.currentStreak, 2, "today not done yet: counts back from yesterday");
  assert.equal(journey.since, "2026-11-01");
  saveCheckReflection(state, "move", "2026-11-07", { note: "today" });
  assert.equal(habitJourney(state, "move", "2026-11-07").currentStreak, 3);
  assert.equal(habitJourney(state, "reading", "2026-11-07").total, 0);
});

test("book days give one cover per date and filter by month or exact date", async () => {
  const { bookDays, bookMonths } = await import("../Public/js/day.mjs");
  const state = createInitialState(seed, today);
  const sample = state.entries.find((e) => e.date === today);
  sample.moments.push(
    createMoment(sample, { title: "Coffee", bookId: "daily", layers: [photoLayer(ref(5), "c")] }),
    createMoment(sample, { title: "Recipe", bookId: "food" }),
  );
  state.entries.push({ id: "oct", date: "2026-10-12", title: "October", body: "x", bookId: "daily", photo: "", layers: [], media: [], moments: [] });
  const days = bookDays(state, "daily");
  assert.deepEqual(days.map((d) => d.date), [today, "2026-10-12"]);
  assert.equal(days[0].moments.length, 1, "only Moments filed in this book");
  assert.equal(days[0].photos.length, 2, "day photo + moment photo");
  assert.deepEqual(bookMonths(state, "daily"), ["2026-11", "2026-10"]);
  assert.deepEqual(bookDays(state, "daily", { month: "2026-10" }).map((d) => d.date), ["2026-10-12"]);
  assert.deepEqual(bookDays(state, "daily", { date: today }).map((d) => d.date), [today]);
  assert.deepEqual(bookDays(state, "food").map((d) => d.moments[0].title), ["Recipe"]);
});

test("templates by photo count add empty frames, fill them in order and support text-only pages", async () => {
  const { applyPageTemplate, fillEmptySlots, TEMPLATES_BY_COUNT, autoLayout } = await import("../Public/js/day.mjs");
  for (const [count, templates] of Object.entries(TEMPLATES_BY_COUNT))
    for (const template of templates)
      if (template !== "text") assert.equal(autoLayout(Math.max(1, Number(count)), template).length, Math.max(1, Number(count)), template);
  const page = { layers: [{ id: "t", kind: "text", text: "hi", x: 10, y: 10, scale: 1, rotation: 0 }] };
  applyPageTemplate(page, 3, "trio", { top: 4, bottom: 96 });
  assert.equal(page.layers.filter((l) => l.kind === "photo" && !l.mediaRef).length, 3, "three empty frames");
  assert.equal(page.layoutTemplate, "trio");
  const rest = fillEmptySlots(page, [{ reference: ref(1), name: "a" }, { reference: ref(2), name: "b" }]);
  assert.deepEqual(rest, []);
  const photos = page.layers.filter((l) => l.kind === "photo");
  assert.deepEqual(photos.map((l) => l.mediaRef), [ref(1), ref(2), ""]);
  // Choosing fewer photos than already placed never deletes a photo.
  applyPageTemplate(page, 1, "full", { top: 4, bottom: 96 });
  assert.equal(page.layers.filter((l) => l.kind === "photo" && l.mediaRef).length, 2);
  assert.equal(page.layers.filter((l) => l.kind === "photo" && !l.mediaRef).length, 0);
  assert.throws(() => applyPageTemplate(page, 0, "text"), /layout.textHasPhotos/);
  const words = { layers: [{ id: "s", kind: "photo", text: "slot", mediaRef: "", x: 1, y: 1, scale: 1, rotation: 0 }] };
  applyPageTemplate(words, 0, "text");
  assert.equal(words.layoutTemplate, "text");
  assert.equal(words.layers.length, 0, "empty frames removed for a text-only page");
  validateStateSnapshot({ ...createInitialState(seed, today), entries: [{ id: "x", date: today, title: "", body: "", layers: photos }] });
});

test("words-only can be forced over photos; video/audio go on the paper by reference", async () => {
  const { applyPageTemplate, mediaLayer, isOnPage } = await import("../Public/js/day.mjs");
  const page = { photo: ref(7), layers: [photoLayer(ref(8), "p"), { id: "t", kind: "text", text: "hi", x: 1, y: 1, scale: 1, rotation: 0 }], media: [] };
  assert.throws(() => applyPageTemplate(page, 0, "text"), /layout.textHasPhotos/);
  applyPageTemplate(page, 0, "text", undefined, { force: true });
  assert.equal(page.photo, "");
  assert.deepEqual(page.layers.map((l) => l.id), ["t"], "only photos leave; text stays");
  const clip = { id: "c1", kind: "video", name: "walk.webm", mime: "video/webm", source: ref(9) };
  const layer = mediaLayer(clip);
  page.media.push(clip);
  page.layers.push(layer);
  assert.equal(layer.kind, "video");
  assert.equal(layer.clipId, "c1");
  assert.ok(layer.w && layer.h);
  assert.ok(isOnPage(page, "c1"));
  assert.equal(mediaLayer({ id: "a", kind: "audio", name: "voice" }).h, undefined);
  validateStateSnapshot({ ...createInitialState(seed, today), entries: [{ id: "x", date: today, title: "", body: "", layers: page.layers, media: page.media }] });
  const refs = (await import("../Public/js/media.mjs")).mediaReferences({ books: [], entries: [{ ...page }], drafts: {} });
  assert.ok(refs.has(ref(9).slice(6)), "clip still referenced once for backup");
});
