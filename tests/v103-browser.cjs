// V10.3 · Captain's panel without AI: the tag beside Captain and a tap open
// the same sheet; the first line fits the day and changes; the small chat is
// honest about what it cannot do; sorting out today and looking back at a
// memory are real flows on this device; nothing is sent anywhere.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [], outside = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { const host = new URL(request.url()).hostname; if (!["127.0.0.1", "localhost"].includes(host) && !request.url().startsWith("data:") && !request.url().startsWith("blob:")) outside.push(request.url()); });
    await page.goto(base);
    await page.waitForSelector(".hero");
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const home = async () => { await require("./signed-in.cjs").leaveReader(page); await page.locator('#navigation [data-page="home"]').tap(); await page.waitForSelector(".hero"); };
    const closePanel = async () => { await page.locator('.kp [data-action="choose-close"]').first().tap(); await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" }); };
    // V10.35: the panel opens on Captain's card (one line for this moment and
    // buttons that really do it), not on a status line in the chat.
    const firstLine = () => page.locator(".kp .cp-card p").innerText();

    // Captain on (Gentle), and one page written today.
    await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await page.waitForSelector(".keeper-onboard");
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForSelector(".keeper-home");
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("下午的咖啡");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForFunction(() => !document.querySelector(".toast.visible"), null, { timeout: 8000 }).catch(() => {});
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page");
    await home();
    await page.waitForSelector(".keeper-home .keeper-bubble", { state: "detached", timeout: 9000 }).catch(() => {});

    // 1. Two ways in, one panel; the line knows there is a page today, and changes.
    const tag = page.locator('.keeper-home [data-action="keeper-panel"]');
    assert.match(await tag.innerText(), /找 Captain/);
    const where = await page.evaluate(() => { const r = (sel) => document.querySelector(sel).getBoundingClientRect(); const t = r(".keeper-entry"), c = r(".keeper-home .keeper-tap"), h = r(".v9-hero"); return { tagH: t.height, gap: c.left - t.right, aboveCard: t.bottom <= h.top + 24, inside: t.left >= 0 && t.right <= innerWidth }; });
    assert.ok(where.tagH >= 44 && Math.abs(where.gap) < 40 && where.aboveCard && where.inside, `the tag sits beside Captain, above the photo-journal card: ${JSON.stringify(where)}`);
    assert.equal(await page.locator("#navigation [data-page]").count() <= 5, true, "no new tab");
    await shot("v103-home");
    const lines = [];
    for (const way of ['.keeper-home [data-action="keeper-panel"]', '.keeper-home [data-action="keeper-tap"]', '.keeper-home [data-action="keeper-panel"]']) {
      await page.locator(way).tap();
      await page.waitForSelector(".keeper-chat.kp");
      lines.push(await firstLine());
      if (lines.length === 1) {
        assert.equal(await page.locator(".kp .kp-do, .kp .kp-chip").count(), 0, "no fixed list of shortcuts (V10.35)");
        assert.deepEqual(await page.$$eval(".kp .cp-card button", (els) => els.map((el) => el.textContent)), ["继续编辑", "看看成品"], "a page just finished, with words");
        assert.match(await page.locator(".kp .keeper-local").innerText(), /简单聊天[\s\S]*这台设备上/);
        await shot("v103-panel");
      }
      await closePanel();
    }
    assert.notEqual(lines[0], lines[1], `opening again shows another line: ${lines.join(" / ")}`);
    for (const line of lines) {
      assert.match(line, /收好啦/, `it knows a page was just kept: ${line}`);
      assert.doesNotMatch(line, /有什么想记录的吗|（|\(/, "no stock question, no stage direction");
    }
    passed.push("the tag beside Captain and a tap open the same panel; the card fits the moment (a page just kept) and its line changes when opened again (V10.35)");

    // 2. The small chat: a few things it can do; honest about the rest.
    await tag.tap();
    await page.waitForSelector(".keeper-chat.kp");
    const say = async (text) => {
      await page.locator("[data-keeper-say]").fill(text);
      await page.locator(".kp-send").tap();
      // The reply follows my line (the sheet keeps the last few lines only).
      await page.waitForFunction((mine) => { const all = [...document.querySelectorAll(".kp .keeper-msg")]; const at = all.map((m) => m.textContent).lastIndexOf(mine); return at >= 0 && all[at + 1]?.classList.contains("them"); }, text);
      await page.waitForSelector(".kp .keeper-msg.pending", { state: "detached" }); // V10.5: “thinking” dots first
      return page.locator(".kp .keeper-msg.them").last().innerText();
    };
    const tired = await say("今天有点累");
    assert.match(tired, /不太轻松|辛苦|这样的日子/);
    // V10.18: a craving has its own reply; an odd sound is still honestly not understood.
    const cake = await say("今天想吃蛋糕");
    assert.match(cake, /饿|吃/);
    const odd = await say("嗷呜");
    assert.match(odd, /没太懂|不太确定|还在想/);
    const write = await say("帮我写一句话");
    assert.match(write, /我还不会替你写/, "honest: it does not write for me");
    assert.equal(await page.locator('.kp .keeper-msg [data-action="cp-go"]').count(), 2, "and offers buttons that really start a page");
    const week = await say("这周我写了什么");
    assert.match(week, /这周你记了 1 天/);
    assert.equal(new Set([tired, cake, write, week]).size, 4, "different things get different answers");
    await page.evaluate(() => document.activeElement?.blur?.());
    await shot("v103-chat");
    passed.push("chat: tired → a gentle line; this week → counted on the device; writing for me → says it can't, with 选照片 / 随手写 buttons (V10.35); anything else → an honest “not sure” (V10.9)");

    // 3. Sort out today: the pages in order, opened one by one; the journal is not changed.
    const before = JSON.stringify((await stored()).entries.find((e) => e.date === today));
    // V10.35: no fixed row for it any more; asking in the chat goes there.
    await page.locator("[data-keeper-say]").fill("帮我整理今天");
    await page.locator(".kp-send").tap();
    await page.waitForSelector('.kp[data-view="organize"] .kp-pages');
    assert.match(await page.locator(".kp-sum").innerText(), /今天 1 页/);
    assert.match(await page.locator(".kp-pages").innerText(), /下午的咖啡/);
    await shot("v103-organize");
    assert.equal(JSON.stringify((await stored()).entries.find((e) => e.date === today)), before, "only shown, nothing rewritten");
    await page.locator(".kp-pages li button").first().tap();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /下午的咖啡/);
    await home();
    await tag.tap();
    passed.push("sort out today (asked in the chat): today's pages in order, each opens its page; no data changed");

    // 4. Look back (V10.35: asked in the chat — no fixed row any more). Without
    // permission it says how to give it; with it, one of my own earlier pages
    // (never a sample), which opens.
    const recall = async () => {
      await page.locator("[data-keeper-say]").fill("看看以前的回忆");
      await page.locator(".kp-send").tap();
      await page.waitForSelector(".kp .keeper-msg.pending", { state: "detached" });
      return page.locator(".kp .keeper-msg.them").last().innerText();
    };
    assert.match(await recall(), /还没有翻看你以前页面的许可[\s\S]*设置/);
    assert.equal((await stored()).keeper.allowMemories, false);
    await shot("v103-memory-ask");
    await closePanel();
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.keeper.allowMemories = true;
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    });
    await page.reload();
    await page.waitForSelector(".keeper-home");
    await tag.tap();
    assert.match(await recall(), /还不多，我们慢慢攒/, "sample days are not offered as my memories");
    await closePanel();
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      const d = new Date(); d.setDate(d.getDate() - 4);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      s.entries = s.entries.filter((e) => e.date !== key);
      s.entries.push({ id: "e-" + key, date: key, title: "", body: "", photo: "", bookId: "travel", mood: "", layers: [], media: [], isDemo: false, moments: [{ id: "old-1", time: "10:00", title: "湖边的早晨", body: "风很轻，水面上有一点雾。", tags: [], bookId: "travel", layers: [], media: [], layoutTemplate: "text" }] });
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    });
    await page.reload();
    await page.waitForSelector(".keeper-home");
    await tag.tap();
    assert.match(await recall(), /湖边的早晨/);
    await shot("v103-memory");
    await page.locator('.kp .keeper-msg [data-action="open-day"]').last().tap();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /湖边的早晨/);
    await home();
    passed.push("look back (asked in the chat): without permission it says where to give it; with it, one of my own pages (never a sample), which opens");

    // 5. Quiet: no tag, a tap does not open anything.
    await page.locator('[data-action="nav"][data-page="settings"]').first().tap();
    await page.locator('[data-action="keeper-set"][data-key="mode"][data-value="quiet"]').tap();
    await home();
    assert.equal(await page.locator(".keeper-entry").count(), 0);
    await page.locator('.keeper-home [data-action="keeper-tap"]').tap();
    await page.waitForTimeout(400);
    assert.equal(await page.locator("#choose-dialog[open]").count(), 0, "still quiet");
    passed.push("Quiet mode: no tag, no panel");

    assert.deepEqual(outside, [], "nothing was requested from anywhere but this device");
    assert.equal((await stored()).keeper.aiConsent, false);
    assert.deepEqual(errors, []);
    console.log(`V10.3 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors; no outside requests.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
