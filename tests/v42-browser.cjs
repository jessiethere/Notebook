// Notification center (bell), levels on My profile, visibility chips and the
// full-height chat. iPhone 13 emulation; demo data only.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu, openToday } = require("./signed-in.cjs");
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

    // 1. Bell on Home with an unread count; opens the notification center.
    const badge = page.locator(".home-top .bell-badge");
    const first = Number(await badge.innerText());
    assert.ok(first >= 3, `welcome + backup tip + friend request + message (${first})`);
    await page.locator(".home-top .bell").tap();
    await page.waitForSelector(".inbox-list");
    assert.equal(await page.locator("#navigation [data-page='home'].active").count(), 1);
    const filters = await page.$$eval("[data-action='inbox-filter']", (els) => els.map((el) => el.dataset.filter));
    assert.deepEqual(filters, ["all", "system", "friends", "interaction", "messages"]);
    await page.locator('[data-action="inbox-filter"][data-filter="system"]').tap();
    assert.ok(await page.locator('.inbox-item[data-type="system"]').count() >= 2);
    assert.equal(await page.locator('.inbox-item[data-type="friend"]').count(), 0);
    // Accept a friend request right here.
    await page.locator('[data-action="inbox-filter"][data-filter="friends"]').tap();
    await page.locator('[data-action="inbox-accept"]').first().tap();
    assert.ok((await demo()).friends.includes("u-mumu"));
    await page.locator('[data-action="inbox-filter"][data-filter="all"]').tap();
    await page.locator('[data-action="inbox-read-all"]').tap();
    await page.locator('[data-action="inbox-back"]').tap();
    await page.waitForSelector(".hero");
    assert.equal(await badge.count(), 0, "all read");
    passed.push(`bell with ${first} unread → center with filters; accept friend; mark all read`);

    // 2. Level card on My profile; a level-up becomes a notification.
    await menu(page, "books");
    await page.locator('[data-action="books-view"][data-view="profile"]').tap();
    await page.waitForSelector(".level-card");
    assert.match(await page.locator(".level-card").innerText(), /Lv\.1[\s\S]*第一页[\s\S]*0[\s\S]*经验/);
    // Earn XP: three check-ins with notes and a written page → over 30 XP.
    await menu(page, "growth");
    for (const habit of ["move", "reading", "pause"]) {
      await page.locator(`[data-action="check"][data-habit="${habit}"]`).first().tap();
      await page.locator(`[data-action="check-note"][data-habit="${habit}"]`).first().tap();
      await page.locator('#dialog-form [name="note"]').fill("今天也做到了");
      await page.locator('#dialog-form [type="submit"]').tap();
    }
    await menu(page, "studio");
    await openToday(page);
    await page.locator('#journal-canvas [data-inline="title"]').fill("我的第一页");
    await page.locator('[data-action="save-entry"]').tap();
    await require("./signed-in.cjs").homeAfterSave(page);
    await page.locator(".home-top .bell").tap();
    await page.waitForSelector('.inbox-item[data-type="level"]');
    assert.match(await page.locator('.inbox-item[data-type="level"]').innerText(), /升级啦/);
    await page.locator('.inbox-item[data-type="level"] [data-action="open-profile"]').tap();
    await page.waitForSelector(".level-card");
    assert.match(await page.locator(".level-card").innerText(), /Lv\.2[\s\S]*随手记/);
    passed.push("level card (Lv.1 → Lv.2 after real writing/check-ins); level-up notification links to it");

    // 3. "谁能看到": compact chips at a normal size (no giant selects).
    const chip = page.locator('.who-row [data-action="showcase"]').first();
    assert.equal(await page.locator(".who-row select").count(), 0);
    assert.ok(parseFloat(await chip.evaluate((el) => getComputedStyle(el).fontSize)) <= 13);
    passed.push("visibility chips instead of oversized pickers");

    // 4. Chat: messages fill the screen; composer at the bottom; ⋯ menu.
    await menu(page, "community");
    await page.locator('[data-action="community-tab"][data-tab="messages"]').tap();
    await page.locator('[data-action="community-open-chat"]').first().tap();
    await page.waitForSelector(".chat-compose");
    const compose = await page.locator(".chat-compose").boundingBox();
    const view = page.viewportSize();
    assert.ok(compose.y > view.height * 0.5, `composer sits low (${Math.round(compose.y)}/${view.height})`);
    assert.equal(await page.locator(".chat-top [data-action='community-block']").count(), 0, "block/report tucked away");
    await page.locator('[data-action="community-chat-menu"]').tap();
    assert.deepEqual(await page.$$eval(".chat-menu button", (els) => els.map((el) => el.dataset.action)), ["community-delete-chat", "community-block", "community-report-user"]);
    await page.locator('[data-action="community-chat-menu"]').tap();
    await page.locator('[data-action="community-share-toggle"]').tap();
    await page.waitForSelector("#chat-share-work");
    const share = await page.locator("#chat-share-work").boundingBox();
    assert.ok(share.x + share.width <= view.width, "share picker fits");
    await page.locator("#chat-text").fill("你好呀");
    await page.locator('[data-action="community-send"]').tap();
    await page.waitForFunction(() => [...document.querySelectorAll(".bubble.mine p")].some((p) => p.textContent === "你好呀"));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    passed.push("chat: full height, composer at the bottom, ⋯ menu, share fits, send works");

    assert.deepEqual(errors, []);
    console.log(`V3.12 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
