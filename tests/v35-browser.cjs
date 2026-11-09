// My Books as a bookshelf + 我的主页 (profile moved from Community).
// Synthetic data only.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const { goTab } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const nav = (tab) => goTab(page, tab);
    const journal = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const demo = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social") || "null"));
    // 1. Shelf: one spine per book on wooden planks, plus an add slot.
    await nav("books");
    await page.waitForSelector(".bookshelf");
    const books = await page.$$eval(".spine[data-action='pull-book']", (els) => els.map((el) => ({ id: el.dataset.book, title: el.querySelector(".spine-title").textContent })));
    assert.ok(books.length >= 3, "sample books on the shelf");
    assert.equal(await page.locator(".spine.add[data-action='new-book']").count(), 1);
    assert.ok((await page.locator(".shelf-plank").count()) >= 1);
    assert.equal(await page.locator(".pulled-book").count(), 0);
    assert.match(await page.locator(".shelf-hint").innerText(), /书脊/);
    // Spines stand on the plank and fit the phone width.
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    passed.push("bookshelf: spines on planks, add slot, hint");

    // 2. Pull a book out; put it back; tap the pulled spine again to open it.
    const second = books[1];
    await page.locator(`[data-action="pull-book"][data-book="${second.id}"]`).click();
    await page.waitForSelector(".pulled-book");
    assert.match(await page.locator(".pulled-book").innerText(), new RegExp(second.title));
    assert.equal(await page.locator(`.spine.pulled[data-book="${second.id}"]`).count(), 1);
    await page.locator('[data-action="put-back"]').click();
    assert.equal(await page.locator(".pulled-book").count(), 0);
    await page.locator(`[data-action="pull-book"][data-book="${second.id}"]`).click();
    await page.locator(`[data-action="pull-book"][data-book="${second.id}"]`).click();
    await page.waitForSelector(".book-detail-copy");
    assert.match(await page.locator(".book-detail-copy").innerText(), new RegExp(second.title));
    await page.locator('[data-action="all-books"]').click();
    await page.waitForSelector(".pulled-book");
    // Write a page straight from the shelf into that book.
    await page.locator('[data-action="shelf-write"]').click();
    await page.waitForSelector("#journal-canvas");
    const draftBook = await page.waitForFunction(() => {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[key]?.bookId;
    }).then((handle) => handle.jsonValue());
    assert.equal(draftBook, second.id);
    passed.push("pull out, put back, open by second tap, write a page into that book");

    // 3. Switch to 我的主页: profile + who-can-see; Community has 3 tabs and a link here.
    await nav("community");
    assert.deepEqual(await page.$$eval(".community-tabs.main [data-action='community-tab']", (els) => els.map((el) => el.dataset.tab)), ["discover", "friends", "messages"]);
    await page.locator('[data-action="open-profile"]').click();
    await page.waitForSelector(".ig-head");
    assert.equal(await page.locator("#navigation [data-page='books'].active").count(), 1, "profile lives in My Books");
    assert.equal(await page.locator('[data-action="books-view"][data-view="profile"][aria-selected="true"]').count(), 1);
    assert.equal(await page.locator(".who-row").count(), books.length);
    assert.equal(await page.locator('.who-row [data-action="showcase"][data-on="0"][aria-pressed="true"]').count(), books.length, "all private by default");
    // Profile edits re-render in place (stay on My Books).
    await page.locator('[data-action="community-profile-edit"]').click();
    await page.locator("#profile-name").fill("书架主人");
    await page.locator('[data-action="community-profile-save"]').click();
    assert.match(await page.locator(".space.ig").innerText(), /书架主人/);
    assert.equal(await page.locator(".bookshelf, .community-tabs").count(), 0);
    passed.push("我的主页 in My Books; community links to it; all books private by default; edits stay in place");

    // 4. Showcase a cover: needs confirmation; cancel keeps it private.
    const first = books[0];
    const coverChip = page.locator(`[data-action="showcase"][data-book="${first.id}"][data-on="1"]`);
    await coverChip.click();
    await page.locator("#confirm-dialog[open] #confirm-cancel").click();
    await page.waitForSelector("#confirm-dialog:not([open])", { state: "attached" });
    assert.equal(await coverChip.getAttribute("aria-pressed"), "false");
    assert.equal((await demo()).profile.showcase.includes(first.id), false);
    await coverChip.click();
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem("little-days.demo-social")).profile.showcase.includes(id), first.id);
    // Visitor preview shows only that cover, no pages.
    await page.locator("#p-preview summary").click();
    assert.equal(await page.locator(".visitor-covers .book-cover").count(), 1);
    assert.match(await page.locator(".visitor-card").innerText(), new RegExp(first.title));
    // The shelf shows the book's state.
    await page.locator('[data-action="books-view"][data-view="shelf"]').click();
    await page.locator(`[data-action="pull-book"][data-book="${first.id}"]`).click();
    assert.match(await page.locator(".pulled-book .badge").innerText(), /主页展示封面/);
    // Journal data is untouched by the demo setting.
    const j = await journal();
    assert.equal(j.books.length, books.length);
    assert.ok(j.books.every((b) => (b.visibility || "private") === "private"));
    assert.ok(!JSON.stringify(j).includes("showcase"));
    passed.push("show a cover on the profile (confirmed), visitor preview, journal stays private");

    // 5. Bilingual + narrow widths.
    await nav("home");
    await page.locator('[data-page="settings"]').click();
    await page.locator('[data-language="en"]').click();
    await nav("books");
    assert.match(await page.locator(".shelf-switch").innerText(), /Shelf[\s\S]*My profile/);
    for (const width of [375, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const view of ["shelf", "profile"]) {
        await page.locator(`[data-action="books-view"][data-view="${view}"]`).click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${view} ${width}`);
      }
    }
    passed.push("English labels; 375/430 widths without horizontal scroll");

    assert.deepEqual(errors, []);
    console.log(`V3.5 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
