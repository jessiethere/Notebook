// V8.0 Little Keeper art: Captain only, as image assets cut out of the
// approved Captain Character Reference (library.json "keepers"); every mood
// maps to a real picture, and the files, catalog and licence agree.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as K from "../Public/js/keeper.mjs";
import { keeperAsset, keeperImage, DEFAULT_OUTFIT } from "../Public/js/keeper-art.mjs";

const root = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("library.json", root), "utf8"));
const png = (file) => {
  const b = readFileSync(new URL(`Keepers/${file}`, root));
  return { sig: b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] };
};

test("catalog: Captain only — Normal, Happy, Sleepy, Peek; files, sizes, alpha and licence", () => {
  assert.deepEqual(catalog.keepers.map((k) => k.id), ["cat-lemon-normal", "cat-lemon-happy", "cat-lemon-sleepy", "cat-lemon-peek"]);
  for (const k of catalog.keepers) {
    assert.equal(k.animal, "cat");
    assert.equal(k.outfit, "lemon");
    assert.ok(existsSync(new URL(`Keepers/${k.file}`, root)), k.file);
    const info = png(k.file);
    assert.ok(info.sig, "PNG");
    assert.equal(info.colorType, 6, "RGBA (transparent)");
  }
  // the three standing states share one canvas (no layout jumps)
  const sizes = ["normal", "happy", "sleepy"].map((m) => png(`LD-keeper-cat-lemon-${m}.png`)).map((i) => `${i.w}x${i.h}`);
  assert.equal(new Set(sizes).size, 1, sizes.join(" "));
  assert.match(readFileSync(new URL("Keepers/LD-keeper-LICENSE.txt", root), "utf8"), /Captain Character Reference/);
});

test("moods: real pictures only; anything else falls back to one of them", () => {
  assert.deepEqual(DEFAULT_OUTFIT, { cat: "lemon" });
  const pick = (mood, animal = "cat") => keeperAsset(catalog, { animal, mood }).id;
  assert.equal(pick("idle"), "cat-lemon-normal");
  assert.equal(pick("quiet"), "cat-lemon-normal", "writing: the calm pose (no Writing art yet)");
  assert.equal(pick("happy"), "cat-lemon-happy");
  assert.equal(pick("sleepy"), "cat-lemon-sleepy");
  assert.equal(pick("peek"), "cat-lemon-peek");
  assert.equal(pick("encouraging"), "cat-lemon-happy");
  assert.equal(pick("excited"), "cat-lemon-happy");
  assert.equal(pick("idle", "bunny"), "cat-lemon-normal", "an earlier Bunny choice shows Captain");
});

test("markup: a plain image with a relative path, escaped alt, no SVG", () => {
  const html = keeperImage(catalog, { mood: "peek", label: 'Cap"tain<' });
  assert.match(html, /^<img class="keeper-img is-peek" src="library\/keepers\/LD-keeper-cat-lemon-peek\.png"/);
  assert.match(html, /alt="Cap&quot;tain&lt;"/);
  assert.doesNotMatch(html, /<svg/);
  assert.equal(keeperImage({ keepers: [] }, {}), "");
});

test("profile: Captain is the only companion this round; old choices are read as Captain", () => {
  assert.deepEqual(K.ANIMALS, ["cat"]);
  assert.equal(K.normalizeKeeper({ animal: "bunny" }).animal, "cat");
  assert.equal(K.normalizeKeeper({}).animal, "cat");
  assert.equal(K.keeperName({ animal: "cat", name: "" }, "en"), "Captain");
  assert.equal(K.normalizeKeeper({ outfit: "<b>" }).outfit, "");
});
