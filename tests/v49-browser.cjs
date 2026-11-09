// V4.9: my space (a personal zone page: banner, accent, motto, books put out
// from the shelf, posts), magazine spines on the shelf, six magazine covers.
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
    await page.waitForSelector(".hero");
    const demo = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social") || "null"));

    // 1. The shelf: magazine covers stand as magazine spines (photo, title, issue).
    await menu(page, "books");
    await page.waitForSelector(".bookshelf .spine.mag-spine");
    assert.equal(await page.locator(".bookshelf .spine.mag-spine").count(), 3);
    await page.waitForFunction(() => [...document.querySelectorAll(".mag-spine .spine-photo")].every((img) => img.complete && img.naturalWidth > 0));
    assert.match(await page.locator('.mag-spine[data-book="travel"]').innerText(), /去[\s\S]*看[\s\S]*界[\s\S]*NO\.\d\d/);
    passed.push("shelf: magazine spines with the cover photo, the title and an issue number");

    // 2. My space: banner, avatar, level, stats, my books, my posts.
    await page.locator('[data-action="books-view"][data-view="profile"]').tap();
    await page.waitForSelector(".space .space-banner img");
    assert.match(await page.locator(".space-who small").innerText(), /Lv\.\d/);
    assert.equal(await page.locator(".ig-counts span").count(), 4);
    assert.equal(await page.locator(".ig-head .c-avatar").count(), 1);
    assert.doesNotMatch(await page.locator(".ig-head").innerText(), /\p{Extended_Pictographic}/u, "no emoji avatar");
    assert.equal(await page.locator(".ig-grid, .ig-empty").count(), 1, "posts as a grid");
    assert.match(await page.locator(".space").innerText(), /我出的书[\s\S]*我的动态/);
    passed.push("my space: banner, avatar, level, stats, my books and my posts");

    // 3. Decorate: banner photo, accent colour and motto are saved.
    await page.locator('.space [data-action="space-dress"]').first().tap();
    await page.waitForSelector(".space-dress-panel");
    const banner = await page.locator('.space-banners [data-action="space-banner"]').nth(3).getAttribute("data-photo");
    await page.locator('.space-banners [data-action="space-banner"]').nth(3).tap();
    await page.waitForSelector(`.space-banner img[src*="LD-photo-${banner}"]`);
    await page.locator('.space-accents [data-accent="#6d8299"]').tap();
    await page.locator("#space-motto").fill("跑步、植物和慢慢变好的我");
    await page.locator('[data-action="space-save"]').tap();
    await page.waitForSelector(".space-dress-panel", { state: "detached" });
    const space = (await demo()).profile.space;
    assert.deepEqual(space, { banner: `photo:${banner}`, accent: "#6d8299", motto: "跑步、植物和慢慢变好的我" });
    assert.match(await page.locator(".space-motto").innerText(), /慢慢变好/);
    assert.match(await page.locator(".space").getAttribute("style"), /#6d8299/);
    passed.push("decorate: banner photo, accent colour and motto saved (this device only)");

    // 4. Put a book out from the shelf (cover only, after confirming); take it back.
    await page.locator('[data-action="space-shelf"]').first().tap();
    await page.locator('.space-shelf [data-action="showcase"][data-book="food"]').tap();
    await page.locator('#confirm-dialog [data-confirm="ok"], .confirm-dialog [data-confirm="ok"], dialog[open] [value="ok"], dialog[open] .primary').first().tap();
    await page.waitForSelector('.space-book-row [data-book="food"] .book-cover');
    assert.deepEqual((await demo()).profile.showcase, ["food"]);
    await page.locator('.space-shelf [data-action="showcase"][data-book="food"][data-on="0"]').tap();
    await page.waitForFunction(() => !document.querySelector('.space-book-row [data-book="food"]'));
    passed.push("从书架出书: a cover goes out after confirming and can be taken back");

    // 5. 发一条 opens the publish sheet (demo).
    await page.locator('.space [data-action="community-publish-start"]').tap();
    await page.waitForSelector(".publish-sheet, [data-action='community-publish-cancel']");
    passed.push("发一条 opens the publish flow");

    // 6. Six magazine covers in the cover picker, each drawn.
    await menu(page, "books");
    await page.locator('[data-action="books-view"][data-view="shelf"]').tap().catch(() => {});
    await page.locator('[data-action="pull-book"][data-book="daily"]').tap();
    await page.locator('.pulled-book [data-action="book"]').tap();
    await page.locator('[data-action="edit-book"]').tap();
    const mags = await page.$$eval(".cover-template-grid .cover-option", (els) => els.map((el) => el.dataset.template).filter((id) => id.startsWith("magazine")));
    assert.deepEqual(mags, ["magazine-jp", "magazine-west", "magazine-mono", "magazine-film", "magazine-minimal", "magazine-collage"]);
    for (const id of mags) assert.equal(await page.locator(`.cover-option[data-template="${id}"] .cover-${id}`).count(), 1, id);
    assert.equal(await page.locator('.cover-option[data-template="magazine-collage"] .mag-photo').count(), 3);
    passed.push("six magazine covers: Japanese, Western, mono, film, minimal, collage");

    assert.deepEqual(errors, []);
    console.log(`V4.9 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
