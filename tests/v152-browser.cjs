// V10.55 · 照片墙 Phase 1 (plan C): the wall is my photos, not a calendar.
//  1. 生活记忆 is still the month calendar; 照片墙 has no month grid, and an
//     empty wall says so kindly with a way to add the first photo.
//  2. Photos kept on saved pages appear by themselves, newest first, in a
//     2-column masonry with a quiet month line; small copies are made in
//     memory (no new files in the media store); library photos stay out.
//  3. A photo opens large with its date and book, the other photos of that
//     day, next / previous, and 打开这一页 opens the reader at its page;
//     closing the reader comes back to the wall.
//  4. Deleting a page takes its photos off the wall.
// zh at 390 (iPhone 13), en at 430. Public library photos as test files.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu, storyLines } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const pic = (id) => path.join(lib, `LD-photo-${id}.jpg`);

const mediaCount = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.open("little-days-media");
        req.onsuccess = () => {
          try {
            const c = req.result.transaction("media").objectStore("media").count();
            c.onsuccess = () => { resolve(c.result); req.result.close(); };
            c.onerror = () => resolve(-1);
          } catch {
            resolve(0);
          }
        };
        req.onerror = () => resolve(-1);
      }),
  );

async function makePage(page, files, line) {
  await menu(page, "studio");
  await page.locator('[data-action="quick-way"][data-way="photo"]').tap();
  await page.locator('[data-action="quick-book"]').first().tap();
  const chooser = page.waitForEvent("filechooser");
  await page.locator('[data-action="quick-start"]').tap();
  await (await chooser).setFiles(files);
  await page.waitForSelector(".qe-tools");
  await storyLines(page, [line]);
  await page.locator('[data-action="story-save"]').tap();
  await page.waitForSelector(".flip-page");
}
async function openWall(page) {
  await page.locator('[data-action="reader-back"]').tap().catch(() => {});
  await menu(page, "calendar");
  await page.locator('[data-action="calendar-mode"][data-mode="wall"]').tap();
  await page.waitForSelector(".photo-wall");
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", device: devices["iPhone 13"] }, { lang: "en", device: { viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } }]) {
      const where = `${run.lang} ${run.device.viewport.width}`;
      const context = await browser.newContext(run.device);
      await context.addInitScript((lang) => localStorage.setItem("little-days.language", lang), run.lang === "zh" ? "zh-CN" : "en");
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");

      // 1 · Two different tabs; an empty wall.
      await menu(page, "calendar");
      await page.waitForSelector(".calendar-grid");
      assert.ok((await page.locator(".calendar-grid [data-date]").count()) >= 28, `${where}: 生活记忆 is a month calendar`);
      await page.locator('[data-action="calendar-mode"][data-mode="wall"]').tap();
      await page.waitForSelector(".photo-wall .pw-empty");
      assert.equal(await page.locator(".calendar-grid, .cal-wall-grid, .wall-day, .wall-weekday").count(), 0, `${where}: no month grid on the wall`);
      assert.match(await page.locator(".pw-empty").innerText(), run.lang === "zh" ? /照片墙还空着[\s\S]*第一张生活照片/ : /still empty[\s\S]*first photo/);
      assert.equal(await page.locator('.pw-empty [data-action="quick-open"][data-way="photo"]').count(), 1, `${where}: a way to add the first photo`);
      assert.equal(await page.locator(".pw-tile").count(), 0, `${where}: no sample photos pretending to be mine`);
      passed.push(`${where}: 生活记忆 stays a month calendar; the wall has no grid and a kind empty state with a way in`);

      // 2 · Photos from saved pages appear by themselves.
      await makePage(page, [pic("beach-sunset"), pic("latte-art"), pic("coffee-cheers")], run.lang === "zh" ? "海边和咖啡" : "Sea and coffee");
      await makePage(page, [pic("happy-dog"), pic("waves")], run.lang === "zh" ? "小狗和海浪" : "A dog and waves");
      const filesBefore = await mediaCount(page);
      await openWall(page);
      await page.waitForSelector(".pw-tile");
      assert.equal(await page.locator(".pw-tile").count(), 5, `${where}: five photos`);
      assert.equal(await page.locator(".pw-month").count(), 1);
      const label = await page.locator(".pw-month-label").innerText();
      const now = new Date();
      assert.ok(label.includes(String(now.getFullYear())), `${where}: month line ${label}`);
      assert.equal(await page.locator(".pw-cols .pw-col").count(), 2, `${where}: two columns`);
      const refs = await page.locator(".pw-tile").evaluateAll((els) => els.map((e) => e.dataset.ref));
      assert.ok(refs.every((r) => r.startsWith("media:")), `${where}: only my own photos`);
      assert.equal(new Set(refs).size, refs.length, `${where}: each photo once`);
      // Small copies, made in memory; natural shapes (not all squares).
      await page.waitForFunction(() => [...document.querySelectorAll(".pw-tile")].every((t) => t.classList.contains("ready")), null, { timeout: 15000 });
      const shapes = await page.evaluate(() => [...document.querySelectorAll(".pw-tile")].map((t) => ({ w: t.getBoundingClientRect().width, h: t.getBoundingClientRect().height, nw: t.querySelector("img").naturalWidth, src: t.querySelector("img").src })));
      assert.ok(shapes.every((s) => s.nw > 0 && s.nw <= 480), `${where}: small copies (${shapes.map((s) => s.nw)})`);
      assert.ok(shapes.some((s) => Math.abs(s.h / s.w - 1) > 0.15), `${where}: photos keep their own shapes`);
      assert.ok(shapes.every((s) => s.src.startsWith("blob:")));
      assert.equal(await mediaCount(page), filesBefore, `${where}: no new files for the wall`);
      // Newest page first: the second page's photos lead.
      const firstRef = refs[0];
      const newest = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("little-days.v1"));
        const day = s.entries.find((e) => (e.moments || []).length >= 2);
        return day.moments.at(-1).layers.filter((l) => l.kind === "photo").map((l) => l.mediaRef);
      });
      assert.ok(newest.length === 2, `${where}: the second page has two photos`);
      assert.ok(newest.includes(firstRef), `${where}: the newest page's photos come first`);
      passed.push(`${where}: 5 photos from 2 saved pages, 2-column masonry, month line "${label.split("\n")[0]}", small in-memory copies, no new stored files`);

      // 3 · The viewer and the way back to the page.
      await page.locator(".pw-tile").first().tap();
      await page.waitForSelector("#wall-viewer[open] .wv-img");
      const viewer = await page.evaluate(() => ({ n: document.querySelector(".wv-n").textContent, when: document.querySelector(".wv-when b").textContent, book: document.querySelector(".wv-when small")?.textContent || "", strip: document.querySelectorAll(".wv-strip button").length, src: document.querySelector(".wv-img").getAttribute("src") }));
      assert.equal(viewer.n, "1 / 5");
      assert.ok(viewer.when.includes(String(now.getDate())), `${where}: the date ${viewer.when}`);
      assert.ok(viewer.book.length > 0, `${where}: the book`);
      assert.equal(viewer.strip, 5, `${where}: the day's photos`);
      await page.locator(".wv-step.next").tap();
      assert.equal(await page.locator(".wv-n").innerText(), "2 / 5");
      await page.locator(".wv-strip button").nth(4).tap();
      assert.equal(await page.locator(".wv-n").innerText(), "5 / 5");
      const target = await page.locator("#wall-viewer").getAttribute("data-ref");
      await page.locator(".wv-open").tap();
      await page.waitForSelector(".flip-page");
      const onPage = await page.evaluate((ref) => [...document.querySelectorAll(".flip-page img")].some((img) => img.src && document.querySelector(".flip-page")) && !!document.querySelector(".flip-page"), target);
      assert.ok(onPage, `${where}: the reader opened`);
      const readerHas = await page.evaluate((ref) => {
        const s = JSON.parse(localStorage.getItem("little-days.v1"));
        const day = s.entries.find((e) => (e.moments || []).some((m) => (m.layers || []).some((l) => l.mediaRef === ref)));
        const m = day.moments.find((mm) => mm.layers.some((l) => l.mediaRef === ref));
        return document.querySelector("[data-reader-stage]")?.innerHTML.includes(m.title || "@@") || document.body.innerText.includes(m.title || "@@");
      }, target);
      assert.ok(readerHas, `${where}: at the page the photo lives on`);
      await page.locator('[data-action="reader-back"]').tap();
      await page.waitForSelector(".photo-wall .pw-tile");
      passed.push(`${where}: viewer — 1 / 5, date and book, the day's 5 photos, next and strip; 打开这一页 opens that page; back returns to the wall`);

      // 4 · Deleting a page takes its photos off.
      const gone = await page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("little-days.v1"));
        const day = s.entries.find((e) => (e.moments || []).length >= 2);
        const m = day.moments.at(-1);
        const b = document.createElement("button");
        b.dataset.action = "read-delete";
        b.dataset.date = day.date;
        b.dataset.moment = m.id;
        b.id = "test-delete";
        document.body.append(b);
        return m.layers.filter((l) => l.kind === "photo").map((l) => l.mediaRef);
      });
      await page.locator("#test-delete").click();
      await page.waitForSelector("#confirm-dialog[open]");
      await page.locator("#confirm-ok").tap();
      await page.waitForFunction(() => document.querySelectorAll(".pw-tile").length === 3);
      const left = await page.locator(".pw-tile").evaluateAll((els) => els.map((e) => e.dataset.ref));
      assert.ok(gone.every((ref) => !left.includes(ref)), `${where}: the deleted page's photos are gone`);
      await page.evaluate(() => document.querySelector("#test-delete")?.remove());
      passed.push(`${where}: deleting a page takes its 2 photos off the wall (3 left)`);

      assert.deepEqual(errors, [], `${where}: ${errors.join(" | ")}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`V10.55 photo wall E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}`);
  console.log("No page errors.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
