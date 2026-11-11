// V10.1 · Journal Studio contextual tools (Phase B): the bottom row becomes
// the selected item's tools (photo / text / sticker), text font · size ·
// colour · alignment, typing on the paper, and a note's title / words turned
// into free text boxes with their look and nothing lost. Synthetic data only.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

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
    const story = async () => (await stored()).drafts[today].moments.at(-1);
    const settle = () => page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved");
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const dock = () => page.$$eval(".tool-dock button", (els) => els.map((el) => el.dataset.tab || el.dataset.tool || el.dataset.action));
    const blur = async () => {
      await page.evaluate(() => document.activeElement?.blur?.());
      await page.waitForFunction(() => !document.body.classList.contains("typing"));
    };

    // 1. 随手写: the title and words take font, size, colour and alignment
    // while typing; they stay where the page puts them (no handles).
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("下午的咖啡");
    await page.waitForSelector("#type-bar:not([hidden])");
    assert.equal(await page.locator("#type-bar .type-to-box").isVisible(), true, "转为自由文字框 is offered for a note's title");
    await page.locator('#type-bar [data-type-font="zh-kuaile"]').tap();
    await page.locator('#type-bar [data-type-size="2"]').tap();
    await page.locator('#type-bar [data-type-color="#B5838D"]').tap();
    // One button steps through the alignments: centre → right.
    const before = await page.locator('#journal-canvas [data-inline="title"]').evaluate((el) => getComputedStyle(el).textAlign);
    await page.locator('#type-bar [data-type-align="cycle"]').tap();
    await page.locator('#journal-canvas [data-inline="body"]').tap();
    await page.keyboard.type("又是充满能量的一天。");
    await page.locator('#type-bar [data-type-color="#6D8299"]').tap();
    await settle();
    let s = await story();
    assert.equal(s.title, "下午的咖啡");
    assert.equal(s.font, "zh-kuaile");
    assert.equal(s.textStyle.color, "#B5838D");
    assert.ok(["left", "center", "right"].includes(s.textStyle.align) && s.textStyle.align !== before, `alignment changed from ${before} to ${s.textStyle.align}`);
    assert.equal(await page.locator('#journal-canvas [data-inline="title"]').evaluate((el) => getComputedStyle(el).textAlign), s.textStyle.align, "the paper shows it");
    assert.equal(s.bodyStyle.color, "#6D8299");
    assert.equal(s.layers.length, 0, "the title and words are not layers: they cannot be dragged");
    assert.equal(await page.locator("#journal-canvas .layer-handle").count(), 0);
    const look = { titleSize: s.textStyle.size, titleAlign: s.textStyle.align, bodyFont: s.bodyFont || s.font };
    await shot("v101-note-style");
    passed.push("随手写: title and words take font, size, colour and alignment while typing; they stay auto-placed");

    // 2. 转为自由文字框: the words become text boxes with the same look — once.
    await page.locator('#journal-canvas [data-inline="title"]').tap();
    await page.locator("#type-bar .type-to-box").tap();
    await page.waitForSelector("#journal-canvas .text-layer");
    await blur();
    await settle();
    s = await story();
    const boxes = s.layers.filter((l) => l.kind === "text");
    assert.deepEqual(boxes.map((l) => l.text), ["下午的咖啡", "又是充满能量的一天。"], "both pieces, each exactly once");
    assert.equal(s.body, "", "the words are not kept twice");
    assert.equal(s.title, "下午的咖啡", "still the page's name");
    assert.notEqual(s.layoutTemplate, "text");
    assert.equal(boxes[0].fontId, "zh-kuaile");
    assert.equal(boxes[0].fontSize, look.titleSize);
    assert.equal(boxes[0].color, "#B5838D");
    assert.equal(boxes[0].align, look.titleAlign);
    assert.equal(boxes[1].color, "#6D8299");
    assert.equal(boxes[1].fontId, look.bodyFont);
    assert.equal(await page.locator("#journal-canvas .text-layer").count(), 2);
    // One undo brings the note back as it was.
    await page.locator('.stage-bar [data-action="undo"]').tap();
    await settle();
    s = await story();
    assert.equal(s.layoutTemplate, "text");
    assert.equal(s.body, "又是充满能量的一天。");
    assert.equal(s.layers.length, 0);
    await page.locator('.stage-bar [data-action="redo"]').tap();
    await settle();
    s = await story();
    assert.equal(s.layers.filter((l) => l.kind === "text").length, 2);
    await shot("v101-converted");
    passed.push("转为自由文字框: title and words become text boxes with their font, size, colour and alignment; nothing doubled or lost; undo restores the note");

    // 3. Text selected: the bottom row is the text's tools; no floating menu.
    const first = s.layers.find((l) => l.text === "下午的咖啡");
    await page.locator(`#journal-canvas [data-layer="${first.id}"]`).tap();
    await page.waitForSelector('.tool-dock.ctx[data-ctx="text"]');
    assert.deepEqual(await dock(), ["layer-deselect", "ctx-edit-text", "font", "color", "align", "layer", "layer-delete"]);
    assert.equal(await page.locator(".layer-bar").count(), 0);
    assert.equal(await page.locator('.tool-dock [data-action="add-photos"], .tool-dock [data-tool="more"]').count(), 0, "only the tools for text");
    await shot("v101-text");
    // Font and size.
    await page.locator('.tool-dock [data-action="text-style"][data-tab="font"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="textstyle"] .type-sheet[data-tab="font"]');
    await page.locator('.type-sheet [data-type-font="zh-wenkai"]').tap();
    await page.locator('.type-sheet [data-type-size="2"]').tap();
    await shot("v101-text-font");
    // Colour.
    await page.locator('.tool-dock [data-action="text-style"][data-tab="color"]').tap();
    await page.waitForSelector('.type-sheet[data-tab="color"]');
    await page.locator('.type-sheet [data-type-color="#7D8E66"]').tap();
    // Alignment.
    await page.locator('.tool-dock [data-action="text-style"][data-tab="align"]').tap();
    await page.waitForSelector('.type-sheet[data-tab="align"]');
    await page.locator('.type-sheet [data-type-align="center"]').tap();
    assert.equal(await page.locator('.type-sheet [data-type-align="center"]').getAttribute("aria-pressed"), "true");
    await settle();
    s = await story();
    let layer = s.layers.find((l) => l.id === first.id);
    assert.equal(layer.fontId, "zh-wenkai");
    assert.ok(layer.fontSize > first.fontSize, "bigger");
    assert.equal(layer.color.toUpperCase(), "#7D8E66");
    assert.equal(layer.align, "center");
    assert.equal(await page.locator(`#journal-canvas [data-layer="${first.id}"]`).evaluate((el) => getComputedStyle(el).textAlign), "center");
    assert.equal(s.layers.find((l) => l.text.startsWith("又是")).color, "#6D8299", "the other box is untouched");
    // Tapping the open tab closes the sheet.
    await page.locator('.tool-dock [data-action="text-style"][data-tab="align"]').tap();
    await page.waitForSelector(".tool-sheet", { state: "detached" });
    // 编辑: type right on the paper.
    await page.locator('.tool-dock [data-action="ctx-edit-text"]').tap();
    await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text"));
    assert.equal(await page.locator(".tool-dock").evaluate((el) => getComputedStyle(el).display), "none", "a phone hides the row while typing");
    await page.keyboard.press("End");
    await page.keyboard.type("好治愈");
    await blur();
    await settle();
    s = await story();
    assert.equal(s.layers.find((l) => l.id === first.id).text, "下午的咖啡好治愈");
    // Each style change is its own undo step.
    await page.locator('.stage-bar [data-action="undo"]').tap();
    await settle();
    assert.equal((await story()).layers.find((l) => l.id === first.id).text, "下午的咖啡");
    await page.locator('.stage-bar [data-action="redo"]').tap();
    await settle();
    passed.push("text: × · edit · font · colour · align · layer · delete in the bottom row; changes apply to that box only; typing happens on the paper; undo works");

    // 4. × returns to the four tools.
    if (!(await page.locator(".tool-dock.ctx").count())) await page.locator(`#journal-canvas [data-layer="${first.id}"]`).tap();
    await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').tap();
    await page.waitForSelector(".tool-dock:not(.ctx)");
    assert.deepEqual(await dock(), ["add-photos", "add-text-layer", "stickers", "more"]);
    assert.equal(await page.locator("#journal-canvas [data-layer].active").count(), 0);

    // 5. Photo selected: replace · crop · adjust · layer · delete.
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="use-scene"]').first().tap();
    await page.waitForSelector("#journal-canvas .photo-layer img");
    await page.waitForSelector('.tool-dock.ctx[data-ctx="photo"]');
    if (await page.locator(".tool-sheet").count()) await studioClose(page);
    assert.deepEqual(await dock(), ["layer-deselect", "replace-photo", "ctx-crop", "photo-edit", "layer", "layer-delete"]);
    await shot("v101-photo");
    await settle();
    s = await story();
    const photo = s.layers.find((l) => l.kind === "photo");
    // Crop: its sliders open in the sheet; the photo is cropped, not moved.
    await page.locator('.tool-dock [data-action="ctx-crop"]').tap();
    await page.waitForSelector(".tool-sheet .crop-sliders");
    await page.locator('[data-crop-field="zoom"]').evaluate((el) => { el.value = "1.6"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await settle();
    await shot("v101-photo-crop");
    await page.locator('.tool-dock [data-action="ctx-crop"]').tap();
    await page.waitForSelector(".tool-sheet", { state: "detached" });
    s = await story();
    assert.equal(s.layers.find((l) => l.id === photo.id).crop.zoom, 1.6);
    // Adjust opens the photo editor; cancel leaves the photo alone.
    await page.locator('.tool-dock [data-action="photo-edit"]').tap();
    await page.waitForSelector("#photo-editor[open] .pe-frame");
    await page.locator('#photo-editor [data-pe-action="cancel"]').tap();
    await page.waitForSelector("#photo-editor:not([open])", { state: "attached" });
    // Layer: copy and the stacking order.
    await page.locator('.tool-dock.ctx [data-tool="layer"]').tap();
    await page.waitForSelector('.tool-sheet[data-tool-row="layer"]');
    assert.equal(await page.locator('.tool-sheet [data-action="layer-copy"], .tool-sheet [data-action="layer-front"], .tool-sheet [data-action="layer-back"], .tool-sheet [data-action="layer-forward"], .tool-sheet [data-action="layer-backward"]').count(), 5);
    await page.locator('.tool-sheet [data-action="layer-back"]').tap();
    await settle();
    s = await story();
    assert.equal(s.layers[0].id, photo.id, "sent behind the text");
    await shot("v101-photo-layer");
    await studioClose(page);
    // Drag and pinch still work on the selected photo.
    const box = await page.locator(`#journal-canvas [data-layer="${photo.id}"]`).boundingBox();
    const cdp = await context.newCDPSession(page);
    const touch = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    const cx = box.x + box.width / 2, cy = box.y + box.height * 0.8;
    await touch("touchStart", [{ x: cx, y: cy, id: 1 }]);
    for (let i = 1; i <= 6; i++) await touch("touchMove", [{ x: cx + i * 5, y: cy - i * 4, id: 1 }]);
    await touch("touchEnd", []);
    await settle();
    const moved = (await story()).layers.find((l) => l.id === photo.id);
    assert.ok(Math.abs(moved.x - photo.x) > 1 || Math.abs(moved.y - photo.y) > 1, "dragging moves the photo");
    await touch("touchStart", [{ x: cx - 12, y: cy, id: 1 }]);
    await touch("touchStart", [{ x: cx - 12, y: cy, id: 1 }, { x: cx + 12, y: cy, id: 2 }]);
    for (let i = 1; i <= 8; i++) await touch("touchMove", [{ x: cx - 12 - i * 4, y: cy, id: 1 }, { x: cx + 12 + i * 4, y: cy, id: 2 }]);
    await touch("touchEnd", []);
    await settle();
    assert.ok((await story()).layers.find((l) => l.id === photo.id).scale > moved.scale * 1.2, "two fingers scale it");
    // Delete, then undo brings it back.
    await page.locator('.tool-dock.ctx [data-action="layer-delete"]').tap();
    await settle();
    assert.equal((await story()).layers.some((l) => l.id === photo.id), false);
    await page.waitForSelector(".tool-dock:not(.ctx)");
    await page.locator('.stage-bar [data-action="undo"]').tap();
    await settle();
    assert.equal((await story()).layers.some((l) => l.id === photo.id), true, "undo restores the photo");
    passed.push("photo: × · replace · crop · adjust · layer · delete; crop sliders, photo editor, stacking order, drag and pinch all work; delete can be undone; × returns to the four tools");

    // 6. Sticker selected: only what applies to a sticker.
    if (await page.locator(".tool-dock.ctx").count()) await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').tap();
    await studioTool(page, "stickers");
    await page.locator('.tool-sheet [data-action="asset-sticker"]').first().tap();
    await studioClose(page);
    await page.waitForSelector('.tool-dock.ctx[data-ctx="sticker"]');
    assert.deepEqual(await dock(), ["layer-deselect", "layer", "layer-delete"]);
    await shot("v101-sticker");
    await page.locator('.tool-dock.ctx [data-tool="layer"]').tap();
    await page.locator('.tool-sheet [data-action="layer-copy"]').tap();
    await settle();
    assert.equal((await story()).layers.filter((l) => l.kind !== "photo" && l.kind !== "text").length, 2, "copied");
    await studioClose(page);
    passed.push("sticker: × · layer · delete; copy from the layer sheet");

    // 6b. Tapping a field inside a sheet keeps the caret there (the sheet moves
    // above the keyboard; that same tap must not count as "a tap elsewhere").
    if (await page.locator(".tool-dock.ctx").count()) await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').tap();
    await studioDetails(page);
    await page.locator('.tool-sheet [data-moment-field="title"]').tap();
    await page.waitForTimeout(900);
    assert.equal(await page.evaluate(() => document.activeElement?.dataset?.momentField), "title", "the name field keeps the caret");
    await page.keyboard.press("End");
    await page.keyboard.type("！");
    await blur();
    await settle();
    assert.equal((await story()).title, "下午的咖啡！");
    await studioClose(page);
    passed.push("a field in a sheet keeps the caret when tapped");

    // 7. Nothing is lost on 完成: text look, crop and stickers are saved.
    if (await page.locator(".tool-dock.ctx").count()) await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').tap();
    await page.waitForFunction(() => !document.querySelector(".toast.visible"), null, { timeout: 8000 }).catch(() => {});
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover)");
    const saved = (await stored()).entries.find((e) => e.date === today).moments.at(-1);
    const savedText = saved.layers.find((l) => l.id === first.id);
    assert.equal(savedText.text, "下午的咖啡好治愈");
    assert.equal(savedText.fontId, "zh-wenkai");
    assert.equal(savedText.align, "center");
    assert.equal(saved.layers.find((l) => l.id === photo.id).crop.zoom, 1.6);
    assert.equal(saved.layers.filter((l) => l.kind === "text").length, 2);
    assert.equal(await page.locator(".flip-page .layer-handle, .flip-page .tool-dock").count(), 0, "read-only page");
    passed.push("完成 keeps the text look, the crop and the stickers");

    assert.deepEqual(errors, []);
    console.log(`V10.1 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
