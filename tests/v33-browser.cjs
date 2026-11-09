// Write-first Studio, templates by photo count, easy "write a moment" entry
// points, and the offline Community / Friends / Messages demo.
const { chromium } = require("playwright");
require("./signed-in.cjs")(chromium);
const { goTab, skipPhotoEditor } = require("./signed-in.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8080";
const media = path.join(__dirname, "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/Media");
const photos = (n) => Array.from({ length: n }, (_, i) => ({ name: `p${i}.jpg`, mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(media, i % 2 ? "lake.jpg" : "coffee.jpg")) }));

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const passed = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "America/New_York" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".hero");
    const nav = (tab) => goTab(page, tab);
    // "Me" moved to My Books → 我的主页.
    const openMe = async () => {
      await nav("books");
      if (!(await page.locator(".ig-head").count())) await page.locator('[data-action="books-view"][data-view="profile"]').click();
      await page.waitForSelector(".ig-head");
    };
    const tool = async (id) => {
      const head = page.locator(`[data-action="tool"][data-tool="${id}"]`);
      if ((await head.getAttribute("aria-expanded")) !== "true") await head.click();
    };
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("little-days.v1")));
    const today = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });

    // 0. Calm home: one invitation to write, no duplicate shortcuts.
    assert.equal(await page.locator(".quick-action, .community-banner, .studio-banner").count(), 0);
    assert.equal(await page.locator('.hero [data-action="quick-open"]').count(), 1);
    await page.locator(".today-preview").click();
    await page.waitForSelector(".day-detail");
    await nav("home");
    // 1. One tap from Home starts a Moment; writing is the first thing on screen.
    // It opens as a note: the title on the paper is ready for typing.
    await page.locator('.moment-cta[data-action="quick-open"]').click();
    await page.locator('#choose-dialog [data-action="quick-start"]').click();
    await page.waitForSelector('#journal-canvas [data-inline="title"]');
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.inline), "title", "title on the paper is focused");
    await page.keyboard.type("Gym Session");
    await page.locator('#journal-canvas [data-inline="body"]').click();
    await page.keyboard.type("深蹲 4 组，状态很好。");
    await page.waitForFunction(() => {
      const d = new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const m = JSON.parse(localStorage.getItem("little-days.v1"))?.drafts?.[key]?.moments?.at(-1);
      return m?.title === "Gym Session" && m.body === "深蹲 4 组，状态很好。" && m.layoutTemplate === "text";
    });
    // Writing sits above the decoration menu, not as one of its rows.
    const order = await page.evaluate(() => {
      const write = document.querySelector("#journal-canvas").getBoundingClientRect().top;
      const menu = document.querySelector("#tool-menu").getBoundingClientRect().top;
      return write < menu;
    });
    assert.ok(order);
    assert.equal(await page.locator('[data-tool-row="text"]').count(), 0);
    assert.equal(await page.locator(".tool-dock .dock-btn").count() >= 7, true, "decoration tools are icons in the bottom dock");
    passed.push("home → write a moment in one tap; writing first, decoration second");

    // 2. Templates: pick the number of photos first, then a layout.
    await tool("layout");
    await page.locator('[data-action="template-count"][data-count="3"]').click();
    const layouts = await page.$$eval('[data-action="apply-layout"]', (els) => els.map((el) => el.dataset.template));
    assert.deepEqual(layouts, ["trio", "collage", "polaroid"]);
    await page.locator('[data-action="apply-layout"][data-template="trio"]').click();
    await page.waitForFunction(() => document.querySelectorAll("#journal-canvas .photo-layer.empty-slot").length === 3);
    await page.locator("#photos-input").setInputFiles(photos(2));
    await skipPhotoEditor(page);
    await page.waitForFunction(() => document.querySelectorAll('#journal-canvas .photo-layer img[src^="blob:"]').length === 2 && document.querySelectorAll("#journal-canvas .empty-slot").length === 1);
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[d]?.moments?.at(-1)?.layers.filter((l) => l.mediaRef).length === 2, today);
    let draft = (await read()).drafts[today];
    let moment = draft.moments.at(-1);
    assert.equal(moment.layoutTemplate, "trio");
    assert.deepEqual(moment.layers.filter((l) => l.kind === "photo").map((l) => Boolean(l.mediaRef)), [true, true, false]);
    // Fewer photos than already placed is not offered; words-only stays possible (with a confirm).
    assert.equal(await page.locator('[data-action="template-count"][data-count="1"]').isDisabled(), true);
    assert.equal(await page.locator('[data-action="template-count"][data-count="0"]').isDisabled(), false);
    // A words-only Moment sets its title on the paper.
    await page.locator('.chapter-chip.add').click();
    await page.locator(".write-card .write-title").fill("只有文字的一刻");
    await page.locator(".write-card .write-body").fill("今天没有拍照。");
    await tool("layout");
    await page.locator('[data-action="template-count"][data-count="0"]').click();
    await page.locator('[data-action="apply-layout"][data-template="text"]').click();
    await page.waitForSelector("#journal-canvas.text-only .canvas-title");
    assert.match(await page.locator("#journal-canvas .canvas-title").innerText(), /只有文字的一刻/);
    await page.locator('[data-action="save-entry"]').click();
    await require("./signed-in.cjs").homeAfterSave(page);
    await nav("calendar");
    await page.locator(`[data-action="select-date"][data-date="${today}"]`).click();
    await page.waitForSelector(".day-detail");
    assert.equal(await page.locator(".day-detail .empty-slot").count(), 0, "empty frames are hidden when reading");
    assert.equal(await page.locator(".day-detail .moment-canvas.text-only").count(), 1);
    // Day Detail offers "add a moment to this day".
    await page.locator('.day-detail [data-action="quick-open"]').click();
    await page.waitForSelector("#choose-dialog[open] .quick-sheet");
    await page.locator('[data-action="quick-way"][data-way="write"]').click();
    await page.locator('[data-action="quick-start"]').click();
    await page.waitForSelector('.page-bar [data-action="moment-delete"]');
    await page.waitForFunction((d) => JSON.parse(localStorage.getItem("little-days.v1")).drafts[d]?.moments?.length === 3, today);
    passed.push("templates by photo count with empty frames, text-only page, add-moment from Day Detail");

    // 3. Community demo: clearly labelled, separate storage.
    const journalBefore = JSON.stringify((await read()).entries);
    // Community is in the bottom menu.
    await nav("community");
    await page.waitForSelector(".demo-banner");
    assert.equal(await page.locator("#navigation [data-page='community'].active").count(), 1);
    assert.deepEqual(await page.$$eval(".community-tabs.main [data-action='community-tab']", (els) => els.map((el) => el.dataset.tab)), ["discover", "friends", "messages"]);
    assert.match(await page.locator(".demo-banner").innerText(), /演示/);
    assert.ok((await page.locator(".work-card").count()) >= 8);
    for (const feed of ["following", "popular", "categories", "all"]) {
      await page.locator(`[data-action="community-feed"][data-feed="${feed}"]`).click();
      await page.waitForSelector(`[data-feed="${feed}"].selected`);
    }
    await page.locator("#community-search").fill("kyoto");
    await page.waitForSelector(".work-card");
    await page.locator(".work-card").first().click();
    await page.waitForSelector(".work-detail");
    const likes = Number((await page.locator('[data-action="community-like"]').innerText()).replace(/\D/g, ""));
    await page.locator('[data-action="community-like"]').click();
    assert.equal(Number((await page.locator('[data-action="community-like"]').innerText()).replace(/\D/g, "")), likes + 1);
    await page.locator('[data-action="community-save-menu"]').click();
    await page.locator('[data-action="community-save"][data-type="cover"]').click();
    await page.locator("#community-comment").fill("好喜欢这个配色");
    await page.locator('[data-action="community-comment"]').click();
    await page.locator('[data-action="community-reply"]').last().click();
    await page.locator("#community-comment").fill("谢谢！");
    await page.locator('[data-action="community-comment"]').click();
    assert.match(await page.locator(".c-comments").innerText(), /好喜欢这个配色[\s\S]*谢谢！/);
    await page.locator('[data-action="community-follow"]').click();
    await page.locator('[data-action="community-friend-request"]').click();
    let demo = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social")));
    assert.ok(demo.following.includes("u-river") && demo.requests.outgoing.includes("u-river"));
    assert.equal(demo.works.find((w) => w.id === "w2").savedAs, "cover");
    assert.equal(JSON.stringify((await read()).entries), journalBefore, "community never touches journal data");
    passed.push("discover/following/popular/categories/search; like, save as cover, comment + reply, follow, friend request");

    // Friends: accept incoming, simulate the other side accepting, block.
    await page.locator('[data-action="community-back"]').click();
    await page.locator('[data-action="community-tab"][data-tab="friends"]').click();
    await page.locator('[data-action="community-friend-accept"][data-user="u-mumu"]').click();
    await page.locator('[data-action="community-simulate-accept"][data-user="u-river"]').click();
    demo = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social")));
    assert.ok(["u-mumu", "u-river", "u-xiaoman"].every((id) => demo.friends.includes(id)));
    await page.locator('.c-user:has-text("June") [data-action="community-block"]').click();
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("little-days.demo-social")).blocked.includes("u-june"));
    await page.locator('[data-action="community-tab"][data-tab="discover"]').click();
    assert.equal(await page.locator(".work-card", { hasText: "Weekend scones" }).count(), 0, "blocked creator hidden");

    // Messages: unread badge, send text + sticker + shared work, simulated reply, delete own message.
    await page.locator('[data-action="community-tab"][data-tab="messages"]').click();
    assert.match(await page.locator(".c-thread").first().innerText(), /1/);
    await page.locator('.c-thread').first().click();
    await page.locator("#chat-text").fill("周末一起去看花吗？");
    await page.locator('[data-action="community-send"]').click();
    await page.locator('[data-action="community-sticker"][data-sticker="tulip"]').click();
    await page.locator('[data-action="community-share-toggle"]').click();
    await page.locator("#chat-share-work").selectOption("w1");
    await page.locator('[data-action="community-send"]').click();
    await page.waitForSelector(".bubble small:has-text('模拟回复')");
    assert.equal(await page.locator(".bubble.mine").count(), 3);
    await page.locator('.bubble.mine [data-action="community-delete-message"]').first().click();
    assert.equal(await page.locator(".bubble.mine").count(), 2);
    await page.locator(".bubble-work").click();
    await page.waitForSelector(".work-detail");
    passed.push("friends accept/simulate/block; messages with sticker, shared work, simulated reply, delete");

    // Publishing: nothing selected by default; explicit pages + media + confirmation.
    await page.locator('[data-action="community-back"]').click();
    await openMe();
    await page.locator('[data-action="community-publish-start"]').click();
    await page.locator('[data-publish="date"]').selectOption(today);
    await page.waitForSelector("[data-publish-page]");
    assert.equal(await page.locator("[data-publish-page]:checked").count(), 0, "nothing pre-selected");
    assert.equal(await page.locator('[data-action="community-publish-submit"]').isDisabled(), true);
    const firstMoment = (await read()).entries.find((e) => e.date === today).moments[0];
    await page.locator(`[data-publish-page="${firstMoment.id}"]`).check();
    const mediaBoxes = page.locator(`.pub-page:has([data-publish-page="${firstMoment.id}"]) [data-publish-media]`);
    assert.equal(await mediaBoxes.count(), 2);
    await mediaBoxes.first().check();
    await page.locator('[data-publish="title"]').fill("我的健身日");
    await page.locator('[data-publish="confirmed"]').check();
    await page.locator('[data-action="community-publish-submit"]').click();
    await page.waitForSelector(".work-detail");
    demo = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social")));
    const mine = demo.works.find((w) => w.authorId === "me");
    assert.equal(mine.title, "我的健身日");
    assert.equal(mine.media.length, 1, "only the ticked photo");
    assert.deepEqual(mine.pages.map((p) => p.title), ["Gym Session"]);
    await page.locator('[data-action="community-toggle-comments"]').uncheck();
    assert.match(await page.locator(".c-comments").innerText(), /关闭了评论/);
    await page.locator('[data-action="community-unpublish"]').click();
    await page.locator("#confirm-dialog[open] #confirm-ok").click();
    await page.waitForFunction(() => !JSON.parse(localStorage.getItem("little-days.demo-social")).works.some((w) => w.authorId === "me"));
    const journal = await read();
    assert.ok(journal.entries.every((e) => e.visibility === "private"));
    assert.ok(!("little-days.demo-social" in JSON.parse(JSON.stringify(journal))));
    passed.push("publish needs explicit page/media + confirmation; comments toggle; unpublish; journal stays private");

    // My profile: manage my community presence.
    await openMe();
    // Avatar: a photo (no emoji); without one, the first letter of the name.
    assert.equal(await page.locator(".ig-head .c-avatar.monogram").count(), 1);
    await page.locator('.ig-actions [data-action="space-dress"]').click();
    await page.locator('[data-action="space-dress-tab"][data-tab="avatar"]').click();
    const avatarPhoto = await page.locator('[data-action="space-avatar"]').first().getAttribute("data-photo");
    await page.locator('[data-action="space-avatar"]').first().click();
    await page.waitForSelector(`.ig-head .c-avatar img[src*="LD-photo-${avatarPhoto}"]`);
    await page.locator('.ig-actions [data-action="community-profile-edit"]').click();
    await page.locator("#profile-name").fill("小日子收藏家");
    await page.locator("#profile-bio").fill("记录早餐、散步和慢慢变好的自己");
    await page.locator('[data-action="community-profile-save"]').click();
    assert.match(await page.locator(".space.ig").innerText(), /小日子收藏家[\s\S]*慢慢变好/);
    // Saved items by type (the cover saved earlier).
    await page.locator('[data-action="community-saved-type"][data-type="cover"]').click();
    assert.match(await page.locator("#p-saved").innerText(), /Kyoto/);
    await page.locator('[data-action="community-saved-type"][data-type="recipe"]').click();
    assert.match(await page.locator("#p-saved").innerText(), /还没有收藏/);
    // Following list with unfollow; blocked list with unblock.
    assert.match(await page.locator("#p-following").innerText(), /River/);
    await page.locator('#p-following [data-action="community-follow"][data-user="u-river"]').click();
    assert.doesNotMatch(await page.locator("#p-following").innerText(), /River/);
    await page.locator('[data-action="community-unblock"][data-user="u-june"]').click();
    // Settings persist.
    await page.locator('[data-profile-setting="defaultCommentsOpen"]').uncheck();
    await page.locator('[data-profile-setting="friendRequests"]').selectOption("following");
    demo = await page.evaluate(() => JSON.parse(localStorage.getItem("little-days.demo-social")));
    assert.deepEqual([demo.profile.name, demo.profile.avatarPhoto, demo.profile.defaultCommentsOpen, demo.profile.friendRequests], ["小日子收藏家", `photo:${avatarPhoto}`, false, "following"]);
    assert.ok(!demo.blocked.includes("u-june") && !demo.following.includes("u-river"));
    // New posts follow the default; my name appears on my post.
    await page.locator('[data-action="community-publish-start"]').click();
    assert.equal(await page.locator('[data-publish="commentsOpen"]').count(), 0, "comments option appears after choosing a day");
    await page.locator('[data-publish="date"]').selectOption(today);
    assert.equal(await page.locator('[data-publish="commentsOpen"]').isChecked(), false);
    await page.locator("[data-publish-page]").first().check();
    await page.locator('[data-publish="confirmed"]').check();
    await page.locator('[data-action="community-publish-submit"]').click();
    await page.waitForSelector(".work-detail");
    assert.match(await page.locator(".work-author").innerText(), /小日子收藏家/);
    assert.match(await page.locator(".c-comments").innerText(), /关闭了评论/);
    await page.locator('[data-action="community-back"]').click();
    await openMe();
    assert.equal(await page.locator(".p-work").count(), 1);
    assert.equal(await page.locator('.p-stat b').first().innerText(), "1");
    // Stats jump to the friends list.
    await page.locator('[data-action="community-jump"][data-target="friends"]').click();
    await page.waitForSelector(".friend-list");
    passed.push("community in bottom menu; profile edit, stats, saved by type, following/blocked, settings, my posts");

    // English labels and narrow widths.
    await nav("home");
    await page.locator('[data-page="settings"]').click();
    await page.locator('[data-language="en"]').click();
    await nav("community");
    // Sub-pages (an open chat) show the compact one-line label.
    assert.match(await page.locator(".demo-banner, .demo-chip").first().innerText(), /Demo/);
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const tab of ["discover", "friends", "messages"]) {
        await page.locator(`[data-action="community-tab"][data-tab="${tab}"]`).click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${tab} ${width}`);
      }
      await page.locator('[data-action="open-profile"]').click();
      await page.waitForSelector(".ig-head");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `profile ${width}`);
      await nav("community");
    }
    assert.deepEqual(errors, []);
    console.log(`V3.3 E2E passed (${passed.length} groups):\n - ${passed.join("\n - ")}\nNo page errors.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
