// V10.44 · S4: no day cover unless the person adds one; old covers can be
// hidden from reading and shown again (nothing deleted).
//  A  A new day of 3 Moments: 3 pages, no cover, 「＋ 封面（可选）」 offered.
//  B  Adding a cover uses the day's photos (no media saved again); a cover
//     photo can come from Photos without changing the Moment's photo; it is
//     saved and still there after a restart; 4 pages.
//  C  Hiding that cover in the Reader: 3 pages, the cover's layers and the
//     flag kept in the journal and in a backup; Day Detail offers to show it;
//     showing it again: 4 pages.
// zh 375 / en 430. Library photos only.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { timed } = require("./v142-browser.cjs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";
const lib = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Photos");
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const zh = run.lang === "zh";
      const where = `${run.lang} ${run.w}`;
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true, locale: zh ? "zh-CN" : "en-US", acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const mediaCount = () => page.evaluate(() => new Promise((resolve) => { const r = indexedDB.open("little-days-media"); r.onsuccess = () => { const c = r.result.transaction("media").objectStore("media").count(); c.onsuccess = () => { resolve(c.result); r.result.close(); }; }; }));
      const day = () => page.evaluate((k) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return s.drafts[k] || s.entries.find((e) => e.date === k); }, today);
      const readerTotal = async () => Number((await page.locator(".reader-count").innerText()).match(/(\d+)\D*$/)[1]);
      const story = async () => {
        const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
        await chooser.setFiles([timed("latte-art", "08:10"), timed("golden-field", "12:40"), timed("city-lights", "19:20")]);
        await page.waitForSelector('[data-action="story-save"]');
        await page.waitForTimeout(300);
      };
      // A
      await story();
      const tabs = await page.locator('.story-tabs [data-action="story-page"]').allInnerTexts();
      assert.equal(tabs.length, 3, `${where} A: three pages, no cover tab (${tabs.join(", ")})`);
      assert.equal(await page.locator('[data-action="story-cover-add"]').count(), 1, `${where} A: 「＋ 封面（可选）」 offered`);
      if (shots) await page.screenshot({ path: `${shots}/v144-${run.lang}-A-tabs.png` });
      let d = await day();
      assert.equal((d.layers || []).length, 0, "no day cover in the data");
      passed.push(`${where} A: a new day of 3 Moments → 3 pages, no cover; the optional cover is offered`);
      // B
      const mediaBefore = await mediaCount();
      await page.locator('[data-action="story-cover-add"]').tap();
      await page.waitForTimeout(400);
      assert.equal((await page.locator('.story-tabs [data-action="story-page"]').allInnerTexts()).length, 4, `${where} B: cover + 3 pages`);
      assert.equal(await mediaCount(), mediaBefore, `${where} B: the cover uses the day's photos (nothing saved again)`);
      d = await day();
      const momentRef = d.moments[0].layers.find((l) => l.kind === "photo" && !l.gen).mediaRef;
      // The cover's photo for the first Moment, from Photos.
      await page.locator('.qe-tools [data-panel="photo"]').tap();
      await page.locator('.qe-photo [data-action="story-pick"]').first().tap();
      await page.locator('.qe-photo [data-action="story-replace"]').tap();
      await page.waitForSelector(".ps-sheet");
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="ps-album"]').tap()]);
      await chooser.setFiles([{ name: "LD-photo-cookies.jpg", mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(lib, "LD-photo-cookies.jpg")) }]);
      await page.waitForFunction((k) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); const x = s.drafts[k] || s.entries.find((e) => e.date === k); return x && x.coverPhotos && Object.keys(x.coverPhotos).length === 1; }, today, { timeout: 15000 });
      d = await day();
      const coverRef = Object.values(d.coverPhotos)[0].reference;
      assert.notEqual(coverRef, momentRef, "the cover shows the new photo");
      assert.equal(d.moments[0].layers.find((l) => l.kind === "photo" && !l.gen).mediaRef, momentRef, `${where} B: the Moment page keeps its photo`);
      assert.ok((d.layers || []).some((l) => l.gen && l.mediaRef === coverRef), "the cover's layer uses it");
      if (shots) await page.screenshot({ path: `${shots}/v144-${run.lang}-B-cover.png` });
      await page.locator('.qe-panel [data-action="story-panel"][data-panel=""]').first().tap().catch(() => {});
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      assert.equal(await readerTotal(), 4, `${where} B: 4 pages with the cover`);
      await page.reload();
      await page.waitForSelector(".hero");
      d = await page.evaluate((k) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === k), today);
      assert.equal(d.coverPhotos[Object.keys(d.coverPhotos)[0]].reference, coverRef, "after a restart the cover keeps its photo");
      passed.push(`${where} B: the person adds a cover — from the day's photos (no new media), one photo from Photos for the cover only; 4 pages; kept after a restart`);
      // C · Hide it in the Reader.
      const layersBefore = d.layers.length;
      await page.evaluate((k) => { const b = document.createElement("button"); b.dataset.action = "reader-open"; b.dataset.book = "daily"; b.dataset.date = k; b.id = "go-read"; document.body.append(b); }, today);
      await page.locator("#go-read").click();
      await page.waitForSelector(".reader-count");
      await page.locator('[data-action="reader-more"]').tap();
      await page.waitForSelector('[data-action="day-cover-toggle"][data-hide="1"]');
      if (shots) await page.screenshot({ path: `${shots}/v144-${run.lang}-C-menu.png` });
      await page.locator('[data-action="day-cover-toggle"]').tap();
      await page.waitForTimeout(400);
      assert.equal(await readerTotal(), 3, `${where} C: hidden → 3 pages`);
      d = await page.evaluate((k) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === k), today);
      assert.equal(d.dayCoverHidden, true);
      assert.equal(d.layers.length, layersBefore, `${where} C: the cover's layers are kept`);
      // A full backup keeps the hidden cover.
      await SS.leaveReader(page);
      await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
      await page.waitForSelector(".hero");
      await page.locator(".settings-gear").click();
      const [download] = await Promise.all([page.waitForEvent("download"), page.locator('[data-action="backup"]').click()]);
      const backup = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
      const inBackup = backup.state.entries.find((e) => e.date === today);
      assert.equal(inBackup.dayCoverHidden, true);
      assert.equal(inBackup.layers.length, layersBefore, `${where} C: the backup keeps the hidden cover`);
      await page.locator('#choose-dialog [data-bk="no"]').click();
      // Day Detail offers to show it again.
      await page.evaluate((k) => { const b = document.createElement("button"); b.dataset.action = "open-day"; b.dataset.date = k; b.id = "go-day"; document.body.append(b); }, today);
      await page.locator("#go-day").click();
      await page.waitForSelector(".day-cover-hidden");
      assert.ok((await page.locator(".day-cover-hidden").innerText()).includes(zh ? "重新显示每日封面" : "Show this day's cover again"));
      if (shots) await page.screenshot({ path: `${shots}/v144-${run.lang}-C-day.png` });
      await page.locator('.day-cover-hidden [data-action="day-cover-toggle"]').tap();
      await page.waitForTimeout(400);
      d = await page.evaluate((k) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === k), today);
      assert.equal(d.dayCoverHidden, undefined, `${where} C: shown again`);
      passed.push(`${where} C: hiding the cover in the Reader → 3 pages, cover layers and flag kept (also in a full backup); Day Detail shows it again → 4 pages`);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v144: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
