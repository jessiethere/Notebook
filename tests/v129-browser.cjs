// V10.29 · Step 2: Quick Edit in 今天的故事 — 换照片 · 写文字 · 换个排版 + 保存
// at the bottom, 自定义 at the top right. Never needs the full editor.
//   Flow B: tap photo 2 on the page → it is chosen (outlined) → replace it →
//           its words stay, the pair keeps its arrangement → undo → replace
//           again → write the page's line (ready to type at once; type and
//           style folded away) → change the font → save.
//   Flow C: two photos, each with its own words; after save and a reload
//           each line is still with its own photo.
//   Flow F: change the layout → replace a photo → change the words → change
//           the style → 自定义 and back → save: no photo lost, words under
//           their own photos, type kept.
//   A page arranged by hand: replacing a photo keeps every place.
// Chinese at 375×667, English at 430×932. Chromium, emulated phones — not a
// real iPhone (the keyboard is not tested here, only that the field has focus).
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const photoFile = (n) => path.join(lib, `LD-photo-${n}.jpg`);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const zh = run.lang === "zh";
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true });
      await context.addInitScript((lang) => localStorage.setItem("little-days.language", lang), zh ? "zh-CN" : "en");
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
      const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
      const draft = async () => {
        const s = await stored();
        return (s.drafts[today] || s.entries.find((e) => e.date === today)).moments.at(-1);
      };
      const photos = (m) => m.layers.filter((l) => l.kind === "photo" && !l.gen && l.mediaRef);
      const tapOnPaper = async (layer) => {
        const paper = await page.locator(".story-canvas").evaluate((el) => { const r = el.firstElementChild.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
        await page.locator(".story-canvas").scrollIntoViewIfNeeded();
        const again = await page.locator(".story-canvas").evaluate((el) => { const r = el.firstElementChild.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
        await page.mouse.click(again.x + (again.w * layer.x) / 100, again.y + (again.h * layer.y) / 100);
        return paper;
      };
      const openPanel = async (name) => {
        if ((await page.locator(`.qe-tools [data-panel="${name}"]`).getAttribute("aria-pressed")) !== "true") await page.locator(`.qe-tools [data-panel="${name}"]`).tap();
        await page.waitForSelector(`.qe-panel.qe-${name}`);
      };
      const pressedKind = () => page.locator('.qe-variants [aria-pressed="true"]').getAttribute("data-kind");
      const replaceWith = async (name) => {
        const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="story-replace"]').tap()]);
        assert.equal(await chooser.isMultiple(), false, "one photo replaces one photo");
        await chooser.setFiles(photoFile(name));
        await page.waitForSelector(".qe-notice");
      };
      const started = Date.now();

      // ================================================= Flow B
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
      await chooser.setFiles([photoFile("latte-art"), photoFile("corner-cafe")]);
      await page.waitForSelector('[data-action="story-save"]');
      // The bottom: three tools and Save; 自定义 at the top right.
      assert.deepEqual(await page.$$eval(".qe-tools button", (els) => els.map((el) => el.dataset.panel || el.dataset.action)), ["photo", "story-text", "layout", "story-save"]);
      assert.deepEqual(await page.$$eval(".qe-tools button b, .qe-tools .qe-save", (els) => els.map((el) => el.textContent.trim()).filter(Boolean)), zh ? ["换照片", "写文字", "换个排版", "保存"] : ["Photo", "Words", "Layout", "Save"]);
      assert.equal(await page.locator('.story-bar [data-action="story-adjust"]').innerText(), zh ? "自定义" : "Customize");
      const bar = await page.locator(".qe-bar").boundingBox();
      assert.ok(bar.y + bar.height <= run.h + 1, "the Quick Edit bar is on screen");
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/v129-${run.lang}-1-default.png` });

      let m = await draft();
      const [p1, p2] = photos(m);
      const first2 = p2.mediaRef;
      // Tap photo 2 on the page: chosen and outlined, no editor.
      await tapOnPaper(p2);
      await page.waitForSelector(".qe-panel.qe-photo");
      assert.equal(await page.locator(".tool-dock-wrap, #canvas-wrap").count(), 0, "still in Quick Edit, not the editor");
      assert.equal(await page.locator(`.qe-thumbs [data-layer="${p2.id}"]`).getAttribute("aria-pressed"), "true");
      assert.equal((await page.locator(".story-canvas .qe-ring b").innerText()).trim(), zh ? "第 2 张" : "Photo 2");
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/v129-${run.lang}-2-pick.png` });
      // Words for that photo: the field is ready at once.
      await page.locator('[data-action="story-words-photo"]').tap();
      await page.waitForSelector(`#choose-dialog [data-target="${p2.id}"][aria-selected="true"]`);
      assert.equal(await page.evaluate(() => document.activeElement?.matches?.("[data-sw-text]")), true, "ready to type");
      await page.keyboard.type(zh ? "街角的咖啡馆" : "the corner cafe");
      await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
      await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
      await openPanel("layout");
      const kindBefore = await pressedKind();
      assert.ok(["row", "column", "stagger"].includes(kindBefore), `a pair: ${kindBefore}`);
      // Replace photo 2 (chosen from the panel's own thumbnails this time).
      await openPanel("photo");
      await page.locator(`.qe-thumbs [data-layer="${p2.id}"]`).tap();
      await replaceWith("cookies");
      m = await draft();
      let now2 = photos(m).find((l) => l.id === p2.id);
      assert.ok(now2, "the same photo layer (same id)");
      assert.notEqual(now2.mediaRef, first2, "a new photo");
      assert.match(now2.mediaRef, /^media:/, "saved in the media store first");
      assert.ok(Math.abs(now2.aspect - 0.8) < 0.02, "in its own shape");
      assert.equal(now2.caption, zh ? "街角的咖啡馆" : "the corner cafe", "its words stayed");
      assert.equal(photos(m).find((l) => l.id === p1.id).mediaRef, p1.mediaRef, "photo 1 untouched");
      assert.match(await page.locator(".qe-notice").innerText(), zh ? /已换成新照片 · 第 2 张的文字保留了/ : /Photo replaced · the words for photo 2 stay/);
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/v129-${run.lang}-3-replaced.png` });
      await openPanel("layout");
      assert.equal(await pressedKind(), kindBefore, "the same arrangement after a photo of another shape");
      // Undo: the earlier photo is back, words still there.
      await page.locator('[data-action="story-undo"]').tap();
      await page.waitForFunction(() => !document.querySelector(".qe-notice"));
      m = await draft();
      assert.equal(photos(m).find((l) => l.id === p2.id).mediaRef, first2, "undo brings the earlier photo back");
      assert.equal(photos(m).find((l) => l.id === p2.id).caption, zh ? "街角的咖啡馆" : "the corner cafe");
      // Replace again and keep it.
      await openPanel("photo");
      await page.locator(`.qe-thumbs [data-layer="${p2.id}"]`).tap();
      await replaceWith("cookies");
      const newRef = photos(await draft()).find((l) => l.id === p2.id).mediaRef;
      // The page's line: ready to type, type and style folded away.
      await page.locator('.qe-tools [data-action="story-text"]').tap();
      await page.waitForSelector("#choose-dialog[open] [data-sw-text]");
      assert.equal(await page.evaluate(() => document.activeElement?.matches?.("[data-sw-text]")), true, "ready to type");
      assert.equal(await page.locator('#choose-dialog [data-target="moment"]').getAttribute("aria-selected"), "true");
      assert.equal(await page.locator("#choose-dialog .sw-type").isVisible(), false, "fonts and colours folded");
      assert.match(await page.locator("#choose-dialog .sw-optional").innerText(), zh ? /可以不写/ : /optional/);
      await page.keyboard.type(zh ? "周六的咖啡" : "Saturday coffee");
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/v129-${run.lang}-4-words.png` });
      await page.evaluate(() => document.activeElement.blur());
      await page.locator("#choose-dialog .sw-more > summary").tap();
      await page.waitForSelector("#choose-dialog .sw-type", { state: "visible" });
      await page.locator('#choose-dialog [data-action="sw-font"][data-font="song"]').tap();
      await page.waitForFunction(() => document.querySelector('#choose-dialog [data-action="sw-font"][data-font="song"]')?.getAttribute("aria-pressed") === "true");
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/v129-${run.lang}-5-type.png` });
      await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
      await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
      m = await draft();
      assert.equal(m.title, zh ? "周六的咖啡" : "Saturday coffee");
      assert.equal(m.typeStyle?.fontId, "song");
      passed.push(`${run.lang} ${run.w} Flow B: tap photo 2 → chosen and outlined (第 2 张) → its words → replace: same layer, new photo saved first, words kept, same arrangement → undo → replace → the line, typed at once, type folded → font — never in the editor`);

      // ================================================= Flow F (layout, style, 自定义 — nothing lost)
      await openPanel("layout");
      assert.equal(await page.locator(".qe-variants button").count(), 3);
      assert.equal(await page.locator(".qe-variants .qe-mini .scrapbook-page").count(), 3, "three real previews");
      assert.equal(await page.locator(".qe-variants [data-action] [data-action]").count(), 0, "previews are pictures, not buttons");
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/v129-${run.lang}-6-layout.png` });
      const variantBefore = Number(m.layoutVariant) || 0;
      const nextVariant = (variantBefore + 1) % 3;
      await page.locator(`.qe-variants [data-variant="${nextVariant}"]`).tap();
      await page.waitForFunction((v) => document.querySelector(`.qe-variants [data-variant="${v}"]`)?.getAttribute("aria-pressed") === "true", nextVariant);
      m = await draft();
      assert.equal(m.layoutVariant, nextVariant);
      await page.locator('.qe-styles [data-style="cozy"]').tap();
      await page.waitForSelector(".story-canvas .scrapbook-page.style-cozy");
      m = await draft();
      assert.equal(m.layoutStyle, "cozy");
      assert.equal(m.layoutVariant, nextVariant, "layout and style are separate: the layout stays");
      // Replace photo 1 too, then change its words.
      await openPanel("photo");
      await page.locator(`.qe-thumbs [data-layer="${p1.id}"]`).tap();
      await replaceWith("brunch");
      await page.locator('[data-action="story-words-photo"]').tap();
      await page.waitForSelector(`#choose-dialog [data-target="${p1.id}"][aria-selected="true"]`);
      await page.keyboard.type(zh ? "早午餐" : "brunch");
      await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
      await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
      // 自定义 and back: nothing changes on the way.
      const beforeCustom = JSON.stringify(await draft());
      await page.locator('.story-bar [data-action="story-adjust"]').tap();
      await page.waitForSelector("#canvas-wrap");
      await page.locator('[data-action="studio-back"]').first().tap();
      await page.waitForSelector('[data-action="story-save"]');
      const afterCustom = await draft();
      const strip = (x) => JSON.stringify({ ...x, updatedAt: 0 });
      assert.equal(strip(afterCustom), strip(JSON.parse(beforeCustom)), "自定义 and back keeps every change");
      m = afterCustom;
      const ref1 = photos(m).find((l) => l.id === p1.id).mediaRef;
      assert.equal(photos(m).length, 2, "no photo lost");
      for (const cap of m.layers.filter((l) => l.bind === "caption")) {
        const owner = photos(m).find((l) => l.id === cap.captionOf);
        assert.ok(owner, "each line belongs to a photo on the page");
        assert.ok(Math.abs(cap.x - owner.x) < 12, "a line stays by its own photo");
      }
      assert.equal(m.typeStyle?.fontId, "song", "the type stays");
      passed.push(`${run.lang} ${run.w} Flow F: 换个排版 shows three real previews; a layout, then 手账, then another photo and its words, then 自定义 and back — layout kept through the style change, nothing lost, each line by its photo, the font kept`);

      // ================================================= save, reload (Flow C)
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      const seconds = (Date.now() - started) / 1000;
      await SS.leaveReader(page);
      await page.reload();
      await page.waitForSelector(".hero");
      const saved = (await stored()).entries.find((e) => e.date === today).moments.at(-1);
      const byRef = Object.fromEntries(photos(saved).map((l) => [l.mediaRef, l.caption]));
      assert.equal(byRef[newRef], zh ? "街角的咖啡馆" : "the corner cafe", "the replaced photo 2 keeps its words after a reload");
      assert.equal(byRef[ref1], zh ? "早午餐" : "brunch", "photo 1's words with photo 1");
      assert.equal(saved.title, zh ? "周六的咖啡" : "Saturday coffee");
      assert.equal(saved.layoutStyle, "cozy");
      assert.equal(saved.typeStyle?.fontId, "song");
      // The reader shows the replaced photos.
      await SS.menu(page, "calendar");
      await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
      await page.waitForSelector(".day-detail .day-contents");
      await page.locator(".day-contents button").last().tap();
      await page.waitForSelector("#phone.in-reader");
      await page.waitForFunction(() => document.querySelectorAll(".reader-stage .photo-layer img[src^='blob:']").length >= 2, null, { timeout: 8000 });
      await SS.leaveReader(page);
      passed.push(`${run.lang} ${run.w} Flow C: after save and a reload each line is with its own photo (by the photo, not its place), the title, style and font kept; the reader shows both new photos (whole flow by script: ${seconds.toFixed(1)} s)`);

      // ================================================= a page arranged by hand
      const [chooser2] = await Promise.all([page.waitForEvent("filechooser"), page.locator('#navigation [data-page="home"]').tap().then(() => page.waitForSelector(".hero")).then(() => page.locator('[data-action="today-photos"]').first().tap())]);
      await chooser2.setFiles([photoFile("beach-day"), photoFile("balloons")]);
      await page.waitForSelector('[data-action="story-save"]');
      await page.locator('.story-bar [data-action="story-adjust"]').tap();
      await page.waitForSelector("#canvas-wrap");
      const id = await page.evaluate(() => document.querySelector("#canvas-wrap .layer[data-layer]")?.getAttribute("data-layer"));
      const box = await page.locator(`#canvas-wrap .layer[data-layer="${id}"]`).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 + 20, { steps: 6 });
      await page.mouse.up();
      await page.locator('[data-action="studio-back"]').first().tap();
      await page.waitForSelector('[data-action="story-save"]');
      m = await draft();
      assert.equal(m.layoutEdited, true);
      const before = photos(m).map((l) => [l.id, l.x, l.y]);
      const other = photos(m).find((l) => l.id !== id);
      await openPanel("photo");
      assert.match(await page.locator(".qe-hint").innerText(), zh ? /自己调整过/ : /arranged this page yourself/);
      await page.locator(`.qe-thumbs [data-layer="${id}"]`).tap();
      await replaceWith("cookies");
      m = await draft();
      assert.deepEqual(photos(m).map((l) => [l.id, l.x, l.y]), before, "every place kept (centres)");
      const keptOther = photos(m).find((l) => l.id === other.id);
      assert.deepEqual([keptOther.w, keptOther.h, keptOther.mediaRef], [other.w, other.h, other.mediaRef], "the other photo untouched");
      assert.equal(m.layoutEdited, true, "still arranged by hand");
      passed.push(`${run.lang} ${run.w}: on a page arranged by hand, replacing a photo keeps every place (the new photo fits the old one's spot); the hint says so`);
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      await SS.leaveReader(page);
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
