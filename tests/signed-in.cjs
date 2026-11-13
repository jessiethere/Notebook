// Older browser suites test the app behind the sign-in page: give every new
// browser context a local account that has already seen the welcome tour.
// (tests/v36-browser.cjs covers sign-in and the tour themselves.)
// They also switch Labs on (community, profile, shared books, themes), which
// new installs hide while the core is being tested (tests/v52 covers that).
function seedAccount() {
  try {
    if (localStorage.getItem("little-days.labs") === null) localStorage.setItem("little-days.labs", "1");
    // The streak stamp moment is tested in v55; older suites skip it.
    if (localStorage.getItem("little-days.celebrated") === null) {
      const d = new Date();
      localStorage.setItem("little-days.celebrated", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
    // The Studio guide (V10.12) is tested in v112; older suites have seen it.
    if (localStorage.getItem("little-days.studio-guide") === null)
      localStorage.setItem("little-days.studio-guide", JSON.stringify({ tour: "skipped", tips: { dblTap: true } }));
    if (!localStorage.getItem("little-days.account"))
      localStorage.setItem(
        "little-days.account",
        JSON.stringify({ version: 1, method: "local", name: "", avatar: "🌷", createdAt: "2026-11-08T00:00:00.000Z", signedIn: true, onboarded: true }),
      );
  } catch {}
}
module.exports = function signedIn(chromium) {
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async (options) => {
    const browser = await launch(options);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (contextOptions) => {
      const context = await newContext(contextOptions);
      await context.addInitScript(seedAccount);
      return context;
    };
    browser.newPage = async (pageOptions) => (await browser.newContext(pageOptions)).newPage();
    return browser;
  };
  return chromium;
};
// The ＋ (Studio) in the menu opens the "how shall we keep today?" sheet
// (photo + a line / just write / draw). Older suites test the editor itself on
// today's page, so they open today's pages (or, on an empty day, today's
// page editor directly — the same editor the calendar opens for a date).
// tests/v36-browser.cjs and v51 test the sheet itself.
// ‹ out of the editor. Since V10.7 a page with something on it asks first
// (finish / keep as draft / keep editing): older suites keep it as a draft,
// which is what leaving did before.
async function leaveStudio(page) {
  await page.locator('[data-action="studio-back"], [data-action="start-close"]').first().click();
  await page.waitForFunction(() => !document.querySelector("#phone.in-studio") || document.querySelector("#choose-dialog[open] .exit-sheet"));
  if (await page.locator("#choose-dialog[open] .exit-sheet").count()) await page.locator('.exit-sheet [data-action="studio-draft-exit"]').click();
  await page.waitForSelector("#phone:not(.in-studio)");
}
module.exports.leaveStudio = leaveStudio;
module.exports.seed = seedAccount; // for persistent profiles (launchPersistentContext)
// V10.11: saving opens the full-screen reader (no bottom menu there): ‹ goes back to the book.
async function leaveReader(page) {
  if (!(await page.locator("#phone.in-reader").count())) return;
  if (await page.locator("#choose-dialog[open]").count()) await page.evaluate(() => document.querySelector("#choose-dialog").close());
  await page.locator('[data-action="reader-back"]').click();
  await page.waitForSelector("#phone:not(.in-reader)");
}
module.exports.leaveReader = leaveReader;
module.exports.goTab = async (page, tab) => {
  // Studio is full-screen: leave it with its own ‹ before using the menu.
  if (await page.locator("#phone.in-studio").count()) {
    await module.exports.studioEdit(page); // the preview has its own ‹ (back to editing)
    await leaveStudio(page);
  }
  await leaveReader(page);
  // Growth has no tab since V6.6: open "My habits" from Home's today card.
  if (tab === "growth") {
    await page.locator('#navigation [data-page="home"]').click();
    await module.exports.openPlans(page);
    await page.locator('.today-list [data-action="nav"][data-page="growth"]').click();
    return;
  }
  await page.locator(`#navigation [data-page="${tab}"]`).click();
  if (tab === "studio") await module.exports.openToday(page);
};
// From the record sheet into today's editor (see goTab).
module.exports.openToday = async (page) => {
  await page.waitForSelector("#choose-dialog[open] .quick-sheet");
  if (await page.locator('[data-action="quick-continue"]').count()) await page.locator('[data-action="quick-continue"]').click();
  else
    await page.evaluate(() => {
      document.querySelector("#choose-dialog").close();
      const open = document.createElement("button");
      open.dataset.action = "edit-today";
      open.hidden = true;
      document.querySelector("#app").append(open);
      open.click();
    });
  await page.waitForSelector("#journal-canvas");
};
// New page photos open the photo editor; older suites keep the originals.
module.exports.skipPhotoEditor = async (page) => {
  await page.waitForSelector("#photo-editor[open] .pe-frame");
  await page.locator('#photo-editor [data-pe-action="cancel"]').click();
  await page.waitForSelector("#photo-editor:not([open])", { state: "attached" });
};
// Tap a bottom-menu tab as a person would (leaving full-screen Studio first),
// without continuing past the Studio start screen.
module.exports.menu = async (page, tab) => {
  if (await page.locator("#phone.in-studio").count()) {
    await module.exports.studioEdit(page); // the preview has its own ‹ (back to editing)
    await leaveStudio(page);
  }
  await leaveReader(page);
  if (tab === "growth") {
    await page.locator('#navigation [data-page="home"]').click();
    await module.exports.openPlans(page);
    await page.locator('.today-list [data-action="nav"][data-page="growth"]').click();
    return;
  }
  await page.locator(`#navigation [data-page="${tab}"]`).click();
};
// Since V6.7, Save shows the page just made in its book (page view); older
// suites then carry on from Home.
module.exports.homeAfterSave = async (page) => {
  await page.waitForSelector(".flip-page:not(.is-cover)");
  await leaveReader(page);
  await page.locator('#navigation [data-page="home"]').click();
  await page.waitForSelector(".hero");
};
// Since V6.8, Home's today card is a planner; habit check-ins are in "My
// habits". Suites that ticked a habit on Home only to write storage once add
// and remove a plan instead; the others open "My habits" first.
// V10.2: Home keeps the plans and habits folded into one line; open it first.
module.exports.openPlans = async (page) => {
  if (await page.locator('.today-planner.qu[data-open="false"]').count()) await page.locator('[data-action="plans-toggle"]').click();
  await page.locator(".today-planner.qu .qu-body").waitFor();
};
module.exports.touchStore = async (page) => {
  await module.exports.openPlans(page);
  await page.locator("[data-plan-input]").fill("·");
  await page.locator('[data-action="plan-add"]').click();
  await page.locator('[data-action="plan-remove"]').first().click();
  await page.waitForFunction(() => localStorage.getItem("little-days.v1"));
};
module.exports.openHabits = async (page) => {
  await module.exports.openPlans(page);
  await page.locator('.today-list [data-action="nav"][data-page="growth"]').click();
  await page.waitForSelector(".growth-habit");
};

// ---------- Journal Studio shell (V10.0) ----------
// The editor keeps four tools at the bottom (photo · text · stickers · more);
// every other tool, the page mode and the page's details live in the More
// sheet. Older suites reach them through these helpers.
const dockReady = async (target) => {
  const dock = target.locator(".tool-dock.sv-tools");
  if (await dock.isVisible()) return;
  // A phone hides the tools while typing: put the keyboard away first.
  await target.evaluate(() => document.activeElement?.blur?.());
  await dock.waitFor({ state: "visible", timeout: 5000 }).catch(async () => {
    await target.locator(".studio-stage").click({ position: { x: 3, y: 3 } });
    await dock.waitFor({ state: "visible" });
  });
};
module.exports.studioTool = async (target, id) => {
  // V10.24: mood is chosen in 页面信息 (More → 心情 opens it at the picker).
  if (id === "mood") {
    await module.exports.studioMore(target);
    await target.locator('.more-grid [data-action="mood-open"]').click();
    const details = target.locator('.tool-sheet[data-tool-row="details"]');
    await details.locator("#mood-picker").waitFor();
    return details;
  }
  const sheet = target.locator(`.tool-sheet[data-tool-row="${id}"]`);
  if (await sheet.count()) return sheet;
  await dockReady(target);
  // With something selected the bottom row is that item's tools (V10.1):
  // 图层 is there; for any other tool, × returns to the four tools first.
  if (await target.locator(".tool-dock.ctx").count()) {
    if (await target.locator(`.tool-dock.ctx [data-tool="${id}"]`).count()) {
      await target.locator(`.tool-dock.ctx [data-tool="${id}"]`).click();
      await sheet.waitFor();
      return sheet;
    }
    await target.locator('.tool-dock.ctx [data-action="layer-deselect"]').click();
    await target.locator(".tool-dock:not(.ctx)").waitFor();
  }
  if (id === "stickers" || id === "more") await target.locator(`.tool-dock [data-tool="${id}"]`).click();
  else {
    if (!(await target.locator('.tool-sheet[data-tool-row="more"]').count())) await target.locator('.tool-dock [data-tool="more"]').click();
    await target.locator(`.more-grid [data-tool="${id}"]`).click();
  }
  await sheet.waitFor();
  return sheet;
};
module.exports.studioMore = (target) => module.exports.studioTool(target, "more");
// Date · journal · time · name · caption · tags · delete.
module.exports.studioDetails = (target) => module.exports.studioTool(target, "details");
module.exports.studioClose = async (target) => {
  if (await target.locator(".tool-sheet").count()) await target.locator('[data-action="tool-close"]').click();
  await target.locator(".tool-sheet").waitFor({ state: "detached" });
};
// 照片+一句 / 随手写 / 自由排版 (More closes itself after the choice).
module.exports.studioMode = async (target, mode) => {
  await module.exports.studioMore(target);
  await target.locator(`[data-action="page-mode"][data-mode="${mode}"]`).click();
  await target.locator('.tool-sheet[data-tool-row="more"]').waitFor({ state: "detached" });
};
// A tile in More that starts something (draw-new, add-video, add-sound…).
module.exports.studioMoreAction = async (target, action) => {
  await module.exports.studioMore(target);
  await target.locator(`.more-grid [data-action="${action}"]`).click();
};
// 预览: sharing and export live here.
module.exports.studioPreview = async (target) => {
  if (await target.locator(".studio-stage.previewing").count()) return;
  await dockReady(target);
  await target.locator('.sv-top [data-action="studio-preview"]').click();
  await target.locator(".studio-stage.previewing").waitFor();
};
module.exports.studioEdit = async (target) => {
  if (!(await target.locator(".studio-stage.previewing").count())) return;
  await target.locator('.sv-top [data-action="studio-preview"]').click();
  await target.locator(".studio-stage:not(.previewing)").waitFor();
};
// A field of the page (name · time · caption · tags): in 页面信息.
module.exports.momentField = async (target, name) => {
  await module.exports.studioDetails(target);
  return target.locator(`[data-moment-field="${name}"]`);
};
// Back to the four tools (× in the selected item's row), if something is selected.
module.exports.studioDeselect = async (target) => {
  await dockReady(target);
  if (await target.locator(".tool-dock.ctx").count()) {
    await target.locator('.tool-dock.ctx [data-action="layer-deselect"]').click();
    await target.locator(".tool-dock:not(.ctx)").waitFor();
  }
};

// ---------- Settings V2 (V10.4) ----------
// Details (profile, Keeper, privacy notes, licences, samples, test log, labs)
// open in a bottom sheet from their row on the Settings page.
module.exports.settingsSheet = async (page, kind) => {
  // (A closed sheet's markup stays in the dialog, so only an open one counts.)
  const sheet = page.locator(`#choose-dialog[open] .s2-sheet[data-sheet="${kind}"]`);
  if (await sheet.count()) return sheet;
  const row = page.locator(`.s2 [data-action="settings-sheet"][data-sheet="${kind}"]`).first();
  await row.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await row.click();
  await sheet.waitFor();
  return sheet;
};
module.exports.closeSheet = async (page) => {
  if (await page.locator("#choose-dialog[open]").count()) await page.locator('#choose-dialog [data-action="choose-close"]').first().click();
  await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
};

// V10.19: the magazine view's words sheet edits one Moment (or one photo) at
// a time. Writes each Moment's own line (null = leave it), in order.
module.exports.storyLines = async (page, lines) => {
  await page.locator('.story-tools [data-action="story-text"]').tap();
  await page.waitForSelector("#choose-dialog[open] [data-sw-text]");
  const tabs = page.locator('#choose-dialog [data-action="sw-moment"]');
  const n = await tabs.count();
  for (const [i, line] of lines.entries()) {
    if (line == null) continue;
    if (n) {
      await tabs.nth(i).tap();
      await page.waitForFunction((at) => document.querySelectorAll('#choose-dialog [data-action="sw-moment"]')[at]?.getAttribute("aria-selected") === "true", i);
    }
    await page.locator('#choose-dialog [data-action="sw-target"][data-target="moment"]').tap();
    await page.waitForSelector('#choose-dialog [data-target="moment"][aria-selected="true"]');
    await page.locator("#choose-dialog [data-sw-text]").fill(line);
  }
  await page.locator('#choose-dialog [data-action="story-text-done"]').tap();
  await page.waitForSelector("#choose-dialog:not([open])", { state: "attached" });
};
