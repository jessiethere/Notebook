// V10.0 · Journal Studio shell (Phase A): the simple top bar, four tools at
// the bottom, More / page details / pages in the bottom sheet, undo & redo
// under the paper (per page), the save state, 完成 → the saved page, and a
// save that fails keeps the editor open. Synthetic data only.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
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
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const draft = async () => (await stored()).drafts[today];
    const settle = () => page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved");
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const calm = async () => {
      await page.evaluate(() => document.activeElement?.blur?.());
      await page.waitForFunction(() => !document.body.classList.contains("typing"));
      await page.waitForFunction(() => !document.querySelector(".toast.visible"), null, { timeout: 8000 }).catch(() => {});
    };
    const undo = page.locator('.stage-bar [data-action="undo"]'), redo = page.locator('.stage-bar [data-action="redo"]');

    // 1. The shell: top bar, paper, undo / redo + pages under it, four tools.
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector("#journal-canvas");
    await calm();
    const top = await page.$$eval(".sv-top > *", (els) => els.filter((el) => !el.classList.contains("visually-hidden")).map((el) => el.dataset.action || el.className));
    assert.deepEqual(top, ["studio-back", "pages-manage", "draft-retry", "studio-preview", "save-entry"], "back · page name · save state · preview · 完成");
    assert.equal(await page.locator('.sv-top [data-action="undo"], .sv-top [data-action="redo"]').count(), 0, "no undo / redo in the top bar");
    assert.match(await page.locator(".sv-title").innerText(), /第 1 页 · 共 1 页/);
    assert.match(await page.locator("#draft-status").innerText(), /已保存/);
    assert.equal(await page.locator("#draft-status").isDisabled(), true, "the save state is only a button when saving failed");
    assert.deepEqual(await page.$$eval(".tool-dock.sv-tools .sv-tool", (els) => els.map((el) => el.innerText.trim())), ["照片", "文字", "贴纸", "更多"]);
    const geometry = () =>
      page.evaluate(() => {
        const r = (sel) => document.querySelector(sel).getBoundingClientRect();
        const scroller = document.querySelector("#app-scroll");
        return { paper: r("#journal-canvas").toJSON(), undo: r('.stage-bar [data-action="undo"]').toJSON(), redo: r('.stage-bar [data-action="redo"]').toJSON(), dock: r(".tool-dock").toJSON(), bar: r(".sv-top").toJSON(), scroll: scroller.scrollHeight - scroller.clientHeight, w: innerWidth, h: innerHeight };
      });
    let g = await geometry();
    assert.ok(g.scroll <= 2, "the editor fits the screen");
    assert.ok(g.paper.width >= Math.min(g.w - 40, (g.h - 260) * 0.8), `a large paper (${g.paper.width}px on ${g.w}×${g.h})`);
    assert.ok(g.undo.top >= g.paper.bottom && g.redo.top >= g.paper.bottom, "undo / redo sit under the paper, never on it");
    assert.ok(g.undo.left < g.w / 3 && g.redo.left < g.w / 3, "at the lower left");
    assert.ok(g.undo.width >= 44 && g.undo.height >= 44, "44px touch targets");
    assert.ok(g.undo.bottom <= g.dock.top, "clear of the tools");
    assert.ok(Math.abs(g.dock.bottom - g.h) < 2, "tools at the very bottom");
    assert.equal(await undo.isDisabled(), true);
    assert.equal(await redo.isDisabled(), true);
    await shot("v100-default");
    passed.push("shell: top bar (back · page · save state · preview · 完成), large paper, undo / redo under it at the lower left, four tools at the bottom");

    // 2. More: every other tool; ‹ comes back; page details hold date / journal / time.
    await studioMore(page);
    const tiles = await page.$$eval(".more-grid .more-tile", (els) => els.map((el) => el.dataset.tool || el.dataset.action));
    // V10.24: 心情 is a shortcut into 页面信息 ("mood-open"), shown on a page (not on the cover)
    for (const need of ["paper", "layout", "font", "draw-new", "add-video", "add-sound", "open-pages", "details"]) assert.ok(tiles.includes(need), `More has ${need}`);
    assert.equal(await page.locator(".more-mode [data-action='page-mode']").count(), 3, "换一种写法: three ways");
    g = await geometry();
    assert.ok(g.scroll <= 2, "still fits with More open");
    assert.ok(g.paper.height > 120, `the paper stays in view above the sheet (${Math.round(g.paper.height)}px)`);
    await shot("v100-more");
    await page.locator('.more-grid [data-tool="paper"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="paper"]');
    await page.locator(".tool-sheet .sheet-back").tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="more"]');
    await page.locator('.more-grid [data-tool="details"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="details"]');
    assert.equal(await page.locator("#editor-date").inputValue(), today);
    assert.equal(await page.locator('.tool-sheet [data-moment-field="bookId"]').count(), 1, "which journal");
    assert.equal(await page.locator('.tool-sheet [data-moment-field="time"]').count(), 1, "time");
    assert.equal(await page.locator('.tool-sheet [data-action="moment-delete"]').count(), 1, "delete this page");
    await shot("v100-details");
    await studioClose(page);
    passed.push("More holds the other tools and the three ways to write; ‹ returns to More; 页面信息 has date, journal, time and delete");

    // 3. Undo / redo: photo, text, sticker, position and layer order are all steps.
    await studioMode(page, "layout");
    await page.waitForSelector('#journal-canvas [data-action="first-photo"]');
    await calm();
    await shot("v100-empty");
    const layers = async () => (await draft()).moments.at(-1).layers;
    await page.locator('#journal-canvas [data-action="first-photo"]').tap();
    await page.locator('#choose-dialog [data-action="use-scene"]').first().tap();
    await page.waitForSelector("#journal-canvas .photo-layer img");
    await settle();
    const withPhoto = (await layers()).length;
    assert.ok(withPhoto >= 1);
    assert.equal(await undo.isDisabled(), false, "undo is on after a change");
    // Text (the new photo is selected: × returns to the four tools).
    await require("./signed-in.cjs").studioDeselect(page);
    await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
    await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text"));
    await page.keyboard.type("下午的咖啡");
    await calm();
    await settle();
    assert.ok((await layers()).some((l) => l.kind === "text" && l.text === "下午的咖啡"));
    // Sticker.
    await studioTool(page, "stickers");
    await page.locator('.tool-sheet [data-action="asset-sticker"]').first().tap();
    await studioClose(page);
    await settle();
    const full = await layers();
    const sticker = full.find((l) => l.kind === "sticker" || l.kind === "asset");
    assert.ok(sticker, "a sticker is on the page");
    // Position: drag the sticker.
    const at = await page.locator(`#journal-canvas [data-layer="${sticker.id}"]`).boundingBox();
    const cdp = await context.newCDPSession(page);
    const touch = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    const cx = at.x + at.width / 2, cy = at.y + at.height / 2;
    await touch("touchStart", [{ x: cx, y: cy, id: 1 }]);
    for (let i = 1; i <= 6; i++) await touch("touchMove", [{ x: cx - i * 8, y: cy + i * 6, id: 1 }]);
    await touch("touchEnd", []);
    await settle();
    const moved = (await layers()).find((l) => l.id === sticker.id);
    assert.ok(Math.abs(moved.x - sticker.x) > 2 || Math.abs(moved.y - sticker.y) > 2, "dragging moves it");
    // Layer order.
    await studioTool(page, "layer");
    await page.locator('.tool-sheet [data-action="layer-front"]').tap();
    await studioClose(page);
    await settle();
    // Undo walks back through every step…
    const steps = [];
    for (let i = 0; i < 12 && !(await undo.isDisabled()); i++) {
      await undo.tap();
      await settle();
      steps.push((await layers()).map((l) => l.kind).join(","));
    }
    assert.ok(steps.length >= 4, `photo, text, sticker, move are separate steps (${steps.length})`);
    const afterUndo = await layers();
    assert.ok(!afterUndo.some((l) => l.kind === "text" && l.text === "下午的咖啡"), "the text is undone");
    assert.ok(!afterUndo.some((l) => l.id === sticker.id), "the sticker is undone");
    assert.equal(await undo.isDisabled(), true, "nothing left to undo: greyed out");
    // …and redo brings them all back.
    for (let i = 0; i < 12 && !(await redo.isDisabled()); i++) {
      await redo.tap();
      await settle();
    }
    const again = await layers();
    assert.equal(again.length, full.length, "redo restores every item");
    assert.ok(again.some((l) => l.kind === "text" && l.text === "下午的咖啡"));
    const redone = again.find((l) => l.id === sticker.id);
    assert.ok(Math.abs(redone.x - moved.x) < 0.01 && Math.abs(redone.y - moved.y) < 0.01, "…in the moved position");
    assert.equal(await redo.isDisabled(), true);
    await calm();
    await page.locator(".studio-stage").tap({ position: { x: 3, y: 3 } });
    await shot("v100-content");
    passed.push("undo / redo: photo, text, sticker, position and layer order are steps; disabled when there is nothing to undo or redo");

    // 4. Pages: undo never changes a page that is not on screen.
    const pageOne = JSON.stringify((await draft()).moments[0]);
    await page.locator('.stage-bar [data-action="add-moment"]').tap();
    await page.waitForFunction(() => /第 2 页 · 共 2 页/.test(document.querySelector(".sv-title")?.innerText || ""));
    await settle();
    assert.equal((await draft()).moments.length, 2);
    // The one step kept is "add this page"; nothing older.
    await calm();
    await studioTool(page, "stickers");
    await page.locator('.tool-sheet [data-action="asset-sticker"]').first().tap();
    await studioClose(page);
    await settle();
    assert.equal((await draft()).moments[1].layers.length, 1);
    // Back to page 1 (the switcher under the paper): its undo starts empty.
    await page.locator(".stage-bar .chapter-chip-wrap .chapter-chip").first().tap();
    await page.waitForFunction(() => /第 1 页 · 共 2 页/.test(document.querySelector(".sv-title")?.innerText || ""));
    assert.equal(await undo.isDisabled(), true, "another page's steps cannot be undone from here");
    assert.equal(await redo.isDisabled(), true);
    await settle();
    let d = await draft();
    assert.equal(JSON.stringify(d.moments[0]), pageOne, "page 1 is exactly as it was");
    assert.equal(d.moments[1].layers.length, 1, "page 2 keeps its sticker");
    // The page sheet: opened from the title; add a page / page details from there.
    await page.locator(".sv-title").tap();
    await page.waitForSelector("#choose-dialog[open] .pages-sheet");
    assert.equal(await page.locator(".pages-row:not(.cover-row)").count(), 2);
    assert.equal(await page.locator('.pages-actions [data-action="pages-add"], .pages-actions [data-action="pages-details"]').count(), 2);
    await shot("v100-pages");
    await page.locator('.pages-actions [data-action="pages-details"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="details"]');
    await (await momentField(page, "title")).fill("下午的咖啡");
    await page.waitForFunction(() => document.querySelector("[data-studio-title]")?.textContent === "下午的咖啡");
    await studioClose(page);
    await settle();
    passed.push("pages: the switcher and the page sheet change pages; undo is per page (another page is never changed); the title follows the page's name");

    // 5. Preview: the clean page with share / export; back to editing.
    await studioPreview(page);
    assert.equal(await page.locator(".tool-dock, .stage-bar").count(), 0, "no tools in the preview");
    assert.deepEqual(await page.$$eval(".sv-export button", (els) => els.map((el) => el.dataset.action)), ["share-story", "export", "export-video"]);
    await shot("v100-preview");
    await studioEdit(page);
    await page.waitForSelector(".tool-dock.sv-tools");
    passed.push("preview: the page alone with share / export photo / export video; ‹ returns to editing");

    // 6. A sound on the page survives 完成 (media stays in IndexedDB).
    await page.locator("#audio-input").setInputFiles({ name: "wind.wav", mimeType: "audio/wav", buffer: wav(1) });
    await page.waitForSelector("#journal-canvas .audio-layer", { state: "attached" });
    await settle();
    await studioClose(page).catch(() => {});

    // 7. A save that fails: the editor stays open, the changes stay, retry works.
    const communityBefore = await page.evaluate(() => Object.keys(localStorage).filter((k) => /social|community/.test(k)).map((k) => k + ":" + localStorage.getItem(k).length).join("|"));
    const good = await page.evaluate(() => localStorage.getItem("little-days.v1"));
    // Another copy of the app changed the journal: this one must not overwrite it.
    await page.evaluate((raw) => localStorage.setItem("little-days.v1", raw + " "), good);
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "failed");
    assert.match(await page.locator("#draft-status").innerText(), /保存失败/);
    assert.equal(await page.locator("#draft-status").isDisabled(), false, "now it is a button: try again");
    assert.equal(await page.locator("#journal-canvas").count(), 1, "still in the editor");
    assert.equal(await page.locator("#journal-canvas .photo-layer").count() >= 1, true, "the page keeps its content");
    await shot("v100-failed");
    // Leaving now asks first.
    await page.locator('.sv-top [data-action="studio-back"]').tap();
    await page.waitForSelector("#confirm-dialog[open]");
    await page.locator("#confirm-cancel").tap();
    assert.equal(await page.locator("#journal-canvas").count(), 1, "stayed");
    // The other copy is gone: retry saves.
    await page.evaluate((raw) => localStorage.setItem("little-days.v1", raw), good);
    await page.waitForFunction(() => !document.querySelector(".toast.visible"), null, { timeout: 8000 }).catch(() => {});
    await page.locator("#draft-status").tap();
    await settle();
    assert.match(await page.locator("#draft-status").innerText(), /已保存/);
    passed.push("save failed: 保存失败 in the top bar, the editor stays with every change, leaving asks first, and retry saves");

    // 8. 完成: saved, out of editing, onto the page just saved (read-only); edit again from there.
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover)");
    assert.equal(await page.locator("#journal-canvas, .tool-dock").count(), 0, "out of the editor");
    const s = await stored();
    const entry = s.entries.find((e) => e.date === today);
    assert.ok(entry, "the day is saved");
    assert.equal(entry.moments.length, 2);
    assert.equal(entry.moments[0].title, "下午的咖啡");
    assert.ok(entry.moments[0].layers.some((l) => l.kind === "photo") && entry.moments[0].layers.some((l) => l.kind === "audio"), "photo and sound are kept");
    assert.ok(entry.moments[0].layers.filter((l) => l.mediaRef).every((l) => /^(media:|photo:|asset:|\/|shared\/|assets\/)/.test(l.mediaRef) && !/^data:/.test(l.mediaRef)), "no media bytes in the journal data");
    assert.ok(!JSON.stringify(s).includes("base64,"));
    assert.notEqual(entry.privacy, "public");
    const communityAfter = await page.evaluate(() => Object.keys(localStorage).filter((k) => /social|community/.test(k)).map((k) => k + ":" + localStorage.getItem(k).length).join("|"));
    assert.equal(communityAfter, communityBefore, "完成 publishes nothing to the community");
    await shot("v100-saved");
    await page.locator(".flip-edit").tap();
    await page.waitForSelector("#journal-canvas");
    assert.match(await page.locator(".sv-title").innerText(), /下午的咖啡/);
    await page.waitForSelector("#journal-canvas .audio-layer", { state: "attached" });
    passed.push("完成: saved and shown as the read-only page; nothing is published; edit again from there with photo and sound intact");

    // 9. The shell fits small and large phones.
    for (const [w, h] of [[375, 667], [390, 844], [430, 932]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.locator(".studio-stage").tap({ position: { x: 3, y: 3 } });
      await page.waitForTimeout(250);
      // Layout is computed on render: change page to redraw at this size.
      await page.locator(".stage-bar .chapter-chip-wrap .chapter-chip").first().tap();
      await page.waitForTimeout(250);
      if (await page.locator(".tool-sheet").count()) await studioClose(page);
      g = await geometry();
      assert.ok(g.scroll <= 2, `${w}×${h}: no scrolling (${g.scroll})`);
      assert.ok(g.paper.top >= g.bar.bottom - 1 && g.undo.top >= g.paper.bottom - 1 && g.undo.bottom <= g.dock.top + 1, `${w}×${h}: bar, paper, undo row and tools do not overlap`);
      assert.ok(g.paper.width >= Math.min(w - 40, (h - 260) * 0.8), `${w}×${h}: paper ${Math.round(g.paper.width)}px`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${w}×${h}: no sideways scroll`);
      await shot(`v100-${w}`);
    }
    passed.push("fits 375×667, 390×844 and 430×932 without scrolling or overlap");

    assert.deepEqual(errors, []);
    console.log(`V10.0 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
