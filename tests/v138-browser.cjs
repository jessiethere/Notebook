// V10.38 · A3 (P0 content integrity): words are never cut.
//  · Quick Edit takes long words (no 70 / 120 cap): a short line is a
//    headline, a long one readable body text; everything typed is saved.
//  · When the words don't fit on one page, the split suggestion keeps the
//    photos on page 1 and continues the words on the next page(s), cut
//    between sentences; the pages' words joined are exactly what was typed.
//    Nothing is split until the person taps it.
//  · Studio's own line on the paper is not cut at 70 either.
//  · Pages saved before (short lines) look and read as before.
// zh at 375 and en at 430. Synthetic / library photos and words only.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const photo = (n) => ({ name: `LD-photo-${n}.jpg`, mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(lib, `LD-photo-${n}.jpg`)) });
// The design board's long texts (S7 74 characters, S8 185 characters).
const ZH74 = "今天和朋友在街角的咖啡馆坐了一个下午，聊了很多以前的事。窗外一直在下小雨，书翻到一半就忘了看。回家的路上买了一袋咖啡豆，想把这个下午的味道留久一点。";
const EN185 = "We drove out before sunrise and the hills were still wrapped in mist. By noon the tent was up, and after dinner we lay on the grass counting stars until it got too cold to stay outside.";
const ZH_VERY_LONG = (ZH74 + "后来雨停了，楼下的猫跑出来晒太阳。我把今天想做的事写在一张小纸条上，一件一件慢慢划掉。晚饭煮了番茄面，第一次没有把面煮烂。睡前又读了二十页，最后一章还留着明天看。").repeat(3);
const EN_VERY_LONG = (EN185 + " In the morning we made coffee on the little stove, watched the valley fill with light, and promised to come back in autumn. ").repeat(3);
assert.ok([...ZH74].length > 70 && [...EN185].length > 120);

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const savedMoments = (page) => page.evaluate((k) => { const st = JSON.parse(localStorage.getItem("little-days.v1")); const day = st.drafts[k] || st.entries.find((e) => e.date === k); return (day?.moments || []).map((m) => ({ id: m.id, title: m.title, photos: m.layers.filter((l) => l.kind === "photo" && !l.gen).length })); }, today());
// Where the page's own words sit on the paper (in % of the page).
const wordsBox = (page, scope) => page.evaluate((scope) => {
  const paper = document.querySelector(scope);
  const P = paper.getBoundingClientRect();
  const el = [...paper.querySelectorAll(".text-layer")].find((x) => x.querySelector("[data-bind='title']") || x.dataset.bind === "title" || x.classList.contains("bind-title")) || [...paper.querySelectorAll(".text-layer")].sort((a, b) => b.textContent.length - a.textContent.length)[0];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { text: el.textContent.trim(), t: ((r.top - P.top) / P.height) * 100, b: ((r.bottom - P.top) / P.height) * 100, l: ((r.left - P.left) / P.width) * 100, r: ((r.right - P.left) / P.width) * 100, size: parseFloat(getComputedStyle(el).fontSize), paperW: P.width, scrollH: el.scrollHeight, clientH: el.clientHeight };
}, scope);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const zh = run.lang === "zh";
      const where = `${run.lang} ${run.w}`;
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true });
      await context.addInitScript((lang) => localStorage.setItem("little-days.language", lang), zh ? "zh-CN" : "en");
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const home = async () => {
        await SS.leaveReader(page);
        await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
        await page.waitForSelector(".hero");
      };
      const startWith = async (files) => {
        const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
        await chooser.setFiles(files);
        await page.waitForSelector('[data-action="story-save"]');
      };
      const write = async (text) => {
        await page.locator('.qe-tools [data-action="story-text"]').tap();
        await page.waitForSelector("#choose-dialog[open] [data-sw-text]");
        const max = await page.locator("#choose-dialog [data-sw-text]").getAttribute("maxlength");
        assert.ok(Number(max) >= 4000, `${where}: no small cap on the words (maxlength ${max})`);
        await page.locator("#choose-dialog [data-sw-text]").fill(text);
        assert.equal(await page.locator("#choose-dialog [data-sw-text]").inputValue(), text, "every character typed is in the box");
        await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
        await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
        await page.waitForTimeout(500);
      };

      // 1 · One photo + the design board's long text: one page, body text, all saved.
      const mid = zh ? ZH74 : EN185;
      await startWith([photo(zh ? "rain-window" : "misty-hills")]);
      await write(mid);
      assert.equal(await page.locator(".qe-split").count(), 0, `${where}: it fits one page — no split suggested`);
      const box = await wordsBox(page, ".story-canvas .journal-canvas");
      assert.equal(box.text.replace(/\s+/g, ""), mid.replace(/\s+/g, ""), `${where}: every word is on the page`);
      assert.ok(box.t >= 0 && box.b <= 100.5, `${where}: the words are on the page (${box.t.toFixed(1)}–${box.b.toFixed(1)}%)`);
      const bodyPx = (16 / 3.2 / 100) * box.paperW;
      assert.ok(Math.abs(box.size - bodyPx) < 1.5, `${where}: a long line is readable body text (${box.size.toFixed(1)} px vs ${bodyPx.toFixed(1)})`);
      if (shots) await page.locator(".story-canvas").screenshot({ path: `${shots}/v138-${run.lang}-${run.w}-one-page.png` });
      let ms = await savedMoments(page);
      assert.equal(ms.at(-1).title, mid, `${where}: saved in full (${[...mid].length} characters; before: cut at 70)`);
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === k).moments.at(-1).title, today());
      assert.equal(saved, mid);
      passed.push(`${where}: one photo + ${[...mid].length}-character words → one page, body text, saved in full`);
      await home();

      // 2 · One photo + words for more than a page: a suggestion, then words continued.
      const long = zh ? ZH_VERY_LONG : EN_VERY_LONG;
      await startWith([photo("corner-cafe")]);
      await write(long);
      await page.waitForSelector(".qe-split");
      const panel = await page.locator(".qe-split").innerText();
      assert.ok(panel.includes(zh ? "照片留在第一页" : "photos stay on the first page"), `${where}: the suggestion says what it does`);
      const figures = await page.locator(".qe-split figure").count();
      assert.ok(figures >= 3, `${where}: the page as it is + at least two pages (${figures})`);
      assert.ok((await page.locator(".qe-split figcaption").allInnerTexts()).some((x) => x.includes(zh ? "文字" : "words")), "a page of words is shown");
      ms = await savedMoments(page);
      assert.equal(ms.length && ms.at(-1).title, long, `${where}: not split on its own — the words are still whole`);
      if (shots) await page.screenshot({ path: `${shots}/v138-${run.lang}-${run.w}-suggest.png` });
      const before = (await savedMoments(page)).length;
      await page.locator('[data-action="story-split-pages"]').tap();
      await page.waitForSelector(".story-tabs");
      ms = await savedMoments(page);
      const made = ms.slice(before - 1);
      assert.equal(made.map((m) => m.title).join(""), long, `${where}: the pages' words joined are exactly what was typed`);
      assert.equal(made[0].photos, 1, "the photo stays on page 1");
      assert.ok(made.slice(1).every((m) => m.photos === 0), "the words continue on pages of words");
      assert.ok(made.every((m) => m.title.trim()), "no empty page");
      // Each page: its words on the page, nothing clipped.
      const tabs = await page.locator('.story-tabs [data-action="story-page"]').count();
      for (let i = 0; i < tabs; i++) {
        await page.locator('.story-tabs [data-action="story-page"]').nth(i).tap();
        await page.waitForTimeout(350);
        if (i === 0 && tabs > made.length) continue; // the day spread
        const b = await wordsBox(page, ".story-canvas .journal-canvas");
        if (!b) continue;
        assert.ok(b.t >= 0 && b.b <= 100.5, `${where} page ${i}: words on the page (${b.t.toFixed(1)}–${b.b.toFixed(1)}%)`);
        if (shots) await page.locator(".story-canvas").screenshot({ path: `${shots}/v138-${run.lang}-${run.w}-page-${i}.png` });
      }
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      const kept = await page.evaluate((k) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === k).moments.map((m) => m.title), today());
      assert.ok(kept.join("").includes(long), `${where}: saved, every word`);
      passed.push(`${where}: one photo + ${[...long].length} characters → suggestion (photo on page 1, words continue on ${made.length - 1} page(s), split between sentences); only after the tap; joined words identical; saved`);
      await home();

      // 3 · Studio: the page's own line on the paper is not cut at 70.
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector('#journal-canvas [data-inline="title"]');
      const studioLine = zh ? ZH74 + "还有一句。" : EN185 + " One more.";
      await page.keyboard.type(studioLine, { delay: 0 });
      await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
      // (Today already has pages, so this is a new page of today: look in the whole draft.)
      const draft = await page.evaluate((k) => { const d = JSON.parse(localStorage.getItem("little-days.v1")).drafts[k]; return d ? [d.title, ...d.moments.map((m) => m.title)] : []; }, today());
      assert.ok(draft.includes(studioLine), `${where}: Studio keeps a ${[...studioLine].length}-character line (${JSON.stringify(draft.map((x) => [...(x || "")].length))})`);
      passed.push(`${where}: Studio's line on the paper keeps ${[...studioLine].length} characters (was cut at 70)`);
      await page.locator('.sv-top [data-action="studio-back"]').tap().catch(() => {});

      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v138: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
