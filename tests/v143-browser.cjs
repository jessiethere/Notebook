// V10.43 · S3: use a photo already in Little Days instead of picking it again.
//  Quick Edit: tap photo 3 → 换照片 → 「正在替换照片 3」, sources 这一页 /
//  这一天 / 这本书 + 从相册添加. Choosing photo 2 copies its reference into
//  place 3: photo 2 stays, photo 3's words stay with place 3 (photo 2's are
//  not copied), no media is saved again, undo works, and the person keeps
//  writing and saves; after a restart every photo shows.
//  Studio: the same sheet for a saved page's photo.
//  Shared reference: deleting the page that shares a photo leaves the other
//  page's photo readable.
// zh 375 / en 430. Library photos only.
const { chromium } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const { timed } = require("./v142-browser.cjs");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();

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
      const mediaCount = () => page.evaluate(() => new Promise((resolve) => { const r = indexedDB.open("little-days-media"); r.onsuccess = () => { const c = r.result.transaction("media").objectStore("media").count(); c.onsuccess = () => { resolve(c.result); r.result.close(); }; }; }));
      const draftMoments = () => page.evaluate((k) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); const d = s.drafts[k] || s.entries.find((e) => e.date === k); return d.moments.map((m) => m.layers.filter((l) => l.kind === "photo" && !l.gen).map((l) => ({ id: l.id, ref: l.mediaRef, caption: l.caption || "" }))); }, today);
      // Three photos at 08:10 (one page) and one at 12:40 (another page).
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
      await chooser.setFiles([timed("latte-art", "08:10"), timed("corner-cafe", "08:11"), timed("cookies", "08:12"), timed("golden-field", "12:40")]);
      await page.waitForSelector('[data-action="story-save"]');
      const tabs = await page.locator(".story-tabs button").count();
      if (tabs > 2) await page.locator(".story-tabs button").nth(1).tap(); // the 08:10 page (after the day spread, if any)
      await page.waitForTimeout(300);
      // Words for photo 2 and photo 3.
      await page.locator('.qe-tools [data-panel="photo"]').tap();
      const pickN = async (n) => { await page.locator('.qe-photo [data-action="story-pick"]').nth(n - 1).tap(); await page.waitForTimeout(150); };
      const wordsFor = async (n, text) => {
        await pickN(n);
        await page.locator('.qe-photo [data-action="story-words-photo"]').tap();
        await page.waitForSelector("#choose-dialog[open] [data-sw-text]");
        await page.locator("#choose-dialog [data-sw-text]").fill(text);
        await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
        await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
        await page.waitForTimeout(400);
        if (!(await page.locator(".qe-photo").count())) await page.locator('.qe-tools [data-panel="photo"]').tap();
      };
      await wordsFor(2, "photo two words");
      await wordsFor(3, "photo three words");
      let before = (await draftMoments()).find((m) => m.length === 3);
      const mediaBefore = await mediaCount();
      // Replace photo 3 from "this page" with photo 2.
      await pickN(3);
      await page.locator('.qe-photo [data-action="story-replace"]').tap();
      await page.waitForSelector("#choose-dialog[open] .ps-sheet");
      assert.match(await page.locator("#ps-title").innerText(), zh ? /正在替换照片 3/ : /Replacing photo 3/, `${where}: says which photo is replaced`);
      assert.deepEqual(await page.locator(".ps-tabs button").allInnerTexts(), zh ? ["这一页", "这一天", "这本书"] : ["This page", "This day", "This book"]);
      assert.equal(await page.locator(".ps-grid .ps-thumb").count(), 3, "this page's 3 photos");
      assert.equal(await page.locator(".ps-thumb.self[disabled]").count(), 1, "photo 3 itself can't be chosen");
      assert.equal(await page.locator('[data-action="ps-album"]').count(), 1, "the photo library is still there");
      if (shots) await page.screenshot({ path: `${shots}/v143-${run.lang}-sheet.png` });
      await page.locator(".ps-grid .ps-thumb").nth(1).tap();
      await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
      await page.waitForTimeout(500);
      let now = (await draftMoments()).find((m) => m.length === 3);
      assert.equal(now[2].ref, before[1].ref, `${where}: place 3 now shows photo 2`);
      assert.equal(now[1].ref, before[1].ref, "photo 2 stays where it was");
      assert.equal(now[2].id, before[2].id, "place 3 keeps its layer");
      assert.equal(now[2].caption, "photo three words", "place 3 keeps its own words");
      assert.equal(now[1].caption, "photo two words", "photo 2's words not copied, not lost");
      assert.equal(await mediaCount(), mediaBefore, `${where}: nothing saved again (${mediaBefore} media records)`);
      assert.equal(await page.locator('[data-action="story-save"]').count(), 1, "still in Quick Edit");
      if (shots) await page.screenshot({ path: `${shots}/v143-${run.lang}-after.png` });
      // Undo, then do it again from "this day" with the 12:40 photo.
      await page.locator('.qe-notice [data-action="story-undo"]').tap();
      await page.waitForTimeout(400);
      now = (await draftMoments()).find((m) => m.length === 3);
      assert.equal(now[2].ref, before[2].ref, `${where}: undo brings photo 3 back`);
      if (!(await page.locator(".qe-photo").count())) await page.locator('.qe-tools [data-panel="photo"]').tap();
      await pickN(3);
      await page.locator('.qe-photo [data-action="story-replace"]').tap();
      await page.locator('.ps-tabs [data-scope="day"]').tap();
      const day = (await draftMoments()).flat();
      const field = day.find((p) => !before.some((b) => b.ref === p.ref));
      await page.locator(`.ps-thumb[data-ref="${field.ref}"]`).tap();
      await page.waitForTimeout(500);
      now = (await draftMoments()).find((m) => m.length === 3);
      assert.equal(now[2].ref, field.ref, `${where}: "this day" offers the other page's photo`);
      assert.equal(await mediaCount(), mediaBefore, "still nothing saved again");
      // Keep going: words for the page, then save.
      await page.locator('.qe-tools [data-action="story-text"]').tap();
      await page.waitForSelector("#choose-dialog[open] [data-sw-text]");
      await page.locator("#choose-dialog [data-sw-text]").fill(zh ? "一句话" : "A line");
      await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
      await page.waitForTimeout(400);
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      passed.push(`${where}: Quick Edit — 「正在替换照片 3」, this page / this day / this book + Photos; photo 2 copied into place 3 (photo 2 stays, words stay with their places, no media saved again), undo, again from this day, keep writing, save`);
      // Restart: every photo still shows.
      await page.reload();
      await page.waitForSelector(".hero");
      const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === k), today);
      assert.ok(saved, "saved");
      const missing = await page.evaluate(async (refs) => { const r = indexedDB.open("little-days-media"); const db = await new Promise((res) => (r.onsuccess = () => res(r.result))); const out = []; for (const ref of refs) { const v = await new Promise((res) => { const g = db.transaction("media").objectStore("media").get(ref.slice(6)); g.onsuccess = () => res(g.result); }); if (!v) out.push(ref); } db.close(); return out; }, [...new Set(JSON.stringify(saved).match(/media:[0-9a-f-]{36}/g))]);
      assert.deepEqual(missing, [], `${where}: after a restart every referenced photo is there`);
      // Studio: replace a saved page's photo with one already in the book.
      await page.evaluate((k) => { const m = JSON.parse(localStorage.getItem("little-days.v1")).entries.find((e) => e.date === k).moments.find((x) => x.layers.filter((l) => l.kind === "photo" && !l.gen).length === 1); window.__oneMoment = m.id; }, today);
      const oneMoment = await page.evaluate(() => window.__oneMoment);
      await page.evaluate(({ k, m }) => { const b = document.createElement("button"); b.dataset.action = "read-edit"; b.dataset.date = k; b.dataset.moment = m; b.id = "go-edit"; document.body.append(b); }, { k: today, m: oneMoment });
      await page.locator("#go-edit").click();
      await page.waitForSelector("#journal-canvas .photo-layer");
      await page.locator("#journal-canvas .photo-layer").first().click();
      await page.waitForTimeout(200);
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.action = "replace-photo"; b.id = "go-replace"; document.body.append(b); });
      await page.locator("#go-replace").click();
      await page.waitForSelector("#choose-dialog[open] .ps-sheet");
      await page.locator('.ps-tabs [data-scope="book"]').tap();
      const pick = page.locator(".ps-thumb:not([disabled])").first();
      const ref = await pick.getAttribute("data-ref");
      await pick.tap();
      await page.waitForTimeout(500);
      const studioRef = await page.evaluate(({ k, m }) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); const d = s.drafts[k] || s.entries.find((e) => e.date === k); return d.moments.find((x) => x.id === m).layers.find((l) => l.kind === "photo" && !l.gen).mediaRef; }, { k: today, m: oneMoment });
      assert.equal(studioRef, ref, `${where}: Studio uses the same sheet; the photo from this book is in place`);
      assert.equal(await mediaCount(), mediaBefore, "Studio: nothing saved again either");
      passed.push(`${where}: after a restart every photo is there; Studio's 替换 uses the same sheet (this book) without saving media again`);
      // Shared reference: delete the page that now shares that photo; the photo's other page still has it.
      await page.locator('.sv-top [data-action="studio-back"]').tap();
      if (await page.locator("#choose-dialog[open] .exit-sheet").count()) await page.locator('#choose-dialog [data-action="save-entry"]').tap();
      await page.waitForTimeout(500);
      const holders = () => page.evaluate(({ k, r }) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); const d = s.entries.find((e) => e.date === k); return d.moments.filter((m) => m.layers.some((l) => l.mediaRef === r && !l.gen)).map((m) => m.id); }, { k: today, r: ref });
      const both = await holders();
      assert.ok(both.length >= 2 && both.includes(oneMoment), `${where}: the photo is now used on ${both.length} pages`);
      await page.evaluate(({ k, m }) => { const b = document.createElement("button"); b.dataset.action = "read-delete"; b.dataset.date = k; b.dataset.moment = m; b.id = "go-delete"; document.body.append(b); }, { k: today, m: oneMoment });
      await page.locator("#go-delete").click();
      if (await page.locator("#confirm-dialog[open]").count()) await page.locator("#confirm-ok").click();
      await page.waitForTimeout(600);
      const left = await holders();
      assert.ok(!left.includes(oneMoment) && left.length >= 1, `${where}: that page is gone, the other page still uses the photo`);
      assert.equal(await mediaCount(), mediaBefore, `${where}: the shared photo's file is kept`);
      passed.push(`${where}: deleting a page that shared a photo keeps the file for the other page`);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v143: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
