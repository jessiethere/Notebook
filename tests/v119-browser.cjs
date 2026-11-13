// V10.19 · Magazine view: words photo by photo, and quick type.
// Three photos taken at the same minute (one Moment) + one more Moment:
// each photo gets its own line, shown by its real thumbnail and number;
// switching photos keeps what was typed; the line sits by its own photo on
// the page (all three styles, re-layout, regroup); quick type (font, size,
// bold, colour, align) shows on the page while the sheet is open and is
// still there in Customize; saved, reopened: each line is still with its
// photo. 375 and 430 wide.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const { withExifTime } = require("./exif-fixture.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png` });
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const exifDay = today.replace(/-/g, ":");
    // Three photos at the very same minute, then one in the evening.
    const pics = [["latte-art", "14:18"], ["coffee-cheers", "14:18"], ["corner-cafe", "14:18"], ["home-dinner", "19:05"]].map(([pid, time]) => ({ name: `${pid}.jpg`, mimeType: "image/jpeg", buffer: withExifTime(fs.readFileSync(path.join(lib, `LD-photo-${pid}.jpg`)), `${exifDay} ${time}:00`) }));
    const draft = () => page.evaluate((t) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[t], today);
    const momentA = async () => (await draft()).moments.find((m) => m.time === "14:18");
    const photosOf = (m) => m.layers.filter((l) => l.kind === "photo" && l.mediaRef && !l.gen);
    // Each photo-caption layer sits right under (or right over) its own photo.
    const nextToOwnPhoto = (m) => {
      const caps = m.layers.filter((l) => l.bind === "caption");
      for (const c of caps) {
        const p = m.layers.find((l) => l.id === c.captionOf);
        assert.ok(p, "bound to a photo that exists");
        const dx = Math.abs(c.x - p.x);
        const gapBelow = c.y - (p.y + p.h / 2);
        const gapAbove = p.y - p.h / 2 - c.y;
        assert.ok(dx <= Math.max(4, p.w / 2) && ((gapBelow > 0 && gapBelow < 14) || (gapAbove > 0 && gapAbove < 14)), `caption ${c.captionOf} by its photo (dx ${dx.toFixed(1)}, below ${gapBelow.toFixed(1)}, above ${gapAbove.toFixed(1)})`);
      }
      return caps.length;
    };

    const chooser = page.waitForEvent("filechooser");
    await page.locator('[data-action="today-photos"]').first().tap();
    await (await chooser).setFiles(pics);
    await page.waitForSelector(".story-canvas .scrapbook-page.style-editorial");
    assert.equal(await page.locator(".story-tabs button").count(), 3, "a spread + 2 Moments (three photos at one minute stay one Moment)");
    let a = await momentA();
    assert.equal(photosOf(a).length, 3);
    const ids = photosOf(a).map((p) => p.id);
    const refs = photosOf(a).map((p) => p.mediaRef);

    // ---------------------------------------------------------- the sheet
    await page.locator(".story-tabs button").nth(1).tap(); // Moment 14:18
    await page.locator('.qe-tools [data-action="story-text"]').tap();
    await page.waitForSelector("#choose-dialog[open] .sw [data-sw-text]");
    const strip = await page.$$eval("#choose-dialog .sw-item", (els) => els.map((el) => [el.dataset.target, el.getAttribute("aria-label"), Boolean(el.querySelector("img"))]));
    assert.deepEqual(strip.map((x) => x[0]), ["moment", ...ids], "the whole Moment, then each photo by its own id");
    assert.deepEqual(strip.slice(1).map((x) => x[1]), ["照片 1 / 3", "照片 2 / 3", "照片 3 / 3"]);
    assert.ok(strip.slice(1).every((x) => x[2]), "real thumbnails");
    // The page stays visible above the sheet (no dimming).
    assert.equal(await page.locator("#choose-dialog.see-through").count(), 1);
    const pick = async (target) => {
      await page.locator(`#choose-dialog [data-action="sw-target"][data-target="${target}"]`).tap();
      await page.waitForSelector(`#choose-dialog [data-target="${target}"][aria-selected="true"]`);
    };
    await page.locator("#choose-dialog [data-sw-text]").fill("周末的咖啡馆 Sunday café");
    await pick(ids[0]);
    assert.equal(await page.locator("#choose-dialog .sw-now b").innerText(), "照片 1 / 3");
    await page.locator("#choose-dialog [data-sw-text]").fill("第一杯：拉花是一只小熊");
    await pick(ids[1]);
    await page.locator("#choose-dialog [data-sw-text]").fill("cheers 和朋友碰杯 🙂 two lattes");
    // Photo 3 left without words. Back to photo 1: what was typed is still there.
    await pick(ids[2]);
    assert.equal(await page.locator("#choose-dialog [data-sw-text]").inputValue(), "");
    await pick(ids[0]);
    assert.equal(await page.locator("#choose-dialog [data-sw-text]").inputValue(), "第一杯：拉花是一只小熊");
    await pick("moment");
    assert.equal(await page.locator("#choose-dialog [data-sw-text]").inputValue(), "周末的咖啡馆 Sunday café");
    // Dots mark the ones written.
    assert.deepEqual(await page.$$eval("#choose-dialog .sw-item", (els) => els.map((el) => Boolean(el.querySelector(".sw-dot")))), [true, true, true, false]);
    // The page behind shows the words as they are typed.
    await page.waitForFunction(() => /拉花是一只小熊/.test(document.querySelector(".story-canvas")?.innerText || ""));
    await shot("01-sheet");
    passed.push("the sheet: the whole Moment + 3 photos by real thumbnail and 照片 n / 3 (same minute, told apart); typing kept when switching; photo 3 can stay empty; the page updates live");

    // ---------------------------------------------------------- quick type
    // While typing the keyboard has the room: the type row steps aside.
    await page.locator("#choose-dialog [data-sw-text]").focus();
    assert.equal(await page.locator("#choose-dialog .sw-type").isVisible(), false, "type tools step aside while typing");
    await page.evaluate(() => document.activeElement.blur());
    await require("./signed-in.cjs").openTypeTools(page);
    await page.locator('#choose-dialog [data-action="sw-font"][data-font="song"]').tap();
    await page.locator('#choose-dialog [data-action="sw-size"][data-dir="1"]').tap();
    await page.locator('#choose-dialog [data-action="sw-bold"]').tap();
    await page.locator('#choose-dialog [data-action="sw-color"][data-color="#6D8299"]').tap();
    await page.locator('#choose-dialog [data-action="sw-align"][data-align="left"]').tap();
    assert.equal(await page.locator("#choose-dialog[open]").count(), 1, "still in the sheet");
    a = await momentA();
    assert.deepEqual(a.typeStyle, { fontId: "song", scale: 1.15, bold: true, color: "#6D8299", align: "left" });
    const styled = a.layers.filter((l) => ["title", "caption"].includes(l.bind));
    assert.ok(styled.length === 3 && styled.every((l) => l.fontId === "song" && l.weight === 700 && l.color === "#6D8299" && l.align === "left"), JSON.stringify(styled.map((l) => [l.bind, l.fontId, l.weight, l.color, l.align])));
    // On the page right away (the same font the studio uses for 宋体).
    const look = await page.$$eval(".story-canvas .layer-text", (els) => els.filter((el) => /拉花|碰杯|咖啡馆/.test(el.textContent)).map((el) => { const s = getComputedStyle(el.closest(".layer") || el); return [s.fontWeight, s.color]; }));
    assert.ok(look.length === 3 && look.every(([w, c]) => Number(w) >= 700 && c === "rgb(109, 130, 153)"), JSON.stringify(look));
    await shot("02-type");
    await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    a = await momentA();
    assert.deepEqual(photosOf(a).map((p) => p.caption || ""), ["第一杯：拉花是一只小熊", "cheers 和朋友碰杯 🙂 two lattes", ""]);
    assert.equal(a.title, "周末的咖啡馆 Sunday café");
    assert.equal(nextToOwnPhoto(a), 2);
    passed.push("quick type (宋体, bigger, bold, colour, left) shows on the page while the sheet is open; stored on the Moment in Studio's own fields; each line right by its own photo");

    // ---------------------------------------------------------- styles, re-layout
    for (const style of ["cozy", "playful", "editorial"]) {
      await require("./signed-in.cjs").storyStyle(page, style);
      await page.waitForSelector(`.story-canvas .scrapbook-page.style-${style}`);
      a = await momentA();
      assert.deepEqual(photosOf(a).map((p) => p.caption || ""), ["第一杯：拉花是一只小熊", "cheers 和朋友碰杯 🙂 two lattes", ""], style);
      assert.equal(nextToOwnPhoto(a), 2, style);
      assert.ok(a.layers.filter((l) => l.bind === "caption").every((l) => l.fontId === "song"), "the type stays: " + style);
    }
    await require("./signed-in.cjs").storyNextLayout(page);
    await page.waitForTimeout(300);
    assert.equal(nextToOwnPhoto(await momentA()), 2, "re-layout keeps each line by its photo");
    passed.push("杂志 / 手账 / 拼贴 and re-layout: every line still by its own photo, the type kept");

    // ---------------------------------------------------------- tapping a photo opens its words
    await require("./signed-in.cjs").closeStoryPanel(page);
    const target = (await momentA()).layers.find((l) => l.id === ids[1]);
    const paper = await page.locator(".story-canvas").evaluate((el) => { const r = el.firstElementChild.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.mouse.click(paper.x + (paper.w * target.x) / 100, paper.y + (paper.h * target.y) / 100);
    // V10.29: the tap chooses that photo (换照片); 给这张写字 opens its words.
    await page.waitForSelector(`.qe-thumbs [data-layer="${ids[1]}"][aria-pressed="true"]`);
    await page.locator('[data-action="story-words-photo"]').tap();
    await page.waitForSelector(`#choose-dialog [data-target="${ids[1]}"][aria-selected="true"]`);
    assert.equal(await page.locator("#choose-dialog [data-sw-text]").inputValue(), "cheers 和朋友碰杯 🙂 two lattes");
    await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
    passed.push("tapping a photo on the page chooses that very photo; 给这张写字 opens its words");

    // ---------------------------------------------------------- regroup keeps lines with their photos
    await require("./signed-in.cjs").storyRegroup(page);
    await page.waitForSelector(".story-group");
    await page.locator('[data-action="story-regroup"]').tap();
    await page.waitForSelector(".story-canvas .scrapbook-page");
    a = await momentA();
    const byRef = Object.fromEntries(photosOf(a).map((p) => [p.mediaRef, p.caption || ""]));
    assert.deepEqual(refs.map((r) => byRef[r]), ["第一杯：拉花是一只小熊", "cheers 和朋友碰杯 🙂 two lattes", ""], "the Moment was rebuilt: each line followed its own photo");
    assert.equal(a.typeStyle?.fontId, "song");
    passed.push("adjusting the groups rebuilds the Moments; each line follows its own photo (by the photo's media id), the type too");

    // ---------------------------------------------------------- 375 / 430
    for (const [w, h] of [[375, 667], [430, 932]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.locator(".story-tabs button").nth(1).tap();
      await page.locator('.qe-tools [data-action="story-text"]').tap();
      await page.waitForSelector("#choose-dialog[open] .sw");
      const fit = await page.evaluate(() => {
        const sheet = document.querySelector("#choose-dialog .sw").getBoundingClientRect();
        const field = document.querySelector("#choose-dialog [data-sw-text]").getBoundingClientRect();
        const done = document.querySelector("#choose-dialog .sw-done").getBoundingClientRect();
        return { sheetTop: sheet.top, field: field.bottom <= innerHeight && field.top >= sheet.top, done: done.top >= 0 && done.bottom <= innerHeight, side: document.querySelector("#choose-dialog .sw").scrollWidth <= document.querySelector("#choose-dialog .sw").clientWidth + 1, canvasSeen: document.querySelector(".story-canvas").getBoundingClientRect().bottom > 80 };
      });
      assert.ok(fit.field && fit.done && fit.side && fit.canvasSeen && fit.sheetTop > h * 0.3, `${w}: ${JSON.stringify(fit)}`);
      await shot(`03-${w}`);
      await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
      await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    passed.push("375×667 and 430×932: the page stays in view above the sheet; the field and Done fit; nothing sideways");

    // ---------------------------------------------------------- Customize keeps it
    await page.locator(".story-tabs button").nth(1).tap();
    await page.locator('[data-action="story-adjust"]').tap();
    await page.waitForSelector("#journal-canvas");
    const studioWords = await page.$$eval("#journal-canvas .layer-text", (els) => els.map((el) => el.textContent));
    assert.ok(studioWords.includes("第一杯：拉花是一只小熊") && studioWords.includes("cheers 和朋友碰杯 🙂 two lattes"), JSON.stringify(studioWords));
    // Editing a photo's words on the paper writes them to that photo.
    // (Regrouping rebuilt the Moment: find photo 1 again by its media id.)
    const pid0 = photosOf(await momentA()).find((p) => p.mediaRef === refs[0]).id;
    const capLayer = (await momentA()).layers.find((l) => l.bind === "caption" && l.captionOf === pid0);
    assert.equal(capLayer.fontId, "song");
    await page.locator(`#journal-canvas [data-inline-layer="${capLayer.id}"]`).dblclick();
    await page.keyboard.press("End");
    await page.keyboard.type("！");
    await page.waitForFunction((pid) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return Object.values(s.drafts).some((d) => d.moments.some((m) => m.layers.some((l) => l.id === pid && /小熊！$/.test(l.caption || "")))); }, pid0).catch(() => {});
    a = await momentA();
    const after = photosOf(a).find((p) => p.mediaRef === refs[0]);
    assert.match(after.caption, /小熊！$/, "typed on the paper → written to that photo");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.locator('[data-action="studio-back"], .studio-back').first().tap().catch(() => {});
    passed.push("Customize: the same lines, fonts and colours are on the page; editing a line there writes it to its photo");

    // ---------------------------------------------------------- save, reopen
    if (await page.locator('[data-action="story-save"]').count()) await page.locator('[data-action="story-save"]').tap();
    else {
      // Customize returned to the studio: save the day from there.
      await page.evaluate(() => document.querySelector('[data-action="save-entry"]')?.click());
    }
    await page.waitForTimeout(800);
    await page.reload();
    await page.waitForSelector(".hero");
    const saved = await page.evaluate((t) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const all = [...(s.entries || []), ...Object.values(s.drafts || {})].filter((e) => e.date === t);
      return all.flatMap((e) => e.moments || []).filter((m) => m.time === "14:18");
    }, today);
    assert.ok(saved.length >= 1);
    const m = saved[0];
    const map = Object.fromEntries(m.layers.filter((l) => l.kind === "photo" && !l.gen).map((p) => [p.mediaRef, p.caption || ""]));
    assert.match(map[refs[0]], /^第一杯：拉花是一只小熊/);
    assert.equal(map[refs[1]], "cheers 和朋友碰杯 🙂 two lattes");
    assert.equal(map[refs[2]], "");
    assert.equal(m.title, "周末的咖啡馆 Sunday café");
    passed.push("saved and reopened: each line still with its own photo; the Moment's own line kept; one Moment, not three");

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
