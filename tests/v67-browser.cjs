// V7.4 E2E — App lock: set a 4-digit passcode (twice), locked on open, wrong /
// right passcode, lock again after leaving ("immediately"), a pause after too
// many wrong tries (kept across a reload), turning it off asks for the
// passcode; and in the iPhone app, Face ID through the native bridge.
const { chromium, devices } = require("playwright");
require("./signed-in.cjs")(chromium);
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
    const type = async (pin) => {
      for (const d of pin) await page.locator(`#lock-screen [data-lock-key="${d}"]`).click();
    };
    const locked = () => page.evaluate(() => Boolean(document.querySelector("#lock-screen")?.open));
    const settings = async () => {
      await page.locator('#navigation [data-page="home"]').click();
      await page.locator(".settings-gear").click();
      await page.waitForSelector(".privacy-card");
    };

    // 1. Turn it on: a passcode, twice (a mismatch asks again). Only a hash is kept.
    await settings();
    await page.locator('[data-action="lock-toggle"]').click();
    await page.waitForSelector("#lock-screen[open]");
    assert.match(await page.locator("#lock-title").innerText(), /设置 4 位密码/);
    await type("1234");
    await page.waitForFunction(() => /再输入一次/.test(document.querySelector("#lock-title").textContent));
    await type("1235");
    await page.waitForFunction(() => /两次不一样/.test(document.querySelector(".lock-message").textContent));
    await type("1234");
    await type("1234");
    await page.waitForSelector("#lock-screen:not([open])", { state: "attached" });
    const stored = await page.evaluate(() => localStorage.getItem("little-days.lock"));
    assert.ok(stored && !stored.includes("1234"), "only a salted hash is stored");
    assert.equal(await page.locator('[data-action="lock-toggle"][aria-checked="true"]').count(), 1);
    passed.push("App lock on: a 4-digit passcode entered twice (mismatch asks again); only a salted hash stored");

    // 2. Opening the app: locked, the journal underneath can't be used; wrong, then right.
    await page.reload();
    await page.waitForSelector("#lock-screen[open]");
    assert.equal(await page.evaluate(() => document.querySelector("#phone").hasAttribute("inert")), true, "the page underneath is inert");
    if (shots) await page.screenshot({ path: `${shots}/v67-lock.png` });
    await type("0000");
    await page.waitForFunction(() => /密码不对/.test(document.querySelector(".lock-message").textContent));
    await page.keyboard.type("1234"); // a keyboard works too
    await page.waitForSelector("#lock-screen:not([open])", { state: "attached" });
    assert.equal(await page.evaluate(() => document.querySelector("#phone").hasAttribute("inert")), false);
    passed.push("locked on open (page inert); wrong passcode refused; right one (keypad or keyboard) unlocks");

    // 3. "Immediately": leaving the app locks it.
    await settings();
    await page.locator('[data-action="lock-grace"][data-grace="0"]').click();
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    assert.equal(await locked(), true, "locked again after leaving");
    await type("1234");
    passed.push("lock after leaving: “immediately” locks as soon as the app is left");

    // 4. Too many wrong tries: a pause, kept across a reload.
    await page.reload();
    await page.waitForSelector("#lock-screen[open]");
    for (let i = 0; i < 5; i++) await type("9999");
    await page.waitForFunction(() => /秒后再试/.test(document.querySelector(".lock-message").textContent));
    assert.equal(await page.locator('#lock-screen [data-lock-key="1"]').isDisabled(), true);
    await page.reload();
    await page.waitForSelector("#lock-screen[open]");
    await page.waitForFunction(() => /秒后再试/.test(document.querySelector(".lock-message").textContent));
    // (Skip the 30 s pause for the test.)
    await page.evaluate(() => localStorage.removeItem("little-days.lock-tries"));
    await page.reload();
    await page.waitForSelector("#lock-screen[open]");
    await type("1234");
    await page.waitForSelector("#lock-screen:not([open])", { state: "attached" });
    passed.push("five wrong tries: a pause (also after a reload)");

    // 5. Forgot passcode: an honest note; turning off asks for the passcode.
    await page.reload();
    await page.waitForSelector("#lock-screen[open]");
    await page.locator('#lock-screen [data-lock-key="forgot"]').click();
    assert.match(await page.locator(".lock-forgot").innerText(), /无法帮你找回/);
    await type("1234");
    await settings();
    await page.locator('[data-action="lock-toggle"]').click();
    assert.match(await page.locator("#lock-title").innerText(), /关闭/);
    await type("1111");
    await page.waitForFunction(() => /密码不对/.test(document.querySelector(".lock-message").textContent));
    assert.ok(await page.evaluate(() => localStorage.getItem("little-days.lock")), "still on");
    await type("1234");
    await page.waitForFunction(() => !localStorage.getItem("little-days.lock"));
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await locked(), false, "off: opens straight to Home");
    passed.push("“Forgot?” explains honestly; turning the lock off needs the passcode");

    // 6. The iPhone app: Face ID through the native bridge (simulated here).
    const ios = await browser.newContext({ ...devices["iPhone 13"] });
    await ios.addInitScript(() => {
      window.littleDaysBiometry = "faceID";
      window.__lockMessages = [];
      window.webkit = { messageHandlers: { littleDaysLock: { postMessage: (m) => {
        window.__lockMessages.push(m);
        if (m.type === "unlock") setTimeout(() => window.littleDaysBiometricResult(true), 50);
      } } } };
    });
    const phone = await ios.newPage();
    phone.on("pageerror", (error) => errors.push(error.message));
    await phone.goto(base);
    await phone.waitForSelector(".hero");
    await phone.locator(".settings-gear").click();
    await phone.locator('[data-action="lock-toggle"]').click();
    for (const pin of ["2580", "2580"]) for (const d of pin) await phone.locator(`#lock-screen [data-lock-key="${d}"]`).click();
    await phone.waitForSelector('[data-action="lock-biometric"][aria-checked="true"]');
    assert.ok((await phone.evaluate(() => window.__lockMessages)).some((m) => m.type === "state" && m.on === true), "the app is told the lock is on");
    await phone.reload();
    await phone.waitForFunction(() => window.__lockMessages?.some((m) => m.type === "unlock"));
    await phone.waitForSelector("#lock-screen:not([open])", { state: "attached" });
    passed.push("iPhone app: Face ID on by default, asked on open, unlocks; the app is told the lock is on");

    assert.deepEqual(errors, []);
    console.log(`V7.4 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
