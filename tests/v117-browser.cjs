// V10.17 · Captain's Playroom MVP: a big stage; tap Captain for the happy
// reaction (the hug-and-giggle frames); drag or tap the pink yarn ball to
// Captain and it is caught; back to rest afterwards; no "coming soon" rows
// for pat / tummy; the no-hat look plays with its own picture only (never
// the lemon-hat frames); Reduce Motion; 375 and 430 wide; Chinese / English.
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
    const errors = [],
      outside = [],
      missing = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      const url = request.url();
      if (!/^(data|blob):/.test(url) && !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) outside.push(url);
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && /library\/keepers/.test(response.url())) missing.push(response.url());
    });
    const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png` });
    await page.goto(base);
    await page.waitForSelector(".hero");
    await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await page.waitForSelector(".keeper-onboard");
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForSelector(".keeper-home");
    const openPlay = async () => {
      await page.locator(".keeper-entry").tap();
      await page.waitForSelector('.kp.corner[data-view="home"]');
      await page.locator('.kp-tabs [data-view="play"]').tap();
      await page.waitForSelector(".pr-stage");
      await page.waitForFunction(() => [...document.querySelectorAll(".pr-stage img")].every((img) => img.complete && img.naturalWidth > 0));
    };
    const close = async () => {
      await page.locator(".kp .kp-x").first().tap();
      await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    };
    const rest = () => page.waitForFunction(() => { const pr = document.querySelector(".pr"); return pr && !pr.dataset.busy && !pr.classList.contains("happy"); }, null, { timeout: 8000 });
    const frameAt = () => page.locator(".pr-anim").evaluate((el) => getComputedStyle(el).backgroundPositionX);

    // ------------------------------------------------ the lemon hat (default)
    await openPlay();
    const stage = await page.locator(".pr-stage").boundingBox();
    const sheet = await page.locator(".kp.corner").boundingBox();
    assert.ok(stage.width >= 300 && Math.abs(stage.width - stage.height) < 2, `a big square stage (${Math.round(stage.width)})`);
    assert.ok(stage.y + stage.height <= sheet.y + sheet.height, "the stage fits in the sheet");
    assert.equal(await page.locator(".pr").getAttribute("data-outfit"), "lemon");
    assert.match(await page.locator(".pr-idle").getAttribute("src"), /LD-keeper-cat-lemon-play-idle\.jpg$/);
    assert.match(await page.locator(".pr-anim").getAttribute("style"), /LD-keeper-cat-lemon-hug-anim\.jpg/);
    assert.doesNotMatch(await page.content(), /play-anim|lemon-sit\.jpg/, "the bandana frames are not used");
    const text = await page.locator(".kp.corner").innerText();
    assert.doesNotMatch(text, /准备中|还在画|摸摸头|挠肚皮|开发/, "no coming-soon rows or developer notes");
    assert.match(await page.locator(".pr-bubble").innerText(), /陪我玩毛线球/);
    assert.equal(await page.locator(".pr:not([data-hinted]) .pr-ring").count(), 1, "first visit: the ball breathes");
    await shot("01-playroom");
    passed.push(`a ${Math.round(stage.width)}px square stage at full height; lemon hat: its own still / hug frames / ball (no bandana); no coming-soon rows`);

    // Tap Captain: the happy reaction runs through its frames, then rests.
    await page.locator(".pr-body").tap();
    await page.waitForSelector(".pr.happy");
    assert.equal(await page.locator(".pr").getAttribute("data-busy"), "1");
    assert.match(await page.locator(".pr-bubble").innerText(), /嘿嘿|好痒|再戳/);
    const seen = new Set();
    for (let i = 0; i < 14; i++) {
      seen.add(await frameAt());
      await page.waitForTimeout(90);
    }
    assert.ok(seen.size >= 4, `the frames really change (${[...seen].join(" ")})`);
    await shot("02-happy");
    // A second tap while it plays changes nothing.
    await page.locator(".pr-body").tap({ force: true }).catch(() => {});
    await rest();
    assert.equal(await page.locator(".pr-anim").evaluate((el) => getComputedStyle(el).opacity), "0", "back to rest");
    assert.match(await page.locator(".pr-bubble").innerText(), /再来|还想玩/);
    passed.push(`tap Captain → the hug-and-giggle frames play (${seen.size} different frames seen), taps meanwhile ignored, then back to rest`);

    // Drag the ball and let go far from Captain: it rolls back home.
    const home = await page.locator(".pr-ball").boundingBox();
    const cx = home.x + home.width / 2,
      cy = home.y + home.height / 2;
    const drag = async (toX, toY) => {
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + (toX - cx) / 2, cy + (toY - cy) / 2, { steps: 4 });
      await page.mouse.move(toX, toY, { steps: 4 });
    };
    await drag(cx, stage.y + stage.height * 0.2);
    const held = await page.locator(".pr-ball").boundingBox();
    assert.ok(cy - (held.y + held.height / 2) > 60, "the ball follows the finger");
    assert.match(await page.locator(".pr-ball").evaluate((el) => el.style.transform), /translate\(.*rotate\(/, "and rolls");
    await page.mouse.up();
    await page.waitForTimeout(650);
    const back = await page.locator(".pr-ball").boundingBox();
    assert.ok(Math.abs(back.y - home.y) < 2 && Math.abs(back.x - home.x) < 2, "let go away from Captain: it rolls back");
    assert.match(await page.locator(".pr-bubble").innerText(), /差一点|这边/);
    assert.equal(await page.locator(".pr[data-hinted]").count(), 1, "the first-visit ring is gone once played");
    // Drag it into Captain's paws: caught → the happy frames → rest, ball home again.
    await drag(stage.x + stage.width * 0.4, stage.y + stage.height * 0.78);
    await shot("03-drag");
    await page.mouse.up();
    await page.waitForSelector(".pr.happy");
    assert.match(await page.locator(".pr-bubble").innerText(), /抓到|我的毛线球|接住/);
    assert.equal(await page.locator(".pr-ball").evaluate((el) => getComputedStyle(el).opacity), "0", "the ball is in Captain's paws (in the frames)");
    await rest();
    await page.waitForTimeout(300);
    const again = await page.locator(".pr-ball").boundingBox();
    assert.ok(Math.abs(again.y - home.y) < 2 && (await page.locator(".pr-ball").evaluate((el) => getComputedStyle(el).opacity)) === "1", "the ball is back for another go");
    // A plain tap on the ball: it rolls over by itself and is caught.
    await page.locator(".pr-ball").tap();
    await page.waitForSelector(".pr.happy");
    await rest();
    // Keyboard: Enter on the ball does the same.
    await page.locator(".pr-ball").focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector(".pr.happy");
    await rest();
    passed.push("the ball follows the finger and rolls; let go away → rolls back; into the paws → caught (happy frames) → back to rest with the ball home; a tap or Enter tosses it");

    // Pulling on the stage never closes the sheet.
    await page.mouse.move(stage.x + 30, stage.y + 40);
    await page.mouse.down();
    await page.mouse.move(stage.x + 30, stage.y + 240, { steps: 6 });
    await page.mouse.up();
    assert.equal(await page.locator("#choose-dialog[open] .pr").count(), 1, "still open");
    await close();
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.play-hint")), "1");
    passed.push("dragging on the stage does not close the sheet; the first-visit hint is remembered on this device");

    // ------------------------------------------------ no hat (its own picture only)
    await page.locator(".keeper-entry").tap();
    await page.locator('.kp-tabs [data-view="looks"]').tap();
    await page.locator('.kp [data-action="keeper-look"][data-look="yarn"]').tap();
    await page.locator('.kp-tabs [data-view="play"]').tap();
    await page.waitForSelector('.pr[data-outfit="yarn"]');
    await page.waitForFunction(() => document.querySelector(".pr-idle").complete);
    assert.match(await page.locator(".pr-idle").getAttribute("src"), /LD-keeper-cat-yarn-happy\.png$/);
    assert.equal(await page.locator(".pr-anim, .pr-ball").count(), 0, "no lemon-hat frames, no second ball");
    assert.doesNotMatch(await page.locator(".kp.corner").innerHTML(), /lemon/, "nothing of the lemon hat on this stage");
    assert.match(await page.locator(".pr-line").innerText(), /戳戳/);
    await shot("04-no-hat");
    await page.locator(".pr-body").tap();
    await page.waitForSelector(".pr.hop");
    assert.match(await page.locator(".pr-bubble").innerText(), /嘿嘿|好痒|再戳/);
    await rest();
    assert.equal(await page.locator('.pr[data-outfit="yarn"] .pr-idle[src$="LD-keeper-cat-yarn-happy.png"]').count(), 1, "still no hat afterwards");
    await close();
    passed.push("no-hat look: its own picture; tap → a little hop and a line; never switches to the lemon hat; no ball / frames it has no art for");

    // ------------------------------------------------ Reduce Motion, 375, 430 English
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("little-days.v1"));
      s.keeper.outfit = "lemon";
      localStorage.setItem("little-days.v1", JSON.stringify(s));
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector(".keeper-home");
    await openPlay();
    const small = await page.locator(".pr-stage").boundingBox();
    const smallSheet = await page.locator(".kp.corner").boundingBox();
    assert.ok(small.width >= 280 && small.y + small.height <= smallSheet.y + smallSheet.height, `375×667: the stage (${Math.round(small.width)}px) fits`);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 375);
    await shot("05-375");
    await page.locator(".pr-body").tap();
    await page.waitForSelector(".pr.happy.still");
    assert.equal(await page.locator(".pr-anim").evaluate((el) => getComputedStyle(el).animationName), "none", "Reduce Motion: one still frame, no stepping");
    await rest();
    await close();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    passed.push(`Reduce Motion: one frame instead of the animation; 375×667: the stage (${Math.round(small.width)}px) fits, nothing sideways`);

    await page.evaluate(() => localStorage.setItem("little-days.language", "en"));
    await page.setViewportSize({ width: 430, height: 932 });
    await page.reload();
    await page.waitForSelector(".keeper-home");
    await openPlay();
    assert.match(await page.locator(".pr-bubble").innerText(), /Play yarn with me/);
    assert.match(await page.locator(".pr-line").innerText(), /Drag the yarn ball/);
    assert.match(await page.locator(".pr-ball").getAttribute("aria-label"), /Yarn ball/);
    await shot("06-430-en");
    await close();
    passed.push("430 wide in English: the stage, the line and the labels in English");

    assert.deepEqual(missing, [], "every Playroom picture loads");
    assert.deepEqual(outside, [], "nothing goes outside this device");
    assert.deepEqual(errors, []);
    passed.push("all pictures load; nothing sent outside; no page errors");
    await context.close();
  } finally {
    await browser.close();
  }
  for (const line of passed) console.log("✓", line);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
