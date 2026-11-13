// V10.5 · Captain's composer: the only way to close is the quiet × at the
// top (or pulling the sheet down); Send is a clear sage button beside the
// field; Return is a new line; nothing is sent while the input method is
// choosing characters; unsent words survive closing the sheet and a reload.
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
    page.on("request", (request) => { const url = request.url(); if (!/^(data|blob):/.test(url) && !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) outside.push(url); });
    await page.goto(base);
    await page.waitForSelector(".hero");
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const field = page.locator("[data-keeper-say]");
    const send = page.locator(".kp-send");
    const mine = () => page.locator(".kp .keeper-msg.me").count();
    const openPanel = async () => { await page.locator(".keeper-entry").tap(); await page.waitForSelector('#choose-dialog[open] .kp[data-view="home"]'); };
    const closed = () => page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    const draft = () => page.evaluate(() => localStorage.getItem("little-days.keeperDraft"));

    await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await page.waitForSelector(".keeper-onboard");
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForSelector(".keeper-home");

    // 1. One quiet × at the top; no close button in the action area; Send beside the field.
    await openPanel();
    const shape = await page.evaluate(() => {
      const sheet = document.querySelector(".kp").getBoundingClientRect();
      const x = document.querySelector(".kp .kp-x").getBoundingClientRect();
      const f = document.querySelector("[data-keeper-say]").getBoundingClientRect();
      const s = document.querySelector(".kp-send").getBoundingClientRect();
      const closers = [...document.querySelectorAll('.kp [data-action="choose-close"]')];
      const edge = document.elementFromPoint(x.left - 3, x.top - 3);
      return { closers: closers.length, xTop: x.top - sheet.top, xRight: sheet.right - x.right, xSize: x.width, edgeIsX: edge?.classList.contains("kp-x"), sameRow: Math.abs((f.top + f.bottom) / 2 - (s.top + s.bottom) / 2) < 30, gap: s.left - f.right, sendH: s.height, sendW: s.width, sendRight: sheet.right - s.right, wide: [...document.querySelectorAll(".kp button")].filter((b) => b.getBoundingClientRect().width > sheet.width * 0.8 && /关闭|Close/.test(b.textContent)).length };
    });
    assert.equal(shape.closers, 1, "one way to close in the sheet: the ×");
    assert.ok(shape.xTop < 60 && shape.xRight < 40 && shape.xSize <= 40, `× sits small in the top-right corner (${JSON.stringify(shape)})`);
    assert.ok(shape.edgeIsX, "the × has a 44px touch area");
    assert.equal(shape.wide, 0, "no full-width Close button");
    assert.ok(shape.sameRow && shape.gap >= 0 && shape.gap < 16, `Send sits right beside the field (${JSON.stringify(shape)})`);
    assert.ok(shape.sendH >= 44 && shape.sendW >= 76, "Send is a full-size button");
    assert.match(await send.innerText(), /发送/);
    assert.equal(await send.locator("svg").count(), 1, "an up arrow");
    assert.equal(await send.isDisabled(), true, "empty: Send is disabled");
    await field.fill("   ");
    assert.equal(await send.isDisabled(), true, "only spaces: still disabled");
    await field.fill("你好");
    assert.equal(await send.isDisabled(), false);
    const colours = await page.evaluate(() => ({ send: getComputedStyle(document.querySelector(".kp-send")).backgroundColor, sage: getComputedStyle(document.documentElement).getPropertyValue("--sageDeep").trim() }));
    const rgb = (hex) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
    assert.equal(colours.send, rgb(colours.sage), "Send is the brand sage green");
    await shot("01-composer");
    passed.push("one small × at the top-right (44px touch area), no full-width Close; a sage “发送 ↑” button right beside the field, disabled while empty");

    // 2. Return is a new line, never "send"; the field grows; ⌘/Ctrl+Return sends.
    await field.fill("第一行");
    const oneLine = (await field.boundingBox()).height;
    await field.press("Enter");
    await page.keyboard.type("第二行");
    assert.equal(await field.inputValue(), "第一行\n第二行");
    assert.equal(await mine(), 0, "Return did not send");
    assert.ok((await field.boundingBox()).height > oneLine, "the field grows with a second line");
    await field.fill(Array.from({ length: 9 }, (_, i) => `第 ${i + 1} 行`).join("\n"));
    assert.ok((await field.boundingBox()).height <= 113, "…up to about four lines, then it scrolls");
    await field.fill("第一行\n第二行");
    await field.press("Control+Enter");
    await page.waitForSelector(".kp .keeper-msg.me");
    assert.equal(await page.locator(".kp .keeper-msg.me").innerText(), "第一行\n第二行", "line breaks are kept in the bubble");
    await page.waitForSelector(".kp .keeper-msg.pending", { state: "detached" });
    passed.push("Return adds a line (never sends); the field grows to about four lines; ⌘/Ctrl+Return sends; line breaks kept");

    // 3. Input method: nothing is sent while characters are being chosen.
    await field.fill("jin tian");
    await field.evaluate((el) => el.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true })));
    await field.evaluate((el) => el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, isComposing: true, bubbles: true, cancelable: true })));
    await field.evaluate((el) => el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 229, bubbles: true, cancelable: true })));
    await send.tap();
    await page.waitForTimeout(300);
    assert.equal(await mine(), 1, "still only the earlier line");
    assert.equal(await field.inputValue(), "jin tian", "the words being composed stay in the field");
    await field.evaluate((el) => el.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "今天" })));
    await field.fill("今天");
    passed.push("while the input method is composing: Return, ⌘/Ctrl+Return and Send do nothing; the words stay in the field");

    // 4. Sending: a clear busy state, no double send, the field is emptied only once the line is in the chat.
    await send.tap();
    await page.waitForSelector(".kp .keeper-msg.pending");
    assert.equal(await page.locator(".kp-send.busy[aria-busy='true']").count(), 1);
    assert.equal(await send.isDisabled(), true);
    await send.evaluate((el) => el.click());
    await page.evaluate(() => document.querySelector('.kp-send').dispatchEvent(new MouseEvent("click", { bubbles: true })));
    assert.equal(await field.inputValue(), "");
    assert.equal(await draft(), null, "sent: the draft is forgotten");
    assert.equal(await page.evaluate(() => document.activeElement?.matches("[data-keeper-say]")), true, "the caret stays in the field after Send (the keyboard does not close)");
    await shot("02-sending");
    await page.waitForSelector(".kp .keeper-msg.pending", { state: "detached" });
    assert.equal(await mine(), 2, "sent once");
    assert.equal(await page.locator(".kp-send.busy").count(), 0);
    // V10.35: no status line first (the card says what fits now), so the
    // replies are the only lines from Captain.
    assert.ok((await page.locator(".kp .keeper-msg.them").count()) >= 2, "a reply for each line");
    passed.push("sending: “thinking” dots + busy button; a second tap cannot send twice; the field empties only after the line is sent");

    // 5. Unsent words: × / pulling down / Esc / a reload never send and never lose them.
    await field.fill("还没想好要不要说");
    await page.locator(".kp .kp-x").tap();
    await closed();
    assert.equal(await draft(), "还没想好要不要说");
    await openPanel();
    assert.equal(await field.inputValue(), "还没想好要不要说", "restored after ×");
    assert.equal(await send.isDisabled(), false);
    assert.equal(await mine(), 0, "closing did not send (a fresh chat, no line of mine)");
    // Pull the sheet down by its header.
    const head = await page.locator(".kp .kp-head b").boundingBox();
    await page.mouse.move(head.x + 10, head.y + 5);
    await page.mouse.down();
    await page.mouse.move(head.x + 10, head.y + 60, { steps: 4 });
    await page.mouse.move(head.x + 10, head.y + 160, { steps: 4 });
    await page.mouse.up();
    await closed();
    assert.equal(await draft(), "还没想好要不要说", "pulling the sheet down keeps the words");
    await openPanel();
    await page.keyboard.press("Escape");
    await closed();
    await page.reload();
    await page.waitForSelector(".keeper-home");
    await openPanel();
    assert.equal(await field.inputValue(), "还没想好要不要说", "restored after a reload");
    // A short pull snaps back (does not close).
    const grab = await page.locator(".kp .choose-grabber").boundingBox();
    await page.mouse.move(grab.x + 5, grab.y + 2);
    await page.mouse.down();
    await page.mouse.move(grab.x + 5, grab.y + 30, { steps: 3 });
    await page.mouse.up();
    assert.equal(await page.locator("#choose-dialog[open]").count(), 1, "a short pull does not close");
    passed.push("unsent words survive ×, pulling the sheet down, Esc and a reload; closing never sends");

    // 6. Typing on a touch screen: shortcuts step aside, field + Send stay in view; × still closes (no shifting under the finger).
    await field.tap();
    await page.waitForSelector(".kp.composing");
    assert.equal(await page.locator(".kp .kp-acts").isVisible(), false);
    await field.press("End");
    await field.press("Enter");
    await page.keyboard.type("再加一行");
    const view = await page.evaluate(() => { const f = document.querySelector("[data-keeper-say]").getBoundingClientRect(), s = document.querySelector(".kp-send").getBoundingClientRect(); return { ok: f.top >= 0 && s.bottom <= innerHeight && f.bottom <= innerHeight, bottom: s.bottom, h: innerHeight }; });
    assert.ok(view.ok, JSON.stringify(view));
    await shot("03-typing");
    await page.waitForTimeout(700);
    await page.locator(".kp .kp-x").tap();
    await closed();
    assert.equal(await draft(), "还没想好要不要说\n再加一行");
    await openPanel();
    await send.tap();
    await page.waitForSelector(".kp .keeper-msg.pending", { state: "detached" });
    assert.equal(await draft(), null);
    assert.equal(await field.inputValue(), "");
    await page.locator(".kp .kp-x").tap();
    await closed();
    passed.push("typing on a touch screen: shortcuts step aside, field and Send stay in view; × closes on the first tap; the draft goes only after a real send");

    // 7. English, small and large phones.
    for (const [w, h] of [[375, 667], [430, 932]]) {
      const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const p = await c.newPage();
      p.on("pageerror", (error) => errors.push(error.message));
      await p.addInitScript(() => localStorage.setItem("little-days.language", "en"));
      await p.goto(base);
      await p.waitForSelector(".hero");
      if (!(await p.locator(".keeper-home").count())) {
        await p.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
        await p.locator('[data-action="keeper-start"]').tap();
        await p.waitForSelector(".keeper-home");
      }
      await p.locator(".keeper-entry").tap();
      await p.waitForSelector(".kp");
      await p.locator("[data-keeper-say]").fill("A fairly long line to see that the field and the Send button still fit side by side");
      const fit = await p.evaluate(() => { const sheet = document.querySelector(".kp").getBoundingClientRect(); const s = document.querySelector(".kp-send").getBoundingClientRect(); return { inside: s.right <= sheet.right && s.bottom <= innerHeight, text: document.querySelector(".kp-send").innerText.trim(), sw: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      assert.ok(fit.inside && fit.sw, `${w}px: ${JSON.stringify(fit)}`);
      if (w === 375) assert.match(fit.text, /Send|发送/);
      if (shots) await p.screenshot({ path: `${shots}/04-${w}.png` });
      await c.close();
    }
    passed.push("375×667 and 430×932: the field and Send fit side by side, nothing past the edge");

    assert.deepEqual(outside, [], "nothing was requested from anywhere but this device");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).keeper.aiConsent), false);
    assert.deepEqual(errors, []);
    console.log(`V10.5 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors; no outside requests. (The on-screen keyboard itself cannot be shown in headless Chromium.)`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
