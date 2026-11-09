// V4.5: a photo-led home (magazine-like, line icons instead of emoji) that
// opens onto the photo library.
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

    // 2. "Start from a photo": real library photos; one tap writes with it.
    const cards = page.locator(".home-mag .inspire-card");
    assert.equal(await cards.count(), 6);
    const srcs = await cards.locator("img").evaluateAll((els) => els.map((el) => el.getAttribute("src")));
    assert.ok(srcs.every((src) => /library\/photos\/LD-photo-/.test(src)));
    const pick = await cards.nth(2).getAttribute("data-scene");
    await cards.nth(2).tap();
    await page.waitForSelector(`#journal-canvas img[src*="LD-photo-${pick}"]`);
    passed.push("「从一张照片开始」: six library photos; tap one to write with it");

    // 3. "照片素材 ›" opens the whole library chooser.
    await page.locator('[data-action="studio-back"]').tap().catch(() => {});
    await page.waitForSelector(".home-mag, .studio-start", { timeout: 10000 });
    if (!(await page.locator(".home-mag").count())) await page.locator('.bottom-nav [data-page="home"], [data-action="nav"][data-page="home"]').first().tap();
    await page.waitForSelector(".home-mag");
    await page.locator('.home-mag [data-action="home-library"]').tap();
    await page.waitForSelector("#choose-dialog[open] .choose-collections button");
    assert.equal(await page.locator("#choose-dialog .choose-collections button").count(), 13);
    passed.push("「照片素材 ›」 opens the album / picks / 13 collections chooser");

    // 4. A fresh day: the photo of the day fills the hero and invites writing.
    await page.evaluate((d) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.entries = s.entries.filter((e) => e.date !== d);
      delete s.drafts[d];
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, today);
    await page.reload();
    await page.waitForSelector(".home-mag .hero-photo.today-scene img");
    assert.match(await page.locator(".home-mag .today-scene").innerText(), /今日照片[\s\S]*今天想记下什么[\s\S]*用它写一页/);
    const heroId = await page.locator(".home-mag .today-scene").getAttribute("data-scene");
    assert.ok(!(await page.locator(`.home-mag .inspire-card[data-scene="${heroId}"]`).count()), "the hero photo is not repeated below");
    passed.push("fresh day: photo of the day as the hero (not repeated in the row)");

    assert.deepEqual(errors, []);
    console.log(`V4.5 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
