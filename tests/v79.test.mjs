// V7.9 Little Keeper art: the approved 3D character pictures (library.json
// "keepers") are used as images; every mood maps to a real picture, and the
// files, catalog and licence agree.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as K from "../Public/js/keeper.mjs";
import { keeperAsset, keeperImage, keeperOutfits, DEFAULT_OUTFIT } from "../Public/js/keeper-art.mjs";

const root = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("library.json", root), "utf8"));

test("catalog: 20 cut-outs of three characters, every file and its licence exist", () => {
  assert.equal(catalog.keepers.length, 20);
  assert.deepEqual([...new Set(catalog.keepers.map((k) => k.animal))].sort(), ["bunny", "cat", "westie"]);
  for (const k of catalog.keepers) {
    assert.ok(existsSync(new URL(`Keepers/${k.file}`, root)), k.file);
    assert.equal(k.license, "LD-keeper-LICENSE.txt");
    assert.ok(readFileSync(new URL(`Keepers/${k.file}`, root)).subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])), "PNG");
  }
  assert.match(readFileSync(new URL("Keepers/LD-keeper-LICENSE.txt", root), "utf8"), /product owner/);
});

test("default outfits: Bunny and Westie in the sprout hat, Captain in the lemon hat", () => {
  assert.deepEqual(DEFAULT_OUTFIT, { bunny: "sprout", cat: "lemon", westie: "sprout" });
  assert.equal(keeperAsset(catalog, { animal: "cat", mood: "idle" }).id, "cat-lemon-neutral");
  assert.equal(keeperAsset(catalog, { animal: "bunny", mood: "idle" }).id, "bunny-sprout-neutral");
  assert.equal(keeperAsset(catalog, { animal: "westie", mood: "idle" }).id, "westie-sprout-neutral");
  assert.deepEqual(keeperOutfits(catalog, "cat"), ["lemon", "beanie", "sleepy", "frog"]);
});

test("moods: real pictures first, the closest existing picture otherwise (never a drawn stand-in)", () => {
  const pick = (animal, mood, outfit = "") => keeperAsset(catalog, { animal, mood, outfit }).id;
  assert.equal(pick("cat", "peek"), "cat-lemon-peek");
  assert.equal(pick("cat", "excited"), "cat-lemon-excited");
  assert.equal(pick("cat", "sleepy"), "cat-lemon-sleepy");
  assert.equal(pick("cat", "encouraging"), "cat-lemon-happy", "no Captain Encouraging art yet");
  assert.equal(pick("bunny", "encouraging"), "bunny-sprout-encouraging");
  assert.equal(pick("bunny", "sleepy"), "bunny-sleepy-happy", "borrows the nightcap picture");
  assert.equal(pick("bunny", "peek"), "bunny-sprout-neutral", "no Bunny Peek art yet");
  assert.equal(pick("westie", "sleepy"), "westie-bear-sleepy");
  assert.equal(pick("westie", "excited"), "westie-sprout-excited");
  assert.equal(pick("westie", "quiet"), "westie-sprout-neutral", "writing: the calm pose (all hold the notebook)");
  // An outfit with one picture always shows that picture.
  assert.equal(pick("cat", "happy", "frog"), "cat-frog-excited");
  assert.equal(pick("westie", "sleepy", "beret"), "westie-beret-neutral");
  // Unknown outfit falls back to the default.
  assert.equal(pick("cat", "idle", "crown"), "cat-lemon-neutral");
  for (const animal of K.ANIMALS) for (const mood of ["idle", "quiet", "happy", "excited", "encouraging", "sleepy", "peek"]) assert.ok(keeperAsset(catalog, { animal, mood }), `${animal}/${mood}`);
});

test("markup: a plain image with a relative path, escaped alt, no SVG", () => {
  const html = keeperImage(catalog, { animal: "cat", mood: "peek", label: 'Cap"tain<' });
  assert.match(html, /^<img class="keeper-img is-peek" src="library\/keepers\/LD-keeper-cat-lemon-peek\.png"/);
  assert.match(html, /alt="Cap&quot;tain&lt;"/);
  assert.doesNotMatch(html, /<svg/);
  assert.equal(keeperImage({ keepers: [] }, { animal: "cat" }), "");
});

test("profile: Westie and an outfit are kept; bad outfits are dropped", () => {
  assert.ok(K.ANIMALS.includes("westie"));
  assert.equal(K.normalizeKeeper({ animal: "westie", outfit: "beret" }).outfit, "beret");
  assert.equal(K.normalizeKeeper({ outfit: "<b>" }).outfit, "");
  assert.equal(K.normalizeKeeper({}).outfit, "");
  assert.equal(K.keeperName({ animal: "westie", name: "" }, "en"), "Snowy");
  assert.equal(K.keeperName({ animal: "cat", name: "" }, "en"), "Captain");
});
