// V10.32 · 今天怎么记: video, sound and free layout sit right under the three
// ways, on the first screen at 375 and 430, Chinese and English, lighter than
// the photo card; "照片 + 一句话" is the default; choosing video swaps the photo
// options for a video note and the Start button for "选一段视频", keeps the book
// and date, and opens the app's own video import (the same reliable media
// saving as before); the three cards keep readable names and room to tap.
// Chromium, emulated phones — not a real iPhone.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 375, h: 667 }, { lang: "zh", w: 430, h: 932 }, { lang: "en", w: 430, h: 932 }]) {
      const zh = run.lang === "zh";
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true });
      await context.addInitScript((lang) => localStorage.setItem("little-days.language", lang), zh ? "zh-CN" : "en");
      // A first-time sheet: no way remembered yet (older suites seed 随手写).
      await context.addInitScript(() => { if (!sessionStorage.getItem("v132-seeded")) { localStorage.removeItem("little-days.quick-way"); sessionStorage.setItem("v132-seeded", "1"); } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
      await page.locator(".today-tile.moment-cta").tap();
      await page.waitForSelector("#choose-dialog[open] .quick-sheet");
      // The photo way is the default and the first, biggest card.
      assert.equal(await page.locator('#choose-dialog .quick-way[aria-pressed="true"]').getAttribute("data-way"), "photo");
      assert.equal(await page.locator("#choose-dialog .quick-way").first().getAttribute("data-way"), "photo");
      // The other ways: on the first screen, before the photo source and the book.
      const at = await page.evaluate(() => {
        const box = (s) => document.querySelector(s)?.getBoundingClientRect();
        const also = [...document.querySelectorAll("#choose-dialog .quick-also button")].map((b) => b.getBoundingClientRect());
        const ways = [...document.querySelectorAll("#choose-dialog .quick-way")].map((b) => b.getBoundingClientRect());
        return { vh: innerHeight, also: also.map((r) => [r.top, r.bottom, r.width, r.height]), ways: ways.map((r) => [r.width, r.height]), photos: box("#choose-dialog .quick-photos")?.top, books: box("#choose-dialog .quick-books")?.top, start: box("#choose-dialog .quick-start")?.bottom, fits: [...document.querySelectorAll("#choose-dialog .quick-also button, #choose-dialog .quick-way b")].every((e) => e.scrollWidth <= e.clientWidth + 1) };
      });
      assert.deepEqual(await page.$$eval("#choose-dialog .quick-also button", (els) => els.map((e) => e.dataset.way)), ["video", "voice", "layout"]);
      for (const [top, bottom] of at.also) assert.ok(top >= 0 && bottom <= at.vh, `${run.lang} ${run.w}: on the first screen (${Math.round(top)}–${Math.round(bottom)} of ${at.vh})`);
      assert.ok(at.also[0][1] < at.photos && at.also[0][1] < at.books, "before the photo source and the book");
      if (run.h >= 900) assert.ok(at.start <= at.vh, "Start is on the first screen too on a tall phone");
      for (const [w, h] of at.also) assert.ok(w >= 44 && h >= 40, `room to tap (${Math.round(w)}×${Math.round(h)})`);
      for (const [w, h] of at.ways) assert.ok(w >= 90 && h >= 120, `the three cards keep their size (${Math.round(w)}×${Math.round(h)})`);
      assert.ok(at.fits, "names fit, nothing cut");
      const photoCard = at.ways[0][0] * at.ways[0][1], videoChip = at.also[0][2] * at.also[0][3];
      assert.ok(photoCard > videoChip * 2.5, "video is lighter than the photo card");
      if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/v132-${run.lang}-${run.w}.png` });
      // A book and an earlier day chosen, then video: they stay.
      const books = await page.$$eval("#choose-dialog .quick-books [data-book]", (els) => els.map((e) => e.dataset.book));
      await page.locator(`#choose-dialog .quick-books [data-book="${books[1]}"]`).tap();
      await page.locator('#choose-dialog .quick-also [data-way="video"]').tap();
      await page.waitForSelector('#choose-dialog .quick-also [data-way="video"][aria-pressed="true"]');
      assert.equal(await page.locator("#choose-dialog .quick-photos").count(), 0, "no photo options for a video");
      assert.match(await page.locator("#choose-dialog .quick-also-say").innerText(), zh ? /视频/ : /video/i);
      assert.equal((await page.locator("#choose-dialog .quick-start").innerText()).trim(), zh ? "选一段视频" : "Pick a video");
      assert.equal(await page.locator("#choose-dialog .quick-start").getAttribute("data-more"), "video");
      assert.equal(await page.locator(`#choose-dialog .quick-books [data-book="${books[1]}"]`).getAttribute("aria-pressed"), "true", "the book stays");
      // Sound and free layout change the button too; back to photo restores it.
      await page.locator('#choose-dialog .quick-also [data-way="voice"]').tap();
      assert.equal((await page.locator("#choose-dialog .quick-start").innerText()).trim(), zh ? "开始记声音" : "Start a sound");
      await page.locator('#choose-dialog .quick-also [data-way="layout"]').tap();
      assert.equal((await page.locator("#choose-dialog .quick-start").innerText()).trim(), zh ? "打开空白页" : "Open a blank page");
      await page.locator('#choose-dialog .quick-way[data-way="photo"]').tap();
      assert.equal(await page.locator("#choose-dialog .quick-photos").count(), 1, "photo options back");
      assert.equal(await page.locator("#choose-dialog .quick-start").getAttribute("data-action"), "quick-start");
      // Video for real: the app's own video input, in the chosen book, today.
      await page.locator('#choose-dialog .quick-also [data-way="video"]').tap();
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator("#choose-dialog .quick-start").tap()]);
      assert.match(await chooser.element().getAttribute("accept"), /video/);
      assert.equal(await chooser.element().getAttribute("id"), "video-input");
      await page.waitForSelector("#canvas-wrap");
      await chooser.setFiles([]).catch(() => {});
      await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[d]?.moments?.length, today, { timeout: 8000 });
      const draft = await page.evaluate((d) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[d], today);
      assert.equal(draft?.moments?.at(-1)?.bookId, books[1], "the new page is in the chosen book");
      // Not remembered as the default way: next time the sheet opens on a main way.
      await SS.leaveStudio(page);
      await page.locator('#navigation [data-page="home"]').tap();
      await page.locator(".today-tile.moment-cta").tap();
      await page.waitForSelector("#choose-dialog[open] .quick-sheet");
      assert.ok(["photo", "write", "draw"].includes(await page.locator('#choose-dialog [data-action="quick-way"][aria-pressed="true"]').first().getAttribute("data-way")));
      assert.equal(await page.locator('#choose-dialog .quick-also [aria-pressed="true"]').count(), 0);
      // An earlier day (补记) also stays when switching to video.
      if (run.w === 375 && zh) {
        await page.evaluate(() => document.querySelector("#choose-dialog").close());
        await page.locator('#navigation [data-page="home"]').tap();
        const yesterday = await page.evaluate(() => { const d = new Date(Date.now() - 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
        await page.locator(`[data-action="backfill"][data-date="${yesterday}"]`).first().tap();
        await page.waitForSelector("#choose-dialog[open] .quick-sheet");
        await page.locator('#choose-dialog .quick-also [data-way="video"]').tap();
        const [c2] = await Promise.all([page.waitForEvent("filechooser"), page.locator("#choose-dialog .quick-start").tap()]);
        await c2.setFiles([]).catch(() => {});
        await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1") || "null")?.drafts?.[d]?.moments?.length, yesterday, { timeout: 8000 });
        await SS.leaveStudio(page);
        passed.push(`${run.lang} ${run.w}: a page started for yesterday (补记) with video stays on yesterday`);
      }
      passed.push(`${run.lang} ${run.w}×${run.h}: video / sound / free layout on the first screen (${at.also.map(([t, b]) => `${Math.round(t)}–${Math.round(b)}`)[0]} px), before the photo source and book; photo is the default and the biggest card; video swaps in its note and "${zh ? "选一段视频" : "Pick a video"}", keeps the book, opens the app's video import; not remembered as the default`);
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
