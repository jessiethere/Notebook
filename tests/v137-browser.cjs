// V10.37 · A2 (P0 data safety): leaving the app keeps what was just typed,
// and "已保存" only shows once the words are really in the journal database.
//  1. Changes are kept while editing (no need to leave first).
//  2. Leaving (visibilitychange → hidden, pagehide) within the save pause
//     keeps the words at once, in LocalStorage and in IndexedDB.
//  3. A database write that fails is never shown as saved; a retry that
//     works is. Coming back to the app checks the state again.
// zh at 375 and en at 430. Synthetic words only.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const where = `${run.lang} ${run.w}`;
      const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, isMobile: true, hasTouch: true });
      await context.addInitScript((lang) => {
        localStorage.setItem("little-days.language", lang);
        // A switch the test turns on to make the journal database refuse writes.
        const put = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (value, key) {
          if (this.name === "kv" && window.__failMeta) throw new DOMException("simulated", "QuotaExceededError");
          return put.call(this, value, key);
        };
        // Lets the test say the page is hidden / visible again.
        window.__setHidden = (hidden) => {
          Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
          Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
          document.dispatchEvent(new Event("visibilitychange"));
        };
      }, run.lang === "zh" ? "zh-CN" : "en");
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
      await page.goto(base);
      await page.waitForSelector(".hero");
      const kept = () => page.evaluate(async () => {
        const ls = localStorage.getItem("little-days.v1") || "";
        const idb = await new Promise((resolve) => {
          const req = indexedDB.open("little-days-meta", 1);
          req.onsuccess = () => {
            const get = req.result.transaction("kv").objectStore("kv").get("little-days.v1");
            get.onsuccess = () => { resolve(get.result || ""); req.result.close(); };
            get.onerror = () => resolve("");
          };
          req.onerror = () => resolve("");
        });
        return { ls, idb };
      });
      const stateNow = () => page.evaluate(() => document.querySelector("#draft-status")?.dataset.state);
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector('#journal-canvas [data-inline="title"]');

      // 1 · Kept while editing, without leaving.
      const w1 = run.lang === "zh" ? "边写边存的第一句" : "Kept while I write";
      await page.keyboard.type(w1);
      await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
      let now = await kept();
      assert.ok(now.ls.includes(w1) && now.idb.includes(w1), `${where}: kept while editing`);
      passed.push(`${where}: words are kept while editing, before leaving`);

      // 2 · Leave right after typing (inside the save pause).
      const w2 = run.lang === "zh" ? "马上切走" : " then away";
      await page.keyboard.type(w2);
      now = await kept();
      assert.ok(!now.ls.includes(w2), "still inside the save pause (the test is meaningful)");
      await page.evaluate(() => window.__setHidden(true));
      now = await kept();
      assert.ok(now.ls.includes(w1 + w2), `${where}: hidden → kept at once in LocalStorage`);
      await page.waitForFunction(async (text) => {
        const req = indexedDB.open("little-days-meta", 1);
        const db = await new Promise((r) => (req.onsuccess = () => r(req.result)));
        const value = await new Promise((r) => { const g = db.transaction("kv").objectStore("kv").get("little-days.v1"); g.onsuccess = () => r(g.result || ""); });
        db.close();
        return value.includes(text);
      }, w1 + w2, { timeout: 5000 });
      await page.evaluate(() => window.__setHidden(false));
      await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
      passed.push(`${where}: going to the background right after typing keeps the words (LocalStorage at once, IndexedDB right after)`);

      const w3 = run.lang === "zh" ? "关页" : " closing";
      await page.keyboard.type(w3);
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
      now = await kept();
      assert.ok(now.ls.includes(w1 + w2 + w3), `${where}: pagehide → kept at once`);
      passed.push(`${where}: closing the page (pagehide) keeps the words at once`);

      // 3 · The database refuses the write: never "saved".
      await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
      await page.evaluate(() => (window.__failMeta = true));
      const w4 = run.lang === "zh" ? "存不进去" : " not stored";
      await page.keyboard.type(w4);
      await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "failed", null, { timeout: 15000 });
      await page.waitForTimeout(600);
      assert.equal(await stateNow(), "failed", `${where}: a failed database write is not shown as saved`);
      // Hidden and back: still honest.
      await page.evaluate(() => window.__setHidden(true));
      await page.evaluate(() => window.__setHidden(false));
      await page.waitForTimeout(600);
      assert.equal(await stateNow(), "failed", `${where}: back from the background, still not saved`);
      // The database works again: retry → saved, and the words are there.
      await page.evaluate(() => (window.__failMeta = false));
      await page.evaluate(() => document.activeElement?.blur?.());
      await page.locator("#draft-status").click();
      await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
      now = await kept();
      assert.ok(now.idb.includes(w1 + w2 + w3 + w4), `${where}: after the retry the words are in the database`);
      passed.push(`${where}: a failed database write shows 还没保存 (also after coming back); a retry that works shows 已保存`);

      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v137: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
