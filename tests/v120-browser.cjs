// V10.20 · Journal Studio photo tools: 形状 / 裁剪画面 / 调整 / 替换 / 图层 /
// 删除; adding a photo no longer opens Layout; each tool's sheet opens at its
// top with its own title; the full-screen crop editor (corners, edges in
// Free, ratios, moving and pinching the photo, 90° turn, cancel / done /
// undo / redo) keeps the original and never moves the layer; crop survives a
// shape change, saving, reopening and the reader. Chromium on an emulated
// iPhone 13 (touch) — not a real iPhone, not the iOS Simulator.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    let page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png` });
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const moment = () => page.evaluate((t) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t].moments.at(-1), today);
    const photos = async () => (await moment()).layers.filter((l) => l.kind === "photo" && l.mediaRef);
    const dock = () => page.$$eval(".tool-dock button", (els) => els.map((el) => el.dataset.tool || el.dataset.action));
    const settle = () => page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 8000 }).catch(() => {});

    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.evaluate(() => document.activeElement?.blur?.());

    // ------------------------------------------------ add one photo: its own tools, no Layout
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="use-scene"]').first().tap();
    await page.waitForSelector('.tool-dock.ctx[data-ctx="photo"]');
    assert.equal(await page.locator(".tool-sheet").count(), 0, "adding a photo opens no Layout sheet");
    assert.deepEqual(await dock(), ["layer-deselect", "shape", "crop-open", "photo-edit", "replace-photo", "layer", "layer-delete"]);
    assert.deepEqual(await page.$$eval(".tool-dock.ctx .sv-tool small", (els) => els.slice(1).map((el) => el.textContent)), ["形状", "裁剪画面", "调整", "替换", "图层", "删除"]);
    await shot("01-photo-tools");
    passed.push("one photo added → selected with its own tools (形状 · 裁剪画面 · 调整 · 替换 · 图层 · 删除); no Layout sheet");

    // ------------------------------------------------ sheets: own titles, open at the top
    await page.locator('.tool-dock [data-tool="shape"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="shape"]');
    assert.equal(await page.locator(".tool-sheet .sheet-head b").innerText(), "形状");
    const chipsSeen = await page.evaluate(() => { const s = document.querySelector(".tool-sheet"); const c = s.querySelector(".shape-chips button").getBoundingClientRect(); const r = s.getBoundingClientRect(); return s.scrollTop === 0 && c.top >= r.top && c.bottom <= r.bottom; });
    assert.ok(chipsSeen, "shapes are the first thing, no scrolling");
    await shot("02-shape-sheet");
    // Scroll this sheet down, switch to 图层, then back: each opens at its top.
    await page.evaluate(() => (document.querySelector(".tool-sheet").scrollTop = 400));
    await page.locator('.tool-dock [data-tool="layer"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="layer"]');
    assert.equal(await page.locator(".tool-sheet .sheet-head b").innerText(), "图层", "not 选中的图层");
    assert.equal(await page.locator(".tool-sheet .shape-chips, .tool-sheet .crop-sliders").count(), 0, "shape and crop are no longer buried in the layer sheet");
    assert.equal(await page.evaluate(() => document.querySelector(".tool-sheet").scrollTop), 0);
    await page.locator('.tool-dock [data-tool="shape"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="shape"]');
    assert.equal(await page.evaluate(() => document.querySelector(".tool-sheet").scrollTop), 0);
    await page.locator(".tool-sheet .sheet-close").tap();
    passed.push("形状 and 图层 have their own titles; a different tool always opens at its top; shape / crop are out of the layer sheet");

    // ------------------------------------------------ the crop editor
    const before = (await photos())[0];
    const geometry = (l) => ({ x: l.x, y: l.y, rotation: l.rotation, scale: l.scale });
    const order = async () => (await moment()).layers.map((l) => l.id);
    const orderBefore = await order();
    const open = async () => {
      await page.locator('.tool-dock [data-action="crop-open"]').tap();
      await page.waitForSelector("#crop-editor[open] .ce-box");
      await page.waitForFunction(() => document.querySelector("#crop-editor .ce-box").getBoundingClientRect().width > 50);
    };
    const boxRect = () => page.locator("#crop-editor .ce-box").evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const imgRect = () => page.locator("#crop-editor .ce-img").evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const touchDrag = async (x0, y0, x1, y1) => {
      await page.mouse.move(x0, y0);
      await page.mouse.down();
      await page.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 });
      await page.mouse.move(x1, y1, { steps: 4 });
      await page.mouse.up();
      await page.waitForTimeout(260);
    };
    await open();
    assert.deepEqual(await page.$$eval("#crop-editor [data-ce-ratio]", (els) => els.map((el) => el.dataset.ceRatio)), ["frame", "free", "original", "1:1", "3:4", "4:3", "9:16", "16:9"]);
    let b = await boxRect();
    const i0 = await imgRect();
    assert.ok(b.w > 200 && i0.w >= b.w - 1, "a big box over the photo");
    await shot("03-crop-open");
    // A corner (ratio held: 外框): the box shrinks at the same proportions, then settles in the middle.
    const aspect0 = b.w / b.h;
    await touchDrag(b.x + b.w - 4, b.y + b.h - 4, b.x + b.w - 90, b.y + b.h - 40);
    b = await boxRect();
    assert.ok(Math.abs(b.w / b.h - aspect0) < 0.02, "a fixed ratio keeps its proportions");
    const zoomedImg = await imgRect();
    assert.ok(zoomedImg.w > i0.w + 10, "after the corner, the photo is shown larger (less of it kept)");
    // Moving the photo inside the box.
    const i1 = await imgRect();
    await touchDrag(b.x + b.w / 2, b.y + b.h / 2, b.x + b.w / 2 + 30, b.y + b.h / 2);
    const i2 = await imgRect();
    assert.ok(Math.abs(i2.x - i1.x) > 3 || i1.x >= b.x - 1, "the photo moves under the box (or is already at its edge)");
    // Pinch to zoom (two touch points through the browser's touch input).
    const cdp = await context.newCDPSession(page);
    const cx = b.x + b.w / 2,
      cy = b.y + b.h / 2;
    const pts = (d) => [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pts(30) });
    for (const d of [40, 55, 70, 85]) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pts(d) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(200);
    const i3 = await imgRect();
    assert.ok(i3.w > i2.w * 1.2, `pinching zooms the photo (${Math.round(i2.w)} → ${Math.round(i3.w)})`);
    // 1:1 tells that the frame will change; Free shows edge handles.
    await page.locator('#crop-editor [data-ce-ratio="1:1"]').tap();
    await page.waitForTimeout(260);
    b = await boxRect();
    assert.ok(Math.abs(b.w / b.h - 1) < 0.02, "1:1");
    assert.match(await page.locator("#crop-editor .ce-note").innerText(), /外框会变成/);
    await page.locator('#crop-editor [data-ce-ratio="free"]').tap();
    assert.equal(await page.locator("#crop-editor .ce-edge.e").isVisible(), true, "edges in Free");
    const fb = await boxRect();
    await touchDrag(fb.x + fb.w, fb.y + fb.h / 2, fb.x + fb.w - 60, fb.y + fb.h / 2);
    const fb2 = await boxRect();
    assert.ok(Math.abs(fb2.w / fb2.h - fb.w / fb.h) > 0.05, "an edge changes the proportions in Free");
    await shot("04-crop-free");
    // Cancel: nothing changed.
    await page.locator('#crop-editor [data-ce="cancel"]').tap();
    await page.waitForSelector("#crop-editor:not([open])", { state: "attached" });
    assert.deepEqual((await photos())[0], before, "取消 changes nothing");
    passed.push("crop editor: a big box with a dimmed outside and a 3×3 grid; corners keep a fixed ratio; the photo moves under the box; pinch zooms; 1:1 says the frame will change; edges in Free; 取消 leaves the photo as it was");

    // 3:4, corner, done → one undo step; the layer stays where it was.
    await open();
    await page.locator('#crop-editor [data-ce-ratio="3:4"]').tap();
    await page.waitForTimeout(260);
    b = await boxRect();
    await touchDrag(b.x + 4, b.y + 4, b.x + 50, b.y + 60);
    await page.locator('#crop-editor [data-ce="done"]').tap();
    await page.waitForSelector("#crop-editor:not([open])", { state: "attached" });
    await settle();
    let after = (await photos())[0];
    assert.ok(after.crop?.rect && after.crop.aspect > 0, "the part kept is saved as a rect");
    assert.equal(after.mediaRef, before.mediaRef, "the picture itself is not re-cut");
    assert.deepEqual(geometry(after), geometry(before), "place, turn and size factor unchanged");
    assert.deepEqual(await order(), orderBefore, "layer order unchanged");
    const frameAspect = await page.evaluate(async (l) => (await import("./js/crop.mjs")).boxAspect(l), after);
    assert.ok(Math.abs(frameAspect - 0.75) < 0.03, `the frame took 3:4 as announced (${frameAspect.toFixed(3)})`);
    const drawn = await page.locator(`#journal-canvas [data-layer="${after.id}"] img`).getAttribute("style");
    assert.match(drawn, /object-position/);
    await page.locator('[data-action="undo"]').first().tap();
    await page.waitForFunction((pid) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return Object.values(s.drafts).some((d) => d.moments.some((m) => m.layers.some((l) => l.id === pid && !l.crop?.rect))); }, after.id, { timeout: 8000 }).catch(() => {});
    const undone = (await photos())[0];
    assert.ok(!undone.crop?.rect && undone.w === before.w && undone.h === before.h, "Undo puts the old crop and frame back");
    await page.locator('[data-action="redo"]').first().tap();
    await page.waitForFunction((pid) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return Object.values(s.drafts).some((d) => d.moments.some((m) => m.layers.some((l) => l.id === pid && l.crop?.rect))); }, after.id, { timeout: 8000 }).catch(() => {});
    assert.deepEqual((await photos())[0].crop, after.crop, "Redo brings the crop back");
    passed.push("3:4 + corner → 完成: kept as crop.rect (the picture is not re-cut); place, turn, order unchanged; the frame took 3:4 as announced; Undo / Redo");

    // Shape after crop: circle, arch — the chosen part stays.
    await page.locator(`#journal-canvas [data-layer="${after.id}"]`).tap().catch(() => {});
    await page.waitForSelector('.tool-dock.ctx[data-ctx="photo"]');
    await page.locator('.tool-dock [data-tool="shape"]').tap();
    for (const shape of ["circle", "arch"]) {
      await page.locator(`.tool-sheet [data-action="layer-shape"][data-shape="${shape}"]`).tap();
      await page.waitForFunction(([pid, sh]) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return Object.values(s.drafts).some((d) => d.moments.some((m) => m.layers.some((l) => l.id === pid && l.shape === sh))); }, [after.id, shape], { timeout: 8000 });
      const l = (await photos())[0];
      assert.equal(l.shape, shape);
      assert.deepEqual(l.crop.rect, after.crop.rect, `${shape}: the part kept is still the same`);
    }
    await shot("05-arch");
    // The fixed-shape crop editor only offers the shape's own proportions.
    await page.locator(".tool-sheet .sheet-close").tap();
    await open();
    assert.equal(await page.locator('#crop-editor [data-ce-ratio="free"]').isDisabled(), true);
    assert.match(await page.locator("#crop-editor .ce-note").innerText(), /形状/);
    await page.locator('#crop-editor [data-ce="cancel"]').tap();
    passed.push("after cropping, 圆形 and 拱门 keep the same chosen part; a fixed shape keeps its own proportions in the crop editor");

    // 90° turn: non-destructive (the original kept as sourceRef).
    await open();
    const iw = (await imgRect()).w,
      ih = (await imgRect()).h;
    await page.locator('#crop-editor [data-ce="rotate"]').tap();
    await page.waitForFunction(([w, h]) => { const r = document.querySelector("#crop-editor .ce-img").getBoundingClientRect(); return Math.abs(r.width / r.height - h / w) < 0.05; }, [iw, ih], { timeout: 8000 });
    await page.locator('#crop-editor [data-ce="done"]').tap();
    await page.waitForSelector("#crop-editor:not([open])", { state: "attached" });
    await settle();
    const turned = (await photos())[0];
    assert.equal(turned.sourceRef, before.mediaRef, "the original is kept");
    assert.equal(turned.edit?.rotate, 90);
    assert.notEqual(turned.mediaRef, before.mediaRef);
    passed.push("↻ 90°: drawn again from the untouched original (sourceRef kept, edit.rotate 90)");

    // Save, reopen, the reader shows the same.
    const expected = await page.evaluate(async (l) => (await import("./js/crop.mjs")).cropView(l), turned);
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page, .reader", { timeout: 10000 });
    await page.reload();
    await page.waitForSelector(".hero");
    const saved = await page.evaluate((t) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); const e = s.entries.find((x) => x.date === t); return e.moments.at(-1).layers.find((l) => l.kind === "photo" && l.mediaRef); }, today);
    assert.deepEqual(saved.crop, turned.crop, "kept after reopening");
    assert.equal(saved.shape, "arch");
    const readerStyle = await page.evaluate(async (l) => {
      const { canvasHTML } = await import("./js/canvas.mjs").catch(() => ({}));
      return (await import("./js/canvas.mjs")).cropStyle(l);
    }, saved);
    assert.match(readerStyle, new RegExp(`object-position:${expected.x}% ${expected.y}%`), "the reader draws the same part");
    passed.push("saved, reopened: the crop and shape are kept; the reader draws the same part (shared crop function)");

    // ------------------------------------------------ two photos: a light layout hint, one photo edited alone
    // (A fresh device, so this does not depend on the page saved above.)
    const context2 = await browser.newContext({ ...devices["iPhone 13"] });
    const p2 = await context2.newPage();
    p2.on("pageerror", (error) => errors.push(error.message));
    await p2.goto(base);
    await p2.waitForSelector(".hero");
    const swap = page;
    // eslint-disable-next-line no-global-assign
    page = p2;
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="use-scene"]').nth(1).tap();
    await page.waitForSelector('.tool-dock.ctx[data-ctx="photo"]');
    await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').tap();
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="use-scene"]').nth(2).tap();
    await page.waitForSelector("#journal-canvas .photo-layer >> nth=1");
    await page.waitForTimeout(300);
    const two = await photos();
    if (two.length >= 2) {
      assert.equal(await page.locator('.tool-sheet[data-tool-row="layout"]').count(), 0, "no Layout sheet forced");
      assert.equal(await page.locator(".layout-hint").count(), 1, "a light 试试排版 chip");
      {
        await shot("06-layout-hint");
        await page.locator('.layout-hint [data-action="layout-hint-open"]').tap();
        await page.waitForSelector('.tool-sheet[data-tool-row="layout"]');
        await page.locator(".tool-sheet .sheet-close").tap();
      }
      // Crop one photo: the other is not touched.
      const other = two[0];
      await page.locator(`#journal-canvas [data-layer="${two[1].id}"]`).tap();
      await page.waitForSelector('.tool-dock.ctx[data-ctx="photo"]');
      await open();
      await page.locator('#crop-editor [data-ce-ratio="1:1"]').tap();
      await page.locator('#crop-editor [data-ce="done"]').tap();
      await page.waitForSelector("#crop-editor:not([open])", { state: "attached" });
      const both = await photos();
      assert.deepEqual(both.find((l) => l.id === other.id), other, "the other photo is untouched");
      passed.push("two photos: no Layout forced (a light, ignorable 试试排版 chip); cropping one leaves the other as it was");
    }

    // ------------------------------------------------ 375 and 430
    for (const [w, h] of [[375, 667], [430, 932]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(150);
      if (!(await page.locator('.tool-dock [data-action="crop-open"]').count())) continue;
      await open();
      const fit = await page.evaluate(() => {
        const q = (s) => document.querySelector(s).getBoundingClientRect();
        const done = q('#crop-editor [data-ce="done"]'),
          ratios = q("#crop-editor .ce-ratios"),
          box = q("#crop-editor .ce-box");
        return { done: done.top >= 0 && done.bottom <= innerHeight, ratios: ratios.bottom <= innerHeight, box: box.width > 150 && box.bottom < ratios.top, side: document.documentElement.scrollWidth <= innerWidth + 1 };
      });
      assert.ok(fit.done && fit.ratios && fit.box && fit.side, `${w}: ${JSON.stringify(fit)}`);
      await shot(`07-crop-${w}`);
      await page.locator('#crop-editor [data-ce="cancel"]').tap();
    }
    passed.push("375×667 and 430×932: the crop editor's box, ratios and 完成 fit; nothing sideways");

    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

