// V6.1 E2E: edit a page right where it is read — "✎ Edit this page" on a
// page of the book (page by page) and "✎ Edit" on each page of a day; saving
// or ‹ comes back to the same page. Sample pages have no edit button.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
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
    await require("./signed-in.cjs").ownSamples(page); // V10.41: the sample days as the person's own (see signed-in.cjs)
    const key = (n) => page.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }, n);
    const [d1, d2] = [await key(40), await key(39)];
    // Make the store real, then add two days of my own pages in the food book.
    await require("./signed-in.cjs").touchStore(page);
    await page.evaluate(([d1, d2]) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.entries = s.entries.filter((e) => ![d1, d2].includes(e.date));
      for (const [date, title] of [[d1, "第一次做蛋糕"], [d2, "楼下新开的面馆"]])
        s.entries.push({ id: "own-" + date, date, title: "", body: "", photo: "", bookId: "food", isDemo: false, layers: [], media: [], moments: [{ id: "page-" + date, title, body: "好吃", time: "", tags: [], bookId: "food", layers: [], media: [], layoutTemplate: "text" }] });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, [d1, d2]);
    await page.reload();
    await page.waitForSelector(".hero");
    const stored = (date) => page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d).moments[0].title, date);
    const retitle = async (text) => {
      const title = page.locator('#journal-canvas [data-inline="title"]');
      await title.click();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.type(text);
      await page.evaluate(() => document.activeElement.blur());
    };

    // 1. The book, page by page: ✎ on the page opens it; Save comes back here.
    await page.locator('.home-book-cover[data-book="food"]').tap();
    // V10.11: the full-screen reader, from the cover.
    await page.waitForSelector(".reader-start");
    await page.locator('.book-detail-showcase').tap(); // the cover opens the reader at the cover
    await page.waitForSelector(".flip-page.is-cover");
    let sampleChecked = false;
    for (let i = 0; i < 60; i++) {
      await page.locator('[data-action="flip"][data-dir="1"]').tap();
      await page.waitForSelector(".flip-page:not(.is-cover)");
      if (await page.locator(".flip-head .badge").count()) {
        assert.equal(await page.locator(".flip-edit").count(), 0, "a sample page has no edit button");
        sampleChecked = true;
      }
      if (/第一次做蛋糕/.test(await page.locator(".flip-canvas").innerText())) break;
    }
    const at = await page.locator(".flip-nav span").innerText();
    if (shots) {
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${shots}/v58-flip.png` });
    }
    await page.locator(".flip-edit").tap();
    await page.waitForSelector("#journal-canvas");
    assert.equal(await page.locator(`.chapter-chip.active[data-moment="page-${d1}"]`).count(), 1, "that very page is open");
    await retitle("第一次做的草莓蛋糕");
    await page.locator('[data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover)");
    assert.equal(await page.locator(".flip-nav span").innerText(), at, "back on the same page of the book");
    assert.match(await page.locator(".flip-canvas").innerText(), /第一次做的草莓蛋糕/, "showing the change");
    assert.equal(await stored(d1), "第一次做的草莓蛋糕");
    // ‹ without saving also comes back to the same page.
    await page.locator(".flip-edit").tap();
    await page.waitForSelector("#journal-canvas");
    await page.locator('[data-action="studio-back"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover)");
    assert.equal(await page.locator(".flip-nav span").innerText(), at);
    // Later pages: samples have no ✎, my own pages do.
    while (!(await page.locator('[data-action="flip"][data-dir="1"]').isDisabled())) {
      await page.locator('[data-action="flip"][data-dir="1"]').tap();
      await page.waitForSelector(".flip-page:not(.is-cover)");
      const sample = (await page.locator(".flip-head .badge").count()) > 0;
      assert.equal(await page.locator(".flip-edit").count(), sample ? 0 : 1, "✎ only on my own pages");
      sampleChecked ||= sample;
    }
    // (V10.41: sample pages are no longer read in a book — tests/v141; here every page is the person's own.)
    passed.push(`book page by page: ✎ edits that page; Save and ‹ come back to the same page${sampleChecked ? "; sample pages have no ✎" : ""}`);

    // 2. Reading a day: every page of mine has ✎ Edit; Save comes back to the day.
    await menu(page, "calendar");
    // Go back to the month of d2 if needed.
    for (let i = 0; i < 3 && !(await page.locator(`[data-action="select-date"][data-date="${d2}"]`).count()); i++) await page.locator('[data-action="month"][data-delta="-1"]').tap();
    await page.locator(`[data-action="select-date"][data-date="${d2}"]`).first().tap();
    await page.waitForSelector(".day-detail");
    const edit = page.locator(`.day-detail .chapter-edit[data-moment="page-${d2}"]`);
    assert.match(await edit.innerText(), /编辑/);
    if (shots) await page.screenshot({ path: `${shots}/v58-day.png` });
    await edit.tap();
    await page.waitForSelector("#journal-canvas");
    assert.equal(await page.locator(`.chapter-chip.active[data-moment="page-${d2}"]`).count(), 1);
    await retitle("楼下新开的牛肉面馆");
    await page.locator('[data-action="save-entry"]').tap();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(`[data-moment-view="page-${d2}"]`).innerText(), /楼下新开的牛肉面馆/);
    assert.equal(await stored(d2), "楼下新开的牛肉面馆");
    await edit.tap();
    await page.waitForSelector("#journal-canvas");
    await page.locator('[data-action="studio-back"]').tap();
    await page.waitForSelector(".day-detail");
    passed.push("reading a day: ✎ Edit on each page opens it; Save and ‹ come back to the day");

    // 3. Writing from ＋ still ends on Home as before.
    await menu(page, "studio");
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    await page.locator('[data-action="quick-way"][data-way="write"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("今天的新一页");
    await page.evaluate(() => document.activeElement.blur());
    await page.locator('[data-action="save-entry"]').tap();
    // V6.7: Save shows the page just written, in its book.
    await page.waitForSelector(".flip-page:not(.is-cover)");
    assert.match(await page.locator(".flip-page").innerText(), /今天的新一页/);
    passed.push("a new page from ＋: Save shows that page in its book");

    assert.deepEqual(errors, []);
    console.log(`V6.1 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
