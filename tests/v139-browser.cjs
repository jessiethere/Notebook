// V10.39 · B1–B5 (P0 first run). A real first start, without the older
// suites' helper (no samples, no Labs, no account):
//  B1 a new journal has no sample pages, days or habits; a journal that
//     already has samples keeps them (nothing deleted) and gets no new ones.
//  B2 the first start follows the device language; someone already using
//     the app keeps Chinese even on an English device.
//  B3 375×667: 选今天的照片 is fully in the first screen; the Keeper
//     invitation waits for the first page and sits under the photo card.
//  B4 no streak stamp pops up after the first page; no streak line on Home.
//  B5 成长轨迹 / 我的习惯 / habits on Home are behind Labs (data kept).
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";
const RES = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources");
const ACCOUNT = JSON.stringify({ version: 1, method: "local", name: "", avatar: "🌷", createdAt: "2026-11-08T00:00:00.000Z", signedIn: true, onboarded: true });

(async () => {
  const { createInitialState } = await import("../Public/js/model.mjs");
  const seed = JSON.parse(fs.readFileSync(path.join(RES, "seed.json"), "utf8"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  const open = async ({ locale, w, h, ls = null }) => {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, locale });
    if (ls) await context.addInitScript((ls) => { if (!sessionStorage.getItem("seeded")) { for (const [k, v] of Object.entries(ls)) localStorage.setItem(k, v); sessionStorage.setItem("seeded", "1"); } }, ls);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("dialog", (d) => errors.push(`native dialog: ${d.message()}`));
    await page.goto(base);
    await page.waitForSelector(".hero");
    return { context, page, errors };
  };
  const journal = (page) => page.evaluate(async () => {
    const ls = localStorage.getItem("little-days.v1");
    if (ls) return JSON.parse(ls);
    return null;
  });
  try {
    for (const run of [{ locale: "zh-CN", w: 375, h: 667, zh: true }, { locale: "en-US", w: 430, h: 932, zh: false }]) {
      const where = `${run.locale} ${run.w}`;
      const { context, page, errors } = await open(run);
      // B2
      assert.equal(await page.evaluate(() => document.documentElement.lang), run.zh ? "zh-CN" : "en", `${where}: the first start follows the device language`);
      // B3: the main way to start is fully visible above the tab bar.
      const fit = await page.evaluate(() => {
        const cta = document.querySelector('[data-action="today-photos"]').getBoundingClientRect();
        const nav = document.querySelector("#navigation").getBoundingClientRect();
        return { bottom: cta.bottom, navTop: nav.top, invite: !!document.querySelector(".keeper-invite"), streak: !!document.querySelector(".streak-chip"), habits: !!document.querySelector(".today-habits-link"), text: document.querySelector("#app").innerText };
      });
      assert.ok(fit.bottom <= fit.navTop, `${where}: 选今天的照片 is in the first screen (${fit.bottom.toFixed(0)} ≤ ${fit.navTop.toFixed(0)})`);
      assert.equal(fit.invite, false, `${where}: no Keeper invitation before the first page`);
      assert.equal(fit.streak, false, `${where}: no streak line on Home`);
      assert.equal(fit.habits, false, `${where}: no habits on Home`);
      assert.ok(!/示例|Sample/.test(fit.text), `${where}: no sample page on Home`);
      if (shots) await page.screenshot({ path: `${shots}/v139-${run.locale}-home.png` });
      // B1: nothing sample-like in the new journal (it is created on the first save).
      await page.locator('#navigation [data-page="calendar"]').tap();
      await page.waitForSelector(".calendar-grid, .segmented");
      assert.equal(await page.locator('[data-mode="growth"]').count(), 0, `${where}: no 成长轨迹 tab`);
      assert.equal(await page.locator(".day-dots").count(), 0, `${where}: no marked days in a new calendar`);
      await page.locator('#navigation [data-page="books"]').tap();
      await page.waitForTimeout(400);
      assert.equal(await page.locator(".shelf-habit-book").count(), 0, `${where}: no 我的习惯 book on the shelf`);
      const shelf = await page.locator("#app").innerText();
      if (!run.zh) assert.ok(shelf.includes("Little Joys of Ordinary Days") && !/平凡日子/.test(shelf), `${where}: the starting books are named in English`);
      // The first page: written and kept.
      await page.locator('#navigation [data-page="home"]').tap();
      await page.waitForSelector(".hero");
      await page.locator('[data-action="today-write"]').first().tap();
      await page.waitForSelector('#journal-canvas [data-inline="title"]');
      await page.keyboard.type(run.zh ? "第一页" : "My first page");
      await page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
      await page.locator('.sv-top [data-action="studio-back"]').tap();
      await page.waitForSelector('#choose-dialog[open] [data-action="save-entry"]');
      await page.locator('#choose-dialog [data-action="save-entry"]').tap();
      await page.waitForTimeout(600);
      await require("./signed-in.cjs").leaveReader(page);
      await page.locator('#navigation [data-page="home"]').tap().catch(() => {});
      await page.waitForSelector(".hero");
      await page.waitForTimeout(900);
      assert.equal(await page.locator("#streak-dialog[open], dialog[open] .streak-card").count(), 0, `${where}: no streak stamp pops up after the first page`);
      const j = await journal(page);
      assert.ok(j, "the journal was saved");
      assert.equal(j.entries.filter((e) => e.isDemo).length, 0, `${where}: no sample pages in the new journal`);
      assert.equal(j.habits.length, 0, `${where}: no sample habits`);
      const order = await page.evaluate(() => { const invite = document.querySelector(".keeper-invite"); const cta = document.querySelector('[data-action="today-photos"]'); return invite ? invite.getBoundingClientRect().top > cta.getBoundingClientRect().bottom : null; });
      assert.equal(order, true, `${where}: after the first page the Keeper invitation shows, under the photo card`);
      if (shots) await page.screenshot({ path: `${shots}/v139-${run.locale}-after-first.png` });
      // B5: with Labs on, Growth is back (nothing was removed).
      await page.evaluate(() => localStorage.setItem("little-days.labs", "1"));
      await page.reload();
      await page.waitForSelector(".hero");
      await page.locator('#navigation [data-page="calendar"]').tap();
      await page.waitForSelector('[data-mode="growth"]');
      assert.deepEqual(errors, []);
      await context.close();
      passed.push(`${where}: first start — device language, CTA in the first screen, no samples / habits / streak / 成长轨迹 / 我的习惯; first page saved without a streak popup; invitation after it, under the photo card; Labs brings Growth back`);
    }

    // B1 / B2 for someone already using the app (English device, no language chosen).
    {
      const old = createInitialState(seed, new Date().toISOString().slice(0, 10));
      old.entries.push({ ...structuredClone(old.entries[0]), id: "mine-1", date: "2026-10-01", title: "My own page", isDemo: false });
      old.samplesAdded = 0; // a newer seed would have added sample days before
      const raw = JSON.stringify(old);
      const { context, page, errors } = await open({ locale: "en-US", w: 430, h: 932, ls: { "little-days.v1": raw, "little-days.account": ACCOUNT } });
      assert.equal(await page.evaluate(() => document.documentElement.lang), "zh-CN", "someone already using the app keeps Chinese after the update");
      await page.locator('#navigation [data-page="books"]').tap();
      await page.waitForTimeout(300);
      const now = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
      const before = JSON.parse(raw);
      assert.equal(now.entries.filter((e) => e.isDemo).length, before.entries.filter((e) => e.isDemo).length, "existing samples are kept (nothing deleted), none added");
      assert.ok(now.entries.some((e) => e.id === "mine-1"), "the person's own page is there");
      assert.equal(now.habits.length, before.habits.length, "habits kept (hidden, not deleted)");
      assert.deepEqual(errors, []);
      await context.close();
      passed.push("existing journal on an English device: stays Chinese; its samples, own pages and habits are all kept; no new samples added");
    }
    console.log(passed.map((p) => `ok  ${p}`).join("\n"));
    console.log(`v139: ${passed.length} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
