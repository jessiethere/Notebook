import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  configureI18n,
  setLanguage,
  t,
  languageCode,
} from "../Public/js/i18n.mjs";
import { validateFieldDefinitions } from "../Public/js/library.mjs";
const base = new URL(
  "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/",
  import.meta.url,
);
const catalog = JSON.parse(readFileSync(new URL("library.json", base)));
const dictionary = JSON.parse(readFileSync(new URL("i18n.json", base)));

test("all font families (7 categories, 5 Chinese) ship their original OFL notices and commercial redistribution terms", () => {
  assert.equal(catalog.fonts.length, 11);
  assert.equal(new Set(catalog.fonts.map((f) => f.category)).size, 7);
  assert.ok(catalog.fonts.filter((f) => f.supportsChinese).length >= 5);
  for (const font of catalog.fonts) {
    const license = readFileSync(
      new URL("Fonts/" + font.license, base),
      "utf8",
    );
    assert.match(license, /SIL OPEN FONT LICENSE/i);
    assert.ok(existsSync(new URL("Fonts/" + font.file, base)));
    // Original Google Fonts TTFs, or OFL npm slices rebuilt by our merge tool.
    assert.match(
      font.source,
      /githubusercontent\.com\/google\/fonts|^npm:.*tools\/merge_font_slices\.py$/,
    );
  }
});
test("original art has transparent scalable SVG and a native PNG for every catalog asset", () => {
  assert.ok(catalog.stickers.length >= 20);
  assert.equal(new Set(catalog.stickers.map((s) => s.category)).size, 10);
  for (const asset of catalog.stickers) {
    const svg = readFileSync(new URL("Stickers/" + asset.file, base), "utf8");
    assert.match(svg, /viewBox="0 0 160 160"/);
    assert.doesNotMatch(svg, /<script|https?:\/\/(?!www\.w3\.org)/);
    assert.ok(existsSync(new URL("Stickers/" + asset.nativeFile, base)));
  }
});
test("language preference is saved separately and interpolation does not translate user content", () => {
  let preference = null;
  const storage = {
    getItem: () => preference,
    setItem: (key, value) => (preference = value),
  };
  configureI18n(dictionary, storage);
  assert.equal(t("settings"), "设置");
  globalThis.document = { documentElement: {} };
  setLanguage("en");
  assert.equal(t("settings"), "Settings");
  assert.equal(t("entry.count", { count: 4 }), "4 pages");
  assert.equal(t("一本用户自己写的手帐"), "一本用户自己写的手帐");
  assert.equal(preference, "en");
  assert.equal(languageCode(), "en");
  assert.throws(() => setLanguage("unknown"));
});
test("custom fields validate types and select options without hardcoding a separate theme editor", () => {
  assert.equal(
    validateFieldDefinitions([
      { id: "plant", label: "植物名称", type: "text" },
      { id: "water", label: "浇水日期", type: "date" },
    ]).length,
    2,
  );
  assert.throws(
    () =>
      validateFieldDefinitions([
        { id: "a", label: "A", type: "select", options: [] },
      ]),
    /selectOptions/,
  );
  assert.throws(
    () => validateFieldDefinitions([{ id: "a", label: "A", type: "script" }]),
    /invalidField/,
  );
});
test("every locale message has both languages and all category and font labels exist", () => {
  for (const [key, value] of Object.entries(dictionary)) {
    assert.ok(value.zh && value.en, key);
  }
  for (const category of new Set(catalog.stickers.map((s) => s.category)))
    assert.ok(dictionary["category." + category]);
  for (const font of catalog.fonts)
    assert.ok(dictionary["font." + font.category]);
  for (const type of catalog.fieldTypes) assert.ok(dictionary["field." + type]);
});

test("font binaries match the catalog SHA-256 and are not renamed internally by the app", async () => {
  const { createHash } = await import("node:crypto");
  for (const font of catalog.fonts) {
    const bytes = readFileSync(new URL("Fonts/" + font.file, base));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), font.sha256);
    assert.ok(font.postScriptName && !font.postScriptName.startsWith("LD-"));
  }
});
