import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as C from "../Public/js/community.mjs";
import { createInitialState, saveEntry } from "../Public/js/model.mjs";
import { createMoment, photoLayer } from "../Public/js/day.mjs";

const seed = JSON.parse(
  readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json", import.meta.url)),
);
const NOW = Date.parse("2026-11-07T12:00:00Z");

test("demo state is local, labelled and separate from journal data", () => {
  const memory = { value: null, getItem: () => memory.value, setItem: (k, v) => (memory.value = v) };
  const state = C.loadDemo(memory);
  assert.equal(C.DEMO_KEY, "little-days.demo-social");
  assert.ok(state.users.every((u) => /虚拟|demo/i.test(u.name)), "virtual users are named as such");
  C.toggleLike(state, "w1");
  C.saveDemo(memory, state);
  assert.equal(C.loadDemo(memory).works.find((w) => w.id === "w1").likedByMe, true);
});

test("popular ranks by likes, comments and saves within this week or month", () => {
  const state = C.createDemoState(NOW);
  const week = C.popular(state, "week", NOW);
  assert.ok(week.every((w) => NOW - Date.parse(w.createdAt) <= 7 * 864e5));
  const month = C.popular(state, "month", NOW);
  assert.ok(month.length > week.length);
  assert.ok(!month.some((w) => w.id === "w12"), "40 days old is not this month");
  assert.deepEqual(C.categories(state).includes("Pet"), true);
  assert.equal(C.search(state, "kyoto").works[0].id, "w2");
  assert.equal(C.search(state, "猫").users[0].id, "u-mumu");
});

test("likes, saves (not copies), comments with replies, report hides work", () => {
  const state = C.createDemoState(NOW);
  const before = state.works.find((w) => w.id === "w5").likes;
  C.toggleLike(state, "w5");
  C.toggleLike(state, "w5");
  assert.equal(state.works.find((w) => w.id === "w5").likes, before);
  C.saveAs(state, "w5", "recipe");
  assert.equal(state.works.find((w) => w.id === "w5").savedAs, "recipe");
  assert.throws(() => C.saveAs(state, "w5", "copy"));
  const comment = C.addComment(state, "w5", "看起来好好吃");
  C.addComment(state, "w5", "谢谢！", comment.id);
  assert.equal(state.works.find((w) => w.id === "w5").comments.at(-1).replies.length, 1);
  assert.throws(() => C.setCommentsOpen(state, "w5", false), /notOwner/);
  C.report(state, "work", "w3", "spam");
  assert.ok(!C.discover(state).some((w) => w.id === "w3"));
});

test("publishing needs explicit pages, media and confirmation; Money and private notes are never offered", () => {
  const journal = createInitialState(seed, "2026-11-07");
  journal.books.push({ id: "money", title: "Money Journal", category: "Money", color: "butter", cover: "💰" });
  const entry = structuredClone(journal.entries.find((e) => e.date === "2026-11-07"));
  entry.moments = [
    createMoment(entry, { title: "Coffee", body: "latte", layers: [photoLayer("media:00000000-0000-4000-8000-000000000001", "c")] }),
    createMoment(entry, { title: "Budget", body: "spent 120", bookId: "money" }),
  ];
  saveEntry(journal, entry);
  journal.checks.push({ habitId: "move", date: "2026-11-07", minutes: 0, note: "private note", shareNote: false });
  const candidates = C.publishCandidates(journal, "2026-11-07");
  assert.equal(candidates.pages.find((p) => p.title === "Budget").private, true);
  assert.equal(candidates.notes.length, 0, "notes stay private unless explicitly shareable");
  const state = C.createDemoState(NOW);
  assert.throws(() => C.publishDay(state, journal, "2026-11-07", { pages: ["day"] }), /confirmRequired/);
  const coffee = candidates.pages.find((p) => p.title === "Coffee");
  const budget = candidates.pages.find((p) => p.title === "Budget");
  const work = C.publishDay(state, journal, "2026-11-07", {
    confirmed: true,
    pages: [coffee.id, budget.id],
    media: [],
    title: "我的咖啡",
  });
  assert.deepEqual(work.pages.map((p) => p.title), ["Coffee"], "Money page dropped");
  assert.equal(work.media.length, 0, "no media unless ticked");
  C.setCommentsOpen(state, work.id, false);
  assert.throws(() => C.addComment(state, work.id, "hi"), /commentsClosed/);
  C.unpublish(state, work.id);
  assert.ok(!state.works.some((w) => w.id === work.id));
  // The journal itself is unchanged and private.
  assert.ok(journal.entries.every((e) => e.visibility === "private"));
});

test("follow is one-way; friends need acceptance; friends do not open private journals; blocking cuts everything", () => {
  const state = C.createDemoState(NOW);
  C.toggleFollow(state, "u-river");
  assert.ok(state.following.includes("u-river"));
  assert.ok(!state.friends.includes("u-river"), "following is not friendship");
  C.requestFriend(state, "u-river");
  assert.ok(state.requests.outgoing.includes("u-river"));
  assert.equal(C.canMessage(state, "u-river"), false);
  C.acceptFriend(state, "u-river");
  assert.ok(C.canMessage(state, "u-river"));
  C.acceptFriend(state, "u-mumu");
  assert.equal(state.requests.incoming.length, 0);
  C.block(state, "u-river");
  assert.ok(!state.friends.includes("u-river") && !state.following.includes("u-river"));
  assert.throws(() => C.requestFriend(state, "u-river"), /blocked/);
  assert.ok(!C.discover(state).some((w) => w.authorId === "u-river"));
  C.unblock(state, "u-river");
  assert.ok(C.discover(state).some((w) => w.authorId === "u-river"));
});

test("messages: friends only, unread counts, simulated replies, delete own message or the conversation", () => {
  const state = C.createDemoState(NOW);
  assert.equal(C.unreadCount(state), 1);
  C.markRead(state, "u-xiaoman");
  assert.equal(C.unreadCount(state), 0);
  assert.throws(() => C.sendMessage(state, "u-june", { text: "hi" }), /friendsOnly/);
  const mine = C.sendMessage(state, "u-xiaoman", { text: "你好呀", sticker: "tulip" });
  C.sendMessage(state, "u-xiaoman", { workId: "w1" });
  const reply = C.simulateReply(state, "u-xiaoman", "（模拟回复）好呀");
  assert.ok(reply.simulated);
  assert.equal(C.unreadCount(state), 1);
  assert.throws(() => C.deleteMessage(state, "u-xiaoman", reply.id), /notOwner/);
  C.deleteMessage(state, "u-xiaoman", mine.id);
  assert.ok(!C.conversationWith(state, "u-xiaoman").messages.some((m) => m.id === mine.id));
  C.deleteConversation(state, "u-xiaoman");
  assert.equal(state.conversations.length, 0);
});

test("my profile: edit name/bio/avatar, stats, saved items by type, request filter", () => {
  const state = C.createDemoState(NOW);
  assert.throws(() => C.updateProfile(state, { avatar: "<img>" }), /avatar/);
  C.updateProfile(state, { name: "  小日子  ", bio: "慢慢记录", avatar: "🐰" });
  assert.deepEqual([state.profile.name, state.profile.bio, state.profile.avatar], ["小日子", "慢慢记录", "🐰"]);
  C.saveAs(state, "w5", "recipe");
  C.saveAs(state, "w8", "cover");
  assert.deepEqual(C.savedWorks(state, "recipe").map((w) => w.id), ["w5"]);
  assert.equal(C.savedWorks(state).length, 2);
  const stats = C.myStats(state);
  assert.equal(stats.saved, 2);
  assert.equal(stats.friends, 1);
  assert.equal(stats.works, 0);
  assert.deepEqual(C.visibleIncoming(state), ["u-mumu"]);
  C.updateProfile(state, { friendRequests: "following" });
  assert.deepEqual(C.visibleIncoming(state), [], "requests from people I don't follow wait quietly");
  assert.ok(state.requests.incoming.includes("u-mumu"), "never auto-accepted or dropped");
  assert.throws(() => C.updateProfile(state, { friendRequests: "nobody" }));
  // Old demo saves without a profile still load.
  const memory = { value: JSON.stringify({ ...C.createDemoState(NOW), profile: undefined }), getItem: () => memory.value, setItem: (k, v) => (memory.value = v) };
  assert.equal(C.loadDemo(memory).profile.avatar, "🌷");
});
