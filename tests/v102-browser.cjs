// V10.2 · Home scroll experience (Create → Remember → Collect): Today's Story
// combines the day's pages as a view only (nothing is merged or rewritten),
// words-only and empty days, the latest real story, the folded plans line
// that remembers its state, My Library, and both languages. Synthetic data.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { touchStore, openPlans } = require("./signed-in.cjs");
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
    const key = (back = 0) => page.evaluate((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }, back);
    const today = await key(0), earlier = await key(3);
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    // V10.56: the plans are in sight (with nothing yet, one quiet line to add).
    assert.equal(await page.locator('.today-planner.qu[data-state="empty"]').count(), 1);
    assert.equal(await page.locator(".qu-body").isVisible(), true);
    assert.ok((await page.evaluate(() => document.querySelector(".today-planner.qu").getBoundingClientRect().height)) <= 180, "no big empty block: a title, one line to add, my habits");
    // Write the journal once (so it is in LocalStorage), then set the days directly.
    await touchStore(page);
    const photo = (id, ref) => ({ id, kind: "photo", text: "", mediaRef: ref, x: 50, y: 50, w: 40, h: 30, rotation: 0, scale: 1 });
    const setDays = async (build) => {
      await page.evaluate(([fn, today, earlier, photoSrc]) => {
        const photo = eval(`(${photoSrc})`);
        const s = JSON.parse(localStorage.getItem("little-days.v1"));
        s.entries = s.entries.filter((e) => e.date !== today && e.date !== earlier);
        delete s.drafts[today];
        eval(`(${fn})`)(s, today, earlier, photo);
        localStorage.setItem("little-days.v1", JSON.stringify(s));
      }, [build.toString(), today, earlier, photo.toString()]);
      await page.reload();
      await page.waitForSelector(".hero");
    };
    const day = (date, moments) => ({ id: "e-" + date, date, title: "", body: "", photo: "", bookId: "daily", mood: "", layers: [], media: [], moments, isDemo: false });

    // 1. Three pages today, in three journals: one story, every page kept as it is.
    await setDays((s, today, earlier, photo) => {
      s.entries.push({ id: "e-" + today, date: today, title: "", body: "", photo: "", bookId: "daily", mood: "", layers: [], media: [], isDemo: false, moments: [
        { id: "m-walk", time: "08:10", title: "早晨的散步", body: "", tags: [], bookId: "travel", layers: [photo("w1", "photo:holiday-pool")], media: [], layoutTemplate: "scrapbook" },
        { id: "m-coffee", time: "15:20", title: "下午的咖啡好治愈", body: "和小林在街角那家店坐了一下午，聊了很多以后想去的地方。", tags: [], bookId: "daily", layers: [photo("c1", "photo:latte-beans"), photo("c2", "photo:latte-art"), photo("c3", "photo:workday-coffee"), photo("c4", "photo:brunch"), { id: "a1", kind: "audio", text: "", clipId: "clip-a", x: 50, y: 80, scale: 1, rotation: 0 }], media: [{ id: "clip-a", kind: "audio", name: "街角的声音", mime: "audio/webm", source: "media:none", size: 10, duration: 31 }], layoutTemplate: "scrapbook" },
        { id: "m-night", time: "22:05", title: "睡前", body: "今天什么都没拍，但想记住这句话：慢一点也没关系。", tags: [], bookId: "food", layers: [], media: [], layoutTemplate: "text" },
      ] });
    });
    const before = JSON.stringify((await stored()).entries.find((e) => e.date === today));
    await page.waitForSelector(".hs-remember .ts-card");
    assert.match(await page.locator(".hs-remember .hs-title").innerText(), /今天的故事[\s\S]*今天留下的 3 页/);
    const zhFont = await page.locator(".hs-remember .hs-title").evaluate((el) => getComputedStyle(el).fontFamily);
    assert.ok(/PingFang SC/.test(zhFont) && !/LD-elegant/.test(zhFont), `the Chinese title uses a face that has Chinese glyphs (${zhFont})`);
    // The page with the most to show leads; photos come from across the day.
    assert.match(await page.locator(".ts-card .ts-title").innerText(), /下午的咖啡好治愈/);
    assert.match(await page.locator(".ts-card .ts-words").innerText(), /和小林在街角那家店/);
    assert.match(await page.locator(".ts-card .ts-meta").innerText(), /15:20/);
    const pics = await page.$$eval(".ts-card .ts-pol img", (els) => els.map((el) => el.getAttribute("src")));
    assert.equal(pics.length, 3);
    assert.ok(/latte-beans/.test(pics[0]) && pics.some((src) => /holiday-pool/.test(src)), `the lead page's photo first, and one from another page: ${pics.join()}`);
    assert.match(await page.locator(".ts-card .ts-more").innerText(), /\+2/, "five photos today, three shown");
    assert.match(await page.locator(".ts-card .ts-chips").innerText(), /♪ 0:31/, "the sound on the page is marked");
    assert.match(await page.locator(".ts-card .ts-book").innerText(), /收藏于[\s\S]*平凡日子里的小确幸/);
    // V10.56: one summary card — the day's numbers (no list of every page on Home).
    assert.equal(await page.locator(".ts-also").count(), 0);
    assert.match(await page.locator(".ts-summary .ts-stats").innerText(), /3 页 · 5 张照片 · 1 段声音/);
    // No sideways scroll; images have boxes before they load (no jumps).
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector(".app-scroll").scrollWidth <= document.querySelector(".app-scroll").clientWidth), true);
    assert.equal(await page.$$eval(".ts-card .ts-pol img", (els) => els.every((el) => el.hasAttribute("width") && el.hasAttribute("height"))), true);
    await page.waitForFunction(() => [...document.querySelectorAll(".ts-card .ts-pol img")].every((img) => img.complete && img.naturalWidth > 0));
    await page.locator(".hs-remember").scrollIntoViewIfNeeded();
    await shot("v102-story");
    // Showing them together changed nothing in the journal.
    assert.equal(JSON.stringify((await stored()).entries.find((e) => e.date === today)), before, "the day's data is exactly as it was");
    // The card opens the lead page; a row opens its own page; the journal's name opens the journal.
    await page.locator(".ts-card .ts-open").tap();
    await page.waitForSelector(".day-detail");
    await page.locator('#navigation [data-page="home"]').tap();
    await page.locator(".ts-summary .ts-all").tap();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /早晨的散步[\s\S]*睡前|睡前[\s\S]*早晨的散步/);
    await page.locator('#navigation [data-page="home"]').tap();
    await page.locator(".ts-card .ts-book").tap();
    await page.waitForFunction(() => /平凡日子里的小确幸/.test(document.querySelector("#app")?.innerText || "") && !document.querySelector(".hs-remember"));
    await page.locator('#navigation [data-page="home"]').tap();
    assert.equal(JSON.stringify((await stored()).entries.find((e) => e.date === today)), before);
    passed.push("several pages in one day: one summary card (lead page, photos from across the day, +N, media mark, kept-in journal, 3 页 · 5 张照片 · 1 段声音); 查看今天全部记录 opens the whole day; the data is untouched");

    // 2. Words only: diary paper; long words are folded, the full page is one tap away.
    await setDays((s, today) => {
      s.entries.push({ id: "e-" + today, date: today, title: "", body: "", photo: "", bookId: "daily", mood: "", layers: [], media: [], isDemo: false, moments: [{ id: "m-words", time: "21:40", title: "今天什么都没拍，但想记住这句话：慢一点也没关系", body: "下午的光从窗帘缝里照进来，猫趴在脚边，电影放到一半就开始下雨，雨声比配乐还好听，锅里的汤一直小火咕嘟着。".repeat(3), tags: [], bookId: "daily", layers: [], media: [], layoutTemplate: "text" }] });
    });
    await page.waitForSelector(".ts-card.ts-paper");
    assert.equal(await page.locator(".ts-card img").count(), 0);
    const type = await page.evaluate(() => { const cs = (sel) => parseFloat(getComputedStyle(document.querySelector(sel)).fontSize); const w = document.querySelector(".ts-card .ts-words"); return { title: cs(".ts-card .ts-title"), words: cs(".ts-card .ts-words"), clipped: w.scrollHeight > w.clientHeight + 2 }; });
    assert.ok(type.title >= 22 && type.words >= 15, `readable sizes: ${JSON.stringify(type)}`);
    assert.equal(type.clipped, true, "long words are folded on Home");
    await page.locator(".hs-remember").scrollIntoViewIfNeeded();
    await shot("v102-words");
    await page.locator(".ts-card .ts-go").tap();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /锅里的汤一直小火咕嘟着。$|锅里的汤一直小火咕嘟着/);
    await page.locator('#navigation [data-page="home"]').tap();
    passed.push("words only: a sheet of diary paper at readable sizes; long words fold and open in full");

    // 3. Nothing today: the invitation, then the latest real story (not yesterday by assumption, never a sample).
    await setDays((s, today, earlier, photo) => {
      s.entries.push({ id: "e-" + earlier, date: earlier, title: "", body: "", photo: "", bookId: "travel", mood: "", layers: [], media: [], isDemo: false, moments: [{ id: "m-old", time: "10:00", title: "湖边的早晨", body: "风很轻。", tags: [], bookId: "travel", layers: [photo("o1", "photo:holiday-pool")], media: [], layoutTemplate: "scrapbook" }] });
    });
    await page.waitForSelector(".hs-remember .ts-empty");
    assert.match(await page.locator(".ts-empty").innerText(), /今天还没有写下故事。[\s\S]*或许可以从一张照片、一句话开始。[\s\S]*选一张照片开始/);
    assert.equal(await page.locator('.ts-empty [data-action="today-photos"]').count(), 1);
    assert.equal(await page.locator(".ts-empty img").count(), 0, "no sample photo in the empty state");
    const when = await page.evaluate((d) => new Date(d + "T12:00:00").toLocaleDateString("zh-CN", { month: "long", day: "numeric" }), earlier);
    assert.match(await page.locator(".ts-recent-head").innerText(), new RegExp(`最近的故事 · ${when}`));
    assert.match(await page.locator(".ts-card.ts-recent").innerText(), /湖边的早晨[\s\S]*收藏于[\s\S]*去看更大的世界/);
    await page.locator(".hs-remember").scrollIntoViewIfNeeded();
    await shot("v102-empty-recent");
    await page.locator(".ts-card.ts-recent .ts-open").tap();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /湖边的早晨/);
    await page.locator('#navigation [data-page="home"]').tap();
    // Only sample days in the journal: just the invitation, no extra card.
    await setDays((s) => { s.entries = s.entries.filter((e) => e.isDemo); });
    await page.waitForSelector(".hs-remember .ts-empty");
    assert.equal(await page.locator(".ts-recent-head, .ts-card").count(), 0, "no made-up latest story");
    passed.push("no record today: an invitation with one way to start, then the latest real story (opens the original); with no history of my own, only the invitation");

    // 4. V10.56 plans: in sight, three at most (what is left first), the rest one tap away;
    // ticking the last one folds the list to one line; nothing is lost.
    await openPlans(page);
    for (const text of ["买咖啡豆", "给妈妈打个电话", "浇花", "散步"]) { await page.locator("[data-plan-input]").fill(text); await page.locator('[data-action="plan-add"]').tap(); }
    await page.evaluate(() => document.activeElement?.blur());
    assert.equal(await page.locator(".qu .today-plans li").count(), 3, "three in sight");
    assert.match(await page.locator(".qu-more").innerText(), /还有 1 项/);
    await page.locator(".qu-more").tap();
    assert.equal(await page.locator(".qu .today-plans li").count(), 4);
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await page.locator(".qu .today-plans li").count(), 4, "show-all is remembered");
    await page.locator(".qu-more").tap();
    assert.equal(await page.locator(".qu .today-plans li").count(), 3);
    for (let i = 0; i < 4; i++) {
      await page.locator('.qu .plan-check[aria-pressed="false"]').first().tap();
      await page.waitForFunction(([d, n]) => (JSON.parse(localStorage.getItem("little-days.v1")).plans?.[d] || []).filter((p) => p.done).length === n, [today, i + 1]);
    }
    await page.waitForSelector('.today-planner.qu[data-state="done"]');
    assert.equal(await page.locator(".qu .today-plans li").count(), 0, "all done folds by itself");
    assert.match(await page.locator(".qu-done").innerText(), /4 件小事都完成啦/);
    const quiet = await page.evaluate(() => document.querySelector(".today-planner.qu").getBoundingClientRect().height);
    assert.ok(quiet <= 150, `the done state is small (title, one done line, my habits) (${quiet}px)`);
    assert.equal(((await stored()).plans[today] || []).filter((p) => p.done).length, 4, "folding loses nothing");
    await page.locator(".qu-more").tap();
    assert.equal(await page.locator(".qu .today-plans li.done").count(), 4, "the done list is one tap away");
    await page.locator(".qu-more").tap();
    passed.push("plans: in sight with three at most and 还有 N 项, show-all remembered, ticking the last folds to one done line, data intact");

    // 5. My Library: the journal written in most recently leads; one write link; covers open the real journal; no My / Shared switch on Home.
    await setDays((s, today, earlier, photo) => {
      s.entries.push({ id: "e-" + today, date: today, title: "", body: "", photo: "", bookId: "food", mood: "", layers: [], media: [], isDemo: false, moments: [{ id: "m-food", time: "12:30", title: "午饭", body: "", tags: [], bookId: "food", updatedAt: new Date().toISOString(), layers: [photo("f1", "photo:brunch")], media: [], layoutTemplate: "scrapbook" }] });
    });
    await page.waitForSelector(".hs-collect .lib-feature");
    assert.match(await page.locator(".hs-collect .hs-title").innerText(), /我的手帐/);
    const shelf = await page.$$eval(".hs-collect .home-book-cover", (els) => els.map((el) => el.dataset.book));
    assert.deepEqual(shelf, ["food", "daily", "travel"], "most recently written first, then the shelf's order");
    assert.equal(await page.locator(".hs-collect .lib-feature .book-cover").count(), 1, "the user's own cover");
    assert.match(await page.locator(".lib-now").innerText(), /正在记录[\s\S]*好好吃饭，好好生活[\s\S]*今天更新[\s\S]*接着记一页/);
    assert.equal(await page.locator(".hs-collect .home-book-write").count(), 1, "one write link, not one per book");
    assert.equal(await page.locator(".hs-collect .home-book-tabs, .hs-collect [data-action='home-books']").count(), 0, "no My / Shared switch on Home");
    const sizes = await page.evaluate(() => { const w = (sel) => document.querySelector(sel).getBoundingClientRect().width; return { feature: w(".lib-feature"), small: w(".lib-others .lib-mini"), row: document.querySelector(".lib-compact").getBoundingClientRect().height }; });
    assert.ok(sizes.row <= 200, `a compact row (${sizes.row}px)`);
    assert.ok(sizes.feature > sizes.small * 1.8, `the featured journal is larger (${JSON.stringify(sizes)})`);
    await page.locator(".hs-collect").scrollIntoViewIfNeeded();
    await shot("v102-library");
    await page.locator('.hs-collect .home-book-cover[data-book="travel"]').tap();
    await page.waitForFunction(() => /去看更大的世界/.test(document.querySelector("#app")?.innerText || "") && !document.querySelector(".hs-collect"));
    await page.locator('#navigation [data-page="home"]').tap();
    // V10.56: the journal in use opens in the reader.
    await page.locator('.hs-collect .lib-feature[data-book="food"]').tap();
    await page.waitForSelector(".flip-page");
    await page.locator('[data-action="reader-back"]').tap();
    await page.locator('#navigation [data-page="home"]').tap();
    await page.locator(".hs-collect .home-book-write").tap();
    await page.waitForSelector('#choose-dialog[open] [data-action="quick-book"][data-book="food"][aria-pressed="true"]');
    await page.keyboard.press("Escape");
    await page.locator('.hs-collect .hs-aside[data-page="books"]').tap();
    await page.waitForSelector(".shelf-switch");
    assert.equal(await page.locator('.shelf-switch [role="tab"]').count() >= 2, true, "My / Shared stays on the bookshelf page");
    await page.locator('#navigation [data-page="home"]').tap();
    passed.push("My Library: one compact row — the journal in use (its cover opens the reader, the only write link), two small covers open their journals; All opens the bookshelf, where My / Shared lives");

    // 6. English: translated titles in the Latin serif; the user's words stay as written; no overflow at 375 / 430.
    await page.evaluate(() => localStorage.setItem("little-days.language", "en"));
    await page.reload();
    await page.waitForSelector(".hero");
    assert.match(await page.locator(".hs-remember .hs-title").innerText(), /Today's Story/);
    assert.match(await page.locator(".hs-collect .hs-title").innerText(), /My Library/);
    assert.match(await page.locator(".hs-remember .hs-title").evaluate((el) => getComputedStyle(el).fontFamily), /LD-elegant/);
    assert.match(await page.locator(".ts-card .ts-title").innerText(), /午饭/, "the page's own words are not translated");
    assert.match(await page.locator(".ts-card .ts-book").innerText(), /In[\s\S]*好好吃饭，好好生活/);
    assert.match(await page.locator(".qu-row").innerText(), /Today's little plans[\s\S]*All done/);
    for (const [w, h] of [[375, 667], [430, 932]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(200);
      const fit = await page.evaluate(() => ({ page: document.documentElement.scrollWidth <= innerWidth, scroller: document.querySelector(".app-scroll").scrollWidth <= document.querySelector(".app-scroll").clientWidth, out: [...document.querySelectorAll(".hs-remember *, .qu *, .hs-collect *")].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).length, nav: getComputedStyle(document.querySelector("#navigation")).position }));
      assert.deepEqual([fit.page, fit.scroller, fit.out], [true, true, 0], `${w}px: nothing wider than the screen`);
      await page.locator(".hs-remember").scrollIntoViewIfNeeded();
      await shot(`v102-en-${w}`);
    }
    await page.evaluate(() => localStorage.setItem("little-days.language", "zh"));
    passed.push("English: Today's Story / My Library in the Latin serif, user content untranslated; nothing overflows at 375 and 430");

    assert.deepEqual(errors, []);
    console.log(`V10.2 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
