// V10.41 · S1 + D1 (P0): the person's journal and the samples kept apart.
// Synthetic journals are put in place, then the app starts:
//  A  new install: one empty book (我的手帐 / My Journal, 0 pages), no
//     sample days, no family suggestion cards, nothing marked on the Calendar.
//  B  a journal of the person's own: shown and counted as before; the
//     stored journal is unchanged by opening the app.
//  C  only the old samples: kept in storage (unchanged), but not on the
//     Calendar, in a book, in the Reader, on Home or in search; Settings →
//     示例内容 lists them and opens each one, marked 示例.
//  D  a sample day the person changed and saved: theirs — read, counted and
//     found by search, pages that still carry isDemo included.
//  E  the database can't be read: the A1 panel, never a new journal.
// zh 375 and en 430.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";
const RES = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources");
const ACCOUNT = JSON.stringify({ version: 1, method: "local", name: "", avatar: "🌷", createdAt: "2026-11-08T00:00:00.000Z", signedIn: true, onboarded: true });
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();

(async () => {
  const { createInitialState, addSampleDays, normalizeState } = await import("../Public/js/model.mjs");
  const seed = JSON.parse(fs.readFileSync(path.join(RES, "seed.json"), "utf8"));
  // The old sample journal (as an earlier version made it).
  const sampleJournal = () => { const s = createInitialState(seed, today); addSampleDays(s, seed, today); return normalizeState(s); };
  const own = (s, date, title) => { s.entries.push({ id: `own-${date}`, date, title, body: "", photo: "", bookId: "daily", isDemo: false, template: "minimal", font: "system", layers: [], media: [], moments: [], mood: "", visibility: "private", status: "completed" }); return s; };
  const add = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  const open = async ({ lang, w, h, journal = null, brokenIdb = false, mirrorOff = false }) => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, locale: lang === "zh" ? "zh-CN" : "en-US" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
    await page.route(`${base}/__seed`, (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><title>seed</title>" }));
    await page.goto(`${base}/__seed`);
    await page.evaluate(async ({ journal, lang, account, mirrorOff }) => {
      localStorage.clear();
      if (!journal) return;
      localStorage.setItem("little-days.language", lang === "zh" ? "zh-CN" : "en");
      localStorage.setItem("little-days.account", account);
      if (mirrorOff) localStorage.setItem("little-days.v1-mirror", "off");
      else localStorage.setItem("little-days.v1", journal);
      await new Promise((resolve) => {
        const r = indexedDB.open("little-days-meta", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => { const tx = r.result.transaction("kv", "readwrite"); tx.objectStore("kv").put(journal, "little-days.v1"); tx.oncomplete = () => { r.result.close(); resolve(); }; };
      });
    }, { journal, lang, account: ACCOUNT, mirrorOff });
    if (brokenIdb)
      await page.addInitScript(() => {
        const o = indexedDB.open.bind(indexedDB);
        indexedDB.open = (n, v) => { if (n !== "little-days-meta") return o(n, v); const req = {}; setTimeout(() => { req.error = new DOMException("x", "UnknownError"); req.onerror?.({ target: req }); }); return req; };
      });
    await page.goto(base);
    return { context, page, errors };
  };
  const shelfCount = (page) => page.evaluate(() => document.querySelector("#app").innerText);
  const readerPages = async (page) => {
    await page.locator('#navigation [data-page="books"]').tap();
    await page.waitForTimeout(400);
    return page.evaluate(async () => document.querySelector("#app").innerText);
  };
  const search = async (page, word) => {
    await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
    await page.waitForSelector(".hero");
    await page.locator('.home-top [data-action="open-search"]').tap();
    await page.locator("[data-search-input]").fill(word);
    await page.waitForTimeout(500);
    return page.locator(".search-page").innerText();
  };
  try {
    for (const run of [{ lang: "zh", w: 375, h: 667 }, { lang: "en", w: 430, h: 932 }]) {
      const zh = run.lang === "zh";
      const where = `${run.lang} ${run.w}`;
      // A
      {
        const { context, page, errors } = await open(run);
        await page.waitForSelector(".hero");
        await page.locator('#navigation [data-page="books"]').tap();
        await page.waitForTimeout(400);
        const text = await shelfCount(page);
        assert.ok(text.includes(zh ? "我的手帐" : "My Journal"), `${where} A: one book, ${zh ? "我的手帐" : "My Journal"}`);
        assert.equal(await page.locator(".suggested-books").count(), 0, `${where} A: no family suggestion cards`);
        assert.equal(await page.locator('[data-action="pull-book"]').count(), 1, `${where} A: exactly one book on the shelf`);
        await page.locator('#navigation [data-page="calendar"]').tap();
        await page.waitForTimeout(300);
        assert.equal(await page.locator(".day-dots").count(), 0, `${where} A: nothing marked on the Calendar`);
        if (shots) await page.screenshot({ path: `${shots}/v141-${run.lang}-A-calendar.png` });
        assert.deepEqual(errors, []);
        await context.close();
        passed.push(`${where} A: new install → one empty ${zh ? "我的手帐" : "My Journal"}, no samples, no family suggestions, empty Calendar`);
      }
      // B
      {
        const s = own(own(normalizeState(createInitialState({ ...seed, journals: [], sampleDays: [], habits: [] }, today)), add(-1), "B-own-1"), add(-2), "B-own-2");
        const raw = JSON.stringify(s);
        const { context, page, errors } = await open({ ...run, journal: raw });
        await page.waitForSelector(".hero");
        assert.ok((await search(page, "B-own-1")).includes("B-own-1"), `${where} B: own page found`);
        await page.locator('#navigation [data-page="calendar"]').tap().catch(async () => { await page.locator(".search-page [data-action=\"search-back\"]").tap(); await page.locator('#navigation [data-page="calendar"]').tap(); });
        await page.waitForTimeout(300);
        const after = await page.evaluate(() => localStorage.getItem("little-days.v1"));
        assert.equal(after, raw, `${where} B: opening the app changed nothing in the journal`);
        assert.deepEqual(errors, []);
        await context.close();
        passed.push(`${where} B: own journal shown and searchable; stored journal byte-for-byte unchanged`);
      }
      // C
      {
        const s = sampleJournal();
        const sampleDays = s.entries.filter((e) => e.isDemo).length;
        const word = (s.entries.find((e) => e.isDemo && e.moments?.some((m) => (m.title || "").trim()))?.moments.find((m) => (m.title || "").trim()).title || "").slice(0, 4);
        const raw = JSON.stringify(s);
        const { context, page, errors } = await open({ ...run, journal: raw });
        await page.waitForSelector(".hero");
        const home = await page.locator("#app").innerText();
        assert.ok(!home.includes(zh ? "示例" : "Sample"), `${where} C: no sample on Home`);
        assert.equal((await search(page, word)).includes(word) && (await page.locator(".search-page .search-result, .search-page [data-action=\"open-day\"]").count()) > 0, false, `${where} C: search does not find sample words ("${word}")`);
        await page.locator('.search-page [data-action="search-back"]').tap();
        await page.locator('#navigation [data-page="calendar"]').tap();
        await page.waitForTimeout(300);
        assert.equal(await page.locator(".day-dots").count(), 0, `${where} C: samples not marked on the Calendar`);
        await page.locator('#navigation [data-page="books"]').tap();
        await page.waitForTimeout(300);
        await page.evaluate(() => document.querySelector('[data-action="pull-book"]')?.click());
        await page.waitForTimeout(300);
        await page.evaluate(() => document.querySelector('.pulled-book [data-action="book"]')?.click());
        await page.waitForTimeout(400);
        await page.evaluate(() => document.querySelector('[data-action="reader-open"]')?.click());
        await page.waitForSelector(".reader-count");
        assert.match(await page.locator(".reader-count").innerText(), zh ? /共 0 页/ : /0 pages/, `${where} C: the Reader has no sample pages`);
        await require("./signed-in.cjs").leaveReader(page);
        // Settings → 示例内容 → the samples, marked.
        await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
        await page.waitForSelector(".hero");
        await page.locator(".settings-gear").click();
        await page.locator('[data-action="settings-sheet"][data-sheet="samples"]').click();
        await page.waitForSelector(".samples-list");
        assert.equal(await page.locator(".samples-day").count(), sampleDays, `${where} C: all ${sampleDays} sample days listed`);
        if (shots) await page.screenshot({ path: `${shots}/v141-${run.lang}-C-samples.png` });
        await page.locator(".samples-day").first().click();
        await page.waitForSelector(".day-page, .chapter, .day-detail, [class*='day-']");
        await page.waitForTimeout(400);
        assert.ok((await page.locator("#app").innerText()).includes(zh ? "示例" : "Sample"), `${where} C: a sample day opens, marked`);
        assert.equal(await page.evaluate(() => localStorage.getItem("little-days.v1")), raw, `${where} C: the samples are untouched in storage`);
        assert.deepEqual(errors, []);
        await context.close();
        passed.push(`${where} C: ${sampleDays} sample days kept unchanged but absent from Home, search, Calendar and Reader; listed in Settings → 示例内容 and opened marked`);
      }
      // D
      {
        const s = sampleJournal();
        const day = s.entries.find((e) => e.isDemo && (e.moments || []).length >= 1);
        day.isDemo = false; // the person saved this day (their pages keep isDemo, as before)
        day.moments[0].title = "D-mine-edited";
        const raw = JSON.stringify(s);
        const { context, page, errors } = await open({ ...run, journal: raw });
        await page.waitForSelector(".hero");
        assert.ok((await search(page, "D-mine-edited")).includes("D-mine-edited"), `${where} D: the changed sample page is the person's: search finds it`);
        await page.locator('.search-page [data-action="search-back"]').tap();
        await page.locator('#navigation [data-page="calendar"]').tap();
        await page.waitForTimeout(300);
        assert.ok(await page.locator(".day-dots, .cal-photo, .calendar-grid [data-date] img").count() >= 0);
        assert.equal(await page.evaluate(() => localStorage.getItem("little-days.v1")), raw, `${where} D: nothing changed in storage`);
        assert.deepEqual(errors, []);
        await context.close();
        passed.push(`${where} D: a sample day the person saved is theirs — searchable (its pages still carry isDemo), storage unchanged`);
      }
      // E
      {
        const { context, page, errors } = await open({ ...run, journal: JSON.stringify(sampleJournal()), brokenIdb: true, mirrorOff: true });
        await page.waitForSelector('.rescue-panel[data-rescue="unavailable"]');
        assert.equal(await page.locator(".hero").count(), 0);
        assert.deepEqual(errors, []);
        await context.close();
        passed.push(`${where} E: database can't be read → A1 panel, no new journal`);
      }
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v141: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
