// V6.3 E2E — Quick Create v3 (P0 ①), today's story: Home asks "what's worth
// keeping today?" → pick photos → grouped into Moments by when they were
// taken (EXIF) → a line each (optional) → a timeline cover + one page per
// Moment → adjust in the studio and come back → save straight into the book.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
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
    const before = await page.evaluate((d) => (JSON.parse(localStorage.getItem("little-days.v1") || "null")?.entries || []).find((e) => e.date === d)?.moments?.length || 0, today);

    // 1. Home: one question, one big button; photos are grouped by time.
    assert.match(await page.locator(".story-start-card .today-prompt").innerText(), /今天有什么值得记录/);
    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').tap();
    await (await chooser).setFiles(pics);
    await page.waitForSelector(".story-group");
    assert.equal(await page.locator(".story-group").count(), 3, "three Moments: morning, afternoon, evening");
    assert.match(await page.locator(".story-group").nth(0).innerText(), /08:10 早上[\s\S]*2 张/);
    assert.match(await page.locator(".story-group").nth(2).innerText(), /19:05 晚上/);
    assert.equal(await page.locator("#phone.in-studio").count(), 1, "full screen, no menu");
    if (shots) await page.screenshot({ path: `${shots}/v60-group.png` });
    passed.push("Home → pick today's photos → grouped into 3 Moments by when they were taken");

    // 2. Move a photo to the next Moment, then back.
    await page.locator('[data-action="story-photo"][data-g="1"][data-i="1"]').tap();
    await page.waitForSelector(".story-photo-bar");
    await page.locator('[data-action="story-move"][data-dir="1"]').tap();
    assert.deepEqual(await page.$$eval(".story-group", (els) => els.map((el) => el.querySelectorAll(".story-thumb").length)), [2, 1, 2]);
    await page.locator('[data-action="story-photo"][data-g="2"][data-i="0"]').tap();
    await page.locator('[data-action="story-move"][data-dir="-1"]').tap();
    assert.deepEqual(await page.$$eval(".story-group", (els) => els.map((el) => el.querySelectorAll(".story-thumb").length)), [2, 2, 1]);
    passed.push("tap a photo to move it to the Moment before / after");

    // 3. A line for some Moments (others skipped) → the story.
    await page.locator('[data-action="story-step"][data-step="lines"]').tap();
    await page.waitForSelector("[data-story-line]");
    await page.locator('[data-story-line="0"]').fill("练腿日，深蹲终于到 60kg");
    await page.locator('[data-story-line="1"]').fill("和小雨在新开的店喝拿铁");
    if (shots) await page.screenshot({ path: `${shots}/v60-lines.png` });
    await page.locator('.story-foot [data-action="story-make"]').tap();
    await page.waitForSelector(".story-canvas .timeline-cover");
    assert.equal(await page.locator(".story-tabs button").count(), 4, "a cover + one page per Moment");
    assert.equal(await page.locator(".story-canvas .timeline-cover .photo-layer, .story-canvas .timeline-cover [data-layer-kind=photo], .story-canvas .timeline-cover img").count() >= 3, true);
    assert.match(await page.locator(".story-canvas").innerText(), /08:10[\s\S]*练腿日[\s\S]*14:30[\s\S]*和小雨/);
    if (shots) {
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${shots}/v60-preview.png` });
    }
    const draft = () => page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[d], today);
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).drafts?.[d]?.layoutTemplate === "timeline", today);
    // A page of its own: shuffle changes its look.
    await page.locator('.story-tabs button').nth(1).tap();
    await page.waitForSelector(".story-canvas .moment-canvas");
    const v0 = (await draft()).moments.find((m) => m.title === "练腿日，深蹲终于到 60kg").layoutVariant;
    await page.locator('[data-action="story-shuffle"]').tap();
    await page.waitForFunction(([d, v]) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[d].moments.find((m) => m.title === "练腿日，深蹲终于到 60kg").layoutVariant !== v, [today, v0]);
    passed.push("a line for two Moments (one skipped) → a timeline cover + 3 pages; shuffle a page");

    // 4. Adjust it myself: the studio on that page, ‹ comes back to the story.
    await page.locator('[data-action="story-adjust"]').tap();
    await page.waitForSelector("#journal-canvas");
    await page.locator('[data-action="studio-back"]').tap();
    await page.waitForSelector(".story-tabs");
    // Back to the lines and again: no duplicate pages.
    await page.locator('[data-action="story-back"]').tap();
    await page.waitForSelector("[data-story-line]");
    assert.equal(await page.locator('[data-story-line="0"]').inputValue(), "练腿日，深蹲终于到 60kg", "the lines are kept");
    await page.locator('.story-foot [data-action="story-make"]').tap();
    await page.waitForSelector(".story-canvas .timeline-cover");
    assert.equal((await draft()).moments.length, before + 3, "remade, not doubled");
    passed.push("adjust in the studio and come back; going back and remaking does not double the pages");

    // 5. Save → straight into the book, page by page, at this day's cover.
    await page.locator('[data-action="story-save"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover) .timeline-cover");
    const saved = await page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d), today);
    assert.equal(saved.layoutTemplate, "timeline");
    const mine = saved.moments.slice(-3);
    assert.deepEqual(mine.map((m) => m.time), ["08:10", "14:30", "19:05"]);
    assert.deepEqual(mine.map((m) => m.layers.filter((l) => l.kind === "photo").length), [2, 2, 1]);
    assert.ok(mine.every((m) => /T/.test(m.capturedAt || "")), "when it was taken is kept");
    assert.equal(mine[2].title, "");
    if (shots) {
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${shots}/v60-book.png` });
    }
    passed.push("save → the book opens page by page at today's timeline cover; times, photos and lines saved");

    // 6. Reading the day in the calendar: the cover and the three pages.
    await menu(page, "calendar");
    await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
    await page.waitForSelector(".day-detail .day-page .timeline-cover");
    assert.ok((await page.locator(".day-detail .moment-chapter").count()) >= 3);
    passed.push("the calendar shows the day with its timeline cover and pages");

    // 7. Leaving at the first step keeps nothing; one time of day = one page as before.
    await menu(page, "home");
    const c2 = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').tap();
    await (await c2).setFiles(pics.slice(0, 1).concat(pics.slice(4)));
    await page.waitForSelector(".story-group");
    await page.locator('[data-action="story-back"]').tap();
    await page.locator("#confirm-ok").tap();
    await page.waitForSelector(".hero");
    const after = await page.evaluate((d) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return (s.drafts[d] || s.entries.find((e) => e.date === d)).moments.length; }, today);
    assert.equal(after, before + 3, "nothing added");
    const c3 = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').tap();
    await (await c3).setFiles(pics.slice(2, 4));
    await page.waitForSelector(".quick-result-bar");
    passed.push("leaving the first step adds nothing; photos from one time of day still give one page (as before)");

    assert.deepEqual(errors, []);
    console.log(`V6.3 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
