// Collaborative Journal demo inside a book + the calm Growth page.
// Virtual users only; nothing leaves the browser.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const { studioTool, studioDetails, studioMode, studioPreview, studioEdit, studioClose, studioMore, studioMoreAction, momentField } = require("./signed-in.cjs");
const { goTab } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const nav = (tab) => goTab(page, tab);
    const demo = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social") || "null"));

    // 1. Growth: one summary strip, compact habits, notes folded away.
    await nav("growth");
    await page.waitForSelector(".growth-summary");
    assert.equal(await page.locator(".growth-intro, .milestone, .theme-header").count(), 0, "old blocks gone");
    assert.equal(await page.locator(".growth-habit.compact").count(), await page.locator('.journey-chip').count());
    assert.equal(await page.locator('[data-action="new-habit"]').count(), 1, "one add-habit button");
    await page.locator('[data-action="growth-calendar"]').click();
    await page.waitForSelector('[data-action="calendar-mode"][data-mode="growth"][aria-pressed="true"], .calendar');
    passed.push("growth page: summary strip, compact habit cards, single add button");

    // 2. Open a book; the shared section is folded and labelled as a demo.
    await nav("books");
    await page.locator('[data-action="pull-book"]').first().click();
    await page.locator('.pulled-book [data-action="book"]').click();
    const toggle = page.locator('[data-action="collab-toggle"]');
    assert.match(await toggle.innerText(), /演示 · 未联网/);
    await toggle.click();
    assert.match(await page.locator(".collab .demo-banner").innerText(), /不会发送给任何人/);
    assert.equal(await page.locator(".collab-member").count(), 1, "only the owner at first; friends are not members");
    const bookId = await page.evaluate(() => document.querySelector('[data-action="edit-book"]').dataset.book);

    // 3. Invite a friend as Editor, simulate accept: their page appears with a mark.
    await page.locator("#collab-invite-user").selectOption("u-xiaoman");
    await page.locator("#collab-invite-role").selectOption("editor");
    await page.locator('[data-action="collab-invite"]').click();
    await page.waitForSelector(".collab-member.pending");
    await page.locator('[data-action="collab-accept"][data-user="u-xiaoman"]').click();
    await page.waitForSelector(".collab-member.active");
    assert.match(await page.locator(".collab-page .collab-mark").first().innerText(), /小满/);
    passed.push("invite friend → pending → simulated accept → contributor-marked page");

    // 4. I write a page; the friend's simulated clash keeps both texts.
    await page.locator('[data-action="collab-write"]').click();
    await page.locator('#dialog-form [name="title"]').fill("我们的周末");
    await page.locator('#dialog-form [name="body"]').fill("一起去了花市。");
    await page.locator('#dialog-form [type="submit"]').click();
    await page.waitForSelector('.collab-page:has-text("我们的周末")');
    const mine = page.locator('.collab-page:has-text("我们的周末")');
    await mine.locator('[data-action="collab-conflict"]').click();
    await page.waitForSelector(".collab-conflict");
    assert.match(await page.locator(".collab-conflict").innerText(), /一起去了花市。/);
    await page.locator('[data-action="collab-resolve"][data-choice="both"]').click();
    await page.waitForSelector(".collab-conflict", { state: "detached" });
    assert.equal(await page.locator('.collab-page:has-text("我们的周末")').count(), 2, "both versions kept");
    passed.push("write a shared page; clash shows both texts, keep both");

    // 5. Version history: restore an older version (confirmed), nothing lost.
    await page.locator(".collab-versions summary").click();
    const versions = await page.locator(".collab-versions li").count();
    await page.locator('[data-action="collab-restore"]').last().click();
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForFunction((n) => document.querySelectorAll(".collab-versions li").length === n + 1 || document.querySelector(".collab-versions:not([open])"), versions);
    let d = await demo();
    assert.equal(d.collab[bookId].versions[0].label, "restored");
    assert.equal(d.collab[bookId].pages.length, 1, "restored to the first shared page");
    passed.push("version history restore with confirmation");

    // 6. Role change, remove (confirm) — their page stays, marked as left.
    await page.locator('[data-collab-role="u-xiaoman"]').selectOption("viewer");
    d = await demo();
    assert.equal(d.collab[bookId].members[0].role, "viewer");
    await page.locator('[data-action="collab-remove"][data-user="u-xiaoman"]').click();
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForFunction(() => !document.querySelector('[data-collab-role="u-xiaoman"]'));
    assert.match(await page.locator(".collab-page .collab-mark").first().innerText(), /已离开/);
    assert.match(await page.locator(".collab-publish").innerText(), /未开放/);
    assert.equal(await page.locator(".collab-publish button").isDisabled(), true);
    passed.push("change role, remove member; pages kept and marked; publish not available");

    // 7. Private journal data never contains the shared demo.
    const journal = await page.evaluate(() => localStorage.getItem("little-days.v1"));
    assert.ok(!/u-xiaoman|我们的周末|collab/.test(journal), "journal storage untouched");
    // Survives reload (demo storage).
    await page.reload();
    await page.waitForSelector(".hero");
    d = await demo();
    assert.equal(d.collab[bookId].pages.length, 1);
    passed.push("demo kept apart from journal data and survives reload");

    assert.deepEqual(errors, []);
    console.log(`Collab + Growth E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
