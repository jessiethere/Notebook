// V10.47 · P0 (TestFlight): deleting every page of a day left a cover that
// could not be deleted, and the deleted pages stayed in the saved day.
// Root causes (docs/BUGFIX_LOG.md): the page directory always drew a cover
// row (an empty placeholder with no delete button), and 完成 refused to save
// an emptied day, so the saved copy kept the deleted pages.
// Synthetic data only.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"], locale: "zh-CN" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    let other = "";
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const dayState = async (date) => { const s = await read(); const e = s.entries.find((x) => x.date === date && !x.isDemo); const d = s.drafts[date]; return { saved: e ? (e.moments || []).length : null, draft: d ? (d.moments || []).length : null }; };
    // Test data is written with the app closed: on the way out the app saves
    // what it holds (A2), which would otherwise overwrite the seeded data.
    const seed = async (fn, arg) => {
      await page.goto(`${base}/shared/i18n.json`); // a plain file of the same site: the app is not running
      await page.evaluate(fn, arg);
      await page.goto(base);
      await page.waitForSelector(".hero");
    };
    const skipGuide = async () => { if (await page.locator(".sg-skip").count()) await page.locator(".sg-skip").first().tap(); };
    // A saved day of `n` pages (just write), built through the app itself.
    const writeDay = async (n, words) => {
      for (let i = 0; i < n; i++) {
        await page.goto(base);
        await page.waitForSelector(".hero");
        await page.locator('[data-action="today-write"]').first().tap();
        await page.waitForTimeout(700);
        await skipGuide();
        await page.keyboard.type(`${words} ${i + 1}`);
        await page.waitForTimeout(300);
        await page.locator('[data-action="save-entry"]').first().tap();
        await page.waitForTimeout(1000);
      }
    };
    const openDayView = async (date) => {
      await page.goto(base);
      await page.waitForSelector(".hero");
      await page.locator('#navigation [data-page="calendar"]').tap();
      await page.waitForSelector(".calendar-grid");
      // A date with pages opens that day straight away; otherwise 阅读 below the month.
      await page.evaluate((k) => document.querySelector(`[data-action="select-date"][data-date="${k}"]`)?.click(), date);
      await page.waitForTimeout(400);
      if (!(await page.locator(".day-detail").count())) {
        if (shots) await page.screenshot({ path: `${shots}/v146-open-${date}.png` });
        await page.locator('.summary-actions [data-action="open-day"]').tap();
      }
      await page.waitForSelector(".day-detail");
    };
    const openDirectory = async (date) => {
      await openDayView(date);
      await page.locator('.day-detail-top [data-action="edit-date"]').tap();
      await page.waitForSelector(".studio-bar");
      await skipGuide();
      await page.locator('[data-action="pages-manage"]').first().tap();
      await page.waitForSelector("#choose-dialog[open] .pages-list");
    };
    const removeFirst = async () => {
      await page.locator('#choose-dialog [data-action="page-remove"]').first().tap();
      await page.waitForTimeout(250);
    };

    // A day elsewhere that must never be touched.
    await writeDay(2, "Two pages");
    // Another date in this month with nothing on it (not a sample day).
    other = await page.evaluate((t) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1") || '{"entries":[],"drafts":{}}');
      const used = new Set([...s.entries.map((e) => e.date), ...Object.keys(s.drafts || {})]);
      for (let back = 1; back < 28; back++) {
        const d = new Date(Date.now() - 86400000 * back);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!used.has(k) && k.slice(0, 7) === t.slice(0, 7)) return k;
      }
      return "2001-01-01";
    }, today);
    await seed(([from, to]) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const copy = structuredClone(s.entries.find((e) => e.date === from && !e.isDemo));
      copy.id = `other-${Date.now()}`;
      copy.date = to;
      copy.moments.forEach((m, i) => (m.id = `other-m${i}`));
      s.entries.push(copy);
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, [today, other]);
    assert.deepEqual(await dayState(other), { saved: 2, draft: null });

    // 1. Two pages: delete one → the other stays, normal.
    await openDirectory(today);
    assert.equal(await page.locator("#choose-dialog .cover-row").count(), 0, "no cover row when the day has no cover");
    await removeFirst();
    if (await page.locator("#confirm-dialog[open]").count()) await page.locator("#confirm-ok").tap();
    await page.waitForTimeout(400);
    if (!(await page.locator("#choose-dialog[open]").count())) await page.locator('[data-action="pages-manage"]').first().tap();
    await page.waitForSelector("#choose-dialog[open] .pages-list");
    assert.equal(await page.locator('#choose-dialog [data-action="page-remove"]').count(), 1, "one page left");
    passed.push("two pages, delete one: the other stays; no cover row without a cover");

    // 2. Delete the last one → 「删除这一页后，这一天将没有记录。」 取消 keeps it; 删除 clears the day.
    await removeFirst();
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /删除这一页后，这一天将没有记录/);
    assert.equal(await page.locator("#confirm-ok").innerText(), "删除");
    assert.equal(await page.locator("#confirm-cancel").innerText(), "取消");
    await page.locator("#confirm-cancel").tap();
    await page.waitForTimeout(300);
    assert.equal((await dayState(today)).saved, 2, "取消 changes nothing");
    if (!(await page.locator("#choose-dialog[open]").count())) await page.locator('[data-action="pages-manage"]').first().tap();
    await page.waitForSelector("#choose-dialog[open] .pages-list");
    await removeFirst();
    await page.waitForSelector("#confirm-dialog[open]");
    await page.locator("#confirm-ok").tap();
    await page.waitForSelector(".calendar-grid");
    assert.deepEqual(await dayState(today), { saved: null, draft: null }, "the day is cleared (saved copy and draft)");
    assert.ok(await page.locator('#toast [data-action="day-restore"]').count(), "a toast with 撤销");
    assert.ok(await page.locator('.summary-actions [data-action="day-restore"]').count(), "恢复 on the empty date");
    if (shots) await page.screenshot({ path: `${shots}/v146-cleared.png` });
    assert.deepEqual(await dayState(other), { saved: 2, draft: null }, "the other date is untouched");
    passed.push("delete the last page: asked (取消 / 删除); the day is cleared; Calendar on the empty date; other dates untouched");

    // 3. Reload: the deleted pages do not come back; 恢复 still works after the reload.
    await page.reload();
    await page.waitForSelector(".hero");
    assert.deepEqual(await dayState(today), { saved: null, draft: null }, "still gone after a reload");
    await page.locator('#navigation [data-page="calendar"]').tap();
    await page.evaluate((k) => document.querySelector(`[data-action="select-date"][data-date="${k}"]`)?.click(), today);
    await page.waitForSelector('.summary-actions [data-action="day-restore"]');
    await page.locator('.summary-actions [data-action="day-restore"]').tap();
    await page.waitForTimeout(400);
    assert.equal((await dayState(today)).saved, 2, "恢复 brings both pages back");
    passed.push("after a reload the deleted day stays gone; 恢复 on that date brings it back");

    // 4. The stuck state left by the old build: saved day with pages, draft with none → 完成 asks and clears.
    await seed((k) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const saved = s.entries.find((e) => e.date === k);
      s.drafts[k] = { ...structuredClone(saved), moments: [] };
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, today);
    await openDayView(today);
    await page.locator('.day-detail-top [data-action="edit-date"]').tap();
    await page.waitForSelector(".studio-bar");
    await skipGuide();
    await page.locator('[data-action="pages-manage"]').first().tap();
    await page.waitForSelector("#choose-dialog[open] .pages-empty");
    assert.equal(await page.locator("#choose-dialog .cover-row").count(), 0, "empty state, no placeholder cover");
    await page.locator('#choose-dialog [data-action="choose-close"]').last().tap();
    await page.locator('[data-action="save-entry"]').first().tap();
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /页面都已经删掉了/);
    await page.locator("#confirm-ok").tap();
    await page.waitForSelector(".calendar-grid");
    assert.deepEqual(await dayState(today), { saved: null, draft: null }, "the stuck day is cleared");
    passed.push("old stuck state (saved pages, empty draft): page directory shows an empty state; 完成 asks and clears the day");

    // 5. An older day with a generated cover: the cover is kept and shown; it can be cleared; with no pages left the day is cleared.
    await seed(([k, o]) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const copy = structuredClone(s.entries.find((e) => e.date === o && !e.isDemo));
      copy.id = `cover-${Date.now()}`;
      copy.date = k;
      copy.layoutTemplate = "scrapbook";
      copy.layers = [{ id: "gen-cover-text", kind: "text", text: "Old cover", x: 50, y: 20, scale: 1, rotation: 0, gen: true }];
      copy.moments.forEach((m, i) => (m.id = `cover-m${i}`));
      s.entries.push(copy);
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, [today, other]);
    await openDirectory(today);
    assert.equal(await page.locator("#choose-dialog .cover-row").count(), 1, "the old cover is kept and listed");
    for (let i = 0; i < 2; i++) {
      await removeFirst();
      if (await page.locator("#confirm-dialog[open]").count()) await page.locator("#confirm-ok").tap();
      await page.waitForTimeout(400);
      if (!(await page.locator("#choose-dialog[open]").count())) await page.locator('[data-action="pages-manage"]').first().tap();
      await page.waitForSelector("#choose-dialog[open] .pages-list");
    }
    assert.equal(await page.locator('#choose-dialog [data-action="page-remove"]').count(), 0, "both pages gone");
    assert.equal(await page.locator('#choose-dialog [data-action="day-page-clear"]').count(), 1, "only the cover — with a way to delete it");
    if (shots) await page.screenshot({ path: `${shots}/v146-only-cover.png` });
    await page.locator('#choose-dialog [data-action="day-page-clear"]').tap();
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /清空封面后，这一天将没有记录/);
    await page.locator("#confirm-ok").tap();
    await page.waitForSelector(".calendar-grid");
    assert.deepEqual(await dayState(today), { saved: null, draft: null }, "deleting the last cover clears the day");
    assert.deepEqual(await dayState(other), { saved: 2, draft: null }, "the other date is still untouched");
    passed.push("older generated cover: kept and listed; with no pages left it can be deleted, which clears the day");

    // 6. Reader: deleting the last page of a day there clears it as well.
    await seed(([k, o]) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const copy = structuredClone(s.entries.find((e) => e.date === o && !e.isDemo));
      copy.id = `reader-${Date.now()}`;
      copy.date = k;
      copy.moments = copy.moments.slice(0, 1);
      copy.moments[0].id = "reader-only";
      s.entries.push(copy);
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, [today, other]);
    await openDayView(today);
    await page.locator('.moment-chapter [data-action="page-menu"]').first().tap();
    await page.locator('#choose-dialog [data-action="read-delete"]').tap();
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /删除这一页后，这一天将没有记录/);
    await page.locator("#confirm-ok").tap();
    await page.waitForTimeout(500);
    assert.deepEqual(await dayState(today), { saved: null, draft: null }, "cleared from the day view too");
    passed.push("day view ⋯ → delete the last page: same question, the day is cleared (no empty shell)");

    assert.deepEqual(errors, []);
    console.log(`V10.47 clear-a-day E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
