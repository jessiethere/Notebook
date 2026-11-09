// V4.4: the photo library is real photos (Unsplash License, bundled); artwork
// is offered as page backgrounds instead.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { MediaStore } from "../Public/js/media.mjs";
import { canvasHTML, backdropOf } from "../Public/js/canvas.mjs";

const R = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const library = JSON.parse(readFileSync(new URL("library.json", R)));

test("every library photo is a bundled JPEG with its Unsplash source on record", () => {
  assert.equal(library.photos.length, 78);
  assert.equal(library.photoCollections.length, 13);
  assert.equal(library.photoCollections[0].id, "coffee");
  const sources = readFileSync(new URL("Photos/Unsplash-Photos.txt", R), "utf8");
  assert.match(sources, /Unsplash License/);
  const ids = new Set();
  for (const photo of library.photos) {
    assert.ok(!ids.has(photo.id), photo.id);
    ids.add(photo.id);
    assert.ok(photo.nameZh && photo.nameEn, photo.id);
    assert.ok(library.photoCollections.some((c) => c.id === photo.collection), photo.collection);
    assert.match(photo.source, /^https:\/\/images\.unsplash\.com\/photo-[0-9a-f-]+$/);
    assert.equal(photo.license, "Unsplash-Photos.txt");
    const file = new URL(`Photos/${photo.file}`, R);
    assert.ok(existsSync(file), photo.file);
    const bytes = readFileSync(file);
    assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xd8], photo.file);
    assert.ok(statSync(file).size < 400_000, photo.file);
    assert.ok(sources.includes(`${photo.file}  ${photo.source}`), photo.file);
  }
  for (const c of library.photoCollections) assert.ok(library.photos.filter((p) => p.collection === c.id).length >= 6, c.id);
});

test("photo: and scene: references resolve to bundled files only", () => {
  const media = Object.create(MediaStore.prototype);
  media.urls = new Map();
  assert.equal(media.resolve("photo:latte-art"), "library/photos/LD-photo-latte-art.jpg");
  assert.equal(media.resolve("scene:color-peach"), "library/scenes/LD-scene-color-peach.svg");
  assert.equal(media.resolve("scene:picnic"), "library/scenes/LD-scene-picnic.svg"); // retired, still shown
  assert.equal(media.resolve("photo:../x"), "");
  assert.equal(media.resolve("photo:"), "");
});

test("a page background covers the paper; words sit on a frosted card (white on dark)", () => {
  const ctx = {
    catalog: { ...library, fonts: [] },
    media: { resolve: (r) => (r.startsWith("scene:") ? `library/scenes/LD-scene-${r.slice(6)}.svg` : "") },
    t: (k) => k,
  };
  assert.equal(backdropOf({}, ctx), null);
  assert.equal(backdropOf({ backdrop: "scene:nope" }, ctx), null);
  assert.equal(backdropOf({ backdrop: "scene:color-peach" }, ctx).dark, false);
  assert.equal(backdropOf({ backdrop: "scene:sky-moon" }, ctx).dark, true);
  const day = { title: "今天", body: "", photo: "", layers: [], template: "cute", backdrop: "scene:sky-moon" };
  const html = canvasHTML(day, ctx, { readOnly: true });
  assert.match(html, /has-backdrop dark-backdrop/);
  assert.match(html, /background-image:url\(&#39;library\/scenes\/LD-scene-sky-moon\.svg&#39;\)|background-image:url\('library\/scenes\/LD-scene-sky-moon\.svg'\)/);
  assert.match(html, /class="backdrop-veil"/);
  assert.match(html, /color:#FFFFFF/);
  // Without a background nothing changes.
  const plain = canvasHTML({ ...day, backdrop: undefined }, ctx, { readOnly: true });
  assert.doesNotMatch(plain, /has-backdrop|backdrop-veil/);
  assert.match(plain, /color:#2F2A26/);
  // A free-layout story with pictures gets the background but no card.
  const free = canvasHTML({ title: "", body: "", layers: [], backdrop: "scene:color-mint" }, ctx, { readOnly: true, dayPage: false });
  assert.match(free, /has-backdrop/);
  assert.doesNotMatch(free, /backdrop-veil/);
});
