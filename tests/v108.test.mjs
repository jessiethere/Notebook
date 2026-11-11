// V10.8 · Captain's wardrobe: only looks with real artwork are offered.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { keeperLooks, keeperAsset, DEFAULT_OUTFIT } from "../Public/js/keeper-art.mjs";
import { normalizeKeeper } from "../Public/js/keeper.mjs";

const base = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("library.json", base), "utf8"));

test("the wardrobe lists the looks that have pictures: hats first, then little things", () => {
  const looks = keeperLooks(catalog, "cat", "zh-CN");
  assert.deepEqual(looks.map((look) => [look.id, look.kind, look.name]), [["lemon", "hat", "柠檬帽"], ["yarn", "accessory", "毛线球"]]);
  assert.equal(looks.find((look) => look.id === "lemon").isDefault, true);
  assert.deepEqual(keeperLooks(catalog, "cat", "en").map((look) => look.name), ["Lemon hat", "Yarn ball"]);
  for (const look of looks) {
    const asset = keeperAsset(catalog, { animal: "cat", outfit: look.id, mood: "idle" });
    assert.equal(asset.outfit, look.id);
    assert.ok(existsSync(new URL(`Keepers/${asset.file}`, base)), asset.file);
  }
});

test("a look without artwork is never offered, and an unknown one falls back to the lemon hat", () => {
  const withGhost = { ...catalog, keeperLooks: [...catalog.keeperLooks, { id: "frog", animal: "cat", kind: "hat", nameZh: "青蛙帽", nameEn: "Frog hat" }] };
  assert.equal(keeperLooks(withGhost, "cat").some((look) => look.id === "frog"), false);
  assert.equal(keeperAsset(catalog, { animal: "cat", outfit: "frog", mood: "idle" }).outfit, DEFAULT_OUTFIT.cat);
  assert.deepEqual(keeperLooks({}, "cat"), []);
});

test("the yarn look has one picture: every mood shows it (never the hat)", () => {
  for (const mood of ["idle", "happy", "sleepy", "peek", "encouraging"]) assert.equal(keeperAsset(catalog, { animal: "cat", outfit: "yarn", mood }).file, "LD-keeper-cat-yarn-happy.png");
  assert.equal(keeperAsset(catalog, { animal: "cat", outfit: "", mood: "peek" }).mood, "peek");
});

test("the chosen look is an optional field of the keeper; old data has none", () => {
  assert.equal(normalizeKeeper({ enabled: true }).outfit, "");
  assert.equal(normalizeKeeper({ enabled: true, outfit: "yarn" }).outfit, "yarn");
  assert.equal(normalizeKeeper({ enabled: true, outfit: "<x>" }).outfit, "");
});
