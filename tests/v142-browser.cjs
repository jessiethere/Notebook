// V10.41 · The same day, the same number everywhere (pages.mjs): a day of
// three photo Moments (taken 08:10 / 12:40 / 19:20) is read, counted on the
// shelf, on the Calendar and in Day Detail as the same pages; books say
// "N 天 · M 页", never "篇" for days. zh 375 / en 430.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { withExifTime } = require("./exif-fixture.cjs");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
const timed = (n, hhmm) => ({ name: `LD-photo-${n}.jpg`, mimeType: "image/jpeg", buffer: withExifTime(fs.readFileSync(path.join(lib, `LD-photo-${n}.jpg`)), `${today.replace(/-/g, ":")} ${hhmm}:00`) });
module.exports.timed = timed;

if (require.main === module) (async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const zh = run.lang === "zh";
      const where = `${run.lang} ${run.w}`;
      // A real first start (no helper): one book, then one day of three Moments.
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true, locale: zh ? "zh-CN" : "en-US" });
      // V10.58: the grouping preview — accept the suggestion with one tap (tests/v155 covers the preview).
      await context.addInitScript(SS.acceptGroups);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
      await chooser.setFiles([timed("latte-art", "08:10"), timed("corner-cafe", "08:20"), timed("golden-field", "12:40"), timed("city-lights", "19:20")]);
      await page.waitForSelector('[data-action="story-save"]');
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      await page.waitForTimeout(500);
      const stored = await page.evaluate((k) => { const e = JSON.parse(localStorage.getItem("little-days.v1")).entries.find((x) => x.date === k); return { moments: e.moments.length, dayPage: Boolean((e.layers || []).length || (e.title || "").trim()) }; }, today);
      const pages = stored.moments + (stored.dayPage ? 1 : 0);
      const readerTotal = Number((await page.locator(".reader-count").innerText()).match(/(\d+)\s*(?:页|pages)?\s*$/)?.[1] || (await page.locator(".reader-count").innerText()).match(/of (\d+)/)?.[1]);
      assert.equal(readerTotal, pages, `${where}: Reader counts ${pages} pages (book cover not counted)`);
      await SS.leaveReader(page);
      // My Books: N 天 · M 页
      await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
      await page.waitForSelector(".hero");
      const lib = await page.locator(".home-books").innerText();
      assert.ok(lib.includes(zh ? `1 天 · ${pages} 页` : `1 day · ${pages} pages`), `${where}: Home library says 1 day · ${pages} pages (${lib.replace(/\s+/g, " ").slice(0, 120)})`);
      assert.ok(!/\d+\s*篇/.test(lib), "no 篇 for days");
      // Calendar: the number on today = pages; Day Detail says the same.
      await page.locator('#navigation [data-page="calendar"]').tap();
      await page.waitForTimeout(400);
      const mark = await page.evaluate(() => document.querySelector(".calendar-grid .day-dots b")?.textContent || "");
      assert.equal(Number(mark), pages, `${where}: Calendar marks ${pages}`);
      await page.evaluate((k) => document.querySelector(`[data-action="open-day"][data-date="${k}"]`)?.click(), today);
      await page.waitForTimeout(500);
      const detail = await page.locator("#app").innerText();
      assert.ok(detail.includes(zh ? `${pages} 页` : `${pages} pages`), `${where}: Day Detail says ${pages} pages`);
      assert.ok(detail.includes(zh ? "4 张照片" : "4 photos"), `${where}: 4 different photos (cover copies not counted twice)`);
      assert.deepEqual(errors, []);
      await context.close();
      passed.push(`${where}: one day = ${pages} pages in the Reader, on Home ("1 天 · ${pages} 页"), on the Calendar and in Day Detail; 4 photos`);
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v142: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
