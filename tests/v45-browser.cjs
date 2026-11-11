// V4.5: a photo-led home (magazine-like, line icons instead of emoji) that
// opens onto the photo library.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
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
    await page.waitForSelector(".home-mag .hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });

    // 1. Today's page as a large story card (V10.2: photos arranged on paper, the words under them); no emoji on Home.
    const hero = page.locator(".home-mag .ts-card .today-preview");
    await page.waitForFunction(() => { const img = document.querySelector(".ts-card .ts-pol.main img"); return img && img.complete && img.naturalWidth > 0; });
    const box = await hero.boundingBox();
    assert.ok(box.width > 330 && box.height > 330, `large story ${box.width}×${box.height}`);
    assert.match(await hero.innerText(), /把日子过成喜欢的样子/);
    assert.match(await hero.innerText(), /示例/, "a sample day says so");
    const homeText = await page.locator(".home-mag").innerText();
    assert.doesNotMatch(homeText, /[✿📖🌿☁️🎨🌱✎🖼]/u, "no emoji in Home's text");
    assert.equal(await page.locator(".home-mag .habit-symbol svg").count(), await page.locator(".home-mag .habit-row").count(), "habits use line icons");
    assert.equal(await page.locator(".home-mag .note-button svg").count(), await page.locator(".home-mag .habit-row").count());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector(".app-scroll").scrollWidth <= document.querySelector(".app-scroll").clientWidth), true, "no sideways scroll");
    if (shots) await page.screenshot({ path: `${shots}/v45-home.png` });
    passed.push("Home: today's page as a large photo; line icons, no emoji; nothing wider than the screen");

    // 2. Below writing: the journals (the photo row is gone).
    assert.equal(await page.locator(".home-mag .inspire-card, .home-mag .home-inspire").count(), 0);
    assert.ok((await page.locator(".home-mag .home-book .home-book-cover").count()) >= 3);
    passed.push("journals row replaces the photo row");

    // 4. A fresh day: the photo of the day fills the hero and invites writing.
    // (Storage is written on the first change: tick and untick a habit.)
    await require("./signed-in.cjs").touchStore(page);
    await page.waitForFunction(() => localStorage.getItem("little-days.v1"));
    await page.evaluate((d) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.entries = s.entries.filter((e) => e.date !== d);
      delete s.drafts[d];
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, today);
    await page.reload();
    // V10.2: a quiet invitation (no sample photo posing as a memory); the photo of the day is one tap away.
    await page.waitForSelector(".home-mag .ts-empty");
    assert.match(await page.locator(".home-mag .ts-empty").innerText(), /今天还没有写下故事[\s\S]*从一张照片、一句话开始[\s\S]*选一张照片开始[\s\S]*今日推荐的照片/);
    assert.equal(await page.locator(".home-mag .ts-empty img").count(), 0);
    assert.equal(await page.locator(".home-mag .ts-empty .today-scene").count(), 1);
    passed.push("fresh day: an invitation to start; the photo of the day is a link");

    assert.deepEqual(errors, []);
    console.log(`V4.5 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
