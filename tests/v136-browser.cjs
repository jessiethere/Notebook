// V10.36 · A1 (P0 data safety): a blank journal only for a real first start.
// Synthetic journals are put into LocalStorage / IndexedDB, then the app
// starts. A journal that exists but can't be read now (database unavailable,
// missing although the device used it, other format, damaged) stops on the
// recovery panel and nothing is written; only an explicit choice goes on.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";
const RES = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources");
const I18N = JSON.parse(fs.readFileSync(path.join(RES, "i18n.json"), "utf8"));
const ACCOUNT = JSON.stringify({ version: 1, method: "local", name: "", avatar: "🌷", createdAt: "2026-11-08T00:00:00.000Z", signedIn: true, onboarded: true });

(async () => {
  const { createInitialState } = await import("../Public/js/model.mjs");
  const seed = JSON.parse(fs.readFileSync(path.join(RES, "seed.json"), "utf8"));
  const journal = (n, title) => {
    const s = createInitialState(seed, "2026-11-07");
    s.entries = s.entries.slice(0, n);
    if (title) s.entries[0].title = title;
    return JSON.stringify(s);
  };
  const good = journal(2, "Real page A");
  const older = journal(1, "Earlier page");
  const damaged = good.slice(0, Math.floor(good.length / 2));
  const newer = JSON.stringify({ ...JSON.parse(good), schemaVersion: 2 });

  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  // One fresh context per case: { ls: {key: value}, idb: {key: value} | null, brokenIdb }
  const setup = async ({ lang = "zh", w = 375, h = 667, ls = {}, idb = null, brokenIdb = false }) => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
    // Put the synthetic data in place on a blank page of the same origin.
    await page.route(`${base}/__seed`, (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>seed</title>" }));
    await page.goto(`${base}/__seed`);
    await page.evaluate(async ({ ls, idb, lang }) => {
      localStorage.clear();
      localStorage.setItem("little-days.language", lang === "zh" ? "zh-CN" : "en");
      for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v);
      if (!idb) return;
      await new Promise((resolve, reject) => {
        const req = indexedDB.open("little-days-meta", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("kv");
        req.onsuccess = () => {
          const tx = req.result.transaction("kv", "readwrite");
          for (const [k, v] of Object.entries(idb)) tx.objectStore("kv").put(v, k);
          tx.oncomplete = () => { req.result.close(); resolve(); };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
    }, { ls, idb, lang });
    if (brokenIdb)
      await page.addInitScript(() => {
        const open = indexedDB.open.bind(indexedDB);
        indexedDB.open = (name, version) => {
          if (name !== "little-days-meta") return open(name, version);
          const req = {};
          setTimeout(() => { req.error = new DOMException("simulated", "UnknownError"); req.onerror?.({ target: req }); });
          return req;
        };
      });
    await page.goto(base);
    const read = () => page.evaluate(async () => {
      const ls = localStorage.getItem("little-days.v1");
      const idb = await new Promise((resolve) => {
        const req = indexedDB.open("little-days-meta", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("kv");
        req.onsuccess = () => {
          const out = {};
          const store = req.result.transaction("kv").objectStore("kv");
          const keys = store.getAllKeys();
          keys.onsuccess = () => {
            let left = keys.result.length;
            if (!left) { req.result.close(); resolve(out); }
            for (const k of keys.result) store.get(k).onsuccess = (e) => { out[k] = e.target.result; if (!--left) { req.result.close(); resolve(out); } };
          };
        };
        req.onerror = () => resolve(null);
      });
      return { ls, idb };
    });
    return { context, page, errors, read };
  };
  const L = (lang, key, values = {}) => Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), I18N[key][lang]);
  const panel = async (page, reason) => {
    await page.waitForSelector(`.rescue-panel[data-rescue="${reason}"]`);
    return page.evaluate(() => ({
      text: document.querySelector(".rescue-panel").textContent,
      acts: [...document.querySelectorAll("[data-rescue-act]")].map((b) => b.dataset.rescueAct),
      hero: !!document.querySelector(".hero"),
      nav: getComputedStyle(document.querySelector("#navigation") || document.body).display,
    }));
  };
  const confirm = async (page) => {
    await page.waitForSelector("#confirm-dialog[open]");
    await page.locator("#confirm-ok").click();
  };
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const where = `${run.lang} ${run.w}`;
      // 1 · A readable journal opens exactly as before.
      {
        const c = await setup({ ...run, ls: { "little-days.v1": good, "little-days.account": ACCOUNT }, idb: { "little-days.v1": good } });
        await c.page.waitForSelector(".hero");
        assert.equal(await c.page.locator(".rescue-panel").count(), 0);
        assert.deepEqual(c.errors, []);
        await c.context.close();
        passed.push(`${where}: readable journal opens Home`);
      }
      // 2 · LocalStorage copy damaged, earlier complete copy in IndexedDB.
      {
        const c = await setup({ ...run, ls: { "little-days.v1": damaged, "little-days.account": ACCOUNT }, idb: { "little-days.v1": older } });
        const p = await panel(c.page, "damaged");
        assert.ok(p.text.includes(L(run.lang, "rescue.damaged")) && p.text.includes(L(run.lang, "rescue.safe")));
        assert.ok(p.text.includes(L(run.lang, "rescue.earlierFound", { pages: 1 })), p.text);
        assert.deepEqual(p.acts, ["retry", "save", "earlier"]);
        assert.equal(p.hero, false);
        await c.page.waitForTimeout(800);
        let now = await c.read();
        assert.equal(now.ls, damaged, `${where}: damaged copy untouched while waiting`);
        assert.equal(now.idb["little-days.v1"], older);
        if (shots) await c.page.screenshot({ path: `${shots}/v136-${run.lang}-${run.w}-damaged.png` });
        // Save a copy: both raw copies, exactly as found.
        const [download] = await Promise.all([c.page.waitForEvent("download"), c.page.locator('[data-rescue-act="save"]').tap()]);
        const file = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
        assert.equal(file.kind, "little-days-journal-copies");
        assert.deepEqual(file.copies.map((x) => [x.source, x.text]), [["local", damaged], ["durable", older]]);
        await c.page.waitForSelector(".rescue-note");
        // Cancel first: nothing changes.
        await c.page.locator('[data-rescue-act="earlier"]').tap();
        await c.page.waitForSelector("#confirm-dialog[open]");
        await c.page.locator("#confirm-cancel").click();
        await c.page.waitForTimeout(300);
        assert.equal((await c.read()).ls, damaged);
        assert.equal(await c.page.locator(".hero").count(), 0);
        // Then go on with the earlier copy: the damaged one is kept first.
        await c.page.locator('[data-rescue-act="earlier"]').tap();
        await confirm(c.page);
        await c.page.waitForSelector(".hero");
        now = await c.read();
        const kept = JSON.parse(now.idb["little-days.v1.rescue"]);
        assert.equal(kept.text, damaged);
        assert.equal(kept.reason, "damaged");
        assert.deepEqual(c.errors, []);
        await c.context.close();
        passed.push(`${where}: damaged newest copy → panel, raw copies saved, earlier copy only after confirm, damaged copy kept`);
      }
      // 3 · A journal in another format (a newer version): never rewritten.
      {
        const c = await setup({ ...run, ls: { "little-days.v1": newer, "little-days.account": ACCOUNT }, idb: { "little-days.v1": newer } });
        const p = await panel(c.page, "incompatible");
        assert.ok(p.text.includes(L(run.lang, "rescue.incompatible")));
        assert.deepEqual(p.acts, ["retry", "save"]);
        await c.page.waitForTimeout(800);
        const now = await c.read();
        assert.equal(now.ls, newer);
        assert.equal(now.idb["little-days.v1"], newer);
        assert.deepEqual(c.errors, []);
        await c.context.close();
        passed.push(`${where}: other format → panel, both copies untouched`);
      }
      // 4 · Database can't open on a device that used the app: no blank journal.
      {
        const c = await setup({ ...run, ls: { "little-days.v1-mirror": "off", "little-days.account": ACCOUNT }, idb: { "little-days.v1": good }, brokenIdb: true });
        const p = await panel(c.page, "unavailable");
        assert.ok(p.text.includes(L(run.lang, "rescue.unavailable")));
        assert.deepEqual(p.acts, ["retry"]);
        if (shots) await c.page.screenshot({ path: `${shots}/v136-${run.lang}-${run.w}-unavailable.png` });
        await c.page.waitForTimeout(800);
        assert.equal(await c.page.evaluate(() => localStorage.getItem("little-days.v1")), null);
        assert.deepEqual(c.errors, []);
        await c.context.close();
        // The real journal is still there for the next start.
        const again = await setup({ ...run, ls: { "little-days.v1-mirror": "off", "little-days.account": ACCOUNT }, idb: { "little-days.v1": good } });
        await again.page.waitForSelector(".hero");
        assert.equal((await again.read()).idb["little-days.v1"], good);
        await again.context.close();
        passed.push(`${where}: database unavailable → panel, nothing written; next start opens the journal`);
      }
      // 5 · The database opens but the journal it should hold is gone.
      {
        const c = await setup({ ...run, ls: { "little-days.v1-mirror": "off", "little-days.account": ACCOUNT }, idb: {} });
        const p = await panel(c.page, "missing");
        assert.deepEqual(p.acts, ["retry", "new"]);
        await c.page.locator('[data-rescue-act="new"]').tap();
        await confirm(c.page);
        await c.page.waitForSelector(".hero");
        assert.deepEqual(c.errors, []);
        await c.context.close();
        passed.push(`${where}: journal missing → panel; a new journal only after an explicit confirm`);
      }
      // 6 · A real first start, also when the database can't open (nothing is written there).
      {
        const c = await setup({ ...run });
        await c.page.waitForSelector(".hero, .welcome, #app section");
        assert.equal(await c.page.locator(".rescue-panel").count(), 0);
        await c.context.close();
        const d = await setup({ ...run, brokenIdb: true });
        await d.page.waitForSelector(".hero, .welcome, #app section");
        assert.equal(await d.page.locator(".rescue-panel").count(), 0);
        assert.deepEqual(d.errors, []);
        await d.context.close();
        passed.push(`${where}: first start opens normally (also without the database)`);
      }
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v136: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
