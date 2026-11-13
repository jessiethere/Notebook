// Quick note, the photo chooser (album / today's picks / library), scenes in
// the main picture spot, pull-up sheets and the calendar photo wall.
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
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1") || "null"));

    // 1. Just write: from ＋ pick 随手写 and type on the paper; saved as a page.
    await menu(page, "studio");
    await page.locator('[data-action="quick-way"][data-way="write"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.inline), "title");
    await page.keyboard.type("周日早晨");
    await page.locator('#journal-canvas [data-inline="body"]').click();
    await page.keyboard.type("在阳台晒太阳，读完了一章书。");
    await page.evaluate(() => document.activeElement.blur());
    await page.locator('[data-action="save-entry"]').tap();
    await require("./signed-in.cjs").homeAfterSave(page);
    let s = await state();
    const saved = s.entries.find((e) => e.date === today);
    const note = saved.moments.find((m) => m.title === "周日早晨");
    assert.ok(note, "saved to today");
    assert.equal(note.body, "在阳台晒太阳，读完了一章书。");
    assert.equal(note.layoutTemplate, "text");
    passed.push("just write: one choice from ＋, title + words typed on the paper, saved as a page");

    // 2. A fresh day: the main picture spot can be tapped; a scene goes into it.
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
    await page.waitForSelector('#journal-canvas .photo-placeholder[data-action="photo-chooser"]');
    await page.locator("#journal-canvas .photo-placeholder").tap();
    await page.waitForSelector("#choose-dialog[open]");
    assert.match(await page.locator("#choose-dialog h2").innerText(), /主照片/);
    assert.ok((await page.locator("#choose-dialog .choose-picks button").count()) >= 3, "today's picks");
    assert.equal(await page.locator("#choose-dialog .choose-collections button").count(), 13, "the library's collections");
    const pick = await page.locator("#choose-dialog .choose-picks button").nth(1).getAttribute("data-scene");
    await page.locator("#choose-dialog .choose-picks button").nth(1).tap();
    await page.waitForSelector(`#journal-canvas .canvas-photo img[src*="LD-photo-${pick}"]`);
    assert.equal(await page.locator("#journal-canvas .photo-layer").count(), 0, "in the layout, not floating on top");
    passed.push("main picture spot opens the chooser; a library photo fills that spot");

    // 3. The ＋照片 button offers album, picks and library (the album still opens the picker).
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.waitForSelector("#choose-dialog[open] .choose-album");
    const chooser = page.waitForEvent("filechooser");
    await page.locator('#choose-dialog [data-action="choose-album"]').tap();
    const picker = await chooser;
    assert.equal(picker.isMultiple(), true);
    await picker.setFiles([]);
    // From the chooser, a collection opens the swipe sheet.
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="scene-collection"][data-collection="coffee"]').tap();
    await page.waitForSelector("#scene-dialog[open] .pb-tile");
    assert.equal(await page.locator("#choose-dialog[open]").count(), 0);
    await page.locator('[data-action="scene-close"]').tap();
    passed.push("＋照片 → album (multi) / today's picks / library collections");

    // 4. Panels have a grabber: tap or pull up for more room, pull down to close.
    // (V10.25: 本页照片 left 更多 — the grabber is the same on every panel)
    await studioTool(page, "paper");
    await page.waitForSelector(".tool-sheet .sheet-grabber");
    const small = (await page.locator(".tool-sheet").boundingBox()).height;
    await page.locator(".sheet-grabber").tap();
    await page.waitForSelector(".tool-sheet.tall");
    const tall = (await page.locator(".tool-sheet").boundingBox()).height;
    assert.ok(tall > small + 80, `taller (${small} → ${tall})`);
    const grab = await page.locator(".sheet-grabber").boundingBox();
    await page.mouse.move(grab.x + grab.width / 2, grab.y + 5);
    await page.mouse.down();
    await page.mouse.move(grab.x + grab.width / 2, grab.y + 90, { steps: 6 });
    await page.mouse.up();
    await page.waitForSelector(".tool-sheet:not(.tall)");
    passed.push("panel grabber: up for more room, down to shrink");

    // 5. Calendar photo wall: the month's pictures on a moving background.
    await page.locator('[data-action="save-entry"]').tap();
    await require("./signed-in.cjs").homeAfterSave(page);
    await menu(page, "calendar");
    await page.locator('[data-action="calendar-mode"][data-mode="wall"]').tap();
    await page.waitForSelector(".cal-wall");
    assert.ok((await page.locator(".wall-day.has-photo").count()) >= 1, "today's picture on the wall");
    assert.notEqual(await page.locator(".cal-wall").evaluate((el) => getComputedStyle(el).animationName), "none");
    assert.match(await page.locator(".cal-wall-stats").innerText(), /\d+ 天 · \d+ 张照片/);
    await page.locator(`.wall-day[data-date="${today}"]`).tap();
    await page.waitForSelector(".day-detail");
    passed.push("calendar photo wall with moving background; a tile opens that day");

    assert.deepEqual(errors, []);
    console.log(`V3.13 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
