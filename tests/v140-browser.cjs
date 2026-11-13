// V10.40 · C2 / C3 (P0 backup you can trust).
//  C2 One photo that can't be read no longer fails the whole backup, and is
//     never left out quietly: the files are listed (with their days); going
//     on makes a file named "-incomplete" that says complete: false and
//     lists them; it is recorded as incomplete, never as a full backup.
//  C3 Handing the file over (download / share sheet) is not a backup: it
//     counts only after 存好了. 没有 (or closing) records nothing.
// zh 375 and en 430. Library photos only; the "unreadable" file is made by
// removing its record from this test browser's media database.
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

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const zh = run.lang === "zh";
      const where = `${run.lang} ${run.w}`;
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true, acceptDownloads: true });
      await context.addInitScript((lang) => localStorage.setItem("little-days.language", lang), zh ? "zh-CN" : "en");
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const keys = () => page.evaluate(() => ({ at: localStorage.getItem("little-days.last-backup"), partial: localStorage.getItem("little-days.last-backup-partial") }));
      const settings = async () => {
        await SS.leaveReader(page);
        await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
        await page.waitForSelector(".hero");
        await page.locator(".settings-gear").click();
        await page.waitForSelector('[data-action="backup"]');
      };
      // A page with two photos of my own.
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.locator('[data-action="today-photos"]').first().tap()]);
      await chooser.setFiles([photo("corner-cafe"), photo("cookies")]);
      await page.waitForSelector('[data-action="story-save"]');
      await page.locator('[data-action="story-save"]').tap();
      await page.waitForSelector("#phone.in-reader");
      const ids = await page.evaluate(() => [...new Set((localStorage.getItem("little-days.v1").match(/media:[a-z0-9-]+/gi) || []).map((r) => r.slice(6)))]);
      assert.ok(ids.length >= 2, "two photos stored");

      // C3 · A complete backup: 没有 records nothing; 存好了 records it.
      await settings();
      let [download] = await Promise.all([page.waitForEvent("download"), page.locator('[data-action="backup"]').click()]);
      assert.doesNotMatch(download.suggestedFilename(), /incomplete/);
      let file = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
      assert.equal(file.complete, true);
      await page.waitForSelector('#choose-dialog[open] [data-bk="no"]');
      if (shots) await page.screenshot({ path: `${shots}/v140-${run.lang}-kept.png` });
      await page.locator('#choose-dialog [data-bk="no"]').click();
      await page.waitForTimeout(300);
      assert.deepEqual(await keys(), { at: null, partial: null }, `${where}: handed over but not kept → no backup recorded`);
      [download] = await Promise.all([page.waitForEvent("download"), page.locator('[data-action="backup"]').click()]);
      await page.locator('#choose-dialog [data-bk="yes"]').click();
      await page.waitForTimeout(300);
      assert.ok((await keys()).at, `${where}: 存好了 → recorded`);
      passed.push(`${where}: a backup counts only after 存好了 (没有 records nothing)`);

      // C2 · One photo can't be read.
      await page.evaluate((id) => new Promise((resolve) => {
        const r = indexedDB.open("little-days-media");
        r.onsuccess = () => { const tx = r.result.transaction("media", "readwrite"); tx.objectStore("media").delete(id); tx.oncomplete = () => { r.result.close(); resolve(); }; };
      }), ids[0]);
      await page.evaluate(() => localStorage.removeItem("little-days.last-backup"));
      let got = false;
      page.once("download", () => (got = true));
      await page.locator('[data-action="backup"]').click();
      await page.waitForSelector("#choose-dialog[open] .backup-missing");
      const sheet = await page.locator(".backup-missing").innerText();
      assert.match(sheet, zh ? /有 1 个文件读不出来[\s\S]*照片/ : /1 file\(s\) can't be read[\s\S]*Photo/, `${where}: the unreadable photo is listed`);
      assert.match(sheet, zh ? /页面里/ : /page\(s\) of/, "with the day it is on");
      if (shots) await page.screenshot({ path: `${shots}/v140-${run.lang}-missing.png` });
      await page.locator('#choose-dialog [data-bk="stop"]').click();
      await page.waitForTimeout(500);
      assert.equal(got, false, `${where}: cancel → nothing exported`);
      [download] = await Promise.all([page.waitForEvent("download"), (async () => { await page.locator('[data-action="backup"]').click(); await page.locator('#choose-dialog [data-bk="go"]').click(); })()]);
      assert.match(download.suggestedFilename(), /-incomplete\.json$/, "the file name says incomplete");
      file = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
      assert.equal(file.complete, false);
      assert.deepEqual(file.missing.map((m) => m.id), [ids[0]]);
      assert.equal(file.media.length, ids.length - 1, "every other file is in it");
      await page.locator('#choose-dialog [data-bk="yes"]').click();
      await page.waitForTimeout(300);
      const k = await keys();
      assert.equal(k.at, null, `${where}: an incomplete backup is never recorded as a full backup`);
      assert.equal(JSON.parse(k.partial).missing, 1);
      await page.reload();
      await settings();
      assert.match(await page.locator(".backup-when").innerText(), zh ? /不完整/ : /incomplete/, `${where}: Settings says the last backup was incomplete`);
      passed.push(`${where}: an unreadable photo is listed with its day; cancel exports nothing; going on gives "-incomplete" (complete: false, the file listed, everything else inside), recorded as incomplete`);

      // The incomplete backup restores in a new browser (the missing photo stays a missing photo).
      const fresh = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true });
      const p2 = await fresh.newPage();
      await p2.goto(base);
      await p2.waitForSelector(".hero");
      await p2.locator(".settings-gear").click();
      await p2.waitForSelector('[data-action="restore-backup"]');
      p2.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await p2.locator("#backup-input").setInputFiles(await download.path());
      await p2.waitForSelector("#confirm-dialog[open]");
      await p2.locator("#confirm-ok").click();
      await p2.waitForFunction(() => (localStorage.getItem("little-days.v1") || "").includes("media:"), null, { timeout: 15000 });
      const restored = await p2.evaluate(() => localStorage.getItem("little-days.v1"));
      assert.ok(restored.includes(`media:${ids[0]}`), "the missing photo keeps its place");
      await fresh.close();
      passed.push(`${where}: the incomplete backup restores; the missing photo keeps its place`);

      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v140: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
