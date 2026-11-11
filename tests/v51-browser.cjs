// V5.1 E2E: ＋ asks how to keep today (photo + a line / just write / draw),
// every record is its own page in the chosen journal, drawing on the page
// (pen pressure, palm rejection, undo, draw again, clear), decorating my
// space (looks, frames, layouts) and stationery level names.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { menu } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";
// A tiny synthetic picture (1×1 PNG) for "my photo".
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

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
    const draft = () => page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[d], today);
    // Start from an empty today.
    await require("./signed-in.cjs").touchStore(page);
    await page.waitForFunction(() => localStorage.getItem("little-days.v1"));
    await page.evaluate((d) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.entries = s.entries.filter((e) => e.date !== d);
      delete s.drafts[d];
      localStorage.setItem("little-days.v1", JSON.stringify(s));
      localStorage.removeItem("little-days.quick-way");
    }, today);
    await page.reload();
    await page.waitForSelector(".hero");

    // 1. ＋ asks how: three ways, which journal; nothing to continue yet.
    await menu(page, "studio");
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    assert.deepEqual(await page.$$eval('[data-action="quick-way"]', (els) => els.map((el) => el.dataset.way)), ["photo", "write", "draw"]);
    assert.equal(await page.locator('[data-action="quick-way"][aria-pressed="true"]').getAttribute("data-way"), "write", "just write by default");
    assert.equal(await page.locator('[data-action="quick-continue"]').count(), 0);
    assert.equal(await page.locator('#choose-dialog [data-action="quick-photo"]').count(), 0, "photo choices only for photo + a line");
    await page.locator('[data-action="quick-way"][data-way="photo"]').tap();
    assert.deepEqual(await page.$$eval('#choose-dialog [data-action="quick-photo"]', (els) => els.map((el) => el.dataset.photo)), ["mine", "today", "pick"]);
    assert.match(await page.locator('[data-action="quick-start"]').innerText(), /选照片/, "my own photos first");
    await page.locator('[data-action="quick-photo"][data-photo="today"]').tap();
    assert.match(await page.locator('[data-action="quick-start"]').innerText(), /写一句话/);
    if (shots) await page.screenshot({ path: `${shots}/v51-sheet.png` });
    passed.push("＋ asks how to keep today: photo + a line / just write / draw, and which journal");

    // 2. Photo + a line with today's photo, into the travel journal.
    await page.locator('[data-action="quick-book"][data-book="travel"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector("#journal-canvas.line-page.has-backdrop");
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.inline), "title", "ready to write the line");
    await page.keyboard.type("海风和一杯冰美式");
    await page.waitForTimeout(1300);
    let d = await draft();
    assert.ok(!d.title && !d.photo, "no separate day page is filled in");
    let line = d.moments.at(-1);
    assert.equal(line.layoutTemplate, "line");
    assert.equal(line.bookId, "travel");
    assert.match(line.backdrop, /^photo:[a-z0-9-]+$/);
    assert.equal(line.title, "海风和一杯冰美式");
    assert.equal(await page.locator(".write-card").count(), 0, "the words are on the photo, no card below");
    assert.equal(await page.locator('.chapter-chips .cover-chip.empty').count(), 1, "the cover is there, optional and empty");
    assert.match(await page.locator(".sv-title").innerText(), /第 1 页 · 共 1 页/);
    await studioMore(page);
    assert.equal(await page.locator('[data-action="page-mode"][data-mode="line"][aria-pressed="true"]').count(), 1);
    await studioClose(page);
    if (shots) await page.screenshot({ path: `${shots}/v51-line.png` });
    // The saved picture works for this page too.
    await page.evaluate(() => document.activeElement?.blur());
    await studioPreview(page);
    const png = page.waitForEvent("download");
    await page.locator('[data-action="export"]').tap();
    assert.match((await png).suggestedFilename(), /\.png$/);
    passed.push("photo + a line: today's photo is the page, one line on it, saved in the chosen journal; exports");

    // 3. My own photo as the page.
    await menu(page, "studio");
    assert.match(await page.locator('[data-action="quick-continue"]').innerText(), /1/);
    assert.equal(await page.locator('[data-action="quick-way"][aria-pressed="true"]').getAttribute("data-way"), "photo", "remembers the last way");
    assert.equal(await page.locator('[data-action="quick-book"][aria-pressed="true"]').getAttribute("data-book"), "travel", "and the last journal");
    await page.locator('[data-action="quick-photo"][data-photo="mine"]').tap();
    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="quick-start"]').tap();
    await (await chooser).setFiles({ name: "mine.png", mimeType: "image/png", buffer: pixel });
    // Quick Create V2 (V6.5): a designed draft right away; saved into the book.
    await page.waitForSelector(".story-canvas .scrapbook-page .photo-layer img[src^='blob:']");
    await page.waitForTimeout(1300);
    d = await draft();
    assert.equal(d.moments.at(-1).layoutTemplate, "scrapbook");
    assert.match(d.moments.at(-1).layers[0].mediaRef, /^media:[0-9a-f-]{36}$/);
    await page.locator('[data-action="story-save"]').tap();
    await page.waitForSelector(".flip-page");
    passed.push("photo + a line with my own photo (kept on this device, laid out in its own shape)");

    // 4. Just write: a note page, typed on the paper.
    await menu(page, "studio");
    await page.locator('[data-action="quick-way"][data-way="write"]').tap();
    await page.locator('[data-action="quick-book"][data-book="daily"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector('#journal-canvas.text-only [data-inline="title"]');
    await page.keyboard.type("随手记一下");
    await page.waitForTimeout(1300);
    d = await draft();
    assert.equal(d.moments.at(-1).layoutTemplate, "text");
    assert.equal(d.moments.at(-1).title, "随手记一下");
    assert.equal(d.moments.length, 3, "every record is its own page");
    passed.push("just write: a note page in the chosen journal");

    // 5. Draw: pen with pressure, palm rejected, marker, undo, done.
    await page.evaluate(() => document.activeElement?.blur());
    await menu(page, "studio");
    await page.locator('[data-action="quick-way"][data-way="draw"]').tap();
    await page.locator('[data-action="quick-start"]').tap();
    await page.waitForSelector("#draw-dialog[open] .draw-canvas");
    assert.deepEqual(await page.$$eval("[data-draw-tool]", (els) => els.map((el) => el.dataset.drawTool)), ["pen", "marker", "pencil", "eraser"]);
    assert.equal(await page.locator('[data-draw="undo"]').isDisabled(), true);
    const stroke = (pointerType, points, pressure = 0.5) =>
      page.evaluate(({ pointerType, points, pressure }) => {
        const c = document.querySelector(".draw-canvas");
        const r = c.getBoundingClientRect();
        const fire = (type, [x, y]) => c.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: pointerType === "pen" ? 7 : 3, pointerType, pressure, clientX: r.left + x * r.width, clientY: r.top + y * r.height }));
        fire("pointerdown", points[0]);
        points.slice(1).forEach((p) => fire("pointermove", p));
        fire("pointerup", points.at(-1));
      }, { pointerType, points, pressure });
    const inked = () => page.evaluate(() => {
      const c = document.querySelector(".draw-canvas");
      const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 8) n++;
      return n;
    });
    await stroke("pen", [[0.2, 0.2], [0.3, 0.25], [0.4, 0.2], [0.5, 0.3]], 1);
    const afterPen = await inked();
    assert.ok(afterPen > 500, "the pencil drew");
    await stroke("touch", [[0.2, 0.7], [0.8, 0.7]]);
    assert.equal(await inked(), afterPen, "a palm touch after the pencil does not draw");
    await page.locator('[data-draw-tool="marker"]').tap();
    await page.locator('[data-draw-color="#e7b93f"]').tap();
    await stroke("pen", [[0.2, 0.4], [0.6, 0.4]]);
    const afterMarker = await inked();
    assert.ok(afterMarker > afterPen);
    await page.locator('[data-draw="undo"]').tap();
    assert.equal(await inked(), afterPen, "undo takes back the marker line");
    await page.locator('[data-draw="redo"]').tap();
    assert.equal(await inked(), afterMarker);
    if (shots) await page.screenshot({ path: `${shots}/v51-draw.png` });
    await page.locator('[data-draw="done"]').tap();
    await page.waitForSelector("#journal-canvas .drawing-layer img[src^='blob:']");
    await page.waitForTimeout(1300);
    d = await draft();
    let drawing = d.moments.at(-1).layers.find((l) => l.drawing);
    assert.ok(drawing, "a drawing on the new page");
    assert.equal(drawing.kind, "photo");
    assert.equal(drawing.frame, "bare");
    assert.match(drawing.mediaRef, /^media:/);
    assert.ok(drawing.w < 70 && drawing.h < 40, `trimmed to the ink (${drawing.w}×${drawing.h})`);
    passed.push("draw: pen pressure, palm ignored after a pencil, marker, undo/redo, trimmed onto the page");

    // 6. Draw again on the same drawing; a photo layout leaves it in place.
    await page.locator("#journal-canvas .drawing-layer").click();
    await page.locator('.layer-bar [data-action="draw-edit"]').click();
    await page.waitForSelector("#draw-dialog[open]");
    await page.waitForFunction(() => {
      const c = document.querySelector(".draw-canvas");
      const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 8) return true;
      return false;
    });
    await stroke("pen", [[0.6, 0.8], [0.8, 0.85]]);
    await page.locator('[data-draw="done"]').tap();
    await page.waitForTimeout(1300);
    d = await draft();
    const again = d.moments.at(-1).layers.filter((l) => l.drawing);
    assert.equal(again.length, 1, "still one drawing");
    assert.notEqual(again[0].mediaRef, drawing.mediaRef);
    assert.ok(again[0].h > drawing.h, "the new lines are part of it");
    // Clearing everything removes the drawing.
    await page.locator("#journal-canvas .drawing-layer").click();
    await page.locator('.layer-bar [data-action="draw-edit"]').click();
    await page.waitForSelector("#draw-dialog[open]");
    await page.locator('[data-draw="clear"]').tap();
    await page.locator('[data-draw="done"]').tap();
    await page.waitForFunction(() => !document.querySelector("#journal-canvas .drawing-layer"));
    passed.push("draw again on the same drawing; clearing it removes it");

    // 7. Draw on any page from the bar above the paper; cancel keeps nothing.
    await studioMoreAction(page, "draw-new");
    await page.waitForSelector("#draw-dialog[open]");
    await stroke("mouse", [[0.3, 0.3], [0.4, 0.4]]);
    await page.locator('[data-draw="cancel"]').tap();
    await page.waitForSelector("#draw-dialog:not([open])", { state: "attached" });
    assert.equal(await page.locator("#journal-canvas .drawing-layer").count(), 0);
    passed.push("draw from the page bar; cancel keeps nothing");

    // 8. Pages of the day: deleting one lands on another page, not an empty day page.
    await studioDetails(page);
    await page.locator('.page-bar [data-action="moment-delete"]').dispatchEvent("click");
    await page.waitForFunction(() => !document.querySelector("#confirm-dialog[open]") || true);
    if (await page.locator("#confirm-dialog[open]").count()) await page.locator("#confirm-ok").tap();
    await page.waitForFunction(() => document.querySelectorAll(".chapter-chips .chapter-chip-wrap").length === 3);
    assert.equal(await page.locator('.chapter-chips .cover-chip.empty:not(.active)').count(), 1, "the empty cover is not opened");
    assert.equal(await page.locator('.page-bar [data-action="moment-delete"]').count(), 1, "a real page is open");
    passed.push("a day is its pages: deleting one opens another, no empty day page");

    // 8b. 整理这一天: reorder and delete pages in one sheet; the cover is there too.
    const order = async () => (await draft()).moments.map((m) => m.id);
    await page.waitForTimeout(1300);
    const before = await order();
    await studioClose(page);
    await page.locator('.sv-title[data-action="pages-manage"]').tap();
    await page.waitForSelector("#choose-dialog[open] .pages-sheet");
    assert.equal(await page.locator(".pages-row.cover-row").count(), 1);
    assert.equal(await page.locator(".pages-row:not(.cover-row)").count(), before.length);
    assert.equal(await page.locator('.pages-row [data-action="page-move"][data-dir="-1"]').first().isDisabled(), true, "the first page cannot move up");
    await page.locator('[data-action="page-move"][data-dir="1"]').first().tap();
    await page.waitForTimeout(1300);
    assert.deepEqual(await order(), [before[1], before[0], ...before.slice(2)]);
    await page.locator(`[data-action="page-remove"][data-moment="${before[2]}"]`).tap();
    if (await page.locator("#confirm-dialog[open]").count()) await page.locator("#confirm-ok").tap();
    await page.waitForFunction((n) => document.querySelectorAll(".pages-row:not(.cover-row)").length === n, before.length - 1);
    await page.locator('#choose-dialog [data-action="choose-close"]').tap();
    await page.waitForTimeout(1300);
    assert.deepEqual(await order(), [before[1], before[0]]);
    assert.match(await page.locator(".sv-title").innerText(), /共 2 页/);
    passed.push("整理这一天: move a page, delete a page, the cover listed first");

    // 9. Decorate my space: a look, then a frame and a post layout.
    await menu(page, "books");
    await page.locator('[data-action="books-view"][data-view="profile"]').tap();
    await page.waitForSelector(".ig-head");
    assert.match(await page.locator(".ig-level").innerText(), /Lv\.\d · (第一页|随手记|贴纸控|手帐控)/);
    await page.locator('.ig-actions .dress-cta').tap();
    await page.waitForSelector(".dress-looks");
    assert.equal(await page.locator('[data-action="space-look"]').count(), 6);
    await page.locator('[data-action="space-look"][data-look="night"]').tap();
    await page.waitForSelector('[data-look="night"][aria-pressed="true"]');
    assert.match(await page.locator(".space").getAttribute("style"), /#8e7cc3/);
    assert.equal(await page.locator(".ig-head.frame-dashed").count(), 1);
    await page.locator('[data-action="space-dress-tab"][data-tab="frame"]').tap();
    await page.locator('[data-action="space-frame"][data-frame="petal"]').tap();
    await page.waitForSelector(".ig-head.frame-petal");
    await page.locator('[data-action="space-dress-tab"][data-tab="layout"]').tap();
    await page.locator('[data-action="space-layout"][data-layout="magazine"]').tap();
    await page.waitForSelector('[data-action="space-layout"][data-layout="magazine"][aria-pressed="true"]');
    const space = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social")).profile.space);
    assert.deepEqual(space, { banner: "photo:milky-way", accent: "#8e7cc3", frame: "petal", layout: "magazine" });
    if (shots) await page.screenshot({ path: `${shots}/v51-dress.png` });
    passed.push("decorate: one-tap looks, avatar frame and post layout, saved on this device");

    assert.deepEqual(errors, []);
    console.log(`V5.1 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
