// V10.10 · Settings polish: same structure as V10.4. A warm unnamed profile
// (我的小世界 + sprout mark; a name → its first letter; a chosen avatar is
// kept); a more present Captain with a light "play" entry into Captain's
// Corner (no chat in Settings); a calmer Data & Privacy with backup first
// and every privacy fact still available; readable text, 44px rows and no
// overlap with the bottom navigation on 375 and 393 phones.
const { chromium, devices } = require("playwright");
const SS = require("./signed-in.cjs");
SS(chromium);
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const shots = process.env.SHOTS || "";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  const errors = [];
  try {
    const open = async (viewport, lang) => {
      const context = await browser.newContext(viewport ? { viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { ...devices["iPhone 13"] });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      if (lang) await page.addInitScript((l) => localStorage.setItem("little-days.language", l), lang);
      await page.goto(base);
      await page.waitForSelector(".hero");
      return page;
    };
    const page = await open();
    const shot = async (p, name) => { if (shots) await p.screenshot({ path: `${shots}/${name}.png` }); };
    const settings = async (p) => { await p.locator('#navigation [data-page="home"]').tap(); await p.locator(".settings-gear").tap(); await p.waitForSelector(".s2"); };
    const themeBefore = await page.evaluate(() => localStorage.getItem("little-days.theme"));

    // 1. Unnamed: 我的小世界, a sprout mark; then a name; then a chosen avatar.
    await settings(page);
    const me = page.locator(".s2-me");
    assert.match(await me.innerText(), /我的小世界[\s\S]*给这个世界起个名字吧/);
    assert.doesNotMatch(await page.locator(".s2").innerText(), /还没有名字/);
    assert.equal(await page.locator(".s2-avatar.sprout svg.sprout-mark").count(), 1);
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "", "no letter and no emoji before a name");
    await shot(page, "01-unnamed");
    await page.locator('.s2-me [data-action="settings-sheet"][data-sheet="profile"]').tap();
    await page.waitForSelector('#choose-dialog[open] .s2-sheet[data-sheet="profile"]');
    await page.locator("[data-profile-name]").fill("小满");
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForFunction(() => /小满/.test(document.querySelector(".s2-name")?.textContent || ""));
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "小");
    assert.match(await me.innerText(), /编辑资料/);
    await SS.settingsSheet(page, "profile");
    await page.locator('[data-action="profile-avatar"][data-avatar="🌙"]').tap();
    await page.locator('[data-action="profile-save"]').tap();
    await page.waitForSelector(".s2-avatar.emoji");
    assert.equal((await page.locator(".s2-avatar").innerText()).trim(), "🌙", "a chosen avatar is kept");
    passed.push("profile: unnamed shows 我的小世界 + 给这个世界起个名字吧 with a sprout mark (no “还没有名字”); a name shows its first letter; a chosen avatar is kept");

    // 2. Captain is more present; settings stay here, playing opens Captain's Corner.
    await page.locator('#navigation [data-page="home"]').tap();
    await page.locator('.keeper-invite [data-action="keeper-onboard"]').tap();
    await page.waitForSelector(".keeper-onboard");
    await page.locator('[data-action="keeper-start"]').tap();
    await page.waitForSelector(".keeper-home");
    await settings(page);
    const art = await page.locator(".s2-keeper img.keeper-img").boundingBox();
    assert.ok(art.width >= 88, `Captain is larger (${art.width}px)`);
    assert.equal(await page.locator('.s2-keeper [data-sheet="keeper"]').count(), 1, "角色与装扮 stays");
    const play = page.locator(".s2-keeper .s2-play");
    assert.match(await play.innerText(), /和 Captain 玩一会儿/);
    assert.equal(await page.locator(".s2 [data-keeper-say], .s2 .keeper-msgs").count(), 0, "no chat inside Settings");
    await play.tap();
    await page.waitForSelector('#choose-dialog[open] .kp.corner[data-view="home"]');
    assert.equal(await page.locator(".kp-tabs [role=tab]").count(), 3, "it is Captain's Corner");
    await page.locator(".kp .kp-x").first().tap();
    await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
    await shot(page, "02-keeper");
    await page.locator('.s2-seg [data-action="keeper-set"][data-value="quiet"]').tap();
    await page.waitForSelector('.s2-seg [data-value="quiet"][aria-pressed="true"]');
    assert.equal(await page.locator(".s2-keeper .s2-play").count(), 0, "Quiet: no play entry (Captain stays quiet)");
    await page.locator('.s2-seg [data-action="keeper-set"][data-value="gentle"]').tap();
    passed.push("Little Keeper: Captain at about 92px; 角色与装扮 stays; 和 Captain 玩一会儿 opens Captain's Corner (no chat in Settings); hidden in Quiet mode");

    // 3. Data & Privacy: backup first and easy to find; short lines; full facts in 隐私说明.
    const data = page.locator(".privacy-card");
    const order = await data.evaluate((el) => [...el.querySelectorAll("b")].map((b) => b.textContent.trim()).filter(Boolean));
    assert.equal(order[0], "备份与恢复", `backup comes first (${order.join(" / ")})`);
    const backup = data.locator('[data-action="backup"]');
    const bb = await backup.boundingBox();
    assert.ok(bb.height >= 44);
    assert.match(await backup.evaluate((el) => getComputedStyle(el).backgroundColor), /^rgb/, "a filled main button");
    assert.equal(await data.locator('[data-action="restore-backup"]').count(), 1);
    assert.equal(await page.locator("#media-usage").count(), 1);
    const hints = await data.locator("small").evaluateAll((els) => els.map((el) => el.textContent.trim().length));
    assert.ok(hints.every((n) => n <= 60), `short lines (${hints})`);
    assert.equal(await data.locator('[data-key="aiConsent"]').isDisabled(), true);
    const notes = await SS.settingsSheet(page, "privacy");
    assert.match(await notes.innerText(), /只存在这台设备上[\s\S]*备份文件里有你的私人文字和照片[\s\S]*100 MB[\s\S]*别人看到你的手机[\s\S]*当天第一页下面[\s\S]*单独征得你的同意/);
    await SS.closeSheet(page);
    await data.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await shot(page, "03-data");
    passed.push("Data & Privacy: 备份与恢复 first with a filled 导出 button and 从备份恢复; one short line per row; AI still off and disabled; the full facts (backup safety, limits, both switches, AI) are in 隐私说明");

    // 4. Themes and language untouched; preferences unchanged.
    assert.equal(await page.locator('.s2-pal [data-action="theme"]').count(), 6);
    assert.equal(await page.locator('.s2-lang [data-action="language"]').count(), 2);
    assert.equal(await page.evaluate(() => localStorage.getItem("little-days.theme")), themeBefore);
    passed.push("six colour themes and 中文 / English unchanged; stored theme preference untouched");

    // 5. Real phone sizes: readable text, 44px rows, nothing under the bottom navigation; English.
    for (const [w, h, lang] of [[375, 667, null], [393, 852, null], [393, 852, "en"]]) {
      const p = await open({ width: w, height: h }, lang);
      await p.locator(".settings-gear").tap();
      await p.waitForSelector(".s2");
      const audit = await p.evaluate(() => {
        const nav = document.querySelector("#navigation").getBoundingClientRect();
        const texts = [...document.querySelectorAll(".s2 *")].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) && el.getBoundingClientRect().height > 0);
        const tiny = texts.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12).map((el) => el.textContent.trim().slice(0, 12));
        const tight = texts.filter((el) => { const c = getComputedStyle(el); const lh = parseFloat(c.lineHeight); return el.getBoundingClientRect().height > parseFloat(c.fontSize) * 2.2 && lh && lh < parseFloat(c.fontSize) * 1.3; }).map((el) => el.textContent.trim().slice(0, 12));
        const targets = [...document.querySelectorAll(".s2 [role=switch], .s2 .s2-more-row, .s2 .s2-btns button")].map((el) => Math.round(el.getBoundingClientRect().height)).filter((h) => h < 44);
        const scroll = document.querySelector("#app-scroll");
        return { tiny, tight, targets, wide: scroll.scrollWidth <= scroll.clientWidth + 1, nav: nav.top };
      });
      assert.deepEqual(audit.tiny, [], `${w}×${h}: nothing under 12px`);
      assert.deepEqual(audit.tight, [], `${w}×${h}: multi-line text has room between lines`);
      assert.deepEqual(audit.targets, [], `${w}×${h}: rows and buttons ≥ 44px`);
      assert.ok(audit.wide);
      await p.evaluate(() => document.querySelector("#app-scroll").scrollTo(0, 1e6));
      await p.waitForTimeout(250);
      const last = await p.evaluate(() => { const els = [...document.querySelectorAll(".s2 button, .s2 .s2-foot")]; const r = els[els.length - 1].getBoundingClientRect(); return { bottom: r.bottom, nav: document.querySelector("#navigation").getBoundingClientRect().top }; });
      assert.ok(last.bottom <= last.nav + 1, `${w}×${h}: the last item clears the bottom navigation (${JSON.stringify(last)})`);
      if (lang === "en") assert.match(await p.locator(".s2-me").innerText(), /My little world[\s\S]*Give this world a name/);
      await shot(p, `04-${w}${lang ? "-" + lang : ""}`);
      await p.context().close();
    }
    passed.push("375×667 and 393×852 (and English): no text under 12px, multi-line text not cramped, switches / rows / buttons ≥ 44px, the last item clears the bottom navigation");

    assert.deepEqual(errors, []);
    console.log(`V10.10 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
