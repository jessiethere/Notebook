// V6.5 E2E — Quick Create V2: pick photos → grouped by when they were taken
// (EXIF) → a designed draft right away (a day spread + one page per Moment,
// in the Editorial style) → words are optional, written in the preview →
// three styles with their own layouts → groups can be adjusted → Customize
// opens the same pages; pages adjusted by hand are never re-laid-out without
// asking → save straight into the book.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { menu } = require("./signed-in.cjs");
const { withExifTime } = require("./exif-fixture.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");

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
    const exifDay = today.replace(/-/g, ":");
    const pics = [
      ["morning-yoga", "08:10"],
      ["strength", "08:40"],
      ["latte-art", "14:30"],
      ["coffee-cheers", "14:50"],
      ["home-dinner", "19:05"],
    ].map(([id, time]) => ({ name: `${id}.jpg`, mimeType: "image/jpeg", buffer: withExifTime(fs.readFileSync(path.join(lib, `LD-photo-${id}.jpg`)), `${exifDay} ${time}:00`) }));
    const store = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const draft = async () => (await store()).drafts[today];
    const before = ((await store())?.entries || []).find((e) => e.date === today)?.moments?.length || 0;

    // 1. Pick photos → a designed draft right away (no steps in between).
    assert.match(await page.locator(".story-start-card .today-prompt").innerText(), /今天有什么值得记录/);
    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').first().tap();
    await (await chooser).setFiles(pics);
    await page.waitForSelector(".story-canvas .scrapbook-page.style-editorial");
    assert.equal(await page.locator(".story-tabs button").count(), 4, "a day spread + one page per Moment");
    await require("./signed-in.cjs").storyLayoutPanel(page);
    assert.equal(await page.locator('.qe-styles [aria-pressed="true"]').getAttribute("data-style"), "editorial", "Editorial by default");
    await require("./signed-in.cjs").closeStoryPanel(page);
    assert.equal(await page.locator("#phone.in-studio").count(), 1, "full screen, no menu");
    let d = await draft();
    assert.equal(d.layoutTemplate, "scrapbook");
    const mine = () => d.moments.slice(-3);
    assert.deepEqual(mine().map((m) => m.time), ["08:10", "14:30", "19:05"]);
    assert.deepEqual(mine().map((m) => m.layers.filter((l) => l.kind === "photo" && !l.gen).length), [2, 2, 1]);
    assert.ok(mine().every((m) => m.layoutTemplate === "scrapbook" && m.title === ""), "words are optional");
    if (shots) await page.screenshot({ path: `${shots}/v60-draft.png` });
    passed.push("pick 5 photos → straight to a designed draft: a day spread + 3 Moment pages (Editorial), no words needed");

    // 2. Words, written in the preview (tap the page); the page shows them.
    // V10.19: one Moment at a time (tabs on the spread), see tests/v119-browser.cjs.
    await page.locator('.qe-tools [data-action="story-text"]').tap();
    await page.waitForSelector("#choose-dialog[open] [data-sw-text]");
    assert.equal(await page.locator('#choose-dialog [data-action="sw-moment"]').count(), 3, "the spread: all three Moments");
    await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
    await require("./signed-in.cjs").storyLines(page, ["练腿日，深蹲终于到 60kg", "和小雨在新开的店喝拿铁 latte"]);
    await page.waitForFunction(() => /练腿日/.test(document.querySelector(".story-canvas").innerText));
    d = await draft();
    assert.deepEqual(mine().map((m) => m.title), ["练腿日，深蹲终于到 60kg", "和小雨在新开的店喝拿铁 latte", ""]);
    const bound = d.layers.filter((l) => l.bind === "title");
    assert.ok(bound.length >= 1 && bound.every((l) => l.of), "the spread's words are bound to their Moments");
    passed.push("words written in the preview show on the page (bound to the Moment, one source of truth)");

    // 3. Three styles, each its own layout; switching keeps photos, words and order.
    const snapshot = (e) => JSON.stringify(e.moments.slice(-3).map((m) => [m.id, m.title, m.layers.filter((l) => l.kind === "photo" && !l.gen).map((l) => l.mediaRef)]));
    const keep = snapshot(d);
    const looks = {};
    for (const style of ["cozy", "playful", "editorial"]) {
      await require("./signed-in.cjs").storyStyle(page, style);
      await page.waitForSelector(`.story-canvas .scrapbook-page.style-${style}`);
      d = await draft();
      assert.equal(snapshot(d), keep, `${style}: same photos, words and order`);
      const m = mine()[0];
      looks[style] = { frame: m.layers.find((l) => l.kind === "photo").frame, paper: m.template, backdrop: m.backdrop || "" };
      if (shots) await page.screenshot({ path: `${shots}/v60-${style}.png` });
    }
    assert.deepEqual(looks.editorial, { frame: "bare", paper: "minimal", backdrop: "" });
    assert.deepEqual([looks.cozy.frame, looks.cozy.paper], ["polaroid", "kraft"]);
    assert.ok(looks.playful.frame === "border" && /^scene:color-/.test(looks.playful.backdrop));
    passed.push("Editorial / Cozy / Collage: different frames, papers and backdrops; photos, words and order kept");

    // 4. Adjust the groups: move a photo to the next Moment, make it again.
    await require("./signed-in.cjs").storyRegroup(page);
    await page.waitForSelector(".story-group");
    await page.locator('[data-action="story-photo"][data-g="1"][data-i="1"]').tap();
    await page.locator('[data-action="story-move"][data-dir="1"]').tap();
    await page.locator('[data-action="story-regroup"]').tap();
    await page.waitForSelector(".story-canvas .scrapbook-page");
    d = await draft();
    assert.deepEqual(mine().map((m) => m.layers.filter((l) => l.kind === "photo" && !l.gen).length), [2, 1, 2]);
    assert.equal(mine()[0].title, "练腿日，深蹲终于到 60kg", "words stay with their Moment");
    assert.equal(d.moments.length, before + 3, "remade, not doubled");
    passed.push("adjust the groups and make it again: words kept, nothing doubled");

    // 5. Customize: drag a photo on the 08:10 page; back in the preview a
    //    style change asks first, and Cancel keeps that page as it is.
    await page.locator(".story-tabs button").nth(1).tap();
    await page.locator('[data-action="story-adjust"]').tap();
    await page.waitForSelector("#journal-canvas .photo-layer");
    const layer = page.locator("#journal-canvas .photo-layer").first();
    const box = await layer.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 24, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await page.locator('[data-action="studio-back"]').tap();
    await page.waitForSelector(".qe-tools");
    d = await draft();
    const edited = mine()[0];
    assert.equal(edited.layoutEdited, true, "the drag marks the page as adjusted by hand");
    const placed = JSON.stringify(edited.layers.filter((l) => l.kind === "photo").map((l) => [l.x, l.y]));
    await require("./signed-in.cjs").storyStyle(page, "cozy");
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /1 页是你自己调整过的/);
    await page.locator("#confirm-cancel").tap();
    await page.waitForFunction((day) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[day].moments.slice(-2).every((m) => m.layoutStyle === "cozy"), today);
    d = await draft();
    assert.equal(mine()[0].layoutStyle, "editorial", "the adjusted page keeps its style");
    assert.equal(JSON.stringify(mine()[0].layers.filter((l) => l.kind === "photo").map((l) => [l.x, l.y])), placed, "…and its photos where they were put");
    passed.push("Customize = the same pages; a page adjusted by hand is kept unless the person says yes");

    // 6. Save → straight into the book at the day spread; the calendar has it.
    await page.locator('[data-action="story-save"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover) .scrapbook-page");
    const saved = (await store()).entries.find((e) => e.date === today);
    assert.equal(saved.layoutTemplate, "scrapbook");
    assert.ok(saved.moments.slice(-3).every((m) => /T/.test(m.capturedAt || "")));
    if (shots) {
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${shots}/v60-book.png` });
    }
    await menu(page, "calendar");
    await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
    await page.waitForSelector(".day-detail .day-page .scrapbook-page");
    assert.match(await page.locator(".day-detail .day-page").innerText(), /练腿日/);
    passed.push("save → the book opens at today's spread; the calendar reads the same pages and words");

    // 7. One photo: one page, no spread. Leaving the preview keeps nothing.
    await menu(page, "home");
    const c2 = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').first().tap();
    await (await c2).setFiles(pics.slice(4));
    await page.waitForSelector(".story-canvas .scrapbook-page");
    assert.equal(await page.locator(".story-tabs").count(), 0, "one page, no tabs");
    await page.locator('[data-action="story-back"]').tap();
    await page.locator("#confirm-ok").tap();
    await page.waitForSelector(".hero");
    const after = await page.evaluate((day) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return (s.drafts[day] || s.entries.find((e) => e.date === day)).moments.length; }, today);
    assert.equal(after, before + 3, "nothing added");
    passed.push("one photo gives one page; leaving the preview adds nothing");

    assert.deepEqual(errors, []);
    console.log(`V6.5 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
