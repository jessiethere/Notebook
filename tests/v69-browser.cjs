// V7.6 E2E — search my journal (Home and Calendar), and "On this day" on Home.
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
    await page.waitForSelector(".hero");
    await require("./signed-in.cjs").touchStore(page);
    const dates = await page.evaluate(() => {
      const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const now = new Date();
      const yearAgo = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);
      const twoAgo = new Date(now); twoAgo.setFullYear(now.getFullYear() - 2);
      const recent = new Date(now); recent.setDate(now.getDate() - 20);
      return { yearAgo: f(yearAgo), twoAgo: f(twoAgo), recent: f(recent) };
    });
    await page.evaluate((d) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const day = (date, extra) => ({ id: "own-" + date, date, title: "", body: "", photo: "", bookId: "daily", isDemo: false, layers: [], media: [], moments: [], ...extra });
      s.entries = s.entries.filter((e) => ![d.yearAgo, d.twoAgo, d.recent].includes(e.date));
      s.entries.push(day(d.yearAgo, { moments: [{ id: "sea", title: "去年的海边", time: "18:20", body: "风很大，浪很温柔", tags: ["旅行"], layers: [{ id: "p1", kind: "photo", text: "", mediaRef: "photo:latte-art", x: 50, y: 50, w: 60, h: 40, scale: 1, rotation: 0 }], media: [] }] }));
      s.entries.push(day(d.twoAgo, { title: "两年前的生日" }));
      s.entries.push(day(d.recent, { title: "和朋友吃火锅", body: "辣得流眼泪，笑得很开心。" }));
      s.checks.push({ habitId: "move", date: d.recent, minutes: 0, note: "深蹲越来越稳" });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, dates);
    await page.reload();
    await page.waitForSelector(".hero");

    // 1. On this day: the closest earlier year, with its photo; other years as chips.
    await page.waitForSelector(".memory-card");
    const card = await page.locator(".memory-card").innerText();
    assert.match(card, /1 年前的今天[\s\S]*去年的海边/);
    assert.equal(await page.locator(".memory-card .memory-open img").count(), 1);
    assert.match(await page.locator(".memory-more").innerText(), /2 年前的今天/);
    await page.locator(".memory-card").scrollIntoViewIfNeeded();
    if (shots) await page.screenshot({ path: `${shots}/v69-memory.png` });
    await page.locator(".memory-open").click();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /去年的海边/);
    await page.locator('#navigation [data-page="home"]').click();
    await page.locator('[data-action="memory-dismiss"]').click();
    await page.waitForSelector(".memory-card", { state: "detached" });
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await page.locator(".memory-card").count(), 0, "hidden for the rest of today");
    passed.push("On this day: a year ago (with its photo, other years as chips), opens that day; × hides it for today");

    // 2. Search from Home: words, all words, tags, a habit note; tap opens the page.
    await page.locator('.home-actions [data-action="open-search"]').click();
    await page.waitForSelector(".search-page");
    assert.equal(await page.evaluate(() => document.activeElement?.matches("[data-search-input]")), true, "ready to type");
    const input = page.locator("[data-search-input]");
    await input.fill("火锅");
    await page.waitForSelector(".search-hit");
    assert.match(await page.locator(".search-hit").first().innerText(), /和朋友吃火锅/);
    assert.equal(await page.locator(".search-hit mark").first().innerText(), "火锅");
    await input.fill("火锅 海边");
    await page.waitForSelector(".search-empty");
    await input.fill("#旅行");
    await page.waitForFunction(() => /去年的海边/.test(document.querySelector("#search-results").textContent));
    await input.fill("深蹲");
    await page.waitForFunction(() => /今日清单/.test(document.querySelector("#search-results").textContent));
    if (shots) await page.screenshot({ path: `${shots}/v69-search.png` });
    await input.fill("流眼泪");
    await page.locator(".search-hit").first().click();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /和朋友吃火锅/);
    passed.push("search from Home: words (marked), all words must match, #tags, habit notes; a result opens its day");

    // 3. Search from Calendar too; back returns there; sample days are not searched.
    await page.locator('#navigation [data-page="calendar"]').click();
    await page.locator('.page-top [data-action="open-search"]').click();
    await page.locator("[data-search-input]").fill("示例");
    await page.waitForFunction(() => document.querySelector("#search-results").textContent.trim().length > 0);
    assert.equal(await page.locator(".search-hit").count(), 0, "sample days are left out");
    await page.locator('[data-action="search-back"]').click();
    await page.waitForSelector('.page-top [data-action="calendar-today"]');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    passed.push("search from Calendar; ‹ goes back there; sample days are not searched");

    assert.deepEqual(errors, []);
    console.log(`V7.6 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
