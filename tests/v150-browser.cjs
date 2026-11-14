// V10.51 · The shelf: a quiet ··· on the pulled-out book (edit details with
// the same editor; delete only an empty book), tags as chips, tags on the
// card (2 + N). Synthetic data only.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const [w, h, lang] of [[375, 667, "zh"], [430, 932, "en"]]) {
      const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, locale: lang === "en" ? "en-US" : "zh-CN" });
      await context.addInitScript((l) => localStorage.setItem("little-days.language", l), lang);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base);
      await page.waitForSelector(".hero");
      await require("./signed-in.cjs").touchStore(page);
      const books = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).books);
      // An older book with tags stored the old way (one with a space).
      const first = (await books())[0];
      await page.evaluate((id) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); s.books.find((b) => b.id === id).tags = ["旧标签", "self awareness", "日常"]; localStorage.setItem("little-days.v1", JSON.stringify(s)); }, first.id);
      await page.goto(`${base}/shared/i18n.json`);
      await page.goto(base);
      await page.waitForSelector(".hero");
      await page.locator('#navigation [data-page="books"]').tap();
      await page.locator(`[data-action="pull-book"][data-book="${first.id}"]`).first().tap();
      await page.waitForSelector(".pulled-book .pulled-more");
      // Tags on the card: 2 + N.
      assert.equal(await page.locator(".pulled-tags span").count(), 3);
      assert.match(await page.locator(".pulled-tags").innerText(), /#旧标签[\s\S]*#self awareness[\s\S]*\+1/);
      // ··· opens a menu, never the book; nothing overlaps.
      const geo = await page.evaluate(() => { const a = document.querySelector(".pulled-more").getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(document.querySelector(".pulled-copy h2")); const t = rg.getBoundingClientRect(); return { size: a.width, overlap: !(t.right <= a.left || t.top >= a.bottom), side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      assert.ok(geo.size >= 44 && !geo.overlap && geo.side, JSON.stringify(geo));
      await page.locator(".pulled-more").tap();
      await page.waitForSelector("#choose-dialog[open] .shelf-menu");
      assert.equal(await page.locator(".reader, .book-detail-showcase").count(), 0, "··· does not open the book");
      // This book has pages? Then no delete button, a note instead.
      const pages = await page.evaluate((id) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return s.entries.filter((e) => !e.isDemo && (e.bookId === id || (e.moments || []).some((m) => m.bookId === id))).length; }, first.id);
      if (pages) assert.equal(await page.locator('.shelf-menu [data-action="shelf-delete"]').count(), 0);
      // Edit details: the same editor, filled in; old tags load as chips.
      await page.locator('.shelf-menu [data-action="edit-book"]').tap();
      await require("./signed-in.cjs").openBookSections(page);
      await page.waitForSelector("#dialog-form .tag-chips");
      assert.deepEqual(await page.locator("#dialog-form .tag-chip span").allInnerTexts(), ["旧标签", "self awareness", "日常"], "old tags kept, no # shown");
      assert.equal(await page.locator('#dialog-form [name="title"]').inputValue(), first.title);
      await page.locator('#dialog-form [name="title"]').fill(lang === "en" ? "Little things" : "小事收集");
      await page.locator('#dialog-form .tag-chip:has-text("日常") [data-action="tag-remove"]').tap();
      await page.locator("#dialog-form [data-tag-entry]").fill(lang === "en" ? "slow living" : "慢生活");
      await page.locator("#dialog-form [data-tag-entry]").press("Enter");
      await page.locator("#dialog-form [data-tag-entry]").fill("咖啡，morning walk");
      await page.locator("#dialog-form [data-tag-entry]").dispatchEvent("input");
      await page.waitForFunction(() => document.querySelectorAll("#dialog-form .tag-chip").length === 5);
      for (const extra of ["a", "b", "c"]) { await page.locator("#dialog-form [data-tag-entry]").fill(extra); await page.locator("#dialog-form [data-tag-entry]").press("Enter"); }
      assert.equal(await page.locator("#dialog-form .tag-chip").count(), 8, "at most 8");
      assert.equal(await page.locator("#dialog-form [data-tag-entry]").isDisabled(), true);
      await page.locator('#dialog-form [type="submit"]').click();
      await page.waitForFunction((t) => JSON.parse(localStorage.getItem("little-days.v1")).books.some((b) => b.title === t), lang === "en" ? "Little things" : "小事收集");
      let saved = (await books()).find((b) => b.id === first.id);
      assert.deepEqual(saved.tags.slice(0, 5), ["旧标签", "self awareness", lang === "en" ? "slow living" : "慢生活", "咖啡", "morning walk"]);
      assert.equal(saved.tags.length, 8);
      await page.waitForSelector(".pulled-book h2");
      assert.equal(await page.locator(".pulled-book h2").innerText(), lang === "en" ? "Little things" : "小事收集", "the shelf updates at once");
      await page.reload();
      await page.waitForSelector(".hero, .bookshelf");
      saved = (await books()).find((b) => b.id === first.id);
      assert.equal(saved.title, lang === "en" ? "Little things" : "小事收集", "kept after reopening");
      // A new empty book can be deleted (asked first); a book with pages cannot.
      await page.locator('#navigation [data-page="books"]').tap();
      await page.locator('[data-action="new-book"]').first().tap();
      await page.locator('#dialog-form [name="title"]').fill("Empty one");
      await page.locator('#dialog-form [type="submit"]').click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.v1")).books.some((b) => b.title === "Empty one"));
      const empty = (await books()).find((b) => b.title === "Empty one");
      await page.locator('#navigation [data-page="books"]').tap();
      await page.locator(`[data-action="pull-book"][data-book="${empty.id}"]`).first().tap();
      await page.locator(".pulled-more").tap();
      await page.locator('.shelf-menu [data-action="shelf-delete"]').tap();
      await page.waitForSelector("#confirm-dialog[open]");
      await page.locator("#confirm-ok").tap();
      await page.waitForFunction((id) => !JSON.parse(localStorage.getItem("little-days.v1")).books.some((b) => b.id === id), empty.id);
      assert.deepEqual(errors, []);
      await context.close();
      passed.push(`${w}×${h} ${lang}: ··· menu (not opening the book, 44 px, no overlap); same editor filled in; old tags as chips; add / remove / comma / 8 max; shelf updates; kept after reload; an empty book deleted after asking; a book with pages has no delete`);
    }
    console.log(`V10.51 shelf passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
