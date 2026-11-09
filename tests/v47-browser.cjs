// V4.7: journals on Home (shelf order, add a page straight into one), the
// calendar by journal, and magazine covers with a chosen photo.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
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
    await page.waitForSelector(".home-mag .home-book");
    const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1") || "null"));
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });

    // 1. Home: the journals in shelf order, as magazine covers; headings in the system sans.
    const homeBooks = await page.$$eval(".home-book .home-book-cover", (els) => els.map((el) => el.dataset.book));
    assert.deepEqual(homeBooks, ["daily", "travel", "food"]);
    assert.equal(await page.locator(".home-book .cover-magazine-jp").count(), 2);
    assert.equal(await page.locator(".home-book .cover-magazine-west").count(), 1);
    await page.waitForFunction(() => [...document.querySelectorAll(".home-book .mag-photo")].every((img) => img.complete && img.naturalWidth > 0));
    const family = await page.locator(".home-mag .today-prompt").evaluate((el) => getComputedStyle(el).fontFamily);
    assert.match(family, /PingFang SC/);
    assert.doesNotMatch(family, /xiaowei|LD-zh|Songti|(^|, )serif/i);
    passed.push("Home: journals in shelf order as magazine covers; system-sans headings");

    // 2. 记一页 writes a page straight into that journal (typed on the paper).
    await page.locator('.home-book-write[data-book="travel"]').tap();
    // The record sheet opens with that journal chosen.
    await page.waitForSelector('#choose-dialog[open] [data-action="quick-book"][data-book="travel"][aria-pressed="true"]');
    await page.locator('[data-action="quick-way"][data-way="write"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("海边的风");
    await page.waitForTimeout(1300);
    const story = (await state()).drafts[today].moments.at(-1);
    assert.equal(story.bookId, "travel");
    assert.equal(story.layoutTemplate, "text");
    assert.equal(story.title, "海边的风");
    await page.evaluate(() => document.activeElement?.blur());
    await page.locator('[data-action="save-entry"]').tap();
    await require("./signed-in.cjs").homeAfterSave(page);
    passed.push("记一页: a new page in that journal, ready to type");

    // 3. Calendar by journal: only that journal's days (and its pictures).
    await menu(page, "calendar");
    const chips = await page.$$eval('[data-action="calendar-book"]', (els) => els.map((el) => el.dataset.book));
    assert.deepEqual(chips, ["", "daily", "travel", "food"]);
    await page.locator('[data-action="calendar-book"][data-book="food"]').tap();
    await page.waitForSelector('[data-action="calendar-book"][data-book="food"][aria-pressed="true"]');
    assert.equal(await page.locator(`.day-cell[data-date="${today}"] .day-mark img`).count(), 0, "nothing in the food journal today");
    await page.locator('[data-action="calendar-book"][data-book="travel"]').tap();
    assert.equal(await page.locator(`.day-cell[data-date="${today}"]`).getAttribute("data-has-content"), "true");
    await page.locator('[data-action="calendar-mode"][data-mode="wall"]').tap();
    await page.waitForSelector('.calendar-books [data-book="travel"][aria-pressed="true"]');
    assert.ok(await page.locator(`.wall-day[data-date="${today}"].has-words, .wall-day[data-date="${today}"].has-photo`).count());
    await page.locator('[data-action="calendar-book"][data-book=""]').tap();
    passed.push("calendar: pick a journal to see only its days (month grid and photo wall)");

    // 4. Covers: choose Western magazine + a library photo; the cover shows it.
    await menu(page, "books");
    await page.locator('[data-action="pull-book"][data-book="food"]').tap();
    await page.locator('.pulled-book [data-action="book"]').tap();
    await page.locator('[data-action="edit-book"]').tap();
    await page.waitForSelector(".cover-photo-picks button");
    assert.deepEqual(await page.$$eval(".cover-template-grid .cover-option", (els) => els.slice(0, 2).map((el) => el.dataset.template)), ["magazine-jp", "magazine-west"]);
    await page.locator('.cover-option[data-template="magazine-west"]').tap();
    const pick = page.locator(".cover-photo-picks button").nth(2);
    const photoId = await pick.getAttribute("data-photo");
    await pick.tap();
    await page.waitForSelector(`#book-cover-preview .cover-magazine-west img[src*="LD-photo-${photoId}"]`);
    await page.locator('#dialog-form button[type="submit"]').tap();
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem("little-days.v1")).books.find((b) => b.id === "food")?.coverImage === `photo:${id}`, photoId);
    const book = (await state()).books.find((b) => b.id === "food");
    assert.equal(book.coverTemplate, "magazine-west");
    await page.waitForSelector(`.book-detail-showcase .cover-magazine-west img[src*="LD-photo-${photoId}"]`);
    passed.push("covers: Japanese / Western magazine first; pick a library photo; saved and shown");

    assert.deepEqual(errors, []);
    console.log(`V4.7 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
