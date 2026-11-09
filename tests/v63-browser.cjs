// V6.6 E2E — Growth merged into the day (task G): 4 tabs (no Growth tab);
// habits checked on Home's "today" card; the "My habits" book on the shelf
// opens the growth journey (and goes back); what was done shows as "today's
// list" on the day and on the book's page; up to 8 things to do today (V6.8,
// for everyone), done ones on the list (also drawn under the exported page),
// yesterday's unfinished only moved when asked.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { menu, openToday } = require("./signed-in.cjs");
const fs = require("node:fs");
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
    const [today, yesterday] = [await key(0), await key(1)];
    const store = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));

    // 1. Four tabs; Growth lives on Home's today card.
    const tabs = await page.$$eval("#navigation [data-page]", (els) => els.map((el) => el.dataset.page));
    assert.ok(!tabs.includes("growth"), "no Growth tab");
    assert.deepEqual(tabs.filter((t) => t !== "community"), ["home", "calendar", "studio", "books"]);
    // V6.8: Home's today card is the day's planner; habits are one line to "My habits".
    assert.match(await page.locator(".today-list h2").innerText(), /今天要做的事/);
    assert.equal(await page.locator(".today-list .habit-row").count(), 0, "no habit rows on Home");
    assert.match(await page.locator(".today-habits-link").innerText(), /我的习惯[\s\S]*0\/\d+ 已完成/);
    await page.locator(".today-habits-link").tap();
    await page.locator('[data-action="check"][data-habit="move"]').first().tap();
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).checks.some((c) => c.date === d && c.habitId === "move"), today);
    await menu(page, "home");
    assert.match(await page.locator(".today-habits-link").innerText(), /1\/\d+ 已完成/);
    if (shots) await page.screenshot({ path: `${shots}/v63-home.png` });
    passed.push("4 tabs (no Growth tab); Home shows the planner and one line to My habits (with today's count)");

    // 2. "My habits": from Home, and as a book on the shelf; back to the shelf.
    await page.locator('.today-list [data-action="nav"][data-page="growth"]').tap();
    await page.waitForSelector(".habit-card, .growth-summary, .page-title");
    assert.match(await page.locator(".page-title").innerText(), /我的习惯/);
    assert.equal(await page.locator('#navigation .nav-item.books[aria-current="page"]').count(), 1, "it belongs to My Books");
    await page.locator('.page-top [data-action="nav"][data-page="books"]').tap();
    await page.waitForSelector(".habit-book");
    assert.match(await page.locator(".habit-book").innerText(), /我的习惯[\s\S]*个习惯/);
    await page.locator(".habit-book").tap();
    await page.waitForFunction(() => /我的习惯/.test(document.querySelector(".page-title")?.textContent || ""));
    passed.push("“My habits” opens from Home and from the shelf, and goes back to the shelf");

    // 3. Things to do today (≤ 5, for everyone since V6.8); done ones go on the day's list.
    await menu(page, "home");
    await page.locator("[data-plan-input]").fill("给妈妈打电话");
    await page.locator('[data-action="plan-add"]').tap();
    await page.locator("[data-plan-input]").fill("买花");
    await page.locator("[data-plan-input]").press("Enter");
    await page.waitForFunction((d) => (JSON.parse(localStorage.getItem("little-days.v1")).plans?.[d] || []).length === 2, today);
    await page.locator('.today-plans [data-action="plan-toggle"]').first().tap();
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).plans[d][0].done === true, today);
    for (const x of ["读书", "跑步", "洗衣服", "交水费", "整理照片", "早点睡"]) {
      await page.locator("[data-plan-input]").fill(x);
      await page.locator('[data-action="plan-add"]').tap();
    }
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).plans[d].length === 8, today);
    assert.equal(await page.locator("[data-plan-input]").count(), 0, "eight at most");
    await page.locator('.today-plans [data-action="plan-remove"]').last().tap();
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).plans[d].length === 7, today);
    passed.push("planner: up to 8 things to do today — add (button / Enter), check, remove");

    // 4. The day's list: on the day in the calendar.
    await menu(page, "calendar");
    await page.locator(`[data-action="select-date"][data-date="${today}"]`).first().tap();
    await page.waitForSelector(".day-detail .today-list-card");
    const list = await page.locator(".today-list-card").innerText();
    assert.match(list, /今日清单/);
    assert.match(list, /给妈妈打电话/, "the thing done");
    assert.doesNotMatch(list, /买花/, "not the ones still to do");
    // V7.1: after the day's pages, as one quiet list of ✓ rows (habits and things done alike).
    assert.ok(await page.evaluate(() => {
      const d = document.querySelector(".day-detail"), list = d.querySelector(".today-list-card");
      return ![...d.querySelectorAll(".moment-chapter, .day-page")].some((el) => list.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    }), "the list comes after the pages");
    assert.ok((await page.locator(".today-list-card .day-checklist .check-line").count()) >= 2, "habits and things done as ✓ rows");
    assert.equal(await page.locator('.today-list-card [data-action="check-note"].text-button').count(), 0, "no repeated 写感想 links");
    if (shots) await page.screenshot({ path: `${shots}/v63-day.png` });
    passed.push("today's list on the day: habits checked and things done (not the undone ones)");

    // 5. …and on the book's page for that day (page by page).
    await page.evaluate((d) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      let e = s.entries.find((x) => x.date === d);
      if (!e || e.isDemo) {
        s.entries = s.entries.filter((x) => x.date !== d);
        e = { id: "own-" + d, date: d, title: "", body: "", photo: "", bookId: "food", isDemo: false, layers: [], media: [], moments: [] };
        s.entries.push(e);
      }
      e.moments.push({ id: "list-page", title: "今天", body: "", tags: [], bookId: "food", layers: [], media: [], layoutTemplate: "text" });
      delete s.drafts[d];
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, today);
    await page.reload();
    await page.waitForSelector(".hero");
    await page.locator('.home-book-cover[data-book="food"]').tap();
    await page.locator('[data-action="book-view"][data-view="flip"]').tap();
    await page.waitForSelector(".flip-page.is-cover");
    let seen = false;
    while (!(await page.locator('[data-action="flip"][data-dir="1"]').isDisabled())) {
      await page.locator('[data-action="flip"][data-dir="1"]').tap();
      await page.waitForSelector(".flip-page:not(.is-cover)");
      if (await page.locator(".flip-checklist").count()) {
        const moveTitle = (await store()).habits.find((h) => h.id === "move").title;
        assert.ok((await page.locator(".flip-checklist").innerText()).includes(moveTitle), "the habit checked, by name");
        assert.match(await page.locator(".flip-checklist").innerText(), /今日清单[\s\S]*给妈妈打电话/);
        seen = true;
        break;
      }
    }
    assert.ok(seen, "the list shows on that day's first page");
    passed.push("today's list also on the book's page for that day");

    // 5b. Privacy (V7.2): the day's list stays out of exports unless switched on
    // in Settings → Privacy; then the day's first page carries it underneath.
    const exportHeight = async () => {
      await menu(page, "studio");
      await openToday(page);
      const download = page.waitForEvent("download");
      await page.locator('[data-action="export"]').click();
      const png = fs.readFileSync(await (await download).path());
      await page.locator('[data-action="studio-back"]').click();
      assert.equal(png.readUInt32BE(16), 1080);
      if (shots) fs.writeFileSync(`${shots}/v63-export.png`, png);
      return png.readUInt32BE(20);
    };
    assert.equal(await exportHeight(), 1350, "private by default: no list in the export");
    await menu(page, "home");
    await page.locator(".settings-gear").tap();
    await page.waitForSelector(".privacy-card");
    assert.match(await page.locator(".privacy-card").innerText(), /只存在这台设备上[\s\S]*GPS/);
    await page.locator('[data-action="privacy-toggle"][data-privacy="shareList"]').tap();
    await page.waitForSelector('[data-privacy="shareList"][aria-checked="true"]');
    const tall = await exportHeight();
    assert.ok(tall > 1350, `switched on: the list strip under the page (${tall}px tall)`);
    passed.push("privacy: today's list stays out of exports by default; switched on, the day's first page carries it");

    // 5c. Privacy: Home can hide today's photos and words.
    await menu(page, "home");
    await page.locator(".settings-gear").tap();
    await page.locator('[data-action="privacy-toggle"][data-privacy="hideToday"]').tap();
    await page.waitForSelector('[data-privacy="hideToday"][aria-checked="true"]');
    await page.locator('#navigation [data-page="home"]').tap();
    await page.waitForSelector(".today-peek-wrap .peek-private");
    assert.equal(await page.locator(".today-peek-wrap img").count(), 0, "no photos on Home");
    assert.match(await page.locator(".peek-private").innerText(), /今天记了 \d+ 页[\s\S]*已在首页隐藏/);
    await page.locator(".peek-private").tap();
    await page.waitForSelector(".day-detail");
    await page.locator('#navigation [data-page="home"]').tap();
    await page.locator(".settings-gear").tap();
    await page.locator('[data-action="privacy-toggle"][data-privacy="hideToday"]').tap();
    passed.push("privacy: Home can hide today's photos and words (and still open the day)");

    // 6. Yesterday's unfinished things move only when asked.
    await page.evaluate(([t, y]) => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.plans = { [y]: [{ id: "y1", text: "回邮件", done: false }, { id: "y2", text: "交房租", done: true }] };
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    }, [today, yesterday]);
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal((await store()).plans[today], undefined, "nothing moved by itself");
    assert.match(await page.locator('[data-action="plan-carry"]').innerText(), /1 件/);
    await page.locator('[data-action="plan-carry"]').tap();
    await page.waitForFunction((d) => (JSON.parse(localStorage.getItem("little-days.v1")).plans?.[d] || []).some((p) => p.text === "回邮件" && !p.done), today);
    assert.equal((await store()).plans[yesterday].length, 2, "yesterday is left as it was");
    passed.push("yesterday's unfinished things come over only when asked; yesterday is unchanged");

    assert.deepEqual(errors, []);
    console.log(`V6.6 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
