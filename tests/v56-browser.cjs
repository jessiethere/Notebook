// V5.9 E2E: read a book as a list or page by page (remembered): the cover,
// then every page in date order; ‹ › buttons, swipe and arrow keys turn pages.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
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
    await page.locator('.home-book-cover[data-book="food"]').tap();
    await page.waitForSelector(".book-view-switch");
    assert.equal(await page.locator('[data-action="book-view"][data-view="list"]').getAttribute("aria-selected"), "true", "the list first");
    assert.ok((await page.locator(".day-covers .day-cover").count()) >= 2);

    // 1. Page by page: the cover, then each page.
    await page.locator('[data-action="book-view"][data-view="flip"]').tap();
    await page.waitForSelector(".flip-page.is-cover");
    assert.equal(await page.locator(".day-covers, .book-filter").count(), 0, "the reader replaces the list");
    assert.match(await page.locator(".flip-cover").innerText(), /好好吃饭/);
    const total = Number((await page.locator(".flip-nav span").innerText()).match(/\/ (\d+)/)[1]);
    assert.ok(total >= 3, `cover + pages (${total})`);
    assert.equal(await page.locator('[data-action="flip"][data-dir="-1"]').isDisabled(), true);
    await page.locator('[data-action="flip"][data-dir="1"]').tap();
    await page.waitForSelector(".flip-page.turn-next .flip-canvas .journal-canvas.read-only");
    assert.match(await page.locator(".flip-nav span").innerText(), /第 2 \//);
    const first = await page.locator(".flip-head").innerText();
    passed.push("page by page: the cover, then the first page (with a turn)");

    // 2. Swipe left turns forward; arrow keys work too; pages go by date.
    const box = await page.locator("[data-flip-stage]").boundingBox();
    await page.evaluate(([x, y]) => {
      const stage = document.querySelector("[data-flip-stage]");
      const fire = (type, cx) => stage.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: cx, clientY: y, pointerType: "touch", pointerId: 9 }));
      fire("pointerdown", x + 120);
      fire("pointerup", x - 40);
    }, [box.x + box.width / 2, box.y + box.height / 2]);
    await page.waitForFunction(() => /第 3 \//.test(document.querySelector(".flip-nav span").textContent));
    const second = await page.locator(".flip-head").innerText();
    const dateOf = (text) => text.match(/(\d{4})年(\d+)月(\d+)日/).slice(1).map(Number);
    const [a, b] = [dateOf(first), dateOf(second)];
    assert.ok(a[0] * 400 + a[1] * 31 + a[2] <= b[0] * 400 + b[1] * 31 + b[2], "oldest first");
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(() => /第 2 \//.test(document.querySelector(".flip-nav span").textContent));
    passed.push("swipe and arrow keys turn pages; pages are in date order");

    // 3. Open this day from a page; the choice is remembered.
    await page.locator(".flip-open").tap();
    await page.waitForSelector(".day-detail");
    await page.reload();
    await page.waitForSelector(".hero");
    await page.locator('.home-book-cover[data-book="food"]').tap();
    await page.waitForSelector(".flip-page.is-cover");
    passed.push("open this day from a page; page-by-page is remembered");

    assert.deepEqual(errors, []);
    console.log(`V5.9 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
