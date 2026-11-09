// V4.7: magazine covers (Japanese / Western) with a library photo, and the
// sample journals switching to them once.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createInitialState, normalizeState } from "../Public/js/model.mjs";
import { coverHTML, coverPhotoRef, coverCollection, MAGAZINE_COVERS } from "../Public/js/personal-ui.mjs";

const R = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const seed = JSON.parse(readFileSync(new URL("seed.json", R)));
const library = JSON.parse(readFileSync(new URL("library.json", R)));
const tokens = JSON.parse(readFileSync(new URL("design-tokens.json", R)));
const ctx = {
  catalog: library,
  tokens,
  t: (k) => k,
  media: { resolve: (r) => (/^photo:/.test(r) ? `library/photos/LD-photo-${r.slice(6)}.jpg` : /^media:/.test(r) ? "blob:x" : "") },
};

test("two magazine covers come first; new and sample journals use them", () => {
  assert.deepEqual(library.coverTemplates.slice(0, MAGAZINE_COVERS.length).map((c) => c.id), MAGAZINE_COVERS);
  const fresh = createInitialState(seed, "2026-11-09");
  assert.deepEqual(fresh.books.map((b) => b.coverTemplate), ["magazine-jp", "magazine-west", "magazine-jp"]);
});

test("sample journals that kept their automatic cover switch to magazine covers once", () => {
  const old = createInitialState(seed, "2026-11-09");
  old.books = old.books.map((b) => ({ ...b, coverRestyled: undefined, coverTemplate: { daily: "floral-notebook", travel: "travel-album", food: "scrapbook-collage" }[b.id] }));
  old.books[2].coverTemplate = "vintage-leather"; // the user chose this one
  const next = normalizeState(old);
  assert.deepEqual(next.books.map((b) => b.coverTemplate), ["magazine-jp", "magazine-west", "vintage-leather"]);
  // Later choosing the old cover again sticks.
  next.books[0].coverTemplate = "floral-notebook";
  assert.equal(normalizeState(next).books[0].coverTemplate, "floral-notebook");
  // A book of your own is never touched.
  const mine = normalizeState({ ...next, books: [...next.books, { id: "b1", title: "Plants", category: "Daily Life", coverTemplate: "floral-notebook", coverDecoration: "tulip" }] });
  assert.equal(mine.books.at(-1).coverTemplate, "floral-notebook");
});

test("a magazine cover uses the book's photo, or a library photo that suits it", () => {
  assert.equal(coverCollection({ category: "Fitness" }), "move");
  assert.equal(coverCollection({ title: "我的植物日记" }), "flowers");
  assert.equal(coverCollection({ category: "亲子" }), "celebrate");
  const book = { id: "b42", title: "健身记录", category: "运动", coverTemplate: "magazine-west" };
  const ref = coverPhotoRef(book, library);
  assert.match(ref, /^photo:/);
  assert.equal(coverPhotoRef(book, library), ref, "always the same photo for the same book");
  assert.equal(library.photos.find((p) => `photo:${p.id}` === ref).collection, "move");
  assert.equal(coverPhotoRef({ ...book, coverImage: "photo:waves" }, library), "photo:waves");
  const west = coverHTML(book, ctx);
  assert.match(west, /cover-magazine-west/);
  assert.match(west, /LITTLE DAYS/);
  assert.match(west, /健身记录/);
  const jp = coverHTML({ ...book, coverTemplate: "magazine-jp", coverImage: "media:abc" }, ctx);
  assert.match(jp, /cover-magazine-jp/);
  assert.match(jp, /mag-vertical/);
  assert.match(jp, /src="blob:x"/);
  // Other covers are unchanged.
  assert.match(coverHTML({ ...book, coverTemplate: "minimal-linen" }, ctx), /cover-minimal-linen/);
});
