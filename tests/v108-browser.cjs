// V10.8 · Captain's light wardrobe: a quiet entry in the panel and the same
// picker in Settings → 角色与装扮; one tap changes the look everywhere; only
// looks with real artwork; no coins, check-ins or unlocking.
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
    const errors = [], outside = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { const url = request.url(); if (!/^(data|blob):/.test(url) && !["127.0.0.1", "localhost"].includes(new URL(url).hostname)) outside.push(url); });
    await page.goto(base);
    await page.waitForSelector(".hero");
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const keeper = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")).keeper);
    const outfitOf = (selector) => page.locator(selector).first().evaluate((img) => ({ outfit: img.dataset.outfit, loaded: img.complete && img.naturalWidth > 0, peek: img.classList.contains("is-peek") }));
    const home = async () => { await page.locator('#navigation [data-page="home"]').tap(); await page.waitForSelector(".keeper-home"); };

    await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await page.waitForSelector(".keeper-onboard");
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForSelector(".keeper-home");
    assert.deepEqual(await outfitOf(".keeper-home img.keeper-img"), { outfit: "lemon", loaded: true, peek: true });

    // 1. A light entry in the panel; the picker lists what has artwork, hats first.
    await page.locator(".keeper-entry").tap();
    await page.waitForSelector('.kp[data-view="home"]');
    // V10.9: 装扮 is the third tab of Captain's Corner (聊天 / 玩耍 / 装扮).
    const link = page.locator('.kp-tabs [data-view="looks"]');
    assert.match(await link.innerText(), /装扮/);
    await link.tap();
    await page.waitForSelector('.kp[data-view="looks"] .keeper-looks');
    const picker = await page.evaluate(() => ({ groups: [...document.querySelectorAll(".kp .look-group h4")].map((h) => h.textContent), looks: [...document.querySelectorAll(".kp .look-chip")].map((b) => [b.dataset.look, b.querySelector("b").textContent, b.getAttribute("aria-pressed"), b.querySelector("img")?.complete && b.querySelector("img").naturalWidth > 0, Math.round(b.getBoundingClientRect().height)]), text: document.querySelector(".kp").innerText }));
    assert.deepEqual(picker.groups, ["帽子", "小配件"]);
    assert.deepEqual(picker.looks.map((l) => l.slice(0, 4)), [["lemon", "柠檬帽", "true", true], ["yarn", "毛线球", "false", true]]);
    assert.ok(picker.looks.every((l) => l[4] >= 44));
    assert.doesNotMatch(picker.text, /金币|签到|亲密度|等级|积分|coin|level/i, "no game mechanics");
    assert.equal(await page.locator(".kp .look-chip[disabled], .kp .look-chip.locked").count(), 0, "nothing locked");
    await shot("01-picker");
    passed.push("panel: the 装扮 tab opens the picker — 帽子 / 小配件, only looks with artwork, nothing locked, no coins or levels");

    // 2. One tap changes the look everywhere and is remembered.
    await page.locator('.kp [data-action="keeper-look"][data-look="yarn"]').tap();
    await page.waitForSelector('.kp [data-look="yarn"][aria-pressed="true"]');
    assert.equal((await keeper()).outfit, "yarn");
    await page.locator('.kp [data-action="keeper-view"][data-view="home"]').first().tap();
    await page.waitForSelector('.kp[data-view="home"]');
    assert.equal((await outfitOf(".kp-head img.keeper-img")).outfit, "yarn");
    await shot("02-panel-yarn");
    await page.locator(".kp .kp-x").tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.deepEqual(await outfitOf(".keeper-home img.keeper-img"), { outfit: "yarn", loaded: true, peek: false });
    await shot("03-home-yarn");
    await page.reload();
    await page.waitForSelector(".keeper-home");
    assert.equal((await outfitOf(".keeper-home img.keeper-img")).outfit, "yarn", "kept after a reload");
    await page.locator('#navigation [data-page="books"]').tap();
    await page.waitForSelector(".keeper-shelf img.keeper-img");
    assert.equal((await outfitOf(".keeper-shelf img.keeper-img")).outfit, "yarn");
    passed.push("one tap: the yarn-ball look shows in the panel, on Home and by the shelf, and is kept after a reload");

    // 3. The same picker in Settings → 角色与装扮; back to the lemon hat.
    await home();
    await page.locator(".settings-gear").tap();
    await page.waitForSelector(".s2");
    assert.equal((await outfitOf(".s2-keeper img.keeper-img")).outfit, "yarn");
    const sheet = await SS.settingsSheet(page, "keeper");
    assert.equal(await sheet.locator('.look-chip[data-look="yarn"]').getAttribute("aria-pressed"), "true");
    await shot("04-settings-sheet");
    await sheet.locator('.look-chip[data-look="lemon"]').tap();
    await page.waitForSelector('.s2-sheet .look-chip[data-look="lemon"][aria-pressed="true"]');
    assert.equal((await keeper()).outfit, "", "the default look is stored as “no choice”");
    assert.equal((await outfitOf(".s2-sheet .keeper-profile img.keeper-img")).outfit, "lemon");
    await SS.closeSheet(page);
    await home();
    assert.deepEqual(await outfitOf(".keeper-home img.keeper-img"), { outfit: "lemon", loaded: true, peek: true }, "the lemon hat peeks over the card again");
    passed.push("Settings → 角色与装扮 has the same picker; choosing the lemon hat again restores the peek on Home");

    // 4. A look that does not exist (older or hand-edited data) shows the lemon hat; nothing breaks.
    await SS.touchStore(page);
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("little-days.v1")); s.keeper.outfit = "frog"; localStorage.setItem("little-days.v1", JSON.stringify(s)); });
    await page.reload();
    await page.waitForSelector(".keeper-home");
    assert.equal((await outfitOf(".keeper-home img.keeper-img")).outfit, "lemon");
    await page.locator(".keeper-entry").tap();
    await page.locator('.kp-tabs [data-view="looks"]').tap();
    await page.waitForSelector('.kp .look-chip[data-look="lemon"][aria-pressed="true"]');
    assert.equal(await page.locator('.kp .look-chip[data-look="frog"]').count(), 0);
    passed.push("a look without artwork is never offered; unknown stored looks fall back to the lemon hat");

    assert.deepEqual(outside, [], "nothing was requested from anywhere but this device");
    assert.deepEqual(errors, []);
    console.log(`V10.8 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors; no outside requests.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
