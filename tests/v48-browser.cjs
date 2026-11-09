// V4.8: library photos keep their own shape; the photo browser shows the
// picked photo large, the collections as tabs and a two-column waterfall.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const library = await page.evaluate(async () => (await (await fetch("shared/library.json")).json()).photos);

    // 1. Open the food collection from the chooser.
    await page.locator('.home-mag .moment-cta').tap();
    await page.locator('#choose-dialog [data-action="quick-start"]').tap();
    await page.waitForSelector("#journal-canvas");
    await page.evaluate(() => document.activeElement?.blur());
    await page.locator('[data-action="page-mode"][data-mode="layout"]').tap();
    await page.locator('#journal-canvas [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="scene-collection"][data-collection="food"]').tap();
    await page.waitForSelector("#scene-dialog[open] .pb-grid .pb-tile");
    await page.waitForFunction(() => [...document.querySelectorAll("#scene-dialog .pb-tile img")].every((img) => img.complete && img.naturalWidth > 0));
    // Tiles keep each photo's own shape: landscape tiles are wide, portrait tall.
    const tiles = await page.$$eval("#scene-dialog .pb-tile", (els) => els.map((el) => { const r = el.querySelector("img").getBoundingClientRect(); return { id: el.dataset.photo, ratio: r.width / r.height }; }));
    assert.equal(tiles.length, 6);
    for (const tile of tiles) {
      const photo = library.find((p) => p.id === tile.id);
      assert.ok(Math.abs(tile.ratio - photo.w / photo.h) < 0.05, `${tile.id} keeps its shape`);
    }
    assert.ok(tiles.some((t) => t.ratio > 1.1) && tiles.some((t) => t.ratio < 0.9), "landscape and portrait both visible");
    // Two columns (a waterfall).
    const lefts = await page.$$eval("#scene-dialog .pb-tile", (els) => [...new Set(els.map((el) => Math.round(el.getBoundingClientRect().left)))]);
    assert.equal(lefts.length, 2);
    if (shots) await page.screenshot({ path: `${shots}/v48-browser.png` });
    passed.push("waterfall: two columns, every photo in its own shape (landscape and portrait)");

    // 2. Tap a tile: the big preview shows it in its own shape, labelled 横图/竖图.
    const tall = tiles.find((t) => t.ratio < 0.9);
    await page.locator(`#scene-dialog .pb-tile[data-photo="${tall.id}"]`).tap();
    await page.waitForSelector(`#scene-dialog .pb-use[data-scene="${tall.id}"]`);
    await page.waitForFunction(() => { const img = document.querySelector("#scene-dialog .pb-preview img"); return img.complete && img.naturalWidth > 0; });
    const preview = await page.locator("#scene-dialog .pb-preview img").boundingBox();
    assert.ok(preview.height > preview.width, "portrait preview stands up");
    assert.match(await page.locator("#scene-dialog .pb-preview figcaption").innerText(), /竖图/);
    passed.push("preview: the picked photo large in its own shape, labelled 竖图 / 横图");

    // 3. Tabs switch collections without closing; 用这张 puts the photo on the page.
    await page.locator('#scene-dialog .pb-tabs [data-collection="pets"]').tap();
    await page.waitForSelector('#scene-dialog .pb-tabs [data-collection="pets"][aria-pressed="true"]');
    const pet = await page.locator("#scene-dialog .pb-tile").first().getAttribute("data-photo");
    assert.equal(library.find((p) => p.id === pet).collection, "pets");
    await page.locator("#scene-dialog .pb-use").tap();
    await page.waitForSelector("#scene-dialog:not([open])", { state: "attached" });
    await page.waitForSelector(`#journal-canvas img[src*="LD-photo-${pet}"]`);
    passed.push("tabs switch collections in place; 用这张 puts it on the page");

    assert.deepEqual(errors, []);
    console.log(`V4.8 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
