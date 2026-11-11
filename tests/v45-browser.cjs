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

    // 1. Today's page as a large photo with the words on it; no emoji on Home.
    const hero = page.locator(".home-mag .hero-photo.today-preview");
    await page.waitForFunction(() => { const img = document.querySelector(".hero-photo img"); return img && img.complete && img.naturalWidth > 0; });
    const box = await hero.boundingBox();
    assert.ok(box.width > 330 && box.height > 330, `large hero ${box.width}×${box.height}`);
    assert.match(await hero.innerText(), /把日子过成喜欢的样子/);
    const homeText = await page.locator(".home-mag").innerText();
    assert.doesNotMatch(homeText, /[✿📖🌿☁️🎨🌱✎🖼]/u, "no emoji in Home's text");
    assert.equal(await page.locator(".home-mag .habit-symbol svg").count(), await page.locator(".home-mag .habit-row").count(), "habits use line icons");
    assert.equal(await page.locator(".home-mag .note-button svg").count(), await page.locator(".home-mag .habit-row").count());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector(".app-scroll").scrollWidth <= document.querySelector(".app-scroll").clientWidth), true, "no sideways scroll");
    if (shots) await page.screenshot({ path: `${shots}/v45-home.png` });
    passed.push("Home: today's page as a large photo; line icons, no emoji; nothing wider than the screen");

    // 2. Below writing: the journals (the photo row is gone).
    assert.equal(await page.locator(".home-mag .inspire-card, .home-mag .home-inspire").count(), 0);
    assert.ok((await page.locator(".home-mag .home-book").count()) >= 3);
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
    await page.waitForSelector(".home-mag .hero-photo.today-scene img");
    assert.match(await page.locator(".home-mag .today-scene").innerText(), /今日照片[\s\S]*今天想记下什么[\s\S]*用它写一页/);
    passed.push("fresh day: photo of the day as the hero");

    assert.deepEqual(errors, []);
    console.log(`V4.5 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
