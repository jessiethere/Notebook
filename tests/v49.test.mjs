// V4.9: my space settings and the four new magazine covers.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as C from "../Public/js/community.mjs";
import { coverHTML, MAGAZINE_COVERS } from "../Public/js/personal-ui.mjs";

const R = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const library = JSON.parse(readFileSync(new URL("library.json", R)));
const tokens = JSON.parse(readFileSync(new URL("design-tokens.json", R)));

test("my space: a library banner, one of the accents and a short motto", () => {
  const state = { profile: { ...C.DEFAULT_PROFILE } };
  C.updateSpace(state, { banner: "photo:waves", accent: C.SPACE_ACCENTS[2], motto: "  " + "长".repeat(60) });
  assert.equal(state.profile.space.banner, "photo:waves");
  assert.equal(state.profile.space.accent, C.SPACE_ACCENTS[2]);
  assert.equal(state.profile.space.motto.length, 40);
  assert.throws(() => C.updateSpace(state, { banner: "https://example.com/x.jpg" }));
  assert.throws(() => C.updateSpace(state, { banner: "media:abc" }), "own photos are not used as a public banner");
  assert.throws(() => C.updateSpace(state, { accent: "red" }));
  assert.equal(state.profile.space.banner, "photo:waves", "a refused change keeps the old value");
});

test("six magazine covers, each drawn with the book's title", () => {
  assert.deepEqual(MAGAZINE_COVERS, library.coverTemplates.slice(0, 6).map((c) => c.id));
  const ctx = { catalog: library, tokens, t: (k) => k, media: { resolve: (r) => (/^photo:/.test(r) ? `p/${r.slice(6)}.jpg` : "") } };
  for (const template of MAGAZINE_COVERS) {
    const html = coverHTML({ id: "b1", title: "植物日记", category: "Plants", coverTemplate: template }, ctx);
    assert.match(html, new RegExp(`cover-${template}`), template);
    assert.match(html, /植物日记/, template);
  }
  const collage = coverHTML({ id: "b1", title: "植物日记", category: "Plants", coverTemplate: "magazine-collage" }, ctx);
  assert.equal(collage.match(/<img class="mag-photo"/g).length, 3);
  assert.match(coverHTML({ id: "b1", title: "x", coverTemplate: "magazine-film" }, ctx), /film-date/);
});
