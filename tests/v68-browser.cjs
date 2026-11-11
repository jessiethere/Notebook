// V7.5 E2E — backup reminder and the storage upgrade: the journal is kept in
// IndexedDB; with LocalStorage full, saving still works and nothing is lost.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"], acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const key = (n) => page.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }, n);
    const idbRaw = () => page.evaluate(() => new Promise((resolve) => {
      const r = indexedDB.open("little-days-meta", 1);
      r.onsuccess = () => { const g = r.result.transaction("kv").objectStore("kv").get("little-days.v1"); g.onsuccess = () => resolve(g.result || null); };
      r.onerror = () => resolve(null);
    }));

    // 1. Nothing to back up yet: no reminder.
    assert.equal(await page.locator(".backup-nudge").count(), 0);
    // Three days of my own → a quiet reminder.
    await require("./signed-in.cjs").touchStore(page);
    const days = [await key(3), await key(2), await key(1)];
    await page.evaluate((days) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      for (const d of days) s.entries.push({ id: "own-" + d, date: d, title: "我的一天 " + d, body: "", photo: "", bookId: "daily", isDemo: false, layers: [], media: [], moments: [] });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, days);
    await page.reload();
    await page.waitForSelector(".backup-nudge");
    assert.match(await page.locator(".backup-nudge").innerText(), /还没备份过/);
    if (shots) await page.screenshot({ path: `${shots}/v68-nudge.png` });
    const download = page.waitForEvent("download");
    await page.locator('.backup-nudge [data-action="backup"]').click();
    assert.match((await download).suggestedFilename(), /Little-Days-Backup-.*\.json/);
    await page.waitForSelector(".backup-nudge", { state: "detached" });
    await page.locator(".settings-gear").click();
    assert.match(await page.locator(".backup-when").innerText(), /上次备份[\s\S]*0 天前/);
    passed.push("backup reminder: only once there are 3 days of my own; “Back up” saves the file and the reminder goes; Settings shows the last backup");

    // 2. Two weeks later it comes back; × waits a week.
    await page.evaluate((d) => localStorage.setItem("little-days.last-backup", d), await key(20));
    await page.locator('#navigation [data-page="home"]').click();
    await page.waitForSelector(".backup-nudge");
    assert.match(await page.locator(".backup-nudge").innerText(), /20 天没备份/);
    await page.locator('[data-action="backup-later"]').click();
    await page.waitForSelector(".backup-nudge", { state: "detached" });
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await page.locator(".backup-nudge").count(), 0, "snoozed for a week");
    passed.push("after 14 days without a backup it comes back; × waits a week");

    // 3. The journal is in IndexedDB too.
    await page.waitForFunction(async () => true);
    await page.waitForTimeout(300);
    assert.equal(await idbRaw(), await page.evaluate(() => localStorage.getItem("little-days.v1")), "IndexedDB has the same journal");
    passed.push("the journal is kept in IndexedDB (copied over on start, saved with every change)");

    // 4. LocalStorage full: write a page anyway; nothing is lost after a reload.
    await page.evaluate(() => {
      // Fill LocalStorage to the last few bytes: big pieces, then smaller ones.
      let n = 0;
      for (const size of [256 * 1024, 16 * 1024, 1024, 64, 4])
        for (let i = 0; i < 4000; i++) {
          try { localStorage.setItem("filler-" + n++, "x".repeat(size)); } catch { break; }
        }
    });
    await page.locator('[data-action="today-write"]').tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("存储满了也能保存");
    await page.locator('#journal-canvas [data-inline="body"]').click();
    await page.keyboard.type("这是一段比较长的文字，".repeat(30));
    await page.locator('[data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page:not(.is-cover)");
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.v1-mirror")), "off", "the mirror was dropped");
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.v1")), null);
    await page.waitForFunction(async () => {
      const raw = await new Promise((resolve) => { const r = indexedDB.open("little-days-meta", 1); r.onsuccess = () => { const g = r.result.transaction("kv").objectStore("kv").get("little-days.v1"); g.onsuccess = () => resolve(g.result || ""); }; });
      return raw.includes("存储满了也能保存");
    });
    await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("filler-")) localStorage.removeItem(k); });
    await page.reload();
    await page.waitForSelector(".hero");
    assert.match(await page.locator(".hs-remember").innerText(), /存储满了也能保存/, "still there after a reload (read from IndexedDB)");
    passed.push("LocalStorage full: the page is saved to IndexedDB, and is still there after a reload");

    assert.deepEqual(errors, []);
    console.log(`V7.5 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
