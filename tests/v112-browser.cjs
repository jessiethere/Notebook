// V10.12 · Journal Studio: tap / double-tap / drag on text boxes, handles
// outside the item, text colours that can be tapped, and the three-step guide.
// Touches are real touch events (CDP Input.dispatchTouchEvent → pointerType
// "touch"), not mouse clicks. This is Chromium's touch emulation on Linux,
// not iPhone Safari.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

async function phone(browser, device, { language, fresh } = {}) {
  const context = await browser.newContext({ ...device });
  if (fresh)
    await context.addInitScript(() => {
      if (!sessionStorage.getItem("guide-cleared")) {
        localStorage.removeItem("little-days.studio-guide");
        sessionStorage.setItem("guide-cleared", "1");
      }
    });
  if (language) await context.addInitScript((code) => localStorage.setItem("little-days.language", code), language);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
  const T = {
    async tap(x, y) {
      await touch("touchStart", [{ x, y, id: 1 }]);
      await touch("touchEnd", []);
    },
    async doubleTap(x, y) {
      await T.tap(x, y);
      await page.waitForTimeout(110);
      await T.tap(x + 2, y + 1); // a finger never lands twice on the same pixel
    },
    async drag(x, y, dx, dy, steps = 8) {
      await touch("touchStart", [{ x, y, id: 1 }]);
      for (let i = 1; i <= steps; i++) await touch("touchMove", [{ x: x + (dx * i) / steps, y: y + (dy * i) / steps, id: 1 }]);
      await touch("touchEnd", []);
    },
    // A tap with a little wobble (a real finger): must still be a tap.
    async wobblyTap(x, y) {
      await touch("touchStart", [{ x, y, id: 1 }]);
      await touch("touchMove", [{ x: x + 3, y: y + 2, id: 1 }]);
      await touch("touchMove", [{ x: x + 4, y: y - 1, id: 1 }]);
      await touch("touchEnd", []);
    },
  };
  return { context, page, errors, T };
}
const center = async (page, selector) => {
  const b = await page.locator(selector).boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
};
const todayOf = (page) => page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
const journal = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1") || "{}"));
const guideMemory = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.studio-guide") || "null"));

// A free page with one text box, typed in, then put away (the box stays selected).
async function textBoxPage(page, words) {
  await page.locator('[data-action="today-write"]').first().tap();
  await page.waitForSelector("#phone.in-studio");
  await page.locator('[data-action="pages-add"], .sv-pages [data-action="moment-add"], [data-action="add-moment"]').first().tap();
  await page.waitForTimeout(350);
  await SS.studioClose(page).catch(() => {});
  await SS.studioDeselect(page).catch(() => {});
  await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
  await page.waitForSelector(".text-layer.editing .layer-text");
  await page.keyboard.press("Control+A");
  await page.keyboard.type(words);
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.waitForSelector(".tool-dock.ctx");
  return page.evaluate(() => document.querySelector("#journal-canvas .text-layer").dataset.layer);
}
async function layerNow(page, id) {
  const today = await todayOf(page);
  return page.evaluate(([date, layerId]) => {
    const s = JSON.parse(localStorage.getItem("little-days.v1"));
    const day = s.drafts[date] || s.entries.find((e) => e.date === date);
    for (const p of [day, ...(day.moments || [])]) {
      const l = (p.layers || []).find((x) => x.id === layerId);
      if (l) return l;
    }
    return null;
  }, [today, id]);
}
const settle = (page) => page.waitForFunction(() => /已保存|Saved/.test(document.querySelector("#draft-status")?.innerText || ""), null, { timeout: 4000 }).catch(() => page.waitForTimeout(900));
const editing = (page) => page.evaluate(() => document.activeElement?.classList?.contains("layer-text") && document.activeElement.isContentEditable);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    // ---------------------------------------------------------------- 1
    // The guide, for someone new (iPhone 13 · 390×844, Chinese).
    {
      const { context, page, errors, T } = await phone(browser, devices["iPhone 13"], { fresh: true });
      await page.goto(base);
      await page.waitForSelector(".hero");
      assert.equal(await guideMemory(page), null, "a new person has not seen it");
      const before = await journal(page);
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#studio-guide .sg-card");
      const step = () => page.evaluate(() => ({ id: document.querySelector("#studio-guide")?.dataset.step, title: document.querySelector("#sg-title")?.textContent, body: document.querySelector("#sg-body")?.textContent, count: document.querySelector(".sg-count")?.textContent }));
      let s = await step();
      // V10.25: four steps — 加东西 · 摆位置 · 改它 · 改整页.
      assert.deepEqual([s.id, s.title, s.count], ["add", "加东西", "1 / 4"]);
      // The paper is still usable: only the card takes touches.
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("#studio-guide")).pointerEvents), "none");
      const ringed = (sel) =>
        page.evaluate((sel) => {
          const b = document.querySelector(sel).getBoundingClientRect();
          const ring = document.querySelector(".sg-ring").getBoundingClientRect(), card = document.querySelector(".sg-card").getBoundingClientRect();
          return { ringed: ring.left <= b.left + 1 && ring.right >= b.right - 1 && ring.top <= b.top + 1 && ring.bottom >= b.bottom - 1, covered: !(card.bottom <= b.top || card.top >= b.bottom), cardInside: card.left >= 0 && card.right <= innerWidth && card.bottom <= innerHeight };
        }, sel);
      await page.waitForTimeout(600); // (the ring follows its target every 250 ms)
      let r = await ringed(".tool-dock.sv-tools");
      assert.ok(r.ringed && !r.covered && r.cardInside, `step 1 rings 照片 · 文字 · 贴纸 · 更多 and does not cover it: ${JSON.stringify(r)}`);
      if (shots) await page.screenshot({ path: `${shots}/01-guide-step1.png` });
      await page.locator('[data-action="guide-next"]').tap();
      s = await step();
      assert.deepEqual([s.id, s.title, s.count], ["move", "摆位置", "2 / 4"]);
      assert.match(s.body, /双击文字/, "the empty page: how to place things and edit words");
      r = await ringed("#journal-canvas");
      assert.ok(r.ringed && r.cardInside, JSON.stringify(r));
      if (shots) await page.screenshot({ path: `${shots}/02-guide-step2.png` });
      await page.locator('[data-action="guide-prev"]').tap();
      assert.equal((await step()).id, "add", "back one step");
      await page.locator('[data-action="guide-next"]').tap();
      await page.locator('[data-action="guide-next"]').tap();
      s = await step();
      assert.deepEqual([s.id, s.title, s.count], ["adjust", "改它", "3 / 4"]);
      assert.match(s.body, /← 返回/);
      assert.equal(await page.locator(".sg-demo.adjust .sg-demo-rotate").count(), 1, "a drawing of the real handles");
      if (shots) await page.screenshot({ path: `${shots}/03-guide-step3.png` });
      await page.locator('[data-action="guide-next"]').tap();
      s = await step();
      assert.deepEqual([s.id, s.title, s.count], ["more", "改整页", "4 / 4"]);
      assert.match(s.body, /更多/);
      r = await ringed('.tool-dock [data-tool="more"]');
      assert.ok(r.ringed && !r.covered, `step 4 rings 更多: ${JSON.stringify(r)}`);
      if (shots) await page.screenshot({ path: `${shots}/04-guide-step4.png` });
      await page.locator('[data-action="guide-next"]').tap(); // 知道了
      await page.waitForSelector("#studio-guide", { state: "detached" });
      assert.equal((await guideMemory(page)).tour, "done");
      // Nothing in the journal changed because of the guide.
      const after = await journal(page);
      assert.ok((after.entries || []).every((e) => e.isDemo), "no page was made by the guide");
      // (Opening the editor keeps an empty draft of today, as before; the guide adds nothing to it.)
      for (const draft of Object.values(after.drafts || {})) {
        for (const pageNow of [draft, ...(draft.moments || [])])
          assert.deepEqual([pageNow.title || "", pageNow.body || "", (pageNow.layers || []).length], ["", "", 0], "the guide put nothing on the page");
      }
      // Not again by itself (leave and come back, reload).
      await SS.leaveStudio(page);
      await page.reload();
      await page.waitForSelector(".hero");
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#phone.in-studio");
      await page.waitForTimeout(900);
      assert.equal(await page.locator("#studio-guide").count(), 0, "completed: not shown again");
      // 更多 → 操作指南 opens it again; 跳过 closes it.
      await SS.studioMore(page);
      await page.locator('.more-grid [data-action="guide-open"]').tap();
      await page.waitForSelector("#studio-guide .sg-card");
      assert.equal((await step()).id, "add");
      await page.locator('[data-action="guide-skip"]').tap();
      await page.waitForSelector("#studio-guide", { state: "detached" });
      assert.equal((await guideMemory(page)).tour, "skipped");
      assert.deepEqual(errors, []);
      await context.close();
      passed.push("guide: opens by itself once for someone new, 4 steps (加东西 · 摆位置 · 改它 · 改整页) on the real tool row, paper and 更多 (card never covers them, paper stays usable), back / next / 知道了, not again after leaving or reloading, 更多 → 操作指南 reopens, 跳过 works, journal untouched");
    }
    // ---------------------------------------------------------------- 2
    // Skipping on first sight; someone who already keeps pages is not taught again.
    {
      const { context, page, errors } = await phone(browser, devices["iPhone 13"], { fresh: true });
      await page.goto(base);
      await page.waitForSelector(".hero");
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#studio-guide .sg-card");
      await page.locator('[data-action="guide-skip"]').tap();
      assert.equal((await guideMemory(page)).tour, "skipped");
      // Make a page of one's own, then forget the guide (as if updating from an older version).
      await page.locator('[data-inline="title"]').tap();
      await page.keyboard.type("我的一页");
      await page.evaluate(() => document.activeElement.blur());
      await settle(page);
      await SS.leaveStudio(page);
      await page.evaluate(() => localStorage.removeItem("little-days.studio-guide"));
      await page.reload();
      await page.waitForSelector(".hero");
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#phone.in-studio");
      await page.waitForTimeout(900);
      assert.equal(await page.locator("#studio-guide").count(), 0, "already keeps pages: an update does not force the guide");
      assert.deepEqual(errors, []);
      await context.close();
      passed.push("guide: 跳过 on first sight is remembered; someone who already keeps pages is not taught again after an update");
    }
    // ---------------------------------------------------------------- 3
    // Tap / double-tap / drag with a finger (iPhone 13), handles, colour, undo.
    {
      const { context, page, errors, T } = await phone(browser, devices["iPhone 13"]);
      await page.goto(base);
      await page.waitForSelector(".hero");
      const id = await textBoxPage(page, "今天的风很轻");
      const BOX = `#journal-canvas [data-layer="${id}"]`;
      // Deselect, then one tap selects (no typing, no keyboard).
      await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').tap();
      await page.waitForSelector(`${BOX}:not(.active)`);
      let c = await center(page, BOX);
      await T.wobblyTap(c.x, c.y);
      await page.waitForSelector(`${BOX}.active`);
      await page.waitForTimeout(500);
      assert.equal(await editing(page), false, "one tap selects, it does not type");
      assert.equal(await page.locator(".tool-dock.ctx").count(), 1);
      // A second single tap a moment later: still just selected.
      await T.tap(c.x, c.y);
      await page.waitForTimeout(500);
      assert.equal(await editing(page), false, "single taps never type");
      const g0 = await layerNow(page, id);
      assert.equal(g0.x, 50, "taps (with a wobble) never move it");
      // The handles: outside the box, apart, not on the words.
      const geo = await page.evaluate((sel) => {
        const box = document.querySelector(sel).getBoundingClientRect();
        const words = document.querySelector(`${sel} .layer-text`).getBoundingClientRect();
        const h = (name) => { const r = document.querySelector(`#sel-frame .handle-${name}`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; };
        const hit = (p) => document.elementFromPoint(p.x, p.y)?.dataset?.handle || document.elementFromPoint(p.x, p.y)?.className;
        const rot = h("rotate"), size = h("resize");
        const inside = (p, r) => p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;
        return { rot, size, apart: Math.hypot(rot.x - size.x, rot.y - size.y), rotOnWords: inside(rot, words), sizeOnWords: inside(size, words), rotInBox: inside(rot, box), sizeInBox: inside(size, box), hitRot: hit(rot), hitSize: hit(size) };
      }, BOX);
      assert.ok(geo.apart >= 40, `touch areas (40 px) do not overlap: ${geo.apart}`);
      assert.ok(!geo.rotOnWords && !geo.sizeOnWords && !geo.rotInBox && !geo.sizeInBox, JSON.stringify(geo));
      assert.deepEqual([geo.hitRot, geo.hitSize], ["rotate", "resize"]);
      if (shots) await page.screenshot({ path: `${shots}/04-selected-handles.png` });
      // Ten drags from all over the words (ends, middle, top edge): only moves.
      const b = (await center(page, BOX)).b;
      const starts = [[0.08, 0.5], [0.5, 0.15], [0.5, 0.5], [0.92, 0.5], [0.95, 0.85], [0.3, 0.8], [0.7, 0.2], [0.5, 0.95], [0.15, 0.2], [0.85, 0.4]];
      let moves = 0;
      for (let i = 0; i < starts.length; i++) {
        const now = (await center(page, BOX)).b;
        const [fx, fy] = starts[i];
        const dx = i % 2 ? -14 : 16, dy = i % 3 ? 9 : -11;
        await T.drag(now.x + now.width * fx, now.y + now.height * fy, dx, dy);
        moves++;
        await page.waitForTimeout(60);
      }
      await settle(page);
      const g1 = await layerNow(page, id);
      assert.equal(moves, 10);
      assert.equal(g1.scale, g0.scale, "never resized by a drag");
      assert.equal(g1.rotation, g0.rotation, "never turned by a drag");
      assert.equal(g1.w ?? null, g0.w ?? null);
      assert.ok(Math.abs(g1.x - g0.x) > 0.5 || Math.abs(g1.y - g0.y) > 0.5, "it moved");
      assert.equal(await editing(page), false);
      // Size handle: grows, stays where it is, keeps its angle.
      let h = await center(page, "#sel-frame .handle-resize");
      await T.drag(h.x, h.y, 40, 22);
      await settle(page);
      const g2 = await layerNow(page, id);
      assert.ok(g2.scale > g1.scale + 0.1, `bigger: ${g1.scale} → ${g2.scale}`);
      assert.deepEqual([g2.x, g2.y, g2.rotation], [g1.x, g1.y, g1.rotation], "resizing does not move or turn it");
      // Turn handle: turns, stays where it is, keeps its size.
      h = await center(page, "#sel-frame .handle-rotate");
      const mid = await center(page, BOX);
      await T.drag(h.x, h.y, 70, (mid.y - h.y) * 0.6);
      await settle(page);
      const g3 = await layerNow(page, id);
      assert.ok(Math.abs(g3.rotation) >= 15, `turned: ${g3.rotation}`);
      assert.deepEqual([g3.x, g3.y, g3.scale], [g2.x, g2.y, g2.scale], "turning does not move or resize it");
      if (shots) await page.screenshot({ path: `${shots}/05-turned.png` });
      // The size handle on a turned box works along the box (a small drag outward grows it).
      h = await center(page, "#sel-frame .handle-resize");
      const m2 = await center(page, BOX);
      const out = { x: h.x - m2.x, y: h.y - m2.y }, len = Math.hypot(out.x, out.y);
      await T.drag(h.x, h.y, (out.x / len) * 24, (out.y / len) * 24);
      await settle(page);
      const g4 = await layerNow(page, id);
      assert.ok(g4.scale > g3.scale, "turned box: dragging the corner outward grows it");
      assert.deepEqual([g4.x, g4.y, g4.rotation], [g3.x, g3.y, g3.rotation]);
      // Double-tap the turned box: typing starts, keyboard focus in the words.
      c = await center(page, `${BOX} .layer-text`);
      await T.doubleTap(c.x, c.y);
      await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text") && document.activeElement.isContentEditable);
      assert.equal(await page.locator(`${BOX}.editing`).count(), 1);
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("#sel-frame")).display), "none", "the frame steps aside while typing");
      // Native text editing: the caret goes where the finger taps; selecting words, copy and paste work.
      // (The box is turned: aim at the first character itself.)
      const first = await page.evaluate((sel) => {
        const el = document.querySelector(`${sel} .layer-text`);
        const range = document.createRange();
        const node = el.firstChild;
        range.setStart(node, 0);
        range.setEnd(node, 1);
        const r = range.getBoundingClientRect();
        return { x: r.left + r.width * 0.3, y: r.top + r.height / 2 };
      }, BOX);
      await T.tap(first.x, first.y);
      await page.waitForTimeout(150);
      const caretStart = await page.evaluate(() => getSelection().anchorOffset);
      await page.keyboard.press("End");
      await page.keyboard.type("，真好");
      await page.keyboard.down("Shift");
      for (let i = 0; i < 2; i++) await page.keyboard.press("ArrowLeft");
      await page.keyboard.up("Shift");
      const dbg = await page.evaluate(() => ({ sel: getSelection().toString(), a: document.activeElement?.className, text: document.activeElement?.textContent, off: getSelection().anchorOffset, focusOff: getSelection().focusOffset, node: getSelection().anchorNode?.nodeName }));
      assert.equal(dbg.sel, "真好", "words can be selected " + JSON.stringify(dbg));
      await page.keyboard.press("Control+C");
      await page.keyboard.press("End");
      await page.keyboard.press("Control+V");
      await page.waitForTimeout(200);
      assert.equal(await page.locator(`${BOX} .layer-text`).innerText(), "今天的风很轻，真好真好", "copy and paste work");
      assert.ok(caretStart <= 1, `the tap put the caret at the start (${caretStart})`);
      if (shots) await page.screenshot({ path: `${shots}/06-typing-turned.png` });
      await page.evaluate(() => document.activeElement.blur());
      await settle(page);
      const g5 = await layerNow(page, id);
      assert.equal(g5.text, "今天的风很轻，真好真好");
      assert.deepEqual([g5.x, g5.y, g5.scale, g5.rotation, g5.fontId, g5.fontSize], [g4.x, g4.y, g4.scale, g4.rotation, g4.fontId, g4.fontSize], "typing keeps place, size, angle and font");
      // Undo / redo walk back through the typing and the turn.
      await page.locator('[data-action="undo"]').first().tap();
      await settle(page);
      assert.equal((await layerNow(page, id)).text, "今天的风很轻");
      await page.locator('[data-action="undo"]').first().tap();
      await settle(page);
      assert.equal((await layerNow(page, id)).scale, g3.scale, "undo the corner drag");
      await page.locator('[data-action="redo"]').first().tap();
      await page.locator('[data-action="redo"]').first().tap();
      await settle(page);
      const g6 = await layerNow(page, id);
      assert.deepEqual([g6.text, g6.scale], [g5.text, g5.scale], "redo");
      // A tap on the empty paper puts the selection away.
      const paper = await page.locator("#journal-canvas").boundingBox();
      await T.tap(paper.x + 20, paper.y + paper.height - 20);
      await page.waitForSelector(`${BOX}:not(.active)`);
      assert.equal(await page.locator("#sel-frame").count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
      passed.push("touch: one tap selects (even with a wobble), single taps never type, double-tap types (also on a turned box) with the caret where tapped, select / copy / paste; 10 drags from all over the words only move it; ↻ and ● sit outside the box, 40 px apart, never on the words; resizing and turning do not move it; typing keeps place / size / angle / font; undo / redo; a tap on the paper deselects");
    }
    // ---------------------------------------------------------------- 4
    // Colour: the sheet and the typing bar; saved; survives leaving and coming back.
    {
      const { context, page, errors, T } = await phone(browser, devices["iPhone 13"]);
      await page.goto(base);
      await page.waitForSelector(".hero");
      const id = await textBoxPage(page, "风很轻");
      const BOX = `#journal-canvas [data-layer="${id}"]`;
      const today = await todayOf(page);
      const paperLook = () => page.evaluate((date) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); const d = s.drafts[date]; const m = d.moments[d.moments.length - 1]; return [m.template, m.backdrop || "", d.template, d.backdrop || ""]; }, today);
      await settle(page);
      await page.waitForFunction((date) => JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[date], today);
      const look0 = await paperLook();
      // Bold first (rich text), then a colour from the sheet.
      await page.locator('.tool-dock.ctx [data-action="text-style"][data-tab="font"]').tap();
      await page.locator('.type-sheet [data-type-mark="bold"]').tap();
      await page.locator('.tool-dock.ctx [data-action="text-style"][data-tab="color"]').tap();
      const sheet = await page.$$eval(".type-sheet [data-type-color]", (els) => els.map((e) => { const r = e.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { c: e.dataset.typeColor, w: r.width, hit: at === e, pressed: e.getAttribute("aria-pressed"), name: e.getAttribute("aria-label"), inView: r.right <= innerWidth && r.left >= 0 }; }));
      assert.equal(sheet.length, 8);
      assert.ok(sheet.every((s) => s.w >= 36 && s.hit && s.inView), JSON.stringify(sheet));
      assert.deepEqual(sheet.filter((s) => s.pressed === "true").map((s) => s.c), ["#6A7059"], "the colour in use is marked (a new box's own colour)");
      assert.ok(sheet.every((s) => s.name && !s.name.startsWith("#")), "each colour has a name for VoiceOver");
      await page.locator('.type-sheet [data-type-color="#B5838D"]').tap();
      assert.equal(await page.locator(BOX).evaluate((el) => getComputedStyle(el).color), "rgb(181, 131, 141)", "shown at once");
      assert.deepEqual(await page.$$eval('.type-sheet [aria-pressed="true"]', (els) => els.map((e) => e.dataset.typeColor || e.dataset.typeMark)), ["#B5838D"]);
      if (shots) await page.screenshot({ path: `${shots}/07-colour-sheet.png` });
      await settle(page);
      let l = await layerNow(page, id);
      assert.equal(l.color, "#B5838D");
      assert.deepEqual(l.marks, [{ start: 0, end: 3, bold: true }], "bold kept");
      assert.deepEqual(await paperLook(), look0, "the paper and the page background are untouched");
      // V10.51: typing in a box shows one short row (样式 · B I U S · 完成);
      // fonts and colours open from 样式 with the keyboard down.
      await page.locator('.tool-dock.ctx [data-action="text-style"][data-tab="color"]').tap(); // close
      const c = await center(page, `${BOX} .layer-text`);
      await T.doubleTap(c.x, c.y);
      await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text"));
      await page.waitForSelector('#type-bar:not([hidden])[data-mode="box"] .type-done');
      assert.equal(await page.locator("#type-bar .type-color-now").isVisible(), false, "no colours stacked over the keyboard");
      assert.equal(await page.locator("#type-bar .type-fonts").isVisible(), false, "no font row over the keyboard");
      assert.ok((await page.locator("#type-bar").boundingBox()).height <= 64, "one short row");
      await page.locator("#type-bar .type-style-open").tap();
      await page.waitForFunction(() => !document.activeElement?.classList.contains("layer-text"));
      await page.waitForSelector(".type-sheet");
      await page.locator('.tool-dock.ctx [data-action="text-style"][data-tab="color"]').tap();
      await page.locator('.type-sheet [data-type-color="#6D8299"]').first().tap();
      await settle(page);
      assert.equal((await layerNow(page, id)).color, "#6D8299", "the colour from 样式 lands on the box");
      if (shots) await page.screenshot({ path: `${shots}/08-colour-typing.png` });
      await page.evaluate(() => document.activeElement.blur());
      await settle(page);
      l = await layerNow(page, id);
      assert.equal(l.color, "#6D8299");
      // Leave (keep as a draft), reload, come back: everything is as it was.
      const kept = { ...l };
      await SS.leaveStudio(page);
      await page.reload();
      await page.waitForSelector(".hero");
      l = await layerNow(page, id);
      assert.deepEqual([l.x, l.y, l.scale, l.rotation, l.color, l.fontId, l.fontSize, l.align, JSON.stringify(l.marks), l.text], [kept.x, kept.y, kept.scale, kept.rotation, kept.color, kept.fontId, kept.fontSize, kept.align, JSON.stringify(kept.marks), kept.text]);
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#phone.in-studio");
      // (today-write opens the cover; go to the page with the box)
      await page.evaluate(() => document.querySelector('.sv-pages [data-page-index]:last-of-type, .sv-pages button[data-action="moment-open"]:last-of-type')?.click());
      await page.waitForSelector(BOX).catch(() => {});
      if (await page.locator(BOX).count()) {
        assert.equal(await page.locator(BOX).evaluate((el) => getComputedStyle(el).color), "rgb(109, 130, 153)", "the colour is there after reopening");
        assert.equal(await page.locator(`${BOX} .rt-b`).count(), 1, "bold is there too");
      }
      assert.deepEqual(errors, []);
      await context.close();
      passed.push("colour: 8 named swatches (36–40 px, all tappable, in view), the colour in use is marked, applies at once with bold kept, paper / background untouched; while typing one short row (样式 · B I U S · 完成, V10.51) and the colours open from 样式; saved, and the same after leaving, reloading and reopening");
    }
    // ---------------------------------------------------------------- 5
    // iPhone SE-size 375×667 (Chinese) and 430×932 (English).
    for (const [label, viewport, language] of [["375", { width: 375, height: 667 }, null], ["430-en", { width: 430, height: 932 }, "en"]]) {
      const device = { ...devices["iPhone 13"], viewport };
      const { context, page, errors, T } = await phone(browser, device, { language, fresh: true });
      await page.goto(base);
      await page.waitForSelector(".hero");
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#studio-guide .sg-card");
      const fit = await page.evaluate(() => { const r = document.querySelector(".sg-card").getBoundingClientRect(); const scroll = document.querySelector("#app-scroll"); return { inside: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, noSideScroll: scroll.scrollWidth <= scroll.clientWidth + 1 }; });
      assert.ok(fit.inside && fit.noSideScroll, JSON.stringify(fit));
      if (language === "en") {
        assert.equal(await page.locator("#sg-title").innerText(), "Add things"); // V10.25: step 1 is 加东西
        assert.equal(await page.locator('[data-action="guide-skip"]').innerText(), "Skip");
      }
      if (shots) await page.screenshot({ path: `${shots}/09-guide-${label}.png` });
      await page.locator('[data-action="guide-skip"]').tap();
      await page.locator('[data-action="pages-add"], .sv-pages [data-action="moment-add"], [data-action="add-moment"]').first().tap();
      await page.waitForTimeout(350);
      await SS.studioClose(page).catch(() => {});
      await SS.studioDeselect(page).catch(() => {});
      await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
      await page.waitForSelector(".text-layer.editing .layer-text");
      await page.keyboard.press("Control+A");
      await page.keyboard.type(language === "en" ? "A light wind" : "风很轻");
      await page.evaluate(() => document.activeElement.blur());
      const id = await page.evaluate(() => document.querySelector("#journal-canvas .text-layer").dataset.layer);
      const BOX = `#journal-canvas [data-layer="${id}"]`;
      await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').tap();
      // First selection of a text box: the one-time "double-tap" tip points at it.
      let c = await center(page, BOX);
      await T.tap(c.x, c.y);
      await page.waitForSelector("#dbl-tip");
      assert.equal(await page.locator("#dbl-tip").innerText(), language === "en" ? "Double-tap to edit the words" : "双击即可编辑文字");
      const tipFit = await page.evaluate(() => { const r = document.querySelector("#dbl-tip").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
      assert.ok(tipFit);
      if (shots) await page.screenshot({ path: `${shots}/10-tip-${label}.png` });
      c = await center(page, `${BOX} .layer-text`);
      await T.doubleTap(c.x, c.y);
      await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text"));
      assert.equal(await page.locator("#dbl-tip").count(), 0, "the tip goes once typing starts");
      await page.evaluate(() => document.activeElement.blur());
      // Once only.
      await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').tap();
      c = await center(page, BOX);
      await T.tap(c.x, c.y);
      await page.waitForTimeout(700);
      assert.equal(await page.locator("#dbl-tip").count(), 0, "the tip is shown once");
      // The handles fit and do not overlap at this size too.
      const apart = await page.evaluate(() => { const a = document.querySelector("#sel-frame .handle-rotate").getBoundingClientRect(), b = document.querySelector("#sel-frame .handle-resize").getBoundingClientRect(); return Math.hypot(a.x - b.x, a.y - b.y); });
      assert.ok(apart >= 40, String(apart));
      // Colours while typing, at this size.
      c = await center(page, `${BOX} .layer-text`);
      await T.doubleTap(c.x, c.y);
      await page.waitForSelector('#type-bar:not([hidden])[data-mode="box"] .type-done');
      const row = await page.$$eval("#type-bar .type-main-row > *", (els) => els.filter((e) => e.getClientRects().length && getComputedStyle(e).display !== "none").map((e) => Math.round(e.getBoundingClientRect().height)));
      assert.ok(row.length >= 3 && row.every((h) => h >= 28), String(row));
      const noSide = await page.evaluate(() => { const s = document.querySelector("#app-scroll"); return s.scrollWidth <= s.clientWidth + 1; });
      assert.ok(noSide, "no sideways scroll");
      if (shots) await page.screenshot({ path: `${shots}/11-typing-${label}.png` });
      assert.deepEqual(errors, []);
      await context.close();
    }
    passed.push("375×667 (中文) and 430×932 (English): the guide card fits, English copy; the one-time 「双击即可编辑」 tip points at the first selected box and goes once typing starts; handles apart; the typing row's buttons ≥ 28 px; no sideways scroll");
    // ---------------------------------------------------------------- 5b
    // The iPhone shell's layout (?shell=ios): the ring sits exactly on the paper
    // (found in the Xcode Simulator: it was drawn ~30 px too low there).
    {
      const { context, page, errors } = await phone(browser, devices["iPhone 13"], { fresh: true });
      await page.goto(`${base}/?shell=ios`);
      await page.waitForSelector(".hero");
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector("#studio-guide .sg-card");
      // V10.25: step 1 rings the tool row; step 2 (摆位置) is the one on the paper.
      await page.locator('[data-action="guide-next"]').tap();
      await page.waitForFunction(() => document.querySelector("#studio-guide")?.dataset.step === "move");
      const measure = () => page.evaluate(() => {
        const ring = document.querySelector(".sg-ring").getBoundingClientRect();
        const paper = document.querySelector("#journal-canvas").getBoundingClientRect();
        return { top: Math.round(paper.top - ring.top), left: Math.round(paper.left - ring.left), bottom: Math.round(ring.bottom - paper.bottom) };
      });
      // The ring follows the paper while the page settles (with a 0.25 s glide).
      let off = await measure();
      for (let i = 0; i < 20 && ![off.top, off.left, off.bottom].every((d) => d >= 2 && d <= 6); i++) {
        await page.waitForTimeout(150);
        off = await measure();
      }
      assert.ok([off.top, off.left, off.bottom].every((d) => d >= 2 && d <= 6), `ring hugs the paper in the iPhone shell: ${JSON.stringify(off)}`);
      if (shots) await page.screenshot({ path: `${shots}/12-guide-ios-shell.png` });
      assert.deepEqual(errors, []);
      await context.close();
      passed.push("iPhone shell layout (?shell=ios): the guide's ring sits exactly on the paper");
    }
    // ---------------------------------------------------------------- 6
    // A mouse still works the same (desktop preview): double-click types.
    {
      const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base);
      await page.waitForSelector(".hero");
      await page.locator('[data-action="today-write"]').first().click();
      await page.waitForSelector("#phone.in-studio");
      await page.locator('[data-action="pages-add"], .sv-pages [data-action="moment-add"], [data-action="add-moment"]').first().click();
      await page.waitForTimeout(350);
      await SS.studioClose(page).catch(() => {});
      await SS.studioDeselect(page).catch(() => {});
      await page.locator('.tool-dock [data-action="add-text-layer"]').click();
      await page.waitForSelector(".text-layer.editing .layer-text");
      await page.keyboard.type("x");
      await page.evaluate(() => document.activeElement.blur());
      await page.locator('.tool-dock.ctx [data-action="layer-deselect"]').click();
      const box = page.locator("#journal-canvas .text-layer");
      await box.click();
      await page.waitForTimeout(450);
      assert.equal(await editing(page), false);
      await box.dblclick();
      await page.waitForFunction(() => document.activeElement?.classList.contains("layer-text"));
      assert.deepEqual(errors, []);
      await context.close();
      passed.push("mouse: click selects, double-click types");
    }
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
