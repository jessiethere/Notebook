// V10.58 · Photo grouping rules: picking order first, a capture time only as
// a hint, the person decides. Synthetic times; public sample photo bytes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { exifTime, photoTime, reliableTime } from "../Public/js/exif.mjs";
import { suggestGroups, movePhotoTo, mergeWithPrevious, oneGroup, splitAt, STORY_GAP_MINUTES } from "../Public/js/day-story.mjs";

const at = (h, m) => new Date(2026, 10, 9, h, m).getTime();
const ids = (groups) => groups.map((g) => g.items.map((i) => i.id));
const shot = (id, h, m, timeSource = "exif-original") => ({ id, time: at(h, m), timeSource });

// A JPEG with only IFD0 DateTime (0x0132): what an editor writes on export.
function withModifiedTime(jpeg, when) {
  const text = Buffer.from(`${when}\0`, "ascii");
  const tiff = Buffer.alloc(26 + text.length);
  tiff.write("MM", 0, "ascii");
  tiff.writeUInt16BE(42, 2);
  tiff.writeUInt32BE(8, 4);
  tiff.writeUInt16BE(1, 8);
  tiff.writeUInt16BE(0x0132, 10);
  tiff.writeUInt16BE(2, 12);
  tiff.writeUInt32BE(text.length, 14);
  tiff.writeUInt32BE(26, 18);
  tiff.writeUInt32BE(0, 22);
  text.copy(tiff, 26);
  const header = Buffer.from("Exif\0\0", "binary");
  const app1 = Buffer.alloc(4);
  app1.writeUInt16BE(0xffe1, 0);
  app1.writeUInt16BE(2 + header.length + tiff.length, 2);
  return Buffer.concat([jpeg.subarray(0, 2), app1, header, tiff, jpeg.subarray(2)]);
}
const photo = readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos/LD-photo-latte-art.jpg", import.meta.url));
const buffer = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

test("an editor's export time is not a capture time; a file date is not either", async () => {
  const edited = withModifiedTime(photo, "2026:11:09 21:30:00");
  assert.deepEqual(exifTime(buffer(edited)).source, "exif-modified");
  const file = new File([edited], "edited.jpg", { type: "image/jpeg", lastModified: at(22, 0) });
  const t = await photoTime(file);
  assert.equal(t.source, "exif-modified");
  assert.equal(reliableTime(t.source), false);
  assert.equal(reliableTime("file"), false);
  assert.equal(reliableTime("none"), false);
  assert.equal(reliableTime("exif-original"), true);
  assert.equal(reliableTime("exif-digitized"), true);
});

test("reliable capture times: pages suggested at gaps > 90 min, picking order kept", () => {
  assert.equal(STORY_GAP_MINUTES, 90);
  const picked = [shot("a", 8, 10), shot("b", 8, 40), shot("c", 14, 30), shot("d", 14, 50), shot("e", 19, 5)];
  const s = suggestGroups(picked);
  assert.equal(s.mode, "time");
  assert.equal(s.reason, "reliable");
  assert.deepEqual(ids(s.groups), [["a", "b"], ["c", "d"], ["e"]]);
  // Picked out of time order: the order is NOT changed by time.
  const shuffled = suggestGroups([shot("c", 14, 30), shot("a", 8, 10), shot("b", 8, 40)]);
  assert.deepEqual(ids(shuffled.groups).flat(), ["c", "a", "b"], "picking order stays");
});

test("file dates, missing EXIF or a mix: one page, no 90-minute split", () => {
  // Morning photos edited in Photoshop at night: only export / file times.
  const edited = [shot("a", 9, 0, "exif-modified"), shot("b", 21, 30, "exif-modified"), shot("c", 22, 0, "file")];
  const s = suggestGroups(edited);
  assert.equal(s.mode, "single");
  assert.equal(s.reason, "unreliable");
  assert.deepEqual(ids(s.groups), [["a", "b", "c"]]);
  const mixed = suggestGroups([shot("a", 8, 0), shot("b", 20, 0, "file")]);
  assert.equal(mixed.reason, "mixed");
  assert.deepEqual(ids(mixed.groups), [["a", "b"]]);
  const none = suggestGroups([{ id: "a", time: null, timeSource: "none" }, { id: "b", time: null, timeSource: "none" }]);
  assert.deepEqual(ids(none.groups), [["a", "b"]]);
  // A Moment's time only comes from a real capture time.
  assert.equal(s.groups[0].start, null, "no trusted time → no time on the page");
  assert.equal(mixed.groups[0].start, at(8, 0));
});

test("the person decides: drag, split, merge, one page — nothing lost or copied", () => {
  const groups = suggestGroups([shot("a", 8, 0), shot("b", 8, 5), shot("c", 15, 0), shot("d", 15, 10)]).groups;
  assert.deepEqual(ids(groups), [["a", "b"], ["c", "d"]]);
  assert.deepEqual(ids(movePhotoTo(groups, { g: 0, i: 0 }, { g: 0, i: 2 })), [["b", "a"], ["c", "d"]], "reorder within a page");
  assert.deepEqual(ids(movePhotoTo(groups, { g: 1, i: 1 }, { g: 0, i: 1 })), [["a", "d", "b"], ["c"]], "to another page, at a place");
  assert.deepEqual(ids(movePhotoTo(groups, { g: 0, i: 1 }, { g: 2, i: 0 })), [["a"], ["c", "d"], ["b"]], "to a new page at the end");
  assert.deepEqual(ids(movePhotoTo([{ items: [{ id: "x" }] }, ...groups.slice(1)], { g: 0, i: 0 }, { g: 1, i: 0 })), [["x", "c", "d"]], "an emptied page goes away");
  assert.deepEqual(ids(splitAt(groups, 1, 1)), [["a", "b"], ["c"], ["d"]]);
  const merged = mergeWithPrevious([{ items: [{ id: "a" }], line: "" }, { items: [{ id: "b" }], line: "下午" }], 1);
  assert.deepEqual(ids(merged), [["a", "b"]]);
  assert.equal(merged[0].line, "下午", "words are kept");
  assert.deepEqual(ids(mergeWithPrevious(groups, 0)), ids(groups), "nothing before the first page");
  assert.deepEqual(ids(oneGroup(groups.flatMap((g) => g.items))), [["a", "b", "c", "d"]]);
  const all = (gs) => gs.flatMap((g) => g.items.map((i) => i.id)).sort().join();
  assert.equal(all(movePhotoTo(groups, { g: 1, i: 0 }, { g: 0, i: 0 })), "a,b,c,d", "every photo is still there, once");
  assert.deepEqual(ids(groups), [["a", "b"], ["c", "d"]], "the original is not changed");
});
