// V7.6 E2E — the daily reminder (iPhone app bridge simulated; Web shows it's
// app-only) and book tags (book form, shelf filter, book page, search).
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
    const errors = [];
    // 1. On the Web: the reminder card says it's for the iPhone app; the switch is off.
    const web = await (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
    web.on("pageerror", (error) => errors.push(error.message));
    await web.goto(base);
    await web.waitForSelector(".hero");
    await web.locator(".settings-gear").click();
    await web.waitForSelector(".reminder-card");
    assert.match(await web.locator(".reminder-card").innerText(), /每天提醒[\s\S]*只在 iPhone App 里有效/);
    assert.equal(await web.locator('[data-action="reminder-toggle"]').isDisabled(), true);
    passed.push("Web: the reminder card explains it works in the iPhone app (switch disabled)");

    // 2. In the iPhone app (bridge simulated): on, a time, today skipped once kept, off.
    const ios = await browser.newContext({ ...devices["iPhone 13"] });
    await ios.addInitScript(() => {
      window.__reminder = [];
      window.webkit = { messageHandlers: { littleDaysReminder: { postMessage: (m) => window.__reminder.push(m) } } };
    });
    const page = await ios.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const last = () => page.evaluate(() => window.__reminder.filter((m) => m.type === "schedule").at(-1));
    assert.ok(await page.evaluate(() => window.__reminder.some((m) => m.type === "ready")), "tells the app it is ready");
    await page.locator(".settings-gear").click();
    await page.locator('[data-action="reminder-toggle"]').click();
    await page.waitForSelector('[data-action="reminder-toggle"][aria-checked="true"]');
    let m = await last();
    assert.deepEqual([m.on, m.hour, m.minute, m.body], [true, 21, 0, "今天有什么值得记的？"]);
    assert.equal(m.offTitle, "关闭每日提醒");
    await page.locator("[data-reminder-time]").fill("08:30");
    await page.locator("[data-reminder-time]").dispatchEvent("change");
    m = await last();
    assert.deepEqual([m.hour, m.minute], [8, 30]);
    if (shots) await page.screenshot({ path: `${shots}/v70-reminder.png` });
    // Keep something today → today is skipped.
    await page.locator('#navigation [data-page="home"]').click();
    await page.locator('[data-action="today-write"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("今天记过了");
    await page.locator('[data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover)");
    assert.equal((await last()).skipToday, true, "today already kept: no reminder today");
    // A tapped reminder opens the record sheet.
    await page.locator('#navigation [data-page="home"]').click();
    await page.evaluate(() => window.littleDaysFromReminder());
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    await page.locator('#choose-dialog [data-action="choose-close"]').click();
    // "Turn off" from the notification.
    await page.evaluate(() => window.littleDaysReminderTurnedOff());
    assert.equal((await last()).on, false);
    await page.locator(".settings-gear").click();
    await page.waitForSelector('[data-action="reminder-toggle"][aria-checked="false"]');
    // Notifications not allowed: an honest note.
    await page.locator('[data-action="reminder-toggle"]').click();
    await page.evaluate(() => window.littleDaysReminderResult({ ok: false, reason: "denied" }));
    await page.waitForFunction(() => /设置 → 通知/.test(document.querySelector(".reminder-warn")?.textContent || ""));
    passed.push("iPhone app: on at 21:00 → 08:30; skipped today once kept; a tap opens the record sheet; off from the notification; a note when notifications are off");

    // 3. Book tags: set in the book form; filter the shelf; shown on the book; found by search.
    await page.locator('#navigation [data-page="books"]').click();
    await page.locator('[data-action="new-book"]').first().click();
    await page.locator('#dialog-form [name="title"]').fill("感恩小书");
    await page.locator('#dialog-form [name="tags"]').fill("阅读 感恩 #self awareness");
    await page.locator('#dialog-form [type="submit"]').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.v1")).books.some((b) => b.title === "感恩小书"));
    const book = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).books.find((b) => b.title === "感恩小书"));
    assert.deepEqual(book.tags, ["阅读", "感恩", "self awareness"]);
    await page.locator('#navigation [data-page="books"]').click();
    await page.waitForSelector(".shelf-tags");
    const before = await page.locator(".bookshelf .spine[data-book]").count();
    await page.locator('.shelf-tags [data-tag="感恩"]').click();
    await page.waitForSelector('.shelf-tags [data-tag="感恩"][aria-pressed="true"]');
    assert.equal(await page.locator(".bookshelf .spine[data-book]").count(), 1, "only the tagged book");
    assert.ok(before > 1);
    if (shots) await page.screenshot({ path: `${shots}/v70-tags.png` });
    await page.locator('.shelf-tags [data-tag=""]').click();
    assert.equal(await page.locator(".bookshelf .spine[data-book]").count(), before);
    await page.locator('#navigation [data-page="home"]').click();
    await page.locator('.home-actions [data-action="open-search"]').click();
    await page.locator("[data-search-input]").fill("感恩");
    await page.waitForSelector(".search-books button");
    assert.match(await page.locator(".search-books").innerText(), /感恩小书[\s\S]*#感恩/);
    await page.locator(".search-books button").first().click();
    await page.waitForSelector(".book-tags");
    assert.match(await page.locator(".book-tags").innerText(), /#阅读[\s\S]*#感恩/);
    passed.push("book tags: typed in the book form (spaces / commas / #), shelf filter chips, tags on the book's page, found by search");

    assert.deepEqual(errors, []);
    console.log(`V7.6b E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
