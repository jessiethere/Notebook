// Scene library + picture of the day: Home card, Studio start, photo panel,
// placing, editing and exporting a scene. Original illustrations only.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { menu, openToday } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"], acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1") || "null"));

    // 1. The sample page shows the coffee photo; the picture of the day is offered on Home.
    // Storage is written on the first change: tick and untick a habit.
    await require("./signed-in.cjs").touchStore(page);
    await page.waitForFunction(() => localStorage.getItem("little-days.v1"));
    let s = await state();
    const sample = s.entries.find((e) => e.isDemo && e.date === today);
    assert.equal(sample.photo, "/assets/coffee.jpg");
    assert.equal(await page.locator(".hero img:not(.keeper-img)").evaluate((img) => img.complete && img.naturalWidth > 0), true);
    passed.push("sample page keeps the coffee photo");

    // 2. Home: with nothing written today, the picture of the day invites writing.
    await page.evaluate((d) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.entries = s.entries.filter((e) => e.date !== d);
      delete s.drafts[d];
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, today);
    await page.reload();
    await page.waitForSelector(".today-scene");
    assert.match(await page.locator(".today-scene").innerText(), /今日推荐的照片/);
    const sceneId = await page.locator(".today-scene").getAttribute("data-scene");
    assert.ok(sceneId, "a picture of the day");
    await page.locator(".today-scene").tap();
    // The record sheet opens on 照片 + 一句话 with today's photo chosen; the
    // photo becomes the whole page, with one line to write on it.
    await page.waitForSelector('#choose-dialog[open] [data-action="quick-way"][data-way="photo"][aria-pressed="true"]');
    await page.waitForSelector('#choose-dialog[open] [data-action="quick-photo"][data-photo="today"][aria-pressed="true"]');
    await page.locator('#choose-dialog [data-action="quick-start"]').tap();
    await page.waitForSelector("#journal-canvas.line-page");
    assert.match(await page.locator("#journal-canvas").getAttribute("style"), new RegExp(`LD-photo-${sceneId}`));
    await studioMode(page, "layout");
    await page.waitForSelector("#journal-canvas"); // mode layout (chosen in More)
    passed.push("Home: picture of the day → one tap makes a photo + one line page");

    // 3. Photo panel: a wallpaper-style gallery (6 collections) → swipe sheet.
    await page.evaluate(() => document.activeElement?.blur());
    await studioTool(page, "photos");
    await page.waitForSelector(".wall-gallery");
    const photoCollections = await page.evaluate(async () => (await (await fetch("shared/library.json")).json()).photoCollections.map((c) => c.id));
    assert.deepEqual(await page.$$eval(".wall-get", (els) => els.map((el) => el.dataset.collection)), photoCollections);
    assert.equal(photoCollections.length, 13);
    const todayCollection = await page.evaluate(async (id) => (await (await fetch("shared/library.json")).json()).photos.find((p) => p.id === id).collection, sceneId);
    const otherCollection = photoCollections.find((id) => id !== todayCollection);
    assert.equal(await page.locator('.wall-row').first().locator('.wall-card').count(), 3, "stacked previews");
    await page.locator(`.wall-get[data-collection="${todayCollection}"]`).tap();
    await page.waitForSelector("#scene-dialog[open] .pb-tile");
    assert.equal(await page.locator("#scene-dialog .pb-tile").count(), 6);
    assert.equal(await page.locator("#scene-dialog .pb-tile").first().getAttribute("data-photo"), sceneId, "today's first");
    assert.equal(await page.locator("#scene-dialog .pb-use").getAttribute("data-scene"), sceneId, "today's is picked to start");
    await page.locator('[data-action="scene-close"]').tap();
    await page.locator(`.wall-get[data-collection="${otherCollection}"]`).tap();
    await page.waitForSelector("#scene-dialog[open] .pb-tile");
    assert.equal(await page.locator("#scene-dialog .pb-tile").count(), 6);
    const other = await page.locator("#scene-dialog .pb-tile").nth(1).getAttribute("data-photo");
    await page.locator("#scene-dialog .pb-tile").nth(1).tap();
    await page.waitForSelector(`#scene-dialog .pb-use[data-scene="${other}"]`);
    await page.locator("#scene-dialog .pb-use").tap();
    await page.waitForSelector("#scene-dialog:not([open])", { state: "attached" });
    await page.waitForFunction((id) => {
      const d = new Date();
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const draft = JSON.parse(localStorage.getItem("little-days.v1")).drafts[k];
      return draft && [draft, ...draft.moments].some((p) => p.layers.some((l) => l.mediaRef === `photo:${id}`));
    }, other);
    passed.push("photo library: 13 collections with stacked previews → swipe sheet; today's first; use one");

    // 4. A scene can be edited like a photo (the original scene stays the source).
    const layerId = await page.evaluate((id) => {
      const d = new Date();
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const draft = JSON.parse(localStorage.getItem("little-days.v1")).drafts[k];
      return [draft, ...draft.moments].flatMap((p) => p.layers).find((l) => l.mediaRef === `photo:${id}`).id;
    }, other);
    await page.locator(`[data-layer="${layerId}"]`).tap();
    await page.locator('.tool-dock.ctx [data-action="photo-edit"]').tap();
    await page.waitForSelector("#photo-editor[open] .pe-frame");
    await page.locator('[data-pe-action="filter"][data-filter="film"]').tap();
    await page.locator('[data-pe-action="done"]').tap();
    await page.waitForFunction((id) => {
      const d = new Date();
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const draft = JSON.parse(localStorage.getItem("little-days.v1")).drafts[k];
      const l = [draft, ...draft.moments].flatMap((p) => p.layers).find((x) => x.sourceRef === `photo:${id}`);
      return l && l.mediaRef.startsWith("media:") && l.edit.filter === "film";
    }, other);
    passed.push("edit a scene with filters (edited copy saved; the scene stays the source)");

    // 5. Export works with scenes on the page.
    await page.locator('[data-action="tool-close"]').first().tap().catch(() => {});
    await studioPreview(page);
    const png = page.waitForEvent("download");
    await page.locator('[data-action="export"]').tap();
    assert.match((await png).suggestedFilename(), /\.png$/);
    // The record sheet also offers the picture of the day.
    await menu(page, "studio");
    await page.locator('[data-action="quick-way"][data-way="photo"]').tap();
    await page.waitForSelector('#choose-dialog [data-action="quick-photo"][data-photo="today"] img');
    assert.match(await page.locator('#choose-dialog [data-action="quick-photo"][data-photo="today"] img').getAttribute("src"), new RegExp(`LD-photo-${sceneId}`));
    passed.push("PNG export with scenes; the record sheet offers the picture of the day");

    assert.deepEqual(errors, []);
    console.log(`V3.11 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
