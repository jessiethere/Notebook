// V7.7 E2E — Little Keeper (optional companion) and Home's greeting; many
// book tags show the top 3 with a search for the rest.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS_DIR || "";

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
    const keeper = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1") || "{}").keeper || null);
    const settings = async () => {
      await require("./signed-in.cjs").leaveReader(page);
      await page.locator('#navigation [data-page="home"]').click();
      await page.locator(".settings-gear").click();
      await page.waitForSelector(".keeper-card");
    };

    // 1. Greeting: "Hi! It's <weekday>"; tap to set a name.
    const weekday = await page.evaluate(() => new Date().toLocaleDateString("zh-CN", { weekday: "long" }));
    assert.match(await page.locator(".home-greeting").innerText(), new RegExp(`Hi！今天是${weekday}`));
    await page.locator(".home-greeting").click();
    await page.locator("[data-greeting-name]").fill("Jess");
    await page.locator("[data-greeting-name]").press("Enter");
    await page.waitForFunction(() => /Hi，Jess！/.test(document.querySelector(".home-greeting")?.textContent || ""));
    passed.push("Home: “Hi, Jess! It's <weekday>” — tap the greeting to set the name");

    // 2. Existing users aren't forced: one invitation; "Maybe later" keeps it away.
    assert.equal(await page.locator(".keeper-invite").count(), 1);
    assert.equal(await page.locator(".keeper-home").count(), 0, "off by default");
    await page.locator('[data-action="keeper-invite-dismiss"]').click();
    await page.waitForSelector(".keeper-invite", { state: "detached" });
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await page.locator(".keeper-invite").count(), 0, "not asked again");
    passed.push("not forced: one invitation on Home; “Maybe later” keeps it away");

    // 3. Onboarding from Settings: a cat named 糯米, Gentle; saved in the journal.
    await settings();
    await page.locator('.keeper-card [data-action="keeper-onboard"]').click();
    await page.waitForSelector(".keeper-onboard");
    // V8.0: Captain only — no animal choice, just Captain's picture.
    assert.equal(await page.locator('[data-action="keeper-pick-animal"]').count(), 0);
    assert.equal(await page.locator('.keeper-intro img.keeper-img[data-animal="cat"]').count(), 1);
    await page.locator("[data-keeper-name]").fill("糯米");
    await page.locator('[data-action="keeper-pick-mode"][data-mode="gentle"]').click();
    assert.equal(await page.locator("[data-keeper-name]").inputValue(), "糯米", "the name survives picking a mode");
    await page.locator('[data-action="keeper-start"]').click();
    let k = await keeper();
    assert.deepEqual([k.enabled, k.animal, k.name, k.mode, k.aiConsent], [true, "cat", "糯米", "gentle", false]);
    await page.reload();
    await page.waitForSelector(".keeper-home");
    // V8.0: Home already greets, so Captain doesn't add a second greeting.
    assert.equal(await page.locator(".keeper-home .keeper-bubble").count(), 0, "no extra welcome line");
    // The approved character art as an image (Captain's Peek), never SVG.
    const art = page.locator('.keeper-home img.keeper-img[data-animal="cat"]');
    assert.equal(await art.count(), 1);
    assert.equal(await art.getAttribute("data-mood"), "peek");
    // A tap: one short line, which goes away by itself.
    // V10.3: a tap (Gentle too) opens Captain's panel with a line that fits the day; a small tag beside it does the same.
    assert.equal(await page.locator('.keeper-home [data-action="keeper-panel"]').count(), 1);
    await page.locator('.keeper-home [data-action="keeper-tap"]').click();
    await page.waitForSelector(".keeper-chat.kp");
    // A normal-width line (V9.1: it once collapsed to one character per line).
    // V10.35: the panel opens on Captain's card.
    const bubbleBox = await page.locator(".kp .cp-card p").boundingBox();
    assert.ok(bubbleBox.width > 100 && bubbleBox.height < 120, `bubble ${bubbleBox.width}×${bubbleBox.height}`);
    await page.locator('.kp [data-action="choose-close"]').click();
    await page.waitForFunction(() => document.querySelector(".keeper-home img.keeper-img")?.naturalWidth > 0);
    assert.equal(await page.locator(".keeper svg").count(), 0);
    if (shots) await page.screenshot({ path: `${shots}/v71-home.png` });
    passed.push("onboarding: Captain only, name it, choose Gentle — kept after a reload; on Today a quiet Peek (no extra greeting); a tap opens the panel");

    // 4. Writing: quiet while typing; a stamp after Save; a reply only when asked, made on the device.
    await page.locator('[data-action="today-write"]').tap();
    // V10.0: the editor's top bar is only back · page · save state · preview · 完成 — the Keeper stays out of the way while writing.
    await page.waitForSelector("#journal-canvas");
    assert.equal(await page.locator(".studio-bar .keeper-mini, .studio-bar .keeper-img").count(), 0);
    await page.locator('#journal-canvas [data-inline="title"]').click();
    await page.keyboard.type("累但是很骄傲");
    await page.locator('#journal-canvas [data-inline="body"]').click();
    await page.keyboard.type("Today was exhausting, but I still managed to work out. I'm proud that I didn't give up.");
    await page.locator('[data-action="save-entry"]').tap();
    await page.waitForSelector(".keeper-stamp");
    // V10.11: the saved page opens in the reader; 听听 Captain 怎么说 is under ⋯ there.
    await page.waitForSelector(".reader .flip-page");
    await page.locator('[data-action="reader-more"]').click();
    await page.waitForSelector("#choose-dialog[open] .reader-keeper .keeper-ask");
    await page.locator(".reader-keeper .keeper-ask").click();
    await page.waitForSelector(".keeper-sheet .keeper-reply");
    assert.match(await page.locator(".keeper-reply").innerText(), /辛苦|长|消耗|不轻松/);
    assert.match(await page.locator(".keeper-local").innerText(), /这台设备上生成/);
    if (shots) await page.screenshot({ path: `${shots}/v71-reply.png` });
    await page.locator('.keeper-sheet [data-action="choose-close"]').click();
    assert.ok((await keeper()).recent.length > 0, "remembers which phrases it just used");
    passed.push("Studio: quiet (writing) while I type; a stamp after Save; “What does 糯米 think?” replies on the device");

    // 5. Quiet: no bubble, no reply button, a tap only bounces.
    await settings();
    await page.locator('[data-action="keeper-set"][data-key="mode"][data-value="quiet"]').click();
    assert.equal(await page.locator('[data-action="keeper-toggle"][data-key="aiConsent"]').isDisabled(), true, "no AI service: the consent can't be switched on");
    await page.locator('#navigation [data-page="home"]').click();
    await page.waitForSelector(".keeper-home");
    assert.equal(await page.locator(".keeper-home .keeper-bubble").count(), 0);
    await page.locator('.keeper-home [data-action="keeper-tap"]').click();
    assert.equal(await page.locator(".keeper-home .keeper-bubble").count(), 0, "still quiet");
    assert.equal(await page.locator("#choose-dialog[open]").count(), 0);
    passed.push("Quiet: visible, but no messages, no reply button, a tap only bounces; AI consent can't be on without a secure service");

    // 6. Interactive: tap to chat; earlier pages only with permission.
    await settings();
    await page.locator('[data-action="keeper-set"][data-key="mode"][data-value="interactive"]').click();
    await page.locator('#navigation [data-page="home"]').click();
    await page.locator('.keeper-home [data-action="keeper-tap"]').click();
    await page.waitForSelector(".keeper-chat");
    // "Look back at a memory" (V10.35: asked in the chat) says it needs permission first.
    await page.locator("[data-keeper-say]").fill("看看以前的回忆");
    await page.locator(".kp-send").click();
    await page.waitForFunction(() => /翻看你以前页面的许可/.test(document.querySelector(".keeper-msgs")?.textContent || ""));
    // Free text it cannot handle gets an honest answer (not the same sentence for everything).
    await page.locator("[data-keeper-say]").fill("嗷呜"); // V10.18: “今天想吃蛋糕” is understood now
    await page.locator(".kp-send").click();
    await page.waitForFunction(() => /没太懂|不太确定|还在想/.test(document.querySelector(".keeper-msgs")?.textContent || ""));
    // Replies are normal-width bubbles (they once shared the art's 64px class).
    assert.ok(await page.locator(".keeper-msg.them").last().evaluate((m) => m.getBoundingClientRect().width > 150));
    await page.locator('.keeper-chat [data-action="choose-close"]').first().click();
    await settings();
    // V10.4: the companion's details live in the “character & look” sheet.
    await require("./signed-in.cjs").settingsSheet(page, "keeper");
    await page.locator('.s2-sheet [data-action="keeper-toggle"][data-key="allowMemories"]').click();
    await page.waitForSelector('.s2-sheet [data-key="allowMemories"][aria-checked="true"]');
    await require("./signed-in.cjs").closeSheet(page);
    passed.push("Interactive: tap opens the panel; “Look back at a memory” asks for permission first; free text gets an honest answer; permission is a separate switch");

    // 7. My Books: on the shelf; a tap says something about my journals.
    await page.locator('#navigation [data-page="books"]').click();
    await page.waitForSelector(".keeper-shelf");
    await page.locator('[data-action="keeper-shelf-tap"]').click();
    await page.waitForSelector(".keeper-shelf .keeper-bubble");
    passed.push("My Books: the companion sits by the shelf; a tap talks about my journals");

    // 8. Turn off: gone everywhere, nothing deleted, name kept.
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).entries.length);
    await settings();
    await page.locator('.s2-seg [data-action="keeper-disable"]').click();
    await page.locator('#navigation [data-page="home"]').click();
    assert.equal(await page.locator(".keeper-home, .keeper-invite").count(), 0);
    k = await keeper();
    assert.deepEqual([k.enabled, k.name, k.animal], [false, "糯米", "cat"]);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).entries.length), before, "no pages deleted");
    passed.push("turning it off hides it everywhere; pages, name and choices are kept");

    // 9. Many tags: the top 3, the rest behind "More" with a search.
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.books[0].tags = ["阅读", "感恩", "健身", "旅行", "美食", "self awareness"];
      s.books[1].tags = ["阅读", "感恩"];
      s.books[2].tags = ["阅读"];
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    });
    await page.reload();
    await page.waitForSelector(".hero");
    await page.locator('#navigation [data-page="books"]').click();
    await page.waitForSelector(".shelf-tags");
    assert.deepEqual(await page.$$eval(".shelf-tags > [data-tag]:not([data-tag=''])", (els) => els.map((e) => e.dataset.tag)), ["阅读", "感恩", "健身"], "top 3 by use");
    await page.locator('[data-action="shelf-tags-more"]').click();
    await page.waitForSelector("[data-tag-search]");
    await page.locator("[data-tag-search]").fill("self");
    assert.equal(await page.locator(".shelf-tags-all button:not([hidden])").count(), 1);
    await page.locator(".shelf-tags-all button:not([hidden])").click();
    await page.waitForSelector('.shelf-tags [data-tag="self awareness"][aria-pressed="true"]');
    passed.push("many tags: the 3 most used, the rest behind “More” with a search; the chosen one stays in view");

    assert.deepEqual(errors, []);
    console.log(`V7.7 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
