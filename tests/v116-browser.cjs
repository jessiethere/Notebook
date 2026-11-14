// V10.16 · Profile marks (five monograms + the sprout, old emoji kept), the
// day's music silent until asked, and a day with several pages in a book.
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
    const errors = [],
      outside = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      const url = request.url();
      if (!/^(data|blob):/.test(url) && !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) outside.push(url);
    });
    const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png` });
    const accountNow = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.account")));
    const journal = () => page.evaluate(() => localStorage.getItem("little-days.v1"));
    const settings = async () => {
      await page.locator('#navigation [data-page="home"]').tap();
      await page.locator(".settings-gear").tap();
      await page.waitForSelector(".s2");
    };
    await page.goto(base);
    await page.waitForSelector(".hero");
    // V10.41 (S1): sample days are no longer in books. This suite reads book
    // days, so the sample days become days the person saved (scenario D).
    await require("./signed-in.cjs").touchStore(page);
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); for (const e of s.entries) e.isDemo = false; localStorage.setItem("little-days.v1", JSON.stringify(s)); });
    await page.reload();
    await page.waitForSelector(".hero");
    let before = null; // taken once the journal is in storage (after the book's music is chosen)

    // ---------------------------------------------------------------- P1
    await settings();
    assert.equal(await page.locator(".s2-avatar .pm-sprout-chip svg").count(), 1, "nothing chosen: the sprout");
    await SS.settingsSheet(page, "profile");
    assert.match(await page.locator(".s2-sheet .kp-title").innerText(), /属于你的小世界/);
    // No emoji to pick any more: five monograms and the sprout.
    const offered = await page.$$eval(".s2-sheet [data-action='profile-avatar']", (els) => els.map((el) => el.dataset.avatar));
    assert.deepEqual(offered, ["mark:sprout", "mono:paper", "mono:seal", "mono:kraft", "mono:sage", "mono:script"]);
    assert.equal(await page.locator('.s2-sheet [data-avatar="mark:sprout"]').getAttribute("aria-pressed"), "true", "the sprout is the default");
    // Typing the name: the card and the five monograms follow as it is typed.
    assert.deepEqual(await page.$$eval(".pf-row .pm-letter", (els) => els.map((el) => el.textContent)), ["名", "名", "名", "名", "名"], "no name: a faint sample");
    await page.locator("[data-profile-name]").fill("jess");
    assert.equal(await page.locator(".pf-card-name").innerText(), "jess");
    assert.deepEqual(await page.$$eval(".pf-row .pm-letter", (els) => els.map((el) => el.textContent)), ["J", "J", "J", "J", "J"]);
    assert.equal(await page.locator(".pf-row .pm-sample").count(), 0);
    // While typing on a phone only the card, the name and Save stay (the keyboard has the room).
    assert.equal(await page.locator(".pf-marks").isVisible(), false, "marks step aside while typing");
    await page.evaluate(() => document.activeElement.blur());
    await page.waitForSelector(".pf-marks", { state: "visible" });
    await page.locator('[data-avatar="mono:script"]').tap();
    assert.equal(await page.locator("[data-profile-name]").inputValue(), "jess", "the name survives picking a mark");
    assert.equal(await page.locator(".pf-card-mark .pm-script").count(), 1, "the card shows the choice");
    await shot("01-profile-editor");
    // Fits a small phone: Save in view, nothing sideways.
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);
    const fit = await page.evaluate(() => {
      const sheet = document.querySelector(".s2-sheet");
      const save = document.querySelector('[data-action="profile-save"]').getBoundingClientRect();
      return { save: save.bottom <= innerHeight + 1 && save.top >= 0, side: sheet.scrollWidth <= sheet.clientWidth + 1 };
    });
    assert.ok(fit.save && fit.side, JSON.stringify(fit));
    await shot("02-profile-375");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForSelector(".s2-avatar .pm-script");
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "J");
    assert.deepEqual([(await accountNow()).name, (await accountNow()).avatar], ["jess", "mono:script"]);
    // Kept after a reload (persisted, not only on screen).
    await page.reload();
    await page.waitForSelector(".hero");
    await settings();
    await page.waitForSelector(".s2-avatar .pm-script");
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "J");
    passed.push("editor: sprout by default, 5 monograms + sprout offered (no emoji), the card and letters follow typing, a choice saves and survives a reload; fits 375×667");

    // V10.16 polish: one letter scale / ring weight for all five; a quiet single selected ring.
    await SS.settingsSheet(page, "profile");
    const look = await page.evaluate(() => {
      const marks = [...document.querySelectorAll(".pf-row .pmark")];
      const css = (el, p) => getComputedStyle(el).getPropertyValue(p).trim();
      const sel = document.querySelector('.pf-choice[aria-pressed="true"] .pmark');
      return {
        sizes: [...new Set(marks.map((m) => m.getBoundingClientRect().width))],
        rings: [...new Set(marks.map((m) => css(m, "--pm-ring")))],
        outline: [css(sel, "outline-style"), parseFloat(css(sel, "outline-width"))],
        others: marks.filter((m) => m !== sel).map((m) => css(m, "outline-style")),
      };
    });
    assert.equal(look.sizes.length, 1, "five papers, one size");
    assert.equal(look.rings.length, 1, "one ring weight");
    assert.equal(look.outline[0], "solid");
    assert.ok(look.outline[1] > 0 && look.outline[1] <= 1.5, "the selected ring is a single, thin one: " + look.outline[1]);
    assert.ok(look.others.every((o) => o === "none"), "only the chosen one is ringed");
    // 430 wide, in English: the labels change, the name does not; nothing sideways; Save in view.
    await page.locator('#choose-dialog [data-action="choose-close"]').tap().catch(() => {});
    await page.evaluate(() => localStorage.setItem("little-days.language", "en"));
    await page.setViewportSize({ width: 430, height: 932 });
    await page.reload();
    await page.waitForSelector(".hero");
    await settings();
    await SS.settingsSheet(page, "profile");
    assert.match(await page.locator(".s2-sheet .kp-title").innerText(), /A little world of your own/);
    assert.equal(await page.locator("[data-profile-name]").inputValue(), "jess", "the name is not translated");
    const fit430 = await page.evaluate(() => {
      const sheet = document.querySelector(".s2-sheet");
      const save = document.querySelector('[data-action="profile-save"]').getBoundingClientRect();
      return { save: save.bottom <= innerHeight + 1 && save.top >= 0, side: sheet.scrollWidth <= sheet.clientWidth + 1, page: document.documentElement.scrollWidth <= innerWidth + 1 };
    });
    assert.ok(fit430.save && fit430.side && fit430.page, JSON.stringify(fit430));
    // Keyboard up (typing): the card, the field and Save stay, Save still reachable.
    await page.locator("[data-profile-name]").focus();
    assert.equal(await page.locator(".pf-marks").isVisible(), false);
    assert.equal(await page.locator('[data-action="profile-save"]').isVisible(), true);
    await shot("02b-profile-430-en");
    await page.evaluate(() => document.activeElement.blur());
    await page.locator('#choose-dialog [data-action="choose-close"]').tap();
    await page.evaluate(() => localStorage.setItem("little-days.language", "zh-CN"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForSelector(".hero");
    passed.push("polish: one paper size and ring weight, a single thin selected ring; 430 English fits, the name is not translated, typing keeps Save in reach");

    // An emoji chosen before V10.16 is kept: shown as it is, offered as 现在的头像.
    await page.evaluate(() => {
      const a = JSON.parse(localStorage.getItem("little-days.account"));
      localStorage.setItem("little-days.account", JSON.stringify({ ...a, avatar: "🐱" }));
    });
    await page.reload();
    await page.waitForSelector(".hero");
    await settings();
    assert.equal((await page.locator(".s2-avatar .pm-emoji").innerText()).trim(), "🐱", "an old emoji avatar is shown as it is");
    await SS.settingsSheet(page, "profile");
    const legacy = page.locator('.pf-legacy[data-avatar="🐱"]');
    assert.equal(await legacy.getAttribute("aria-pressed"), "true");
    assert.match(await legacy.innerText(), /现在的头像/);
    await shot("03-profile-legacy");
    // Saving without changing anything keeps it.
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForSelector(".s2-avatar .pm-emoji");
    assert.equal((await accountNow()).avatar, "🐱");
    passed.push("an old emoji avatar is kept: shown as it is, offered as 现在的头像, and saving keeps it");

    // A save that fails (storage full) keeps the sheet and says so.
    await SS.settingsSheet(page, "profile");
    await page.locator("[data-profile-name]").fill("小满");
    await page.evaluate(() => document.activeElement.blur());
    await page.locator('[data-avatar="mono:seal"]').tap();
    await page.evaluate(() => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "little-days.account") throw new DOMException("full", "QuotaExceededError");
        return real.call(this, key, value);
      };
      window.__restoreSetItem = () => (Storage.prototype.setItem = real);
    });
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForFunction(() => /没能保存资料/.test(document.querySelector("#toast")?.textContent || ""));
    assert.equal(await page.locator('#choose-dialog[open] .s2-sheet[data-sheet="profile"]').count(), 1, "the sheet stays open");
    assert.equal(await page.locator("[data-profile-name]").inputValue(), "小满", "what was typed is still there");
    assert.equal((await accountNow()).avatar, "🐱", "nothing half-saved");
    await page.evaluate(() => window.__restoreSetItem());
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForSelector(".s2-avatar .pm-seal");
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "小");
    passed.push("a failed save keeps the sheet and the typed name and says so; saving again works (小 on the seal)");

    // The welcome page (Labs): the same record; the mark there is now, no picker.
    await page.evaluate(() => {
      const a = JSON.parse(localStorage.getItem("little-days.account"));
      localStorage.setItem("little-days.account", JSON.stringify({ ...a, signedIn: false }));
    });
    await page.reload();
    await page.waitForSelector(".login");
    assert.equal(await page.locator('[data-action="login-avatar"]').count(), 0, "no picker on the welcome page");
    assert.equal(await page.locator(".login-me .pm-seal").count(), 1, "the same mark as Settings");
    assert.equal(await page.locator("#login-name").inputValue(), "小满");
    // The brand: the app icon and the Capiday wordmark with its sprout (no pixel ✿, no emoji art).
    assert.equal(await page.locator(".login-brand .login-icon").count(), 1);
    assert.equal(await page.locator(".login-brand .brand-sprout").count(), 1);
    assert.equal(await page.locator(".login-art").count(), 0);
    // Apple / email are not live: only inside the Labs tray, disabled and labelled.
    assert.equal(await page.locator(".login-provider").count(), await page.locator(".login-labs .login-provider[disabled]").count());
    assert.match(await page.locator(".login-labs-tag").innerText(), /实验室/);
    await shot("04-welcome");
    await page.locator('[data-action="login-local"]').tap();
    await page.waitForSelector(".hero");
    assert.deepEqual([(await accountNow()).name, (await accountNow()).avatar, (await accountNow()).signedIn], ["小满", "mono:seal", true], "signing in again keeps the mark");
    passed.push("welcome page (Labs): app icon + wordmark, name + the current mark from the same record, no picker, Apple/email only in the labelled Labs tray; signing in keeps the mark");

    // ---------------------------------------------------------------- P2: the day's music
    const bgm = () => page.evaluate(() => { const a = document.querySelector("#background-music"); return { playing: Boolean(a && !a.paused), music: a?.dataset.music || "" }; });
    // Give the first book a piece (from its page, as a person would), then read one of its days.
    await page.locator('#navigation [data-page="books"]').tap();
    await page.locator(".spine[data-book]").first().tap();
    await page.waitForTimeout(300);
    if (await page.locator('[data-action="book"]').count()) await page.locator('[data-action="book"]').first().tap().catch(() => {});
    await page.waitForSelector(".book-music");
    await page.locator('.book-music [data-action="music-sheet"]').tap();
    await page.locator('.music-sheet [data-action="music-pick"]').first().tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    await page.waitForFunction(() => localStorage.getItem("little-days.v1"));
    before = await journal();
    await page.locator('.day-covers .day-cover[data-date]').first().waitFor();
    const bookDay = await page.locator('.day-covers .day-cover[data-date]').first().getAttribute("data-date");
    // (Choosing it played it on the book page; the calendar is another place: silent.)
    await page.locator('#navigation [data-page="calendar"]').tap();
    await page.waitForFunction(() => document.querySelector("#background-music")?.paused ?? true);
    let musicDay = null;
    const cell = page.locator(`[data-action="select-date"][data-date="${bookDay}"]`).first();
    for (let i = 0; i < 3 && !(await cell.count()); i++) await page.locator('[data-action="month"][data-delta="-1"]').tap();
    await cell.tap();
    await page.waitForSelector(".day-detail .day-music .music-chip");
    musicDay = bookDay;
    assert.ok(musicDay, "a day with music");
    await page.waitForTimeout(700);
    assert.equal((await bgm()).playing, false, "opening a day plays nothing");
    await page.locator(".day-music .music-chip").tap();
    await page.waitForFunction(() => !document.querySelector("#background-music").paused);
    await page.locator(".day-music .music-chip").tap();
    await page.waitForFunction(() => document.querySelector("#background-music").paused);
    await page.locator(".day-music .music-chip").tap();
    await page.waitForFunction(() => !document.querySelector("#background-music").paused);
    await page.locator('[data-action="day-back"]').tap();
    await page.waitForFunction(() => document.querySelector("#background-music").paused);
    // Another day (or the same one again) starts silent: no sound by surprise.
    await page.locator(`[data-action="select-date"][data-date="${musicDay}"]`).first().tap();
    await page.waitForSelector(".day-detail");
    await page.waitForTimeout(700);
    assert.equal((await bgm()).playing, false, "coming back: silent again");
    await page.locator('[data-action="day-back"]').tap();
    passed.push("day detail: silent on opening; the chip plays / pauses / plays; leaving stops it; coming back is silent again");

    // ---------------------------------------------------------------- P2: a day with several pages
    await page.locator('#navigation [data-page="books"]').tap();
    await page.locator(".spine[data-book]").first().tap();
    await page.waitForTimeout(300);
    const open = page.locator('[data-action="book"]').first();
    if (await open.count()) await open.tap().catch(() => {});
    await page.waitForSelector(".day-covers");
    const groups = page.locator(".day-group");
    assert.ok((await groups.count()) >= 1, "a day with several pages has its own row of pages");
    const group = groups.first();
    const thumbs = group.locator(".day-page-thumb");
    const n = await thumbs.count();
    assert.ok(n >= 2);
    const labels = await thumbs.evaluateAll((els) => els.map((el) => el.querySelector("small b").textContent));
    assert.ok(labels.every((l) => /^第 \d+ 页$/.test(l)), labels.join());
    // Days with one page have no row (their card opens the page itself).
    const singles = await page.$$eval(".day-covers > .day-cover:not(.cover-entry)", (els) => els.length);
    assert.ok(singles >= 1);
    await group.scrollIntoViewIfNeeded();
    await shot("05-day-pages");
    // Each small page opens the reader at exactly that page.
    for (let i = 0; i < n; i++) {
      const want = Number((await thumbs.nth(i).locator("small b").innerText()).match(/\d+/)[0]);
      await thumbs.nth(i).tap();
      await page.waitForSelector(".reader");
      await page.waitForFunction((w) => new RegExp(`第 ${w} / \\d+ 页`).test(document.querySelector(".reader")?.innerText || ""), want);
      await SS.leaveReader(page);
      await page.waitForSelector(".day-covers");
    }
    // The day's card itself still opens its first page.
    const first = Number((await thumbs.nth(0).locator("small b").innerText()).match(/\d+/)[0]);
    await group.locator(".day-cover").tap();
    await page.waitForSelector(".reader");
    await page.waitForFunction((w) => new RegExp(`第 ${w} / \\d+ 页`).test(document.querySelector(".reader")?.innerText || ""), first);
    await SS.leaveReader(page);
    passed.push(`book detail: a day with ${n} pages shows them; each opens the reader at that page; the day's card opens its first page; one-page days unchanged`);

    // ---------------------------------------------------------------- data
    // (The sample journal is only written to storage once something changes in it.)
    const pagesOf = (text) => (JSON.parse(text || "null")?.entries || []).map((e) => [e.date, (e.moments || []).length]);
    assert.deepEqual(pagesOf(await journal()), pagesOf(before), "no page copied or moved");
    assert.deepEqual(outside, [], "nothing went outside this computer");
    assert.deepEqual(errors, []);
    passed.push("journal untouched (no page copied); nothing sent outside");
    await context.close();
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
