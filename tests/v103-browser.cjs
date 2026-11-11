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
    const home = async () => { await page.locator('#navigation [data-page="home"]').tap(); await page.waitForSelector(".hero"); };
    const closePanel = async () => { await page.locator('.kp [data-action="choose-close"]').first().tap(); await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" }); };
    const firstLine = () => page.locator(".kp .keeper-msg.them").first().innerText();

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
        assert.deepEqual(await page.$$eval(".kp-acts .kp-do", (els) => els.map((el) => el.dataset.do)), ["organize", "memory", "write", "chat"]);
        assert.match(await page.locator(".kp .keeper-local").innerText(), /这台设备上生成/);
        await shot("v103-panel");
      }
      await closePanel();
    }
    assert.equal(new Set(lines).size, 3, `three openings, three different lines: ${lines.join(" / ")}`);
    for (const line of lines) {
      assert.match(line, /一页|「下午的咖啡」|那页|名字/, `it knows a page was kept today: ${line}`);
      assert.doesNotMatch(line, /有什么想记录的吗|（|\(/, "no stock question, no stage direction");
    }
    passed.push("the tag beside Captain and a tap open the same panel; the first line fits the day and is different each time");

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
    const cake = await say("今天想吃蛋糕");
    assert.match(cake, /没太懂|不太确定|还在想/);
    const write = await say("帮我写一句话");
    assert.match(write, /AI 小管家[\s\S]*不想假装/);
    const week = await say("这周我写了什么");
    assert.match(week, /这周你记了 1 天/);
    assert.equal(new Set([tired, cake, write, week]).size, 4, "different things get different answers");
    await page.evaluate(() => document.activeElement?.blur?.());
    await shot("v103-chat");
    passed.push("chat: tired → a gentle line; this week → counted on the device; writing for me → says it needs the AI keeper; anything else → an honest “not sure” (V10.9)");

    // 3. Sort out today: the pages in order, opened one by one; the journal is not changed.
    const before = JSON.stringify((await stored()).entries.find((e) => e.date === today));
    await page.locator('[data-action="keeper-do"][data-do="organize"]').tap();
    await page.waitForSelector('.kp[data-view="organize"] .kp-pages');
    assert.match(await page.locator(".kp-sum").innerText(), /今天 1 页/);
    assert.match(await page.locator(".kp-pages").innerText(), /下午的咖啡/);
    await shot("v103-organize");
    assert.equal(JSON.stringify((await stored()).entries.find((e) => e.date === today)), before, "only shown, nothing rewritten");
    await page.locator(".kp-pages li button").first().tap();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /下午的咖啡/);
    await home();
    // Typing "整理" goes to the same place.
    await tag.tap();
    await page.locator("[data-keeper-say]").fill("帮我整理今天");
    await page.locator(".kp-send").tap();
    await page.waitForSelector('.kp[data-view="organize"]');
    await page.locator('.kp [data-action="keeper-view"][data-view="home"]').first().tap();
    passed.push("sort out today: today's pages in order, each opens its page; typing 整理 goes there too; no data changed");

    // 4. Look back: asks once, then finds one of my own earlier pages (not a sample) and opens it.
    await page.locator('[data-action="keeper-do"][data-do="memory"]').tap();
    await page.waitForSelector('.kp[data-view="memory"] [data-action="keeper-allow-memories"]');
    assert.equal((await stored()).keeper.allowMemories, false);
    await shot("v103-memory-ask");
    await page.locator('[data-action="keeper-allow-memories"]').tap();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.v1")).keeper.allowMemories === true);
    assert.match(await page.locator(".kp").innerText(), /还不多，我们慢慢攒/, "sample days are not offered as my memories");
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
    await page.locator('[data-action="keeper-do"][data-do="memory"]').tap();
    await page.waitForSelector(".kp-memory");
    assert.match(await page.locator(".kp-memory").innerText(), /去看更大的世界[\s\S]*湖边的早晨[\s\S]*风很轻/);
    await shot("v103-memory");
    await page.locator(".kp-memory").tap();
    await page.waitForSelector(".day-detail");
    assert.match(await page.locator(".day-detail").innerText(), /湖边的早晨/);
    await home();
    passed.push("look back: asks before looking at earlier pages; shows one of my own (never a sample) with its journal and date; opens the original page");

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
