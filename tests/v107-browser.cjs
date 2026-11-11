// V10.7 · Leaving Journal Studio: finish the entry, keep it as a draft, or
// keep editing. Saved (on this device) is not the same as Draft / Completed
// (the record). The status belongs to the whole record (cover + pages).
// Autosave still works; a failed save never leaves or claims success.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const stored = () => page.evaluate((date) => { const s = JSON.parse(localStorage.getItem("little-days.v1")); return { entry: s.entries.find((e) => e.date === date && !e.isDemo) || null, draft: s.drafts[date] || null }; }, today);
    const sheet = page.locator("#choose-dialog[open] .exit-sheet");
    const inStudio = () => page.locator("#phone.in-studio").count();
    const back = () => page.locator('.sv-top [data-action="studio-back"]').tap();
    const savedNow = () => page.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
    const status = () => page.locator("#draft-status .ds-status").innerText();
    const quiet = () => page.waitForFunction(() => !document.querySelector(".toast.visible"), null, { timeout: 8000 }).catch(() => {});
    // What must survive: pages, words, formatting ranges, where things sit.
    const shape = (entry) => JSON.stringify({ title: entry.title, body: entry.body, layers: entry.layers, moments: entry.moments.map((m) => ({ id: m.id, title: m.title, body: m.body, titleMarks: m.titleMarks, bodyMarks: m.bodyMarks, layoutTemplate: m.layoutTemplate ?? null, layers: m.layers })) });

    // 0. Nothing written: ‹ just leaves, nothing is created, no question.
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.evaluate(() => document.activeElement?.blur?.());
    await back();
    await page.waitForSelector("#phone:not(.in-studio)");
    assert.equal(await page.locator("#choose-dialog[open]").count(), 0);
    assert.deepEqual(await stored(), { entry: null, draft: null }, "no empty draft is left behind");
    assert.equal(await page.locator(".draft-tag").count(), 0);
    passed.push("an empty page: ‹ leaves at once, no question, nothing created");

    // 1. A record with two pages: words with formatting, a photo and a text box in free layout.
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("第一页");
    await page.locator('#journal-canvas [data-inline="body"]').tap();
    await page.keyboard.type("今天在思考要不要买电脑。");
    await page.evaluate(() => { const el = document.querySelector('#journal-canvas [data-inline="body"]'); const r = document.createRange(); r.setStart(el.firstChild, 8); r.setEnd(el.firstChild, 11); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await page.waitForTimeout(80);
    await page.locator('#type-bar [data-type-mark="bold"]').tap();
    await page.evaluate(() => document.activeElement?.blur?.());
    assert.equal(await status(), "草稿", "a new record is a draft");
    await quiet();
    await page.locator('[data-action="pages-add"], .sv-pages [data-action="moment-add"], [data-action="add-moment"]').first().tap();
    await page.waitForFunction(() => /共 2 页|of 2/.test(document.querySelector(".sv-top")?.textContent || ""));
    // (A page added this way is already a free-layout page.)
    await page.locator('.tool-dock [data-action="add-photos"]').tap();
    await page.locator('#choose-dialog [data-action="use-scene"]').first().tap();
    await page.waitForSelector("#journal-canvas .photo-layer img");
    await SS.studioClose(page).catch(() => {});
    await SS.studioDeselect(page);
    await page.locator('.tool-dock [data-action="add-text-layer"]').tap();
    await page.waitForSelector(".text-layer.editing .layer-text");
    await page.keyboard.press("Control+A");
    await page.keyboard.type("第二页的文本框");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForSelector(".tool-dock.ctx");
    await savedNow();
    const working = await stored();
    assert.ok(working.draft && !working.entry, "autosave keeps the work on this device while editing");
    assert.match(await page.locator("#draft-status").innerText(), /已保存[\s\S]*草稿/, "Saved (device) and Draft (record) are two things");

    // 2. Nothing but leaving asks: switching pages, a tool, the preview do not.
    await page.locator('.sv-top [data-action="pages-manage"]').tap();
    await page.waitForTimeout(250);
    assert.equal(await sheet.count(), 0, "the page list is not the leaving question");
    await page.evaluate(() => { const d = document.querySelector("#choose-dialog"); if (d.open) d.close(); });
    await SS.studioDeselect(page);
    await SS.studioMore(page);
    assert.equal(await sheet.count(), 0);
    await SS.studioClose(page);
    await SS.studioPreview(page);
    assert.equal(await sheet.count(), 0);
    await SS.studioEdit(page);
    passed.push("switching pages, opening tools and the preview never ask; autosave keeps working (Saved ≠ Draft)");

    // 3. ‹ asks; 继续编辑 (button, ×) changes nothing: paper, selected item, still editing.
    await page.locator("#journal-canvas .text-layer").first().tap();
    await page.waitForSelector("#journal-canvas .text-layer.active");
    const paper = await page.locator("#journal-canvas").innerHTML();
    await back();
    await sheet.waitFor();
    assert.match(await sheet.innerText(), /要先收好这一页吗？[\s\S]*完成手帐[\s\S]*保存草稿[\s\S]*继续编辑/);
    assert.doesNotMatch(await sheet.innerText(), /放弃|丢弃|丢失|Discard|lose/i, "nothing scary: the work is safe either way");
    assert.deepEqual(await sheet.locator("button[data-action]").evaluateAll((els) => els.map((el) => el.dataset.action)), ["choose-close", "save-entry", "studio-draft-exit", "choose-close"]);
    const sizes = await sheet.locator(".exit-choice, .exit-stay").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
    assert.ok(sizes.every((h) => h >= 44), `44px targets (${sizes})`);
    await shot("01-sheet");
    await sheet.locator(".exit-stay").tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.equal(await inStudio(), 1);
    assert.equal(await page.locator("#journal-canvas").innerHTML(), paper, "the paper is exactly as it was");
    assert.equal(await page.locator("#journal-canvas .text-layer.active").count(), 1, "the selected item is still selected");
    await back();
    await sheet.waitFor();
    await sheet.locator(".kp-x").tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.equal(await inStudio(), 1);
    passed.push("‹ asks “要先收好这一页吗？” with three choices (no scary wording); 继续编辑 / × keep the paper, the selection and the editor as they were");

    // 4. 保存草稿: everything is kept, the record is a Draft, the editor closes.
    const beforeDraft = shape((await stored()).draft);
    await back();
    await sheet.waitFor();
    await sheet.locator('[data-action="studio-draft-exit"]').tap();
    await page.waitForSelector("#phone:not(.in-studio)");
    await page.waitForSelector(".hero");
    let now = await stored();
    assert.equal(now.entry.status, "draft");
    assert.equal(now.draft, null, "one copy of the record after leaving");
    assert.equal(shape(now.entry), beforeDraft, "cover, pages, photo positions, text and formatting are unchanged");
    assert.equal(now.entry.moments.length, 2);
    assert.deepEqual(now.entry.moments[0].bodyMarks, [{ start: 8, end: 11, bold: true }]);
    assert.ok(now.entry.moments[1].layers.some((l) => l.kind === "photo") && now.entry.moments[1].layers.some((l) => l.kind === "text"));
    // The draft can be found: a quiet tag on Home, in the book, on the day.
    assert.equal(await page.locator(".ts-card .draft-tag").first().innerText(), "草稿");
    await shot("02-home-tag");
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await page.locator(".ts-card .draft-tag").count() >= 1, true, "still a draft after a reload");
    await page.locator('#navigation [data-page="books"]').tap();
    await page.locator(`[data-action="pull-book"][data-book="${now.entry.moments[0].bookId}"]`).first().tap();
    await page.locator(`[data-action="book"][data-book="${now.entry.moments[0].bookId}"]`).first().tap();
    await page.waitForSelector(".book-detail-showcase");
    if (await page.locator('[data-action="book-view"][data-view="list"]').count()) await page.locator('[data-action="book-view"][data-view="list"]').tap();
    await page.waitForSelector(".day-cover .draft-tag");
    await shot("03-book-tag");
    await page.locator(".day-cover", { has: page.locator(".draft-tag") }).first().tap();
    await page.waitForSelector(".day-detail .draft-banner.is-draft");
    assert.match(await page.locator(".day-detail .draft-banner").innerText(), /草稿[\s\S]*继续编辑/);
    await shot("04-day-banner");
    passed.push("保存草稿: the whole record (2 pages, formatting, photo and text box positions) is kept unchanged and marked Draft; a quiet 草稿 tag on Home, in the book and on the day — also after a reload");

    // 5. Continue the draft where it was left; change it; keep it as a draft again.
    await page.locator('.day-detail .draft-banner [data-action="draft-continue"]').tap();
    await page.waitForSelector("#journal-canvas");
    await page.waitForFunction(() => /第 2 页|Page 2/.test(document.querySelector(".sv-top")?.textContent || ""), null, { timeout: 8000 });
    assert.equal(await status(), "草稿");
    assert.equal(await page.locator("#journal-canvas .photo-layer").count(), 1, "the page that was open, with its photo");
    assert.equal(await page.locator("#journal-canvas .text-layer .layer-text").first().innerText(), "第二页的文本框");
    await page.locator("#journal-canvas .text-layer").first().tap();
    await page.locator('.tool-dock.ctx [data-action="ctx-edit-text"]').tap();
    await page.waitForSelector(".text-layer.editing .layer-text");
    await page.keyboard.press("End");
    await page.keyboard.type("，又改了");
    await page.evaluate(() => document.activeElement?.blur?.());
    await savedNow();
    await back();
    await sheet.waitFor();
    await sheet.locator('[data-action="studio-draft-exit"]').tap();
    await page.waitForSelector("#phone:not(.in-studio)");
    now = await stored();
    assert.equal(now.entry.status, "draft");
    assert.ok(now.entry.moments[1].layers.some((l) => l.text === "第二页的文本框，又改了"));
    assert.equal(now.entry.moments.length, 2);
    passed.push("a draft reopens on the page it was left on, with its content; changing it and keeping it as a draft again works");

    // 6. Draft → Completed from the leaving sheet (the same step as 完成 at the top right).
    await page.waitForSelector(".day-detail");
    await page.locator('.day-detail .draft-banner [data-action="draft-continue"]').tap();
    await page.waitForSelector("#journal-canvas");
    await back();
    await sheet.waitFor(); // a draft asks even when nothing changed: it can be finished now
    await sheet.locator('[data-action="save-entry"]').tap();
    await page.waitForFunction(() => !document.querySelector("#phone.in-studio"));
    now = await stored();
    assert.equal(now.entry.status, "completed");
    assert.equal(now.draft, null);
    assert.equal(now.entry.moments.length, 2);
    const landedSheet = await page.evaluate(() => ({ day: Boolean(document.querySelector(".day-detail")), flip: Boolean(document.querySelector(".flip-page")) }));
    assert.equal(await page.locator(".draft-banner.is-draft, .flip-head .draft-tag").count(), 0, "no draft tag once finished");
    passed.push("草稿 → 完成手帐 from the leaving sheet: saved, marked Completed, the draft tag goes");

    // 7. A finished record: looking does not ask; changing it asks; 完成 at the top right gives the same result.
    const openFinished = async () => {
      if (!(await page.locator(".day-detail").count())) { await page.locator('#navigation [data-page="calendar"]').tap(); await page.locator(`[data-date="${today}"]`).first().tap(); await page.waitForSelector(".day-detail"); }
      await page.locator('.day-detail [data-action="read-edit"]').first().tap();
      await page.waitForSelector("#journal-canvas");
    };
    await openFinished();
    assert.equal(await status(), "已完成");
    await back();
    await page.waitForSelector("#phone:not(.in-studio)");
    assert.equal(await page.locator("#choose-dialog[open]").count(), 0, "a finished record that was only looked at leaves without a question");
    assert.equal((await stored()).entry.status, "completed");
    await openFinished();
    await page.locator('#journal-canvas [data-inline="title"]').tap();
    await page.keyboard.press("End");
    await page.keyboard.type("（改）");
    await page.evaluate(() => document.activeElement?.blur?.());
    await savedNow();
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForFunction(() => !document.querySelector("#phone.in-studio"));
    now = await stored();
    assert.equal(now.entry.status, "completed");
    assert.equal(now.entry.moments[0].title, "第一页（改）");
    const landedTop = await page.evaluate(() => ({ day: Boolean(document.querySelector(".day-detail")), flip: Boolean(document.querySelector(".flip-page")) }));
    assert.deepEqual(landedTop, landedSheet, "完成 (top right) and 完成手帐 (sheet) end in the same place");
    // Finished, then changed and put away as a draft.
    await openFinished();
    await page.locator('#journal-canvas [data-inline="title"]').tap();
    await page.keyboard.press("End");
    await page.keyboard.type("！");
    await page.evaluate(() => document.activeElement?.blur?.());
    await savedNow();
    await back();
    await sheet.waitFor();
    assert.match(await sheet.innerText(), /已经完成过/);
    await sheet.locator('[data-action="studio-draft-exit"]').tap();
    await page.waitForSelector("#phone:not(.in-studio)");
    now = await stored();
    assert.equal(now.entry.status, "draft");
    assert.equal(now.entry.moments[0].title, "第一页（改）！");
    passed.push("a finished record: only looking leaves without a question; 完成 (top right) = 完成手帐 (sheet) — same save, same status, same place; finished → changed → draft again works");

    // 8. A failed save never leaves and never says it worked.
    const failing = await browser.newContext({ ...devices["iPhone 13"] });
    const fp = await failing.newPage();
    fp.on("pageerror", (error) => errors.push(error.message));
    await fp.goto(base);
    await fp.waitForSelector(".hero");
    await fp.locator('[data-action="today-write"]').first().tap();
    await fp.waitForSelector('#journal-canvas [data-inline="title"]');
    await fp.keyboard.type("存不下来的一页");
    await fp.evaluate(() => document.activeElement?.blur?.());
    await fp.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "saved", null, { timeout: 15000 });
    await fp.locator('.sv-top [data-action="studio-back"]').tap();
    await fp.waitForSelector("#choose-dialog[open] .exit-sheet");
    // Another tab changed the journal meanwhile: this copy may not be written.
    await fp.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); s.plans = { ...(s.plans || {}), "2000-01-01": [{ id: "x", text: "elsewhere", done: false }] }; localStorage.setItem("little-days.v1", JSON.stringify(s)); });
    await fp.locator('.exit-sheet [data-action="studio-draft-exit"]').tap();
    await fp.waitForFunction(() => document.querySelector("#draft-status")?.dataset.state === "failed");
    assert.equal(await fp.locator("#phone.in-studio").count(), 1, "still in the editor");
    const said = await fp.locator(".toast").innerText();
    assert.doesNotMatch(said, /收好了|Draft kept/);
    assert.match(await fp.locator("#draft-status").innerText(), /保存失败|Not saved/);
    assert.equal(await fp.locator('#journal-canvas [data-inline="title"]').innerText(), "存不下来的一页", "the work is still on the page");
    await fp.locator('.sv-top [data-action="save-entry"]').tap();
    await fp.waitForTimeout(300);
    assert.equal(await fp.locator("#phone.in-studio").count(), 1, "完成 cannot leave either while saving fails");
    await failing.close();
    passed.push("a failed save: no “kept” message, the state reads 保存失败, the editor stays open with the work on the page");

    // 9. Small phone and English.
    const small = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const sp = await small.newPage();
    sp.on("pageerror", (error) => errors.push(error.message));
    await sp.addInitScript(() => localStorage.setItem("little-days.language", "en"));
    await sp.goto(base);
    await sp.waitForSelector(".hero");
    await sp.locator('[data-action="today-write"]').first().tap();
    await sp.waitForSelector('#journal-canvas [data-inline="title"]');
    await sp.keyboard.type("A small page");
    await sp.evaluate(() => document.activeElement?.blur?.());
    await sp.locator('.sv-top [data-action="studio-back"]').tap();
    await sp.waitForSelector("#choose-dialog[open] .exit-sheet");
    const fit = await sp.evaluate(() => { const r = document.querySelector(".exit-sheet").getBoundingClientRect(); return { inside: r.top >= 0 && r.bottom <= innerHeight + 1, wide: document.documentElement.scrollWidth <= innerWidth + 1, text: document.querySelector(".exit-sheet").innerText }; });
    assert.ok(fit.inside && fit.wide, JSON.stringify({ inside: fit.inside, wide: fit.wide }));
    if (/Finish entry/.test(fit.text)) assert.match(fit.text, /Finish entry[\s\S]*Keep as draft[\s\S]*Keep editing/);
    if (shots) await sp.screenshot({ path: `${shots}/05-375-en.png` });
    await small.close();
    passed.push("375×667: the sheet fits on screen");

    assert.deepEqual(errors, []);
    console.log(`V10.7 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
