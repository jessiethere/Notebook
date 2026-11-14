// V6.3 (Quick Create v3, P0 ①): when photos were taken (EXIF), grouping a
// day's photos into Moments, editing the groups, and the timeline cover.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { exifDate, parseExifDate, photoTime } from "../Public/js/exif.mjs";
import { groupByTime, movePhoto, splitAt, removePhoto, clockLabel, partOfDay, timelineLayers, TIMELINE_ROWS } from "../Public/js/day-story.mjs";

const { withExifTime } = createRequire(import.meta.url)("./exif-fixture.cjs");
const photo = readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos/LD-photo-latte-art.jpg", import.meta.url));
const buffer = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const at = (h, m) => new Date(2026, 10, 9, h, m).getTime();

test("reads when a JPEG was taken; no EXIF, no time", async () => {
  const tagged = withExifTime(photo, "2026:11:09 08:10:00");
  assert.equal(exifDate(buffer(tagged)).getTime(), at(8, 10));
  assert.equal(exifDate(buffer(photo)), null);
  assert.equal(exifDate(new ArrayBuffer(10)), null);
  assert.equal(parseExifDate("0000:00:00 00:00:00"), null);
  assert.equal(parseExifDate("garbage"), null);
  const file = new File([tagged], "a.jpg", { type: "image/jpeg", lastModified: 5 });
  assert.deepEqual(await photoTime(file), { time: at(8, 10), source: "exif-original" }); // V10.58: where the time came from
  assert.deepEqual(await photoTime(new File([photo], "b.jpg", { type: "image/jpeg", lastModified: 5 })), { time: 5, source: "file" });
});

test("photos split into Moments where more than 90 minutes pass, in shooting order", () => {
  const items = [{ id: "c", time: at(14, 30) }, { id: "a", time: at(8, 10) }, { id: "b", time: at(8, 40) }, { id: "d", time: at(14, 50) }, { id: "e", time: at(19, 5) }];
  const groups = groupByTime(items);
  assert.deepEqual(groups.map((g) => g.items.map((i) => i.id)), [["a", "b"], ["c", "d"], ["e"]]);
  assert.equal(groups[0].start, at(8, 10));
  assert.equal(clockLabel(groups[1].start), "14:30");
  assert.deepEqual(groups.map((g) => partOfDay(g.start)), ["morning", "afternoon", "evening"]);
  assert.equal(groupByTime([{ time: null }, { time: null }]).length, 1, "no times: one Moment, in picking order");
  assert.deepEqual(groupByTime([{ id: 1, time: at(8, 0) }, { id: 2, time: null }, { id: 3, time: at(12, 0) }]).map((g) => g.items.map((i) => i.id)), [[1, 2], [3]], "a photo without a time stays after the one before it");
  assert.equal(groupByTime([]).length, 0);
});

test("moving a photo, splitting and removing keep the Moments tidy", () => {
  const groups = groupByTime([{ id: "a", time: at(8, 0) }, { id: "b", time: at(8, 5) }, { id: "c", time: at(15, 0) }]);
  const moved = movePhoto(groups, 0, 1, 1);
  assert.deepEqual(moved.map((g) => g.items.map((i) => i.id)), [["a"], ["b", "c"]]);
  assert.equal(moved[1].start, at(8, 5), "the Moment starts at its earliest photo");
  assert.deepEqual(movePhoto(groups, 1, 0, -1).map((g) => g.items.map((i) => i.id)), [["a", "b", "c"]], "an emptied Moment goes away");
  assert.deepEqual(movePhoto(groups, 0, 0, -1).map((g) => g.items.map((i) => i.id)), [["a"], ["b"], ["c"]], "at the start: a new Moment");
  assert.deepEqual(splitAt(groups, 0, 1).map((g) => g.items.map((i) => i.id)), [["a"], ["b"], ["c"]]);
  assert.equal(splitAt(groups, 0, 0), groups, "nothing to split before the first photo");
  assert.deepEqual(removePhoto(groups, 1, 0).map((g) => g.items.map((i) => i.id)), [["a", "b"]]);
  assert.deepEqual(groups.map((g) => g.items.length), [2, 1], "the original is not changed");
});

test("the timeline cover: a row per Moment, photos kept whole and on the page", () => {
  const moments = [
    { time: "08:10", title: "练腿日", photo: { reference: "media:a", aspect: 1.5 }, count: 2 },
    { time: "14:30", title: "", photo: { reference: "media:b", aspect: 0.75 }, count: 2 },
    { time: "19:05", title: "x".repeat(80), photo: { reference: "media:c", aspect: 1 }, count: 3 },
  ];
  let n = 0;
  const layers = timelineLayers(moments, { dateSmall: "SATURDAY", dateBig: "Nov 9", photos: (c) => `${c} 张`, makeId: () => `id${n++}` });
  const photos = layers.filter((l) => l.kind === "photo");
  assert.equal(photos.length, 3);
  for (const [i, p] of photos.entries()) {
    assert.ok(Math.abs((p.w / p.h) * 0.8 - moments[i].photo.aspect) < 0.02, "its own shape");
    assert.ok(p.x - p.w / 2 >= 0 && p.x + p.w / 2 <= 100 && p.y - p.h / 2 >= 15 && p.y + p.h / 2 <= 100, "on the page, below the date");
  }
  assert.ok(photos[0].x < 50 && photos[1].x > 50, "rows alternate sides");
  assert.equal(photos[0].tape, true);
  const texts = layers.filter((l) => l.kind === "text").map((l) => l.text);
  assert.ok(texts.includes("Nov 9") && texts.includes("14:30") && texts.includes("练腿日") && texts.includes("2 张"));
  assert.ok(texts.some((t) => t.endsWith("…") && t.length <= 40), "a long line is shortened on the cover");
  const calm = timelineLayers(moments, { variant: 2 }).filter((l) => l.kind === "photo");
  assert.ok(calm.every((p) => p.rotation === 0 && p.x < 50));
  const many = timelineLayers(Array.from({ length: 8 }, (_, i) => ({ time: `0${i}:00`, photo: { reference: `media:${i}`, aspect: 1 }, count: 1 })), { more: (c) => `+${c}` });
  assert.equal(many.filter((l) => l.kind === "photo").length, TIMELINE_ROWS - 1);
  assert.ok(many.some((l) => l.text === "+4"));
});
