// V10.4 · Settings V2: “My Little Days · this device's own space” (no cloud
// account), the companion preview, look & preferences, data & privacy, and
// “About & more” as rows that open sheets. Every old control still works;
// journals are never touched by a profile change or by going back to the
// welcome page.
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
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const accountNow = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.account")));
    const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
    const settings = async () => {
      if (await page.locator(".s2").count()) return;
      await page.locator('#navigation [data-page="home"]').tap();
      await page.locator(".settings-gear").tap();
      await page.waitForSelector(".s2");
    };
    const noOverflow = async (label) => assert.ok(await page.evaluate(() => document.querySelector("#app-scroll").scrollWidth <= document.querySelector("#app-scroll").clientWidth + 1), `no sideways scroll (${label})`);
    await SS.touchStore(page);
    const journalBefore = JSON.stringify((await stored()).entries);

    // 1. The profile area says what it is: this device's own space, no cloud account; default avatar = a letter.
    await settings();
    const me = page.locator(".s2-me");
    assert.match(await me.innerText(), /MY LITTLE DAYS[\s\S]*还没有名字[\s\S]*本机个人空间[\s\S]*没有云端账号/);
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "L", "no name yet: the brand's first letter, not an emoji");
    assert.equal(await page.locator(".s2-avatar.emoji").count(), 0);
    assert.equal(await page.locator(".settings-card").count(), 0, "no stack of big cards");
    assert.doesNotMatch(await page.locator(".s2").innerText(), /退出登录|Sign out/, "no “sign out”: there is no account to sign out of");
    await noOverflow("zh 390");
    await shot("01-top");
    passed.push("profile area: “My Little Days · your space on this device — no cloud account”; default avatar is a letter chip; no card stack");

    // 2. Edit profile: a name and an avatar, saved on this device only; journals untouched.
    await SS.settingsSheet(page, "profile");
    await page.locator("[data-profile-name]").fill("Jess");
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForFunction(() => /Jess/.test(document.querySelector(".s2-name")?.textContent || ""));
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "J", "the first letter of the name");
    assert.deepEqual([(await accountNow()).name, (await accountNow()).avatar, (await accountNow()).signedIn], ["Jess", "🌷", true]);
    await SS.settingsSheet(page, "profile");
    assert.equal(await page.locator("[data-profile-name]").inputValue(), "Jess");
    await page.locator('[data-action="profile-avatar"][data-avatar="🐱"]').tap();
    await page.waitForSelector('[data-action="profile-avatar"][data-avatar="🐱"][aria-pressed="true"]');
    assert.equal(await page.locator("[data-profile-name]").inputValue(), "Jess", "the name survives picking an avatar");
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForSelector(".s2-avatar.emoji");
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "🐱");
    await page.reload();
    await page.waitForSelector(".hero");
    await settings();
    assert.match(await page.locator(".s2-me").innerText(), /Jess/);
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "🐱", "a chosen avatar is kept after a reload");
    // Back to the letter.
    await SS.settingsSheet(page, "profile");
    await page.locator('[data-action="profile-avatar"][data-avatar=""]').tap();
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForSelector(".s2-avatar:not(.emoji)");
    assert.equal(JSON.stringify((await stored()).entries), journalBefore, "journals untouched by profile edits");
    passed.push("edit profile: name + avatar saved on this device (kept after reload); a custom avatar stays until I choose the letter again; journals untouched");

    // 3. Little Keeper: an invitation while off; then a preview, the mode in one line, details in its sheet.
    assert.equal(await page.locator('.keeper-card [data-action="keeper-onboard"]').count(), 1);
    await page.locator('.keeper-card [data-action="keeper-onboard"]').tap();
    await page.waitForSelector(".keeper-onboard");
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.v1")).keeper?.enabled === true);
    await settings();
    await page.waitForSelector(".s2-keeper");
    assert.equal(await page.locator(".s2-keeper img.keeper-img").count(), 1, "Captain's picture");
    assert.match(await page.locator(".keeper-card").innerText(), /Captain[\s\S]*角色与装扮[\s\S]*安静[\s\S]*温柔[\s\S]*互动[\s\S]*关闭/);
    assert.equal(await page.locator(".s2 [data-keeper-rename]").count(), 0, "details are not spread on the page");
    await page.locator('.s2-seg [data-action="keeper-set"][data-value="interactive"]').tap();
    await page.waitForSelector('.s2-seg [data-action="keeper-set"][data-value="interactive"][aria-pressed="true"]');
    assert.equal((await stored()).keeper.mode, "interactive");
    const sheet = await SS.settingsSheet(page, "keeper");
    assert.equal(await sheet.locator("[data-keeper-rename]").count(), 1);
    assert.equal(await sheet.locator('[data-action="keeper-toggle"][data-key="allowMemories"]').count(), 1);
    assert.equal(await sheet.locator('[data-action="keeper-toggle"][data-key="proactive"]').isDisabled(), false, "greeting first: available in Interactive");
    await sheet.locator("[data-keeper-rename]").fill("糯米");
    await sheet.locator("[data-keeper-rename]").press("Enter");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.v1")).keeper.name === "糯米");
    await shot("02-keeper-sheet");
    await SS.closeSheet(page);
    await page.waitForFunction(() => /糯米/.test(document.querySelector(".s2-keeper")?.textContent || ""));
    passed.push("Little Keeper: invitation while off; preview + one-line mode choice (incl. Off); rename / look-back / greet-first live in “Character & look”");

    // 4. Look & preferences: a palette row (kept after reload), language, reminder.
    const themes = await page.$$eval('.s2-pal [data-action="theme"]', (els) => els.map((e) => e.dataset.themeId));
    assert.ok(themes.length >= 4, "the palette");
    await page.locator(`.s2-pal [data-action="theme"][data-theme-id="${themes[2]}"]`).tap();
    await page.waitForSelector(`.s2-pal [data-theme-id="${themes[2]}"][aria-pressed="true"]`);
    assert.equal(await page.locator('.s2-pal [aria-pressed="true"]').count(), 1);
    await page.reload();
    await page.waitForSelector(".hero");
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.theme")), themes[2]);
    await settings();
    await page.waitForSelector(`.s2-pal [data-theme-id="${themes[2]}"][aria-pressed="true"]`);
    await page.locator(`.s2-pal [data-action="theme"][data-theme-id="${themes[0]}"]`).tap();
    await page.waitForSelector(`.s2-pal [data-theme-id="${themes[0]}"][aria-pressed="true"]`);
    assert.equal(await page.locator('[data-action="reminder-toggle"]').isDisabled(), true, "reminders: iPhone app only");
    await page.locator('.s2-lang [data-action="language"][data-language="en"]').tap();
    await page.waitForFunction(() => /Look & Preferences/.test(document.querySelector(".s2")?.textContent || ""));
    assert.match(await page.locator(".s2").innerText(), /Your space on this device[\s\S]*Data & Privacy[\s\S]*About & More/);
    assert.match(await page.locator(".s2-me").innerText(), /Jess/, "my name is not translated");
    assert.match(await page.locator(".s2-keeper").innerText(), /糯米/, "the companion's name is not translated");
    await noOverflow("en 390");
    await shot("03-english");
    await page.locator('.s2-lang [data-action="language"][data-language="zh-CN"]').tap();
    await page.waitForFunction(() => /外观与偏好/.test(document.querySelector(".s2")?.textContent || ""));
    passed.push("look & preferences: palette choice kept after reload; language switch changes the interface only; reminder row explains itself");

    // 5. Data & privacy: storage, backup + restore, lock, two switches, AI not available (cannot be turned on), privacy notes.
    const data = page.locator(".privacy-card");
    assert.match(await data.innerText(), /本机存储[\s\S]*备份与恢复[\s\S]*AI 小管家[\s\S]*尚未接入[\s\S]*隐私说明/);
    assert.equal(await data.locator('[data-action="backup"]').count(), 1);
    assert.equal(await data.locator('[data-action="restore-backup"]').count(), 1);
    assert.equal(await data.locator('[data-action="lock-toggle"]').count(), 1);
    const ai = data.locator('[data-action="keeper-toggle"][data-key="aiConsent"]');
    assert.equal(await ai.isDisabled(), true);
    assert.equal(await ai.getAttribute("aria-checked"), "false");
    await data.locator('[data-action="privacy-toggle"][data-privacy="hideToday"]').tap();
    await page.waitForSelector('[data-privacy="hideToday"][aria-checked="true"]');
    await data.locator('[data-action="privacy-toggle"][data-privacy="hideToday"]').tap();
    await page.waitForSelector('[data-privacy="hideToday"][aria-checked="false"]');
    assert.match(await (await SS.settingsSheet(page, "privacy")).innerText(), /只存在这台设备上/);
    await SS.closeSheet(page);
    assert.equal((await stored()).keeper.aiConsent, false);
    await shot("04-data");
    passed.push("data & privacy: storage, backup / restore, lock, two switches; the AI row is marked “not available yet” and cannot be switched on; notes in a sheet");

    // 6. About & more: rows that open sheets; the last row clears the bottom navigation.
    const about = page.locator(".s2-about");
    assert.match(await about.innerText(), /更新记录[\s\S]*功能介绍[\s\S]*许可证[\s\S]*示例内容[\s\S]*测试记录[\s\S]*实验室/);
    assert.match(await (await SS.settingsSheet(page, "licenses")).innerText(), /OFL|许可|Licen/);
    await SS.closeSheet(page);
    assert.equal(await (await SS.settingsSheet(page, "samples")).locator('[data-action="samples-remove"]').count(), 1);
    await SS.closeSheet(page);
    assert.equal(await (await SS.settingsSheet(page, "testlog")).locator('[data-action="export-events"]').count(), 1);
    await SS.closeSheet(page);
    await about.locator('[data-action="whats-new"]').evaluate((el) => el.scrollIntoView({ block: "center" }));
    await about.locator('[data-action="whats-new"]').tap();
    await page.waitForSelector(".news-sheet");
    assert.match(await page.locator(".news-sheet").innerText(), /10\.4/);
    await page.locator('.news-sheet [data-action="choose-close"]').first().tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    assert.equal(await about.locator(".s2-dot").count(), 0, "read once: no dot");
    await page.evaluate(() => document.querySelector("#app-scroll").scrollTo(0, 1e6));
    await page.waitForTimeout(200);
    const clear = await page.evaluate(() => {
      const rows = [...document.querySelectorAll(".s2-about .s2-more-row")];
      const last = rows[rows.length - 1].getBoundingClientRect();
      const nav = document.querySelector("#navigation").getBoundingClientRect();
      return { bottom: last.bottom, nav: nav.top, height: last.height };
    });
    assert.ok(clear.bottom <= clear.nav + 1, `the last row is above the bottom navigation (${JSON.stringify(clear)})`);
    assert.ok(clear.height >= 44, "rows are at least 44px");
    await shot("05-bottom");
    passed.push("about & more: updates (dot until read), tour, licences, samples, test log, labs open as sheets; last row clears the bottom navigation");

    // 7. “Back to the welcome page” only with the Labs sign-in page; it keeps everything.
    assert.equal(await about.locator('[data-action="sign-out"]').count(), 1, "Labs on in this suite");
    assert.match(await about.locator('[data-action="sign-out"]').innerText(), /回到欢迎页[\s\S]*数据保留/);
    await SS.settingsSheet(page, "labs");
    await page.locator('.s2-sheet [data-action="labs-toggle"]').tap();
    await page.waitForSelector('.s2-sheet [data-action="labs-toggle"][aria-pressed="false"]');
    assert.equal(await page.locator('.s2 [data-action="sign-out"]').count(), 0, "Labs off: no such row");
    await page.locator('.s2-sheet [data-action="labs-toggle"]').tap();
    await page.waitForSelector('.s2-sheet [data-action="labs-toggle"][aria-pressed="true"]');
    await SS.closeSheet(page);
    const before = await stored();
    await about.locator('[data-action="sign-out"]').evaluate((el) => el.scrollIntoView({ block: "center" }));
    await about.locator('[data-action="sign-out"]').tap();
    await page.waitForSelector("#confirm-dialog[open]");
    assert.match(await page.locator("#confirm-message").innerText(), /这不是退出账号/);
    await page.locator("#confirm-ok").tap();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.account")).signedIn === false);
    const after = await stored();
    assert.deepEqual([after.entries.length, after.books.length, after.keeper.name], [before.entries.length, before.books.length, "糯米"], "nothing deleted");
    assert.equal((await accountNow()).name, "Jess", "the profile is kept too");
    passed.push("“Back to the welcome page (data kept)” appears only with the Labs sign-in page; it asks first and deletes nothing");

    // 8. Small and large phones: no sideways scroll, nothing cut.
    for (const [w, h] of [[375, 667], [430, 932]]) {
      const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const p = await c.newPage();
      p.on("pageerror", (error) => errors.push(error.message));
      await p.goto(base);
      await p.waitForSelector(".hero");
      await p.locator(".settings-gear").tap();
      await p.waitForSelector(".s2");
      for (const lang of ["zh-CN", "en"]) {
        await p.locator(`.s2-lang [data-action="language"][data-language="${lang}"]`).tap();
        await p.waitForTimeout(250);
        const wide = await p.evaluate(() => {
          const scroll = document.querySelector("#app-scroll");
          const over = [...document.querySelectorAll(".s2 *")].filter((el) => el.getBoundingClientRect().right > scroll.getBoundingClientRect().right + 1).map((el) => el.className || el.tagName);
          return { ok: scroll.scrollWidth <= scroll.clientWidth + 1, over: over.slice(0, 5) };
        });
        assert.ok(wide.ok && !wide.over.length, `${w}px ${lang}: ${JSON.stringify(wide)}`);
      }
      if (shots) await p.screenshot({ path: `${shots}/06-${w}.png` });
      await c.close();
    }
    passed.push("375×667 and 430×932, Chinese and English: no sideways scroll, nothing past the edge");

    assert.deepEqual(outside, [], "nothing was requested from anywhere but this device");
    assert.deepEqual(errors, []);
    console.log(`V10.4 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors; no outside requests.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
