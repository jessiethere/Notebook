// V10.11 · The full-screen Book Reader, on real journal pages (a long text
// page; a photo + a real sound): the cover is not counted as a page; swipe
// and edge taps turn, the middle shows / hides the controls; a double tap on
// a photo looks at it closely; pinch zooms the page; nothing plays by
// itself and the book's music waits to be asked; the page list and the
// thumbnails jump straight to a page; editing returns to the same page
// (finished or kept as a draft); progress is remembered; Reduce Motion;
// 375 / 430 phones and English.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

function wav(seconds = 1) {
  const rate = 8000, count = rate * seconds, buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF"); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) buffer.writeInt16LE(Math.sin((i / rate) * Math.PI * 440) * 3000, 44 + i * 2);
  return buffer;
}
// Counts every media play() (music included) — nothing may start by itself.
const countPlays = () => {
  window.__plays = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    window.__plays.push(this.closest?.("#app") ? "page" : "music");
    return play.call(this).catch(() => {});
  };
};
const LONG = Array.from({ length: 14 }, (_, i) => `第 ${i + 1} 行：今天的风很轻，路过面包店的时候闻到了刚出炉的香味。`).join("\n");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  const errors = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    await context.addInitScript(countPlays);
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    // V10.41 (S1): sample days are no longer read in a book. This suite turns
    // pages across several days, so the sample days become days the person
    // saved (as if each had been opened and saved — scenario D).
    await require("./signed-in.cjs").touchStore(page);
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); for (const e of s.entries) e.isDemo = false; localStorage.setItem("little-days.v1", JSON.stringify(s)); });
    await page.reload();
    await page.waitForSelector(".hero");
    const shot = async (name, p = page) => { if (shots) await p.screenshot({ path: `${shots}/${name}.png` }); };
    const label = () => page.locator(".reader-count").innerText();
    const plays = (kind) => page.evaluate((k) => window.__plays.filter((x) => x === k).length, kind);
    const stage = async () => page.locator(".reader-stage").boundingBox();
    const tapAt = async (fx, fy = 0.45) => { const b = await stage(); await page.mouse.click(b.x + b.width * fx, b.y + b.height * fy); await page.waitForTimeout(80); };
    const drag = async (fromX, toX, fromY = 0.45, toY = fromY) => {
      const b = await stage();
      await page.mouse.move(b.x + b.width * fromX, b.y + b.height * fromY);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width * toX, b.y + b.height * toY, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(420);
    };
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));

    // Two real pages today in 平凡日子里的小确幸: a long text page, then a photo + a sound.
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("很长的一页");
    await page.locator('#journal-canvas [data-inline="body"]').tap();
    await page.evaluate((text) => document.execCommand("insertText", false, text), LONG);
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForFunction(() => !document.querySelector(".toast.visible"), null, { timeout: 8000 }).catch(() => {});
    await page.locator('[data-action="add-moment"]').first().tap();
    await page.waitForFunction(() => /共 2 页|of 2/.test(document.querySelector(".sv-top")?.textContent || ""));
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="use-scene"]').first().tap();
    await page.waitForSelector("#journal-canvas .photo-layer img");
    await SS.studioClose(page).catch(() => {});
    await page.locator("#audio-input").setInputFiles({ name: "wind.wav", mimeType: "audio/wav", buffer: wav(1) });
    await page.waitForSelector("#journal-canvas .audio-layer", { state: "attached" });
    await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
    await page.evaluate(() => document.querySelector("#choose-dialog")?.open && document.querySelector("#choose-dialog").close());
    await page.locator('.sv-top [data-action="save-entry"]').tap();

    // 1. A new page lands in the reader, on that page; the bottom menu is hidden; nothing plays.
    await page.waitForSelector(".reader .reader-page");
    const total = Number((await label()).match(/第 (\d+) \/ (\d+) 页/)[2]);
    assert.equal(await label(), `第 ${total} / ${total} 页`, "the page just made (the newest)");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("#navigation")).display), "none");
    assert.equal(await page.locator(".reader-page .audio-layer").count(), 1);
    await page.waitForSelector(".reader-page .audio-layer .layer-play");
    await page.waitForTimeout(500);
    assert.equal(await plays("page") + (await plays("music")), 0, "nothing starts by itself");
    await shot("01-new-page");
    // Tapping the sound plays it; the page does not turn and the controls stay.
    await page.locator(".reader-page .audio-layer .layer-play").click();
    await page.waitForFunction(() => window.__plays.includes("page"));
    assert.equal(await label(), `第 ${total} / ${total} 页`);
    assert.equal(await page.locator(".reader.chrome-off").count(), 0);
    passed.push(`a new page opens in the reader at that page (第 ${total} / ${total} 页); no bottom menu; nothing plays by itself; the sound plays only when tapped, without turning the page`);

    // 2. Turning: edges, swipes, a vertical drag (no turn), the middle (controls).
    await page.evaluate(() => document.querySelectorAll("#app audio").forEach((a) => a.pause()));
    await tapAt(0.08);
    await page.waitForTimeout(350);
    assert.equal(await label(), `第 ${total - 1} / ${total} 页`, "left edge → previous");
    await drag(0.3, 0.85);
    assert.equal(await label(), `第 ${total - 2} / ${total} 页`, "swipe right → previous");
    await drag(0.8, 0.2);
    assert.equal(await label(), `第 ${total - 1} / ${total} 页`, "swipe left → next");
    await drag(0.5, 0.52, 0.2, 0.8);
    assert.equal(await label(), `第 ${total - 1} / ${total} 页`, "a vertical drag does not turn");
    await drag(0.7, 0.62);
    assert.equal(await label(), `第 ${total - 1} / ${total} 页`, "a short drag springs back");
    await tapAt(0.5);
    await page.waitForSelector(".reader.chrome-off");
    const still = await page.locator(".reader-page").boundingBox();
    await shot("02-chrome-off");
    await tapAt(0.5);
    await page.waitForSelector(".reader:not(.chrome-off)");
    assert.deepEqual(await page.locator(".reader-page").boundingBox(), still, "the page does not move when the controls show / hide");
    passed.push("left / right edge taps and swipes turn; a vertical or short drag does not; the middle shows / hides the controls without moving the page");

    // 3. Long text: the paper is unchanged; 阅读全文 shows the real words; back at the same page.
    const full = page.locator(".reader-full");
    assert.equal(await full.isVisible(), true, "the words do not fit the paper → 阅读全文");
    await full.tap();
    await page.waitForSelector("#choose-dialog[open] .reader-text");
    const body = await page.locator(".reader-text-body").innerText();
    assert.equal(body.trim(), LONG, "the full words come from the journal");
    await shot("03-full-text");
    await SS.closeSheet(page);
    assert.equal(await label(), `第 ${total - 1} / ${total} 页`);
    passed.push("a long page keeps its layout; 阅读全文 shows all its words from the journal; closing returns to the same page");

    // 4. Photos: a single tap toggles the controls; a double tap looks closely (zoom, then back as it was).
    await tapAt(0.92);
    await page.waitForTimeout(350);
    const photo = await page.locator(".reader-page .photo-layer img").first().boundingBox();
    await page.mouse.click(photo.x + photo.width / 2, photo.y + photo.height / 2);
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".reader.chrome-off").count(), 1, "single tap on a photo → controls");
    assert.equal(await page.locator("#lightbox[open]").count(), 0);
    await page.mouse.click(photo.x + photo.width / 2, photo.y + photo.height / 2);
    await page.waitForTimeout(80);
    await page.mouse.click(photo.x + photo.width / 2, photo.y + photo.height / 2);
    await page.waitForSelector("#lightbox[open].zoomable");
    const img = await page.locator("#lightbox-image").boundingBox();
    await page.mouse.click(img.x + img.width / 2, img.y + img.height / 2);
    await page.waitForTimeout(60);
    await page.mouse.click(img.x + img.width / 2, img.y + img.height / 2);
    await page.waitForFunction(() => /scale\(2/.test(document.querySelector("#lightbox-image").style.transform));
    await shot("04-photo-zoom");
    await page.keyboard.press("Escape");
    await page.waitForSelector("#lightbox:not([open])", { state: "attached" });
    assert.equal(await label(), `第 ${total} / ${total} 页`, "back on the same page");
    assert.equal(await page.locator(".reader.chrome-off").count(), 1, "the controls are as they were");
    await tapAt(0.5);
    passed.push("on a photo: one tap shows / hides the controls; a double tap opens it to look closely (double tap zooms); closing returns to the page as it was");

    // 5. Pinch the page to read small words; while zoomed a drag moves it instead of turning.
    await page.evaluate(() => {
      const el = document.querySelector("[data-reader-stage]");
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const fire = (type, id, x) => el.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: cy, bubbles: true, pointerType: "touch", isPrimary: id === 1 }));
      fire("pointerdown", 1, cx - 40); fire("pointerdown", 2, cx + 40);
      for (let d = 40; d <= 100; d += 10) { fire("pointermove", 1, cx - d); fire("pointermove", 2, cx + d); }
      fire("pointerup", 1, cx - 100); fire("pointerup", 2, cx + 100);
    });
    await page.waitForSelector(".reader.zoomed");
    assert.equal(await page.locator(".reader-unzoom").isVisible(), true);
    await drag(0.7, 0.3);
    assert.equal(await label(), `第 ${total} / ${total} 页`, "zoomed: a drag moves the page, it does not turn");
    await shot("05-page-zoom");
    await page.locator(".reader-unzoom").tap();
    await page.waitForSelector(".reader:not(.zoomed)");
    passed.push("pinching the page zooms it (up to 3×); a drag then moves it rather than turning; 还原大小 restores it");

    // 6. All pages; 回到封面; the cover is not a page; the ends do not turn further.
    await page.locator('[data-action="reader-thumbs"]').tap();
    await page.waitForSelector("#choose-dialog[open] .reader-thumbs");
    assert.equal(await page.locator(".reader-thumb").count(), total + 1, "the cover and every page");
    await shot("06-thumbs");
    await page.locator('.reader-thumb[data-at="1"]').tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.equal(await label(), `第 1 / ${total} 页`);
    await page.locator('[data-action="reader-more"]').tap();
    await page.locator('#choose-dialog [data-action="reader-go"][data-at="0"]').tap();
    await page.waitForFunction(() => /封面/.test(document.querySelector(".reader-count")?.textContent || ""));
    assert.equal(await label(), `封面 · 共 ${total} 页`);
    assert.equal(await page.locator('.reader-nav [data-dir="-1"]').isDisabled(), true);
    await drag(0.3, 0.9);
    assert.equal(await label(), `封面 · 共 ${total} 页`, "nothing before the cover");
    await shot("07-cover");
    passed.push(`all pages: the cover + ${total} pages, tap one to go there; 回到封面; “封面 · 共 ${total} 页”, nothing before it`);

    // 7. Back to the book: progress; 继续翻阅; 从封面开始; after a reload too.
    await page.locator('.reader-nav [data-dir="1"]').tap();
    await page.locator('.reader-nav [data-dir="1"]').tap();
    await page.locator('.reader-nav [data-dir="1"]').tap();
    await page.waitForFunction(() => /第 3 \//.test(document.querySelector(".reader-count")?.textContent || ""));
    await page.locator('[data-action="reader-back"]').tap();
    await page.waitForSelector(".reader-start");
    assert.match(await page.locator(".reader-start").innerText(), /继续翻阅 · 第 3 页/);
    assert.equal(await page.locator(".book-view-switch, .flip-book").count(), 0, "no list / flip switch, no reader inside the page");
    assert.match(await page.locator(".book-actions").innerText(), /记录新的一页[\s\S]*分享给家人看/);
    await shot("08-detail");
    await page.reload();
    await page.waitForSelector(".hero");
    await page.locator('#navigation [data-page="books"]').tap();
    await page.locator('[data-action="pull-book"][data-book="daily"]').tap();
    await page.locator('[data-action="book"][data-book="daily"]').tap();
    await page.waitForSelector(".reader-start");
    assert.match(await page.locator(".reader-start").innerText(), /继续翻阅 · 第 3 页/, "remembered after a reload");
    await page.locator(".reader-start").tap();
    await page.waitForSelector(".reader");
    assert.equal(await label(), `第 3 / ${total} 页`);
    await page.locator('[data-action="reader-back"]').tap();
    await page.locator('.reader-start-hint [data-at="cover"]').tap();
    await page.waitForSelector(".reader");
    assert.equal(await label(), `封面 · 共 ${total} 页`);
    await page.locator('[data-action="reader-back"]').tap();
    passed.push("‹ back to the book keeps the place: 继续翻阅 · 第 3 页 (also after a reload); 从封面开始; the book page has no list / flip switch; 记录新的一页 and PDF are secondary");

    // 8. The page list goes straight to a page; the cover is its own entry.
    await page.locator(".cover-entry").tap();
    await page.waitForSelector(".reader");
    assert.equal(await label(), `封面 · 共 ${total} 页`);
    await page.locator('[data-action="reader-back"]').tap();
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    await page.locator(`.day-cover[data-date="${today}"]`).tap();
    await page.waitForSelector(".reader");
    assert.equal(await label(), `第 ${total - 1} / ${total} 页`, "today's first page, no cover first");
    passed.push("page list: the cover entry opens the cover; a day opens straight at its first page");

    // 9. Edit from the reader → finish → back on the same page, updated; edit → keep as draft → same page, Draft tag.
    await page.locator(".reader-edit").tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.locator('#journal-canvas [data-inline="title"]').tap();
    await page.keyboard.press("End");
    await page.keyboard.type("（改）");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".reader");
    assert.equal(await label(), `第 ${total - 1} / ${total} 页`, "back where I was");
    assert.match(await page.locator(".reader-page").innerText(), /很长的一页（改）/, "drawn again with what was saved");
    assert.equal((await stored()).entries.find((e) => e.date === today).status, "completed");
    await page.locator(".reader-edit").tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.locator('#journal-canvas [data-inline="title"]').tap();
    await page.keyboard.press("End");
    await page.keyboard.type("！");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
    await page.locator('.sv-top [data-action="studio-back"]').tap();
    await page.waitForSelector("#choose-dialog[open] .exit-sheet");
    await page.locator('.exit-sheet [data-action="studio-draft-exit"]').tap();
    await page.waitForSelector(".reader");
    assert.equal(await label(), `第 ${total - 1} / ${total} 页`);
    assert.equal(await page.locator(".reader-caption .draft-tag").count(), 1, "the Draft tag");
    assert.equal((await stored()).entries.find((e) => e.date === today).status, "draft");
    const layers = (await stored()).entries.find((e) => e.date === today).moments[1].layers.map((l) => l.kind).sort();
    assert.deepEqual(layers, ["audio", "photo"], "the other page's photo and sound are untouched");
    await shot("09-draft");
    passed.push("编辑 from the reader → 完成 → back on the same page, drawn with the change (Completed); → 保存草稿 → same page with a 草稿 tag (Draft); other pages untouched");

    // 10. The book's music: silent until asked; play, pause, play again.
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); s.books.find((b) => b.id === "daily").music = "afternoon-coffee"; localStorage.setItem("little-days.v1", JSON.stringify(s)); });
    await page.reload();
    await page.waitForSelector(".hero");
    await page.evaluate(() => (window.__plays = []));
    await page.locator('#navigation [data-page="books"]').tap();
    await page.locator('[data-action="pull-book"][data-book="daily"]').tap();
    await page.locator('[data-action="book"][data-book="daily"]').tap();
    await page.waitForSelector(".reader-start");
    await page.locator(".reader-start").tap();
    await page.waitForSelector(".reader-music");
    await page.waitForTimeout(600);
    assert.equal(await plays("music"), 0, "entering the book and the reader: silent");
    assert.equal(await page.locator(".reader-music").getAttribute("aria-pressed"), "false");
    await page.locator(".reader-music").tap();
    await page.waitForFunction(() => window.__plays.includes("music"));
    await page.waitForSelector('.reader-music[aria-pressed="true"]');
    await shot("10-music");
    await page.locator('.reader-nav [data-dir="1"]').tap();
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.reader-music[aria-pressed="true"]').count(), 1, "keeps playing while turning");
    await page.locator(".reader-music").tap();
    await page.waitForSelector('.reader-music[aria-pressed="false"]');
    await page.locator(".reader-music").tap();
    await page.waitForSelector('.reader-music[aria-pressed="true"]');
    await page.locator(".reader-music").tap();
    passed.push("the book's music: silent on entering the book and the reader; ♪ plays, keeps playing while turning, pauses and continues");

    // 11. Reduce Motion: a soft fade instead of the slide.
    const calm = await browser.newContext({ ...devices["iPhone 13"], reducedMotion: "reduce" });
    const cp = await calm.newPage();
    cp.on("pageerror", (error) => errors.push(error.message));
    await cp.goto(base);
    await cp.waitForSelector(".hero");
    // (V10.41: the sample days as saved days, so the book has pages — see the top.)
    await require("./signed-in.cjs").touchStore(cp);
    await cp.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); for (const e of s.entries) e.isDemo = false; localStorage.setItem("little-days.v1", JSON.stringify(s)); });
    await cp.reload();
    await cp.waitForSelector(".hero");
    await cp.locator('#navigation [data-page="books"]').tap();
    await cp.locator('[data-action="pull-book"][data-book="daily"]').tap();
    await cp.locator('[data-action="book"][data-book="daily"]').tap();
    await cp.locator(".reader-start").tap();
    await cp.locator('.reader-nav [data-dir="1"]').tap();
    assert.equal(await cp.locator(".reader-page").evaluate((el) => getComputedStyle(el).animationName), "reader-fade");
    await calm.close();
    passed.push("Reduce Motion: pages change with a short fade, not a slide");

    // 12. Phone sizes and English: the whole 4:5 page shows, clear of the bars; no sideways scroll.
    for (const [w, h, lang] of [[375, 667, null], [430, 932, null], [393, 852, "en"]]) {
      const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const p = await c.newPage();
      p.on("pageerror", (error) => errors.push(error.message));
      if (lang) await p.addInitScript((l) => localStorage.setItem("little-days.language", l), lang);
      await p.goto(base);
      await p.waitForSelector(".hero");
      // (V10.41: the sample days as saved days, so the book has pages — see the top.)
      await require("./signed-in.cjs").touchStore(p);
      await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); for (const e of s.entries) e.isDemo = false; localStorage.setItem("little-days.v1", JSON.stringify(s)); });
      await p.reload();
      await p.waitForSelector(".hero");
      await p.locator('#navigation [data-page="books"]').tap();
      await p.locator('[data-action="pull-book"][data-book="daily"]').tap();
      await p.locator('[data-action="book"][data-book="daily"]').tap();
      await p.locator(".reader-start").tap();
      await p.locator('.reader-nav [data-dir="1"]').tap();
      await p.waitForTimeout(450);
      const fit = await p.evaluate(() => {
        const r = document.querySelector(".reader-page").getBoundingClientRect();
        const top = document.querySelector(".reader-top").getBoundingClientRect();
        const bottom = document.querySelector(".reader-bottom").getBoundingClientRect();
        const scroll = document.querySelector("#app-scroll");
        return { ratio: Math.round((r.width / r.height) * 100) / 100, clear: r.top >= top.bottom - 1 && r.bottom <= bottom.top + 1, inside: r.left >= 0 && r.right <= innerWidth, wide: scroll.scrollWidth <= scroll.clientWidth + 1, width: Math.round(r.width), label: document.querySelector(".reader-count").textContent };
      });
      assert.ok(fit.ratio === 0.8 && fit.clear && fit.inside && fit.wide, `${w}×${h}: ${JSON.stringify(fit)}`);
      if (lang === "en") assert.match(fit.label, /^Page 1 of \d+$/);
      await shot(`11-${w}${lang ? "-en" : ""}`, p);
      await c.close();
    }
    passed.push("375×667, 430×932 and English: the whole 4:5 page shows between the bars (never cropped), no sideways scroll; “Page 1 of N”");

    assert.deepEqual(errors, []);
    console.log(`V10.11 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
