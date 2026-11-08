// Older browser suites test the app behind the sign-in page: give every new
// browser context a local account that has already seen the welcome tour.
// (tests/v36-browser.cjs covers sign-in and the tour themselves.)
function seedAccount() {
  try {
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
// The ＋ (Studio) in the menu opens a "how do you want to start?" screen.
// Older suites expect the editor, so they continue today's page (or start
// with words on an empty day). tests/v36-browser.cjs tests the screen itself.
module.exports.goTab = async (page, tab) => {
  await page.locator(`#navigation [data-page="${tab}"]`).click();
  if (tab === "studio") {
    await page.waitForSelector(".studio-start");
    await page.locator('[data-action="start-continue"], [data-action="start-words"]').first().click();
    await page.waitForSelector("#journal-canvas");
  }
};
// New page photos open the photo editor; older suites keep the originals.
module.exports.skipPhotoEditor = async (page) => {
  await page.waitForSelector("#photo-editor[open] .pe-frame");
  await page.locator('#photo-editor [data-pe-action="cancel"]').click();
  await page.waitForSelector("#photo-editor:not([open])", { state: "attached" });
};
