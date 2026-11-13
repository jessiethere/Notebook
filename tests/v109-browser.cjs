// V10.9 · Captain's Corner: replies that fit what was meant (the ten lines
// from the review, typed into the real panel); no page is quoted without
// permission; one steady sheet height (medium / expanded); the shortcuts
// fold once the chat starts; Chat / Play / Look tabs; Play is honestly
// "on its way". Nothing is sent anywhere.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

const transcript = [];
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await context.newPage();
    const errors = [], outside = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { const url = request.url(); if (!/^(data|blob):/.test(url) && !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) outside.push(url); });
    await page.goto(base);
    await page.waitForSelector(".hero");
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const height = () => page.locator(".kp.corner").evaluate((el) => Math.round(el.getBoundingClientRect().height));
    const openCorner = async () => { await page.locator(".keeper-entry").tap(); await page.waitForSelector('.kp.corner[data-view="home"]'); };
    const close = async () => { await page.locator(".kp .kp-x").first().tap(); await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" }); };
    const say = async (text) => {
      if (!(await page.locator('.kp[data-view="home"]').count())) { await page.locator('.kp [data-action="keeper-view"][data-view="home"]').first().tap(); await page.waitForSelector('.kp[data-view="home"]'); }
      await page.locator("[data-keeper-say]").fill(text);
      await page.locator(".kp-send").tap();
      await page.waitForFunction(() => !document.querySelector(".kp .keeper-msg.pending"));
      const view = await page.locator(".kp").getAttribute("data-view");
      const reply = view === "home" ? await page.locator(".kp .keeper-msg.them").last().innerText() : `→ ${view}`;
      transcript.push([text, reply]);
      return reply;
    };

    // Captain on; one page today whose title must not be quoted without permission.
    await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await page.waitForSelector(".keeper-onboard");
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForSelector(".keeper-home");
    await page.locator('[data-action="today-write"]').first().tap();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    await page.keyboard.type("只给自己看的标题");
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForFunction(() => !document.querySelector(".toast.visible"), null, { timeout: 8000 }).catch(() => {});
    await page.locator('.sv-top [data-action="save-entry"]').tap();
    await page.waitForSelector(".flip-page");
    await require("./signed-in.cjs").leaveReader(page); await page.locator('#navigation [data-page="home"]').tap();
    await page.waitForSelector(".keeper-home");

    // 1. Without permission Captain never quotes the page (and never says it peeked).
    for (let i = 0; i < 6; i++) {
      await openCorner();
      // V10.35: the first line is Captain's card.
      const first = await page.locator(".kp .cp-card p").innerText();
      assert.doesNotMatch(first, /只给自己看的标题|偷偷|多看/, first);
      await close();
    }
    const k0 = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).keeper);
    assert.equal(k0.allowMemories, false);
    passed.push("without “look at earlier pages”, six openings: the first line never quotes the page title and never says Captain peeked");

    // 2. The ten lines from the review, typed into the real panel.
    await openCorner();
    // V10.35: before any chat the panel is only as tall as the card and the
    // field; the first line gives the conversation its full height, which
    // then stays the same.
    const quiet = await height();
    let h0 = 0;
    const expect = [
      ["你好可爱呀", /被你发现|多开心|摸摸我/],
      ["你的柠檬帽好好看", /柠檬帽|叶子|不摘/],
      ["我想摸摸你", /呼噜|耳朵|抱一下/],
      ["今天有点累，但是写完了一页", /写完|这一页收好|厉害/],
      ["今天很开心", /开心|不错|记一笔/],
      ["谢谢你陪我", /不客气|陪着你|下次也叫我/],
      ["你会做什么", /理一理今天的页面[\s\S]*翻一页以前的回忆/],
    ];
    for (const [text, pattern] of expect) {
      const reply = await say(text);
      assert.match(reply, pattern, `${text} → ${reply}`);
      if (text !== "你会做什么") assert.doesNotMatch(reply, /会的是|我会的不多|还不会/, `no feature list for “${text}”`);
      if (!h0) {
        h0 = await height();
        assert.ok(h0 > quiet, `the chat gets its room (${quiet} → ${h0})`);
      }
      assert.equal(await height(), h0, `the sheet keeps its height after “${text}”`);
    }
    const tired = transcript.find(([t]) => t.startsWith("今天有点累"))[1];
    assert.doesNotMatch(tired, /不写也没关系|不用写/, "a finished page is not met with “it's fine not to write”");
    // Auto-scroll: the newest reply is in view.
    const scroll = await page.locator(".kp .keeper-msgs").evaluate((box) => box.scrollHeight - box.scrollTop - box.clientHeight);
    assert.ok(scroll <= 2, `scrolled to the newest line (${scroll})`);
    // V10.35: no folded shortcuts any more — Captain's card comes back above the chat.
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForTimeout(450);
    assert.equal(await page.locator(".kp .cp-card").isVisible(), true);
    assert.equal(await page.locator(".kp .kp-chip, .kp .kp-do").count(), 0);
    // V10.10: once the keyboard closes and the card comes back, the newest line is still in view.
    const after = await page.locator(".kp .keeper-msgs").evaluate((box) => box.scrollHeight - box.scrollTop - box.clientHeight);
    assert.ok(after <= 2, `still at the newest line after the keyboard closes (${after})`);

    await shot("01-chat");
    const reply8 = await say("帮我整理今天的故事");
    assert.equal(reply8, "→ organize", "a request still opens its flow");
    await page.locator('.kp [data-action="keeper-view"][data-view="home"]').first().tap();
    await page.waitForSelector('.kp[data-view="home"]');
    // V10.18: the weather has its own reply now; an odd sound is still honestly not understood.
    assert.match(await say("今天天气不错"), /天气|走走|打盹/);
    const unknown = await say("嗷呜");
    assert.match(unknown, /没太懂|不太确定|还在想/);
    assert.doesNotMatch(unknown, /书架|回忆|会的/, "unknown is honest and short — no feature list");
    passed.push("the review lines get fitting replies (compliment, hat, pet, tired-but-done, happy, thanks); only “你会做什么” lists abilities; 整理 opens its flow; unknown is an honest “not sure”; height steady; newest line in view; shortcuts fold into one line");

    // 3. Medium / expanded: tap the grabber, pull it, and pull down to close (the draft stays).
    await page.locator(".kp .kp-grab").tap();
    await page.waitForSelector(".kp.corner.tall");
    const tall = await height();
    assert.ok(tall >= h0 + 60, `expanded (${h0} → ${tall})`);
    await page.locator(".kp .kp-grab").tap();
    await page.waitForSelector(".kp.corner:not(.tall)");
    const grab = await page.locator(".kp .kp-grab").boundingBox();
    await page.mouse.move(grab.x + grab.width / 2, grab.y + grab.height / 2);
    await page.mouse.down();
    await page.mouse.move(grab.x + grab.width / 2, grab.y - 80, { steps: 5 });
    await page.mouse.up();
    await page.waitForSelector(".kp.corner.tall");
    assert.equal(await height(), tall, "the expanded height is always the same");
    await page.locator("[data-keeper-say]").fill("还没说完的话");
    await page.evaluate(() => document.activeElement?.blur?.());
    const g2 = await page.locator(".kp .kp-grab").boundingBox();
    await page.mouse.move(g2.x + g2.width / 2, g2.y + g2.height / 2);
    await page.mouse.down();
    await page.mouse.move(g2.x + g2.width / 2, g2.y + 120, { steps: 5 });
    await page.mouse.up();
    await page.waitForSelector(".kp.corner:not(.tall)");
    assert.equal(await page.locator("#choose-dialog[open]").count(), 1, "from expanded, pulling down goes to medium first");
    const g3 = await page.locator(".kp .kp-grab").boundingBox();
    await page.mouse.move(g3.x + g3.width / 2, g3.y + g3.height / 2);
    await page.mouse.down();
    await page.mouse.move(g3.x + g3.width / 2, g3.y + 140, { steps: 5 });
    await page.mouse.up();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.keeperDraft")), "还没说完的话", "unsent words kept");
    passed.push("two steady heights: tap or pull the grabber up to expand, down to medium, down again to close; unsent words kept");

    // 4. Chat / Play / Look tabs. Play is honestly on its way (no stand-in interaction).
    await openCorner();
    assert.deepEqual(await page.$$eval(".kp-tabs [role=tab]", (els) => els.map((el) => [el.dataset.view, el.textContent, el.getAttribute("aria-selected")])), [["home", "聊天", "true"], ["play", "玩耍", "false"], ["looks", "装扮", "false"]]);
    const tabH = await page.locator(".kp-tabs [role=tab]").first().evaluate((el) => el.getBoundingClientRect().height);
    assert.ok(tabH >= 38);
    await page.locator('.kp-tabs [data-view="play"]').tap();
    // V10.17: Play is the Playroom (tests/v117-browser.cjs): it opens at full
    // height for its stage, with no "coming soon" rows for unfinished play.
    await page.waitForSelector('.kp.corner[data-view="play"] .pr-stage');
    assert.ok((await height()) > h0, "Play takes the full height");
    assert.doesNotMatch(await page.locator(".kp.corner").innerText(), /准备中|还在画|摸摸头|挠肚皮/);
    await shot("02-play");
    await page.locator('.kp-tabs [data-view="looks"]').tap();
    await page.waitForSelector('.kp.corner[data-view="looks"] .look-chip');
    await shot("03-look");
    await page.locator('.kp-tabs [data-view="home"]').tap();
    await page.waitForSelector('.kp.corner[data-view="home"]');
    await close();
    passed.push("Chat / Play / Look tabs (Chat and Look at one height, Play full height for its stage, no coming-soon rows); Look is the wardrobe");

    // 5. With permission switched on, Captain may mention the page by name.
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); s.keeper.allowMemories = true; localStorage.setItem("little-days.v1", JSON.stringify(s)); localStorage.removeItem("little-days.keeperLines"); });
    await page.reload();
    await page.waitForSelector(".keeper-home");
    // V10.35: the panel opens on Captain's card, whose line never quotes a
    // page (the page's name is shown only as a fact, under the line, when
    // coming back from the reader); the chat can still look back when asked.
    for (let i = 0; i < 3; i++) {
      await openCorner();
      assert.doesNotMatch(await page.locator(".kp .cp-card p").innerText(), /只给自己看的标题|偷偷/);
      await close();
    }
    passed.push("with “look at earlier pages” on, the card's line still states only what fits now (V10.35)");

    // 6. English interface: the English review lines.
    const en = await browser.newContext({ ...devices["iPhone 13"] });
    const ep = await en.newPage();
    ep.on("pageerror", (error) => errors.push(error.message));
    await ep.addInitScript(() => localStorage.setItem("little-days.language", "en"));
    await ep.goto(base);
    await ep.waitForSelector(".hero");
    await ep.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await ep.locator('[data-action="keeper-start"]').tap();
    await ep.waitForSelector(".keeper-home");
    await ep.locator(".keeper-entry").tap();
    await ep.waitForSelector(".kp.corner");
    for (const [text, pattern] of [["Hello, you’re adorable!", /noticed|happy a little longer|pat my head/], ["I’m tired, but I finished a journal page.", /finished a page|It's written|page is kept/], ["what can you do", /sort out today's pages/]]) {
      await ep.locator("[data-keeper-say]").fill(text);
      await ep.locator(".kp-send").tap();
      await ep.waitForFunction(() => !document.querySelector(".kp .keeper-msg.pending"));
      const reply = await ep.locator(".kp .keeper-msg.them").last().innerText();
      transcript.push([`(EN) ${text}`, reply]);
      assert.match(reply, pattern, `${text} → ${reply}`);
    }
    assert.match(await ep.locator(".kp-tabs").innerText(), /Chat[\s\S]*Play[\s\S]*Look/);
    if (shots) await ep.screenshot({ path: `${shots}/04-en.png` });
    await en.close();
    passed.push("English interface: compliment, tired-but-done and “what can you do” answered in English");

    assert.deepEqual(outside, [], "nothing was requested from anywhere but this device");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).keeper.aiConsent), false);
    assert.deepEqual(errors, []);
    console.log(`V10.9 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nTranscript (typed → Captain):\n${transcript.map(([a, b]) => `   ${a}  →  ${b}`).join("\n")}\nNo page errors; no outside requests.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  console.error(transcript.map(([a, b]) => `${a} → ${b}`).join("\n"));
  process.exit(1);
});
