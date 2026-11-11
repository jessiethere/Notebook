// V5.5 E2E: drag a spine to reorder the shelf; Home shows the same order; a
// tap still pulls a book out; move earlier / later from the pulled-out book;
// Latin titles lie sideways along the spine.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { menu } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 430, height: 900 } })).newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const order = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).books.map((b) => b.id));
    // A fourth book with an English title.
    await menu(page, "books");
    await page.locator('[data-action="book-suggest"][data-preset="relationship"]').click();
    await page.locator('#dialog-form [name="title"]').fill("The two of us");
    await page.locator('#dialog-form [type="submit"]').click();
    await menu(page, "books");
    await page.waitForSelector(".bookshelf");
    const spines = page.locator(".bookshelf .spine[data-book]");
    assert.equal(await spines.count(), 4);
    assert.equal(await page.locator(".bookshelf .spine-title.latin").count(), 1, "the English title lies sideways");
    assert.equal(await page.locator(".bookshelf .spine-title.latin").evaluate((el) => getComputedStyle(el).writingMode), "vertical-rl");
    passed.push("Latin titles lie sideways along the spine; Chinese stays stacked");

    // 1. Drag the last spine before the first.
    const before = await order();
    const last = await spines.nth(3).boundingBox(),
      first = await spines.nth(0).boundingBox();
    await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(last.x + last.width / 2 + (first.x + 4 - last.x - last.width / 2) * (i / 12), last.y + last.height / 2);
    assert.equal(await page.locator(".bookshelf .spine.dragging").count(), 1, "the spine is lifted while dragging");
    assert.equal(await page.locator(".bookshelf .drop-before").count(), 1, "a marker shows where it goes");
    await page.mouse.up();
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem("little-days.v1")).books[0].id === id, before[3]);
    assert.deepEqual(await order(), [before[3], ...before.slice(0, 3)]);
    assert.equal(await page.locator(".pulled-book").count(), 0, "dropping does not pull the book out");
    // Home lists the books in the same order.
    await menu(page, "home");
    // V10.2: Home shows the first few journals of the shelf (nothing written yet, so the first leads).
    assert.deepEqual(await page.$$eval(".home-book-cover", (els) => els.map((el) => el.dataset.book)), (await order()).slice(0, 3));
    passed.push("drag a spine to a new place; Home follows the shelf order");

    // 2. A plain tap still pulls a book out; move it one step later.
    await menu(page, "books");
    await page.locator(".bookshelf .spine[data-book]").nth(0).click();
    await page.waitForSelector(".pulled-book");
    assert.equal(await page.locator('[data-action="book-step"][data-dir="-1"]').isDisabled(), true, "the first book cannot go earlier");
    await page.locator('[data-action="book-step"][data-dir="1"]').click();
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem("little-days.v1")).books[1].id === id, before[3]);
    assert.equal(await page.locator(".pulled-book").count(), 1, "still pulled out");
    // Reload: the order is saved.
    await page.reload();
    await page.waitForSelector(".hero");
    assert.deepEqual((await order()).slice(0, 2), [before[0], before[3]]);
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.events")).filter((e) => e.e === "book_reorder").map((e) => e.kind));
    assert.deepEqual(events, ["drag", "step"]);
    passed.push("tap still pulls a book out; earlier / later buttons; order saved");

    // 3. Growth: a written check-in opens to read first; the habit's icon is its little book.
    const mobile = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    mobile.on("pageerror", (error) => errors.push(error.message));
    await mobile.goto(base);
    await mobile.waitForSelector(".hero");
    await require("./signed-in.cjs").openHabits(mobile);
    await mobile.locator('.habit-row [data-action="check"][data-habit="move"]').first().click();
    await mobile.locator('.habit-row [data-action="check-note"][data-habit="move"]').first().click();
    await mobile.locator('#dialog-form [name="note"]').fill("深蹲感觉越来越稳了。");
    await mobile.locator('#dialog-form [type="submit"]').click();
    const noted = mobile.locator('.habit-row .note-button[data-habit="move"]').first();
    assert.equal(await noted.getAttribute("data-action"), "check-view");
    await noted.click();
    await mobile.waitForSelector("#choose-dialog[open] .check-view");
    assert.match(await mobile.locator(".check-view-note").innerText(), /越来越稳/);
    assert.equal(await mobile.locator("#form-dialog[open]").count(), 0, "reading, not editing");
    await mobile.locator('.check-view [data-action="check-note"]').click();
    await mobile.waitForSelector('#form-dialog[open] [name="note"]');
    await mobile.locator('#dialog-form [data-action="close-dialog"]').click();
    const bookIcon = mobile.locator('.habit-row .habit-book[data-habit="move"]').first();
    assert.equal(await bookIcon.locator(".habit-book-count").innerText(), "1");
    const size = await bookIcon.boundingBox();
    assert.ok(size.width >= 40 && size.height >= 46, "a bigger book to tap");
    await bookIcon.click();
    await mobile.waitForSelector(".journey");
    passed.push("growth: a written check-in opens to read (Edit inside); the habit's book icon opens its growth book");

    // 4. Tap words on the paper: font, size and colour right there; the caret stays.
    await mobile.locator('#navigation [data-page="studio"]').click();
    await mobile.locator('[data-action="quick-way"][data-way="write"]').click();
    await mobile.locator('[data-action="quick-start"]').click();
    await mobile.waitForSelector('#journal-canvas [data-inline="title"]');
    await mobile.keyboard.type("昨天给他过生日了");
    await mobile.waitForSelector("#type-bar:not([hidden])");
    // Measure once the page has settled (the caret scroll can still be easing in).
    const settledBox = async () => {
      let last = await mobile.locator("#journal-canvas").boundingBox();
      for (let i = 0; i < 20; i++) {
        await mobile.waitForTimeout(120);
        const next = await mobile.locator("#journal-canvas").boundingBox();
        if (JSON.stringify(next) === JSON.stringify(last)) return next;
        last = next;
      }
      return last;
    };
    const stageBefore = await settledBox();
    await mobile.locator('[data-type-font="zh-kuaile"]').click();
    await mobile.locator('[data-type-size="2"]').click();
    await mobile.locator('[data-type-color="#B5838D"]').click();
    assert.equal(await mobile.evaluate(() => document.activeElement?.dataset.inline), "title", "still typing in the title");
    await mobile.keyboard.type("！");
    assert.deepEqual(await settledBox(), stageBefore, "the bar never moves the page");
    await mobile.locator('#journal-canvas [data-inline="body"]').click();
    await mobile.locator('[data-type-color="#7D8E66"]').click();
    await mobile.waitForTimeout(1300);
    const note = await mobile.evaluate(() => { const d = new Date(); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return JSON.parse(localStorage.getItem("little-days.v1")).drafts[k].moments.at(-1); });
    assert.equal(note.title, "昨天给他过生日了！");
    assert.equal(note.font, "zh-kuaile");
    assert.equal(note.textStyle.color, "#B5838D");
    assert.ok(note.textStyle.size > 20);
    assert.equal(note.bodyStyle.color, "#7D8E66");
    assert.match(await mobile.locator('.tool-dock [data-action="add-text-layer"]').innerText(), /文字/, "Text sits in the bottom tools");
    await mobile.evaluate(() => document.activeElement.blur());
    await mobile.waitForSelector("#type-bar", { state: "hidden" });
    // One place for each choice: the journal is in the line above the paper,
    // video / sound are added under it; the dock does not repeat them.
    const dockTools = await mobile.$$eval(".tool-dock .sv-tool", (els) => els.map((el) => el.dataset.tool || el.dataset.action));
    assert.deepEqual(dockTools, ["add-photos", "add-text-layer", "stickers", "more"], dockTools.join());
    // A check-in on the page is a soft label with a check (no emoji, no box).
    await studioTool(mobile, "growth");
    await mobile.locator('[data-action="insert-growth"][data-habit="move"]').click();
    await mobile.waitForSelector("#journal-canvas .growth-layer .growth-check");
    assert.doesNotMatch(await mobile.locator("#journal-canvas .growth-layer").innerText(), /\p{Extended_Pictographic}/u);
    assert.equal(await mobile.locator("#journal-canvas .growth-layer .growth-card").evaluate((el) => getComputedStyle(el).borderTopWidth), "0px");
    // Selection: two small dots, not a square box.
    const handle = await mobile.locator("#journal-canvas .growth-layer .handle-resize").evaluate((el) => [el.offsetWidth, getComputedStyle(el).borderRadius]);
    assert.ok(handle[0] <= 16 && handle[1] === "50%", JSON.stringify(handle));
    passed.push("type bar: tap the title or words → font / size / colour, caret stays, page never moves; 加文字框 is clearly an add");

    // 5. Sample days to look through, marked and removable.
    await require("./signed-in.cjs").leaveStudio(mobile);
    await mobile.locator('#navigation [data-page="home"]').click();
    const samples = await mobile.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1") || "null")?.entries.filter((e) => e.isDemo).length);
    assert.ok(samples >= 6, `sample days (${samples})`);
    await mobile.locator('[data-action="nav"][data-page="settings"]').click();
    await require("./signed-in.cjs").settingsSheet(mobile, "samples");
    await mobile.locator('[data-action="samples-remove"]').click();
    await mobile.locator("#confirm-ok").click();
    await mobile.waitForFunction(() => !JSON.parse(localStorage.getItem("little-days.v1")).entries.some((e) => e.isDemo));
    await mobile.reload();
    await mobile.waitForSelector(".hero");
    assert.equal(await mobile.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).entries.filter((e) => e.isDemo).length), 0, "they don't come back");
    passed.push("sample days across the books; removable in Settings and they stay removed");

    assert.deepEqual(errors, []);
    console.log(`V5.5 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
