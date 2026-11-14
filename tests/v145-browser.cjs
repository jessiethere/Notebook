// V10.46 · P0 (TestFlight): hand drawing — finish, select, move, edit again,
// save, reopen. Covers the web side of the three findings:
//  A) the board's 取消 / 完成 bar keeps clear of the iPhone status bar
//     (the iOS part is checked with real touches in the Simulator, see
//     docs/BUGFIX_LOG.md; here: the bar's padding includes the safe area);
//  B) the empty (see-through) part of a drawing no longer hides the text /
//     photo underneath; ink still selects the drawing;
//  C) 取消 asks before throwing away new strokes; editing an earlier drawing
//     and cancelling keeps it exactly;
//  D) a failed save keeps the drawing and offers to try again.
// Plus: blank board → no layer; undo / redo; save → Reader; reload → still there.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"], locale: "zh-CN" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const day = () => page.evaluate((k) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return s.drafts[k] || s.entries.find((e) => e.date === k); }, today);
    const layersOf = (d) => [d, ...(d?.moments || [])].flatMap((p) => p?.layers || []);
    const drawings = async () => layersOf(await day()).filter((l) => l.drawing);
    const ctxKind = () => page.locator(".tool-dock.ctx").getAttribute("data-ctx").catch(() => "");
    const strokes = async (list) => {
      const box = await page.locator("#draw-dialog[open] .draw-canvas").boundingBox();
      for (const [x0, y0, x1, y1] of list) {
        await page.mouse.move(box.x + box.width * x0, box.y + box.height * y0);
        await page.mouse.down();
        for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width * (x0 + ((x1 - x0) * i) / 8), box.y + box.height * (y0 + ((y1 - y0) * i) / 8));
        await page.mouse.up();
      }
    };
    const skipGuide = async () => {
      if (await page.locator(".sg-skip").count()) await page.locator(".sg-skip").first().tap();
      await page.waitForTimeout(200);
    };
    const deselect = async () => {
      if (await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').count()) await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').first().tap();
      await page.waitForTimeout(200);
    };
    const openMoreDraw = async () => {
      await deselect();
      await page.locator('.tool-dock [data-action="tool"][data-tool="more"]').tap();
      await page.locator('[data-action="draw-new"]').first().tap();
      await page.waitForSelector("#draw-dialog[open] .draw-canvas");
    };

    // 1. Home → 手绘: a blank board left with 完成 adds no layer (a page is ready first).
    await page.locator('[data-action="today-draw"]').first().tap();
    await page.waitForSelector("#draw-dialog[open] .draw-canvas");
    const pad = await page.evaluate(() => {
      const rule = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).find((r) => r.selectorText === ".draw-top");
      return rule?.style.padding || "";
    });
    assert.match(pad, /safe-area-inset-top/, "A: the bar keeps clear of the status bar");
    assert.ok(await page.locator(".studio-bar").count(), "the page is ready before drawing");
    await page.locator('#draw-dialog [data-draw="done"]').tap();
    await page.waitForSelector("#draw-dialog:not([open])", { state: "attached" });
    await page.waitForTimeout(400);
    assert.equal((await drawings()).length, 0, "blank board → no layer");
    await skipGuide();
    passed.push("A: 取消 / 完成 clear of the status bar; Home → 手绘 gets a page first; a blank board adds no layer");

    // 2. Text on the page, then a drawing with two strokes far apart over it.
    await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
    await page.waitForTimeout(400);
    await page.keyboard.type("Hello");
    await page.evaluate(() => document.activeElement?.blur());
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => { const el = document.querySelector("#journal-canvas [data-layer] .layer-text").closest("[data-layer]"); const r = el.getBoundingClientRect(); return { id: el.dataset.layer, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await openMoreDraw();
    await strokes([[0.1, 0.1, 0.25, 0.15], [0.75, 0.85, 0.9, 0.9]]);
    // undo / redo on the board
    await page.locator('#draw-dialog [data-draw="undo"]').tap();
    await page.locator('#draw-dialog [data-draw="redo"]').tap();
    await page.locator('#draw-dialog [data-draw="done"]').tap();
    await page.waitForFunction(() => !document.querySelector("#draw-dialog[open]"));
    await page.waitForFunction(() => document.querySelector("#journal-canvas .drawing-layer"));
    let list = await drawings();
    assert.equal(list.length, 1, "one drawing layer");
    const drawing = list[0];
    assert.ok(drawing.w > 60 && drawing.h > 60, "the drawing's box covers most of the page");
    await deselect();
    await page.waitForTimeout(600); // the drawing's ink map is read after render
    const onTop = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("[data-layer]")?.dataset.layer, text);
    assert.equal(onTop, drawing.id, "the see-through box is on top of the text");
    await page.touchscreen.tap(text.x, text.y);
    await page.waitForTimeout(400);
    assert.equal(await ctxKind(), "text", "B: tapping the text under the empty part selects the text");
    await deselect();
    // Tapping the ink selects the drawing.
    const canvas = await page.locator("#journal-canvas").boundingBox();
    const ink = { x: canvas.x + canvas.width * 0.825, y: canvas.y + canvas.height * 0.875 };
    await page.touchscreen.tap(ink.x, ink.y);
    await page.waitForTimeout(400);
    assert.equal(await ctxKind(), "drawing", "B: tapping the ink selects the drawing");
    if (shots) await page.screenshot({ path: `${shots}/v145-selected.png` });
    passed.push("B: the empty part of a drawing passes the touch to the text underneath; the ink selects the drawing");

    // 3. Move it (mouse drag on the ink), then 接着画 + 取消 without new strokes keeps it.
    await page.mouse.move(ink.x, ink.y);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(ink.x - i * 5, ink.y - i * 5);
    await page.mouse.up();
    await page.waitForTimeout(1300);
    list = await drawings();
    assert.ok(list[0].x < drawing.x && list[0].y < drawing.y, "moved");
    const moved = list[0];
    await page.locator('.tool-dock.ctx [data-action="draw-edit"]').tap();
    await page.waitForSelector("#draw-dialog[open] .draw-canvas");
    await page.waitForTimeout(300);
    await page.locator('#draw-dialog [data-draw="cancel"]').tap();
    await page.waitForFunction(() => !document.querySelector("#draw-dialog[open]"));
    list = await drawings();
    assert.deepEqual([list[0].mediaRef, list[0].x, list[0].y], [moved.mediaRef, moved.x, moved.y], "C: nothing new → 取消 keeps the earlier drawing as it was");
    passed.push("move the drawing; 接着画 → 取消 with nothing new keeps the earlier drawing");

    // 4. 接着画 + a stroke + 取消 → asks; 「取消」 keeps the board; 「确定」 discards only the new strokes.
    await page.touchscreen.tap(ink.x - 30, ink.y - 30);
    await page.waitForTimeout(300);
    if ((await ctxKind()) !== "drawing") await page.touchscreen.tap(canvas.x + canvas.width * 0.8, canvas.y + canvas.height * 0.85);
    await page.locator('.tool-dock.ctx [data-action="draw-edit"]').tap();
    await page.waitForSelector("#draw-dialog[open] .draw-canvas");
    await strokes([[0.4, 0.4, 0.6, 0.5]]);
    // V10.57: the question is inside the board — 保存到页面 / 放弃修改 / 继续画.
    await page.locator('#draw-dialog [data-draw="cancel"]').tap();
    await page.waitForSelector("#draw-dialog .draw-ask:not([hidden])");
    assert.match(await page.locator("#draw-dialog .draw-ask").innerText(), /放弃修改[\s\S]*继续画/);
    await page.locator('#draw-dialog [data-draw-answer="stay"]').tap();
    await page.waitForTimeout(200);
    assert.ok(await page.locator("#draw-dialog[open]").count(), "C: 继续画 keeps drawing");
    await page.locator('#draw-dialog [data-draw="cancel"]').tap();
    await page.waitForSelector("#draw-dialog .draw-ask:not([hidden])");
    await page.locator('#draw-dialog [data-draw-answer="discard"]').tap();
    await page.waitForFunction(() => !document.querySelector("#draw-dialog[open]"));
    list = await drawings();
    assert.equal(list[0].mediaRef, moved.mediaRef, "C: the earlier drawing is untouched");
    passed.push("C: 取消 with new strokes asks first; keep drawing or discard only the new strokes");

    // 5. 接着画 + a stroke + 完成, the first save fails → asked to try again → kept.
    await page.locator('.tool-dock.ctx [data-action="draw-edit"]').tap().catch(async () => {
      await page.touchscreen.tap(canvas.x + canvas.width * 0.8, canvas.y + canvas.height * 0.85);
      await page.locator('.tool-dock.ctx [data-action="draw-edit"]').tap();
    });
    await page.waitForSelector("#draw-dialog[open] .draw-canvas");
    await strokes([[0.4, 0.4, 0.6, 0.5]]);
    await page.evaluate(() => {
      // media.put writes with add(); the first write fails as if the device were full.
      const add = IDBObjectStore.prototype.add;
      let fail = 1;
      IDBObjectStore.prototype.add = function (...args) {
        if (this.name === "media" && fail-- > 0) throw new DOMException("full", "QuotaExceededError");
        return add.apply(this, args);
      };
    });
    await page.locator('#draw-dialog [data-draw="done"]').tap();
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /再试一次/);
    await page.locator("#confirm-ok").tap();
    await page.waitForFunction((ref) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const all = [...Object.values(s.drafts), ...s.entries].flatMap((d) => [d, ...(d.moments || [])]).flatMap((p) => p.layers || []);
      return all.some((l) => l.drawing && l.mediaRef !== ref);
    }, moved.mediaRef);
    list = await drawings();
    assert.equal(list.length, 1, "still one drawing layer");
    assert.notEqual(list[0].mediaRef, moved.mediaRef, "D: the new strokes were kept after trying again");
    passed.push("D: a failed save asks to try again and keeps the drawing");

    // 6. Save the page → Reader; reload → the drawing is still there and draws.
    await deselect();
    await page.locator('[data-action="save-entry"]').first().tap();
    await page.waitForSelector(".reader-page");
    const ref = list[0].mediaRef;
    await page.reload();
    await page.waitForSelector(".hero");
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === k), today);
    assert.ok(layersOf(saved).some((l) => l.drawing && l.mediaRef === ref), "saved after a reload");
    await page.locator(`[data-action="open-day"][data-date="${today}"]`).first().tap();
    await page.waitForSelector(".chapter-canvas .drawing-layer img");
    await page.waitForFunction(() => [...document.querySelectorAll(".chapter-canvas .drawing-layer img")].every((i) => i.complete && i.naturalWidth > 0));
    if (shots) await page.screenshot({ path: `${shots}/v145-reopened.png` });
    passed.push("save → Reader; after a reload the drawing is in the saved page and draws in Day Detail");

    assert.deepEqual(errors, []);
    console.log(`V10.46 drawing E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
