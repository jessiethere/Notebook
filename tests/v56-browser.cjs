// V5.9 E2E (V10.11: in the full-screen reader): the cover, then every page
// in date order; ‹ › buttons, swipe and arrow keys turn pages; the place is remembered.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
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
    // V10.11: the book page lists its days; reading opens the full-screen reader.
    await page.locator('.home-book-cover[data-book="food"]').tap();
    await page.waitForSelector(".reader-start");
    assert.equal(await page.locator(".book-view-switch").count(), 0);
    assert.ok((await page.locator(".day-covers .day-cover:not(.cover-entry)").count()) >= 2);

    // 1. Page by page: the cover, then each page.
    await page.locator(".reader-start").tap();
    await page.waitForSelector(".flip-page.is-cover");
    assert.match(await page.locator(".reader-cover").innerText(), /好好吃饭/);
    const total = Number((await page.locator(".reader-count").innerText()).match(/共 (\d+) 页/)[1]);
    assert.ok(total >= 2, `pages (${total})`);
    assert.equal(await page.locator('[data-action="flip"][data-dir="-1"]').isDisabled(), true);
    await page.locator('[data-action="flip"][data-dir="1"]').tap();
    await page.waitForSelector(".flip-page.turn-next .flip-canvas .journal-canvas.read-only");
    assert.match(await page.locator(".reader-count").innerText(), /第 1 \//);
    const first = await page.locator(".flip-head").innerText();
    passed.push("page by page: the cover, then the first page (with a turn)");

    // 2. Swipe left turns forward; arrow keys work too; pages go by date.
    const box = await page.locator("[data-flip-stage]").boundingBox();
    await page.evaluate(([x, y]) => {
      const stage = document.querySelector("[data-flip-stage]");
      const fire = (type, cx) => stage.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: cx, clientY: y, pointerType: "touch", pointerId: 9 }));
      fire("pointerdown", x + 120);
      for (let cx = x + 100; cx >= x - 40; cx -= 20) fire("pointermove", cx);
      fire("pointerup", x - 40);
    }, [box.x + box.width / 2, box.y + box.height / 2]);
    await page.waitForFunction(() => /第 2 \//.test(document.querySelector(".reader-count").textContent));
    const second = await page.locator(".flip-head").innerText();
    const dateOf = (text) => text.match(/(\d{4})年(\d+)月(\d+)日/).slice(1).map(Number);
    const [a, b] = [dateOf(first), dateOf(second)];
    assert.ok(a[0] * 400 + a[1] * 31 + a[2] <= b[0] * 400 + b[1] * 31 + b[2], "oldest first");
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(() => /第 1 \//.test(document.querySelector(".reader-count").textContent));
    passed.push("swipe and arrow keys turn pages; pages are in date order");

    // 3. Open this day from a page (More); the place is remembered.
    await page.locator('[data-action="reader-more"]').tap();
    await page.locator('#choose-dialog [data-action="open-day"]').tap();
    await page.waitForSelector(".day-detail");
    await page.reload();
    await page.waitForSelector(".hero");
    await page.locator('.home-book-cover[data-book="food"]').tap();
    await page.waitForSelector(".reader-start");
    assert.match(await page.locator(".reader-start").innerText(), /继续翻阅 · 第 1 页/);
    passed.push("open this day from a page (More); the reading place is remembered");

    assert.deepEqual(errors, []);
    console.log(`V5.9 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
