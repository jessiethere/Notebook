// V4.4: the photo library is real photos; gradients, cute patterns and the
// other artwork are page backgrounds (Paper panel, or from the photo chooser).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { menu, openToday } = require("./signed-in.cjs");
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
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png` });

    // 1. The chooser and the library show real photos only (no artwork).
    // Storage is written on the first change: tick and untick a habit, then clear today.
    await require("./signed-in.cjs").touchStore(page);
    await page.waitForFunction(() => localStorage.getItem("little-days.v1"));
    await page.evaluate((d) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.entries = s.entries.filter((e) => e.date !== d);
      delete s.drafts[d];
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, today);
    await page.reload();
    await page.waitForSelector(".hero");
    await menu(page, "studio");
    await openToday(page);
    await page.locator('#journal-canvas [data-inline="title"]').fill("周日的小美好");
    await page.locator('#journal-canvas [data-inline="body"]').fill("晒太阳，读书，喝了一杯热可可。");
    await page.locator("#journal-canvas .photo-placeholder").tap();
    await page.waitForSelector("#choose-dialog[open] .choose-picks img");
    const srcs = await page.$$eval("#choose-dialog img", (els) => els.map((el) => el.getAttribute("src")));
    assert.ok(srcs.length >= 16, `${srcs.length} pictures`);
    assert.ok(srcs.every((src) => /library\/photos\/LD-photo-[a-z0-9-]+\.jpg$/.test(src)), "photos only");
    await page.waitForFunction(() => [...document.querySelectorAll("#choose-dialog .choose-picks img")].every((img) => img.complete && img.naturalWidth >= 600));
    await shot("v44-chooser");
    passed.push("chooser: today's picks + 13 photo collections, all real photos");

    // 2. The chooser leads to page backgrounds (shown first in the Paper panel).
    await page.locator('#choose-dialog [data-action="open-backdrops"]').tap();
    await page.waitForSelector('.tool-sheet.tall[data-tool-row="paper"] .backdrop-picker');
    assert.equal(await page.locator("#choose-dialog[open]").count(), 0);
    assert.deepEqual(await page.$$eval(".backdrop-picker h4", (els) => els.map((el) => el.textContent)), ["照片氛围", "渐变色彩", "可爱图案"]);
    assert.equal(await page.locator(".backdrop-option img").count(), 20);
    assert.equal(await page.locator('.backdrop-option[data-backdrop=""]').getAttribute("aria-pressed"), "true");
    const first = await page.locator(".tool-body > *").first().getAttribute("class");
    assert.match(first, /backdrop-picker/, "backgrounds come before paper styles");
    passed.push("「换个页面背景」 opens Paper → backgrounds first (photo mood, gradients, patterns: 20)");

    // 3. A light background: the page is covered, words on a frosted card.
    await page.locator('.backdrop-option[data-backdrop="scene:pattern-clouds"]').tap();
    await page.waitForSelector("#journal-canvas.has-backdrop:not(.dark-backdrop) .backdrop-veil");
    assert.match(await page.locator("#journal-canvas").evaluate((el) => getComputedStyle(el).backgroundImage), /LD-scene-pattern-clouds\.svg/);
    assert.equal(await page.locator('.backdrop-option[data-backdrop="scene:pattern-clouds"]').getAttribute("aria-pressed"), "true");
    await shot("v44-picker");
    await page.locator('[data-action="tool-close"]').tap();
    await page.waitForTimeout(250);
    await shot("v44-light");
    passed.push("light background: covers the paper; title/words on a frosted card");

    // 4. A dark background: the words turn white.
    await studioTool(page, "paper");
    await page.locator('.backdrop-option[data-backdrop="photo:starry-lake"]').tap();
    await page.waitForSelector("#journal-canvas.dark-backdrop");
    assert.equal(await page.locator("#journal-canvas .canvas-title").evaluate((el) => getComputedStyle(el).color), "rgb(255, 255, 255)");
    assert.notEqual(await page.locator("#journal-canvas .canvas-body").evaluate((el) => getComputedStyle(el).color), "rgb(153, 140, 122)");
    await page.locator('[data-action="tool-close"]').tap();
    await page.waitForTimeout(250);
    await shot("v44-dark");
    passed.push("dark background: white words on a dark frosted card");

    // 5. A library photo in the main spot, the background kept; saved and shown when reading.
    await page.locator("#journal-canvas .photo-placeholder").tap();
    await page.waitForSelector("#choose-dialog[open]");
    await page.locator('#choose-dialog [data-action="scene-collection"][data-collection="coffee"]').tap();
    await page.waitForSelector("#scene-dialog[open] .pb-tile img");
    await page.waitForFunction(() => { const img = document.querySelector("#scene-dialog .pb-preview img"); return img.complete && img.naturalWidth > 0; });
    await shot("v44-collection");
    // Pick a photo in the waterfall; the big preview and 用这张 follow it.
    const latte = page.locator('#scene-dialog .pb-tile[data-photo="latte-art"]');
    await latte.scrollIntoViewIfNeeded();
    await latte.tap();
    await page.waitForSelector('#scene-dialog .pb-use[data-scene="latte-art"]');
    await page.locator("#scene-dialog .pb-use").tap();
    await page.waitForSelector('#journal-canvas .canvas-photo img[src*="LD-photo-latte-art"]');
    await page.waitForFunction(() => { const img = document.querySelector("#journal-canvas .canvas-photo img"); return img.complete && img.naturalWidth > 0; });
    await shot("v44-photo-on-dark");
    await studioPreview(page);
    const png = page.waitForEvent("download");
    await page.locator('[data-action="export"]').tap();
    assert.match((await png).suggestedFilename(), /\.png$/);
    await page.locator('[data-action="save-entry"]').tap();
    await require("./signed-in.cjs").homeAfterSave(page);
    const saved = (await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")))).entries.find((e) => e.date === today);
    assert.equal(saved.backdrop, "photo:starry-lake");
    assert.equal(saved.photo, "photo:latte-art");
    await menu(page, "calendar");
    await page.locator('[data-action="calendar-mode"][data-mode="wall"]').tap();
    await page.locator(`.wall-day[data-date="${today}"]`).tap();
    await page.waitForSelector(".day-detail .journal-canvas.has-backdrop.dark-backdrop");
    passed.push("library photo + background saved; PNG export; read mode shows the background");

    // 6. No background: back to plain paper (edit the day from reading mode).
    await page.locator('.day-detail-top [data-action="edit-date"]').tap();
    await page.waitForSelector("#journal-canvas.has-backdrop");
    await page.evaluate(() => document.activeElement?.blur());
    if (await page.locator('[data-action="tool-close"]').count()) await page.locator('[data-action="tool-close"]').tap();
    await studioTool(page, "paper");
    await page.locator('.backdrop-option[data-backdrop=""]').tap();
    await page.waitForSelector("#journal-canvas:not(.has-backdrop)");
    assert.equal(await page.locator("#journal-canvas .backdrop-veil").count(), 0);
    passed.push("「不用背景」 returns to plain paper");

    assert.deepEqual(errors, []);
    console.log(`V4.4 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
