// V6.2 E2E: a whole book's music and the music volume. A book can keep one
// piece that plays while it is open (list or page by page) and when one of
// its days is read; a page with its own music plays that instead. The volume
// is set in the music sheet and remembered.
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
    const key = (n) => page.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }, n);
    const [d1, d2] = [await key(3), await key(2)];
    await require("./signed-in.cjs").touchStore(page);
    await page.evaluate(([d1, d2]) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.entries = s.entries.filter((e) => ![d1, d2].includes(e.date));
      s.entries.push({ id: "own-" + d1, date: d1, title: "", body: "", photo: "", bookId: "food", isDemo: false, layers: [], media: [], moments: [{ id: "plain-" + d1, title: "没选音乐的一页", body: "", tags: [], bookId: "food", layers: [], media: [], layoutTemplate: "text" }] });
      s.entries.push({ id: "own-" + d2, date: d2, title: "", body: "", photo: "", bookId: "food", isDemo: false, layers: [], media: [], moments: [{ id: "sea-" + d2, title: "有自己音乐的一页", body: "", tags: [], bookId: "food", layers: [], media: [], layoutTemplate: "text", music: "seaside" }] });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, [d1, d2]);
    await page.reload();
    await page.waitForSelector(".hero");
    const bgm = () => page.evaluate(() => { const a = document.querySelector("#background-music"); return a ? { music: a.dataset.music, playing: !a.paused, volume: Math.round(a.volume * 100) } : { music: "", playing: false, volume: -1 }; });
    const playing = (id) => page.waitForFunction((id) => { const a = document.querySelector("#background-music"); return a && !a.paused && a.dataset.music === id; }, id);

    // 1. The book: ♫ add music to this book → the sheet (with a volume) → choose.
    await require("./signed-in.cjs").openBookPage(page, "food");
    await page.waitForSelector(".book-music");
    assert.match(await page.locator(".book-music").innerText(), /给这本书配音乐/);
    assert.equal((await bgm()).playing, false, "no music before one is chosen");
    await page.locator('.book-music [data-action="music-sheet"]').tap();
    await page.waitForSelector('#choose-dialog[open] .music-sheet[data-target="book"]');
    assert.match(await page.locator(".music-sheet h2").innerText(), /这本书的音乐/);
    await page.locator("[data-music-volume]").fill("30");
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.music-volume")), "0.3");
    assert.match(await page.locator(".music-volume output").innerText(), /30%/);
    await page.locator('[data-action="music-preview"][data-music="morning-piano"]').tap();
    await playing("morning-piano");
    assert.equal((await bgm()).volume, 30, "plays at the chosen volume");
    if (shots) await page.screenshot({ path: `${shots}/v59-sheet.png` });
    await page.locator('[data-action="music-pick"][data-music="cafe-corner"]').tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).books.find((b) => b.id === "food").music), "cafe-corner");
    await playing("cafe-corner");
    assert.match(await page.locator(".book-music .music-chip").innerText(), /咖啡馆一角/);
    if (shots) await page.screenshot({ path: `${shots}/v59-book.png` });
    passed.push("a book's music: chosen from the book page, saved on the book, plays while it is open; volume set in the sheet");

    // 2. Page by page: the book's music goes on; a page with its own plays that.
    // V10.11: page by page is the full-screen reader; the music chosen here keeps playing.
    await page.locator('.reader-start').tap();
    await page.waitForSelector(".flip-page.is-cover");
    assert.equal((await bgm()).music, "cafe-corner");
    let sawPlain = false, sawOwn = false;
    while (!(await page.locator('[data-action="flip"][data-dir="1"]').isDisabled())) {
      await page.locator('[data-action="flip"][data-dir="1"]').tap();
      await page.waitForSelector(".flip-page:not(.is-cover)");
      const text = await page.locator(".flip-canvas").innerText();
      if (/没选音乐的一页/.test(text)) {
        await playing("cafe-corner");
        assert.equal(await page.locator('.reader-music[aria-pressed="true"]').count(), 1);
        sawPlain = true;
      }
      if (/有自己音乐的一页/.test(text)) {
        await playing("seaside");
        assert.equal(await page.locator('.reader-music[aria-pressed="true"]').count(), 1);
        sawOwn = true;
      }
    }
    assert.ok(sawPlain && sawOwn);
    passed.push("page by page: the book's music; a page with its own music plays that instead");

    // 3. Reading one of its days plays the book's music; leaving stops it.
    await menu(page, "calendar");
    if (!(await page.locator(`[data-action="select-date"][data-date="${d1}"]`).count())) await page.locator('[data-action="month"][data-delta="-1"]').tap();
    await page.locator(`[data-action="select-date"][data-date="${d1}"]`).first().tap();
    await page.waitForSelector(".day-detail .day-music .music-chip");
    // V10.16: silent until the chip is tapped.
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.querySelector("#background-music")?.paused ?? true), true, "no music by itself");
    await page.locator(".day-music .music-chip").tap();
    await playing("cafe-corner");
    await menu(page, "home");
    await page.waitForFunction(() => document.querySelector("#background-music").paused);
    passed.push("reading a day of that book: the chip plays the book's music (silent until tapped); leaving stops it");

    // 4. The volume is remembered; the book's music can be taken off again.
    await page.reload();
    await page.waitForSelector(".hero");
    await require("./signed-in.cjs").openBookPage(page, "food");
    await page.locator('.book-music [data-action="music-sheet"]').tap();
    assert.equal(await page.locator("[data-music-volume]").inputValue(), "30");
    await page.locator('[data-action="music-none"]').tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).books.find((b) => b.id === "food").music), undefined);
    assert.match(await page.locator(".book-music").innerText(), /给这本书配音乐/);
    passed.push("the volume is remembered after reload; the book's music can be removed");

    assert.deepEqual(errors, []);
    console.log(`V6.2 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
