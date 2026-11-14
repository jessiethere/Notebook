// V10.27 · Titles are optional, always. Three untitled Quick Create pages on
// one day (Flow A + E): Home, the Calendar day, My Books, the reader and the
// editor never say "未命名 / Untitled"; the day's list tells the pages apart
// by time, a picture and what is on them; a row opens that page in the reader.
// Flow D: a title can be added later and removed again, and nothing else on
// the page changes. Chinese at 375×667, English at 430×932.
// Chromium, emulated phones — not a real iPhone.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const FORBIDDEN = /未命名|无标题|没有名字的一页|Untitled|A page with no name/i;
const sets = [["latte-art", "corner-cafe"], ["beach-day", "balloons", "above-clouds"], ["brunch"]];

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
      await page.goto(base);
      await page.waitForSelector(".hero");
      const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
      const saved = () => page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d), today);
      const noUntitled = async (where) => assert.doesNotMatch(await page.locator("body").innerText(), FORBIDDEN, `${run.lang} ${where}`);

      // ---------------------------------------------- Flow A ×3: pick photos → save, no words, no title
      for (const names of sets) {
        const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
        await chooser.setFiles(names.map((n) => path.join(lib, `LD-photo-${n}.jpg`)));
        await page.waitForSelector('[data-action="story-save"]');
        await page.locator('[data-action="story-save"]').tap();
        await page.waitForSelector("#phone.in-reader");
        await noUntitled("reader after save");
        // Step 4: the reader shows only the finished page — a photo is not a keyboard stop (WebKit drew its blue focus ring on it)
        assert.equal(await page.locator('.reader-stage [data-action="zoom-photo"][tabindex="0"]').count(), 0);
        assert.equal(await page.locator(".reader-stage .active, .reader-stage .sel-frame, .reader-stage .layer-handle, .reader-stage .has-selection").count(), 0, "no selection, handles or selection frame");
        await SS.leaveReader(page);
        await page.locator('#navigation [data-page="home"]').tap();
        await page.waitForSelector(".hero");
      }
      const entry = await saved();
      assert.equal(entry.moments.length, 3);
      assert.ok(entry.moments.every((m) => !String(m.title || "").trim()), "titles stay empty — nothing was written into them");
      await noUntitled("home");
      passed.push(`${run.lang} ${run.w}: three Quick Create pages saved with no words and no title; reader and Home show no 未命名 / Untitled; titles stay empty in the data`);

      // ---------------------------------------------- Flow E: the day's list tells them apart
      await SS.menu(page, "calendar");
      await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
      await page.waitForSelector(".day-detail .day-contents");
      await noUntitled("calendar day");
      const rows = await page.$$eval(".day-contents button b", (els) => els.map((e) => e.innerText.trim()));
      // V10.58: these sample files carry only a file date — not a capture time — so the page has no time of its own.
      const want = zh ? [/^(\d\d:\d\d · )?2 张照片$/, /^(\d\d:\d\d · )?3 张照片$/, /^(\d\d:\d\d · )?1 张照片$/] : [/^(\d\d:\d\d · )?2 photos$/, /^(\d\d:\d\d · )?3 photos$/, /^(\d\d:\d\d · )?1 photo$/];
      rows.forEach((row, i) => assert.match(row, want[i], JSON.stringify(rows)));
      assert.equal(await page.locator(".day-contents img.day-contents-thumb").count(), 3, "a picture for each page");
      assert.equal(await page.locator(".day-detail .title-add").count(), 3);
      assert.match(await page.locator(".day-detail .title-add").first().innerText(), zh ? /起个名字（选填）/ : /Add a name \(optional\)/);
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/v126-day-${run.lang}-${run.w}.png` });
      // a row opens that page in the reader
      await page.locator(".day-contents button").nth(1).tap();
      await page.waitForSelector("#phone.in-reader");
      await noUntitled("reader from the day list");
      await SS.leaveReader(page);
      passed.push(`${run.lang} ${run.w}: the day's list reads ${rows.join(" / ")} with a picture each; the optional name link says so; a row opens the reader`);

      // ---------------------------------------------- Flow D: add a title later, then remove it
      await SS.menu(page, "calendar");
      await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
      await page.waitForSelector(".day-detail .day-contents");
      const first = entry.moments[0];
      const layersBefore = first.layers.length;
      const title = page.locator(`.day-detail [data-title-edit][data-moment="${first.id}"]`);
      await title.tap();
      await page.keyboard.type(zh ? "周六的咖啡" : "Saturday coffee");
      await page.keyboard.press("Enter");
      await page.waitForFunction(([d, id, v]) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d).moments.find((m) => m.id === id).title === v, [today, first.id, zh ? "周六的咖啡" : "Saturday coffee"]);
      await page.waitForFunction((v) => document.querySelector(".day-contents button b")?.innerText.includes(v), zh ? "周六的咖啡" : "Saturday coffee");
      await title.dblclick();
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.press("Backspace");
      await page.locator(".day-masthead").click();
      await page.waitForFunction(([d, id]) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === d).moments.find((m) => m.id === id).title === "", [today, first.id]);
      await page.waitForFunction((re) => new RegExp(re).test(document.querySelector(".day-contents button b")?.innerText || ""), zh ? "^(\\d\\d:\\d\\d · )?2 张照片$" : "^(\\d\\d:\\d\\d · )?2 photos$");
      const after = (await saved()).moments[0];
      assert.equal(after.layers.length, layersBefore, "photos and words untouched");
      await noUntitled("calendar after removing the title");
      passed.push(`${run.lang} ${run.w}: a title added later shows in the list; removing it brings back "time · 2 photos"; the page's photos are untouched`);

      // ---------------------------------------------- the editor's top bar and My Books
      await page.locator(`.day-detail .chapter-edit[data-moment="${first.id}"]`).tap();
      await page.waitForSelector("[data-studio-title]");
      const top = (await page.locator("[data-studio-title]").innerText()).trim();
      assert.match(top, zh ? /^\d{1,2}月\d{1,2}日$/ : /^[A-Z][a-z]+ \d{1,2}$/, top);
      await noUntitled("editor");
      await SS.menu(page, "books");
      await page.waitForTimeout(500);
      await noUntitled("my books");
      passed.push(`${run.lang} ${run.w}: an untitled page's editor top bar shows its day (${top}); My Books has no 未命名 / Untitled`);
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
