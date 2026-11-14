// V5.0: a profile like a photo app (my page = what others see), photo
// avatars, other people's pages with follow / add friend / message, the UI in
// one sans typeface, and deleting a story / removing the day page in place.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
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
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const demo = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social") || "null"));

    // 1. Another person's page: banner, photo avatar, posts grid, follow / add friend / message.
    await menu(page, "community");
    await page.locator('[data-action="community-tab"][data-tab="friends"]').tap();
    await page.locator('.friend-list [data-action="community-open-user"][data-user="u-xiaoman"]').tap();
    await page.waitForSelector(".space.ig.other .ig-head .c-avatar img");
    assert.match(await page.locator(".space.ig.other").innerText(), /小满[\s\S]*@xiaoman\.demo/);
    assert.ok(await page.locator('.ig-actions [data-action="community-follow"]').count());
    assert.ok(await page.locator('.ig-actions [data-action="community-open-chat"], .ig-actions [data-action="community-friend-request"]').count());
    assert.ok((await page.locator(".space.ig.other .ig-tile").count()) >= 1);
    // Follow / unfollow from the page.
    // (Demo data is written on the first change; the button shows the state.)
    const wasFollowing = /secondary/.test(await page.locator('.ig-actions [data-action="community-follow"]').getAttribute("class"));
    await page.locator('.ig-actions [data-action="community-follow"]').tap();
    await page.waitForFunction((was) => JSON.parse(localStorage.getItem("little-days.demo-social")).following.includes("u-xiaoman") !== was, wasFollowing);
    // Message from the page (friends).
    await page.locator('.ig-actions [data-action="community-open-chat"]').tap();
    await page.waitForSelector(".chat");
    passed.push("someone's page: photo avatar, banner, posts grid; follow and message from it");

    // 2. Someone's page also opens from a post's author.
    await page.locator('[data-action="community-chat-back"]').tap().catch(() => {});
    await page.locator('[data-action="community-tab"][data-tab="discover"]').tap();
    await page.locator('[data-action="community-open-work"]').first().tap();
    const authorId = await page.locator('.work-author [data-action="community-open-user"]').getAttribute("data-user");
    if (authorId !== "me") {
      await page.locator('.work-author [data-action="community-open-user"]').tap();
      await page.waitForSelector(".space.ig.other");
      await page.locator('[data-action="community-back"]').first().tap();
    }
    passed.push("tap a post's author to open their page");

    // 3. My page is the visitor view first; management sits below it.
    await menu(page, "books");
    await page.locator('[data-action="books-view"][data-view="profile"]').tap();
    await page.waitForSelector(".space.ig .ig-head");
    const order = await page.evaluate(() => {
      const ig = document.querySelector(".space.ig").getBoundingClientRect().top;
      const manage = document.querySelector(".ig-manage-title").getBoundingClientRect().top;
      return ig < manage;
    });
    assert.ok(order);
    assert.match(await page.locator(".ig-level").innerText(), /^Lv\.\d · /);
    assert.doesNotMatch(await page.locator(".level-card").innerText(), /\p{Extended_Pictographic}/u, "level card without emoji");
    passed.push("my page: the visitor view first, a small level tag, management below (no emoji)");

    // 4. One sans typeface for the interface.
    const fonts = await page.$$eval(".page-title, .ig-counts b, dialog h2, .p-stat b", (els) => els.map((el) => getComputedStyle(el).fontFamily));
    assert.ok(fonts.length && fonts.every((f) => /PingFang SC/.test(f) && !/Georgia|xiaowei|LD-/.test(f)), fonts.join(" / "));
    passed.push("interface type: one sans (PingFang on iPhone)");

    // 5. Delete a story right from its card; clear the day page ("no day page").
    await menu(page, "home");
    // Today's sample is only an example (writing starts a fresh page), so
    // this test makes today's page my own first: a cover with the photo.
    await require("./signed-in.cjs").touchStore(page);
    await page.waitForFunction(() => localStorage.getItem("little-days.v1"));
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const e = s.entries.find((x) => x.id === "sample-today");
      if (e) Object.assign(e, { isDemo: false, title: "我的今天" });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    });
    await page.reload();
    await page.waitForSelector(".hero");

    await page.locator('.home-mag .moment-cta').tap();
    await page.locator('#choose-dialog [data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("不想要的这页");
    await page.evaluate(() => document.activeElement.blur());
    // (The paper is pinned at the top and the tools at the bottom; the card's
    // buttons sit between them on screen, so the click is sent directly.)
    await studioDetails(page);
    await page.locator('.page-bar [data-action="moment-delete"]').dispatchEvent("click");
    await page.locator("#confirm-ok").tap();
    await page.waitForFunction(() => !document.querySelector(".chapter-chips")?.innerText.includes("不想要的这页"));
    await studioDetails(page);
    await page.locator('.page-bar [data-action="day-page-clear"]').dispatchEvent("click");
    // V10.47: no page is left, so clearing the cover clears the day (asked first).
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /清空封面后，这一天将没有记录/);
    await page.locator("#confirm-ok").tap();
    await page.waitForSelector(".calendar-grid");
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    assert.ok(!after.drafts[today] && !after.entries.some((e) => e.date === today && !e.isDemo), "story deleted, day page cleared — the day is empty");
    passed.push("delete this page (story) and remove the day page, right on the writing card");

    assert.deepEqual(errors, []);
    console.log(`V5.0 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
