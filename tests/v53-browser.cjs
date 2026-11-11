// V5.4 E2E: one person keeps the book, family looks. Suggested books for
// couples and families; a whole book shared as one PDF (title page + every
// page); an honest question about letting family add photos (test log only).
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { menu } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";
// Public sample photos from the library (Unsplash License).
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const pics = ["beach-sunset", "latte-art", "coffee-cheers"].map((id) => path.join(lib, `LD-photo-${id}.jpg`));

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

    // 1. Suggested books on the shelf: 我们俩 and 宝宝成长.
    await menu(page, "books");
    await page.waitForSelector(".suggested-books");
    assert.deepEqual(await page.$$eval('[data-action="book-suggest"]', (els) => els.map((el) => el.dataset.preset)), ["relationship", "parenting"]);
    await page.locator('[data-action="book-suggest"][data-preset="relationship"]').tap();
    await page.waitForSelector("#form-dialog[open]");
    assert.equal(await page.locator('#dialog-form [name="title"]').inputValue(), "我们俩");
    await page.locator('#dialog-form [type="submit"]').tap();
    await page.waitForSelector(".book-share");
    const bookId = await page.locator(".book-share").getAttribute("data-book");
    const book = await page.evaluate((id) => JSON.parse(localStorage.getItem("little-days.v1")).books.find((b) => b.id === id), bookId);
    assert.equal(book.category, "Relationship");
    assert.equal(book.visibility, "private");
    await menu(page, "books");
    assert.deepEqual(await page.$$eval('[data-action="book-suggest"]', (els) => els.map((el) => el.dataset.preset)), ["parenting"], "a made book is no longer suggested");
    passed.push("suggested books for couples and families; the made one stays private");

    // 2. An empty book cannot be shared yet.
    await page.locator(`[data-action="book"][data-book="${bookId}"], [data-book="${bookId}"]`).first().tap();
    if (!(await page.locator(".book-share").count())) await page.locator(`[data-book="${bookId}"]`).first().tap();
    await page.waitForSelector(".book-share");
    await page.locator(".book-share").tap();
    await page.waitForSelector(".toast.show, #toast:not(:empty)");
    assert.match(await page.locator("#toast").innerText(), /还没有页面/);

    // 3. Two pages in the book, then share it with family as a PDF.
    for (const [files, line] of [[pics, "第一次一起看海"], [pics.slice(1), "周末的咖啡"]]) {
      await menu(page, "studio");
      await page.locator('[data-action="quick-way"][data-way="photo"]').tap();
      await page.locator(`[data-action="quick-book"][data-book="${bookId}"]`).tap();
      const chooser = page.waitForEvent("filechooser");
      await page.locator('[data-action="quick-start"]').tap();
      await (await chooser).setFiles(files);
      // Quick Create V2: a line in the preview, saved into the book.
      await page.waitForSelector(".story-styles");
      await page.locator('.story-tools [data-action="story-text"]').tap();
      await page.locator("[data-story-word]").fill(line);
      await page.locator('[data-action="story-text-done"]').tap();
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector(".flip-page");
    }
    await menu(page, "home");
    await page.locator(`.home-book-cover[data-book="${bookId}"]`).tap();
    await page.waitForSelector(".book-share");
    assert.match(await page.locator(".book-share-help").innerText(), /PDF/);
    const download = page.waitForEvent("download");
    await page.locator(".book-share").tap();
    const file = await download;
    assert.match(file.suggestedFilename(), /^Little-Days-book-\d{4}-\d{2}-\d{2}\.pdf$/, "a safe file name (the title is inside the PDF)");
    const pdf = fs.readFileSync(await file.path()).toString("latin1");
    assert.ok(pdf.startsWith("%PDF-1.4"));
    assert.equal(pdf.match(/\/Type \/Page /g).length, 3, "a title page + two pages");
    assert.match(pdf, /\/Filter \/DCTDecode/);
    assert.match(pdf, /\/Title <FEFF6211.*>/, "the book's name is the PDF title");
    passed.push("share with family: the whole book as one PDF (title page + every page)");

    // 4. The honest question afterwards, kept only in the test log.
    await page.waitForSelector("#choose-dialog[open] .contribute-sheet");
    assert.match(await page.locator(".contribute-sheet").innerText(), /还在做/);
    if (shots) await page.screenshot({ path: `${shots}/v53-ask.png` });
    await page.locator('[data-action="contribute-interest"][data-kind="view"]').tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.events")).filter((e) => /book_|contribute/.test(e.e)));
    assert.deepEqual(events.map((e) => [e.e, e.kind || "", e.pages ?? ""]), [
      ["book_create", "", ""],
      ["book_share", "saved", 2],
      ["contribute_interest", "view", ""],
    ]);
    passed.push("would family add photos too? — asked honestly, answer kept in the local test log");

    assert.deepEqual(errors, []);
    console.log(`V5.4 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
