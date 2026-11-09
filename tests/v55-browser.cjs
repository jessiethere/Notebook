// V5.7 E2E: reading a day — double-click (or tap, when untitled) a title to
// write it; ⋯ → edit / delete the page. A gentle streak: a chip on Home and
// a "Day N" stamp moment after today's first page (once a day).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu } = require("./signed-in.cjs");
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
    const key = (n) => page.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }, n);
    const today = await key(0);
    // My own pages on the two days before today; nothing yet today; the
    // stamp moment not yet shown today.
    await page.locator('.habit-row [data-action="check"][data-habit="move"]').first().tap();
    await page.locator('.habit-row [data-action="check"][data-habit="move"]').first().tap();
    const [d1, d2] = [await key(1), await key(2)];
    await page.evaluate(([today, d1, d2]) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.entries = s.entries.filter((e) => ![today, d1, d2].includes(e.date));
      delete s.drafts[today];
      for (const date of [d1, d2]) s.entries.push({ id: "own-" + date, date, title: "", body: "", photo: "", bookId: "daily", layers: [], media: [], moments: [{ id: "page-" + date, title: "", body: "散步", time: "", tags: [], bookId: "daily", layers: [], media: [], layoutTemplate: "text" }] });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
      localStorage.setItem("little-days.celebrated", "2000-01-01");
    }, [today, d1, d2]);
    await page.reload();
    await page.waitForSelector(".hero");

    // 1. Home: the streak chip (2 days so far, today not yet).
    assert.match(await page.locator(".streak-chip").innerText(), /连续 2 天/);
    await page.locator(".streak-chip").tap();
    await page.waitForSelector("#streak-dialog[open]");
    assert.match(await page.locator(".streak-message").innerText(), /第 3 天/);
    assert.equal(await page.locator(".streak-confetti").count(), 0, "just looking: no celebration");
    await page.locator('#streak-dialog [data-action="streak-write"]').tap();
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    passed.push("Home streak chip; looking at it shows the week and how to keep it going");

    // 2. Today's first page → back on Home → the stamp moment, once.
    await page.locator('[data-action="quick-way"][data-way="write"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("第三天");
    await page.evaluate(() => document.activeElement.blur());
    await page.locator('[data-action="save-entry"]').tap();
    await page.waitForSelector("#streak-dialog[open] .streak-card.celebrate");
    assert.match(await page.locator(".streak-card h2").innerText(), /连续记录 3 天/);
    assert.match(await page.locator(".streak-message").innerText(), /三天/, "the 3-day milestone message");
    assert.equal(await page.locator(".streak-confetti i").count(), 16);
    assert.equal(await page.locator(".streak-week span.on").count() >= 1, true);
    if (shots) await page.screenshot({ path: `${shots}/v55-stamp.png` });
    await page.locator('#streak-dialog [data-action="streak-close"]').tap();
    await menu(page, "calendar");
    await menu(page, "home");
    await page.waitForTimeout(500);
    assert.equal(await page.locator("#streak-dialog[open]").count(), 0, "only once a day");
    assert.match(await page.locator(".streak-chip").innerText(), /连续 3 天/);
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.events")).filter((e) => e.e === "celebrate"));
    assert.equal(events.length, 1);
    passed.push("today's first page → a 'Day 3' stamp moment with the milestone line, once a day");

    // 3. Reading a day: tap an untitled title to write it; double-click to change it.
    await menu(page, "calendar");
    await page.locator(`[data-action="select-date"][data-date="${d1}"]`).first().tap();
    await page.waitForSelector(".day-detail");
    const title = page.locator(`.day-detail [data-title-edit][data-moment="page-${d1}"]`);
    assert.match(await title.innerText(), /加标题/);
    await title.tap();
    await page.keyboard.type("傍晚散步");
    await page.keyboard.press("Enter");
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d).moments[0].title === "傍晚散步", d1);
    await title.dblclick();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("傍晚和猫一起散步");
    await page.locator(".day-masthead").click();
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d).moments[0].title === "傍晚和猫一起散步", d1);
    passed.push("reading a day: tap 加标题 / double-click the title to write it");

    // 4. ⋯ on a page: edit (opens that page) or delete.
    await page.locator(`.day-detail .chapter-more[data-moment="page-${d1}"]`).tap();
    await page.waitForSelector("#choose-dialog[open] .page-menu-sheet");
    await page.locator('#choose-dialog [data-action="read-edit"]').tap();
    await page.waitForSelector("#journal-canvas");
    assert.equal(await page.locator(`.chapter-chip.active[data-moment="page-${d1}"]`).count(), 1, "opens that page");
    await page.locator('[data-action="studio-back"]').tap();
    await page.waitForSelector(".day-detail");
    await page.locator(`.day-detail .chapter-more[data-moment="page-${d1}"]`).tap();
    await page.locator('#choose-dialog [data-action="read-delete"]').tap();
    await page.locator("#confirm-ok").tap();
    await page.waitForFunction((d) => !JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d).moments.length, d1);
    assert.equal(await page.locator(`[data-moment-view="page-${d1}"]`).count(), 0);
    passed.push("⋯ on a page: edit opens it in the studio; delete (confirmed) removes it");

    // 5. Writing on a day that only has a sample starts my own page; my own
    //    photo as a whole page is shown whole; Save floats when scrolled away.
    const fresh = await (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
    fresh.on("pageerror", (error) => errors.push(error.message));
    await fresh.goto(base);
    await fresh.waitForSelector(".hero");
    await fresh.locator('#navigation [data-page="studio"]').tap();
    await fresh.locator('[data-action="quick-continue"]').tap().catch(() => {});
    if (!(await fresh.locator("#journal-canvas").count())) {
      await fresh.locator('[data-action="quick-way"][data-way="write"]').tap();
      await fresh.locator('[data-action="quick-start"]').tap();
    }
    await fresh.waitForSelector("#journal-canvas");
    assert.equal(await fresh.locator('.chapter-chips .cover-chip').innerText().then((t) => /把日子过成喜欢的样子/.test(t)), false, "the sample cover is not my page");
    // Photo + a line with my own (portrait) photo, from the page modes.
    const fs = require("node:fs");
    const path = require("node:path");
    const portrait = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos/LD-photo-latte-art.jpg");
    await fresh.locator('[data-action="add-moment"]').first().tap();
    await fresh.locator('[data-action="page-mode"][data-mode="line"]').tap();
    const chooser = fresh.waitForEvent("filechooser");
    await fresh.locator('#choose-dialog [data-action="choose-album"]').tap();
    await (await chooser).setFiles(portrait);
    await fresh.waitForSelector("#journal-canvas.own-backdrop .backdrop-whole");
    assert.equal(await fresh.locator("#journal-canvas .backdrop-whole").evaluate((img) => getComputedStyle(img).objectFit), "contain", "shown whole, not cropped");
    await fresh.keyboard.type("整张照片都在");
    await fresh.evaluate(() => document.activeElement.blur());
    // Scroll the top bar away: the floating Save appears and saves the day.
    await fresh.evaluate(() => (document.querySelector("#app-scroll").scrollTop = 600));
    await fresh.waitForSelector(".float-save:not([hidden])");
    await fresh.locator(".float-save").tap();
    await fresh.waitForSelector(".hero");
    const saved = await fresh.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d), today);
    assert.equal(saved.isDemo, false);
    assert.notEqual(saved.title, "把日子过成喜欢的样子", "no sample words on my day");
    assert.notEqual(saved.photo, "/assets/coffee.jpg", "no sample photo on my day");
    assert.ok(saved.moments.some((m) => /^media:/.test(m.backdrop || "")));
    passed.push("writing on the sample day starts my own page; my own photo is shown whole; floating Save when the top bar is away");

    assert.deepEqual(errors, []);
    console.log(`V5.7 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
