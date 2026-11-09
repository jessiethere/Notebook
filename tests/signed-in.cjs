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
module.exports.goTab = async (page, tab) => {
  // Studio is full-screen: leave it with its own ‹ before using the menu.
  if (await page.locator("#phone.in-studio").count()) {
    const back = page.locator('[data-action="studio-back"], [data-action="start-close"]').first();
    await back.click();
    await page.waitForSelector("#phone:not(.in-studio)");
  }
  // Growth has no tab since V6.6: open "My habits" from Home's today card.
  if (tab === "growth") {
    await page.locator('#navigation [data-page="home"]').click();
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
    await page.locator('[data-action="studio-back"], [data-action="start-close"]').first().click();
    await page.waitForSelector("#phone:not(.in-studio)");
  }
  if (tab === "growth") {
    await page.locator('#navigation [data-page="home"]').click();
    await page.locator('.today-list [data-action="nav"][data-page="growth"]').click();
    return;
  }
  await page.locator(`#navigation [data-page="${tab}"]`).click();
};
// Since V6.7, Save shows the page just made in its book (page view); older
// suites then carry on from Home.
module.exports.homeAfterSave = async (page) => {
  await page.waitForSelector(".flip-page:not(.is-cover)");
  await page.locator('#navigation [data-page="home"]').click();
  await page.waitForSelector(".hero");
};
// Since V6.8, Home's today card is a planner; habit check-ins are in "My
// habits". Suites that ticked a habit on Home only to write storage once add
// and remove a plan instead; the others open "My habits" first.
module.exports.touchStore = async (page) => {
  await page.locator("[data-plan-input]").fill("·");
  await page.locator('[data-action="plan-add"]').click();
  await page.locator('[data-action="plan-remove"]').first().click();
  await page.waitForFunction(() => localStorage.getItem("little-days.v1"));
};
module.exports.openHabits = async (page) => {
  await page.locator('.today-list [data-action="nav"][data-page="growth"]').click();
  await page.waitForSelector(".growth-habit");
};
