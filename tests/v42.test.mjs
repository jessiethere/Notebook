// Experience/levels from the local journal, and the notification inbox.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { experience, LEVELS } from "../Public/js/levels.mjs";
import * as C from "../Public/js/community.mjs";
import { createInitialState } from "../Public/js/model.mjs";

const seed = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json", import.meta.url)));

test("samples give no XP; writing, check-ins and notes do", () => {
  const state = createInitialState(seed, "2026-11-09");
  let xp = experience(state, null, "2026-11-09");
  assert.equal(xp.total, 0, "sample pages don't count");
  assert.equal(xp.level.id, "seed");
  state.checks.push({ habitId: "move", date: "2026-11-09", minutes: 0, note: "走了一圈" });
  state.checks.push({ habitId: "reading", date: "2026-11-08", minutes: 20 });
  state.entries.push({ id: "e1", date: "2026-11-08", title: "周末", body: "", photo: "", layers: [{ kind: "photo", mediaRef: "media:x" }], moments: [{ id: "m", title: "早餐", body: "", layers: [] }] });
  xp = experience(state, { works: [{ authorId: "me" }, { authorId: "u-x" }] }, "2026-11-09");
  const by = Object.fromEntries(xp.breakdown.map((b) => [b.id, b.count]));
  assert.deepEqual(by, { activeDay: 2, page: 1, moment: 1, photo: 1, check: 2, note: 1, reflection: 0, post: 1 });
  assert.equal(xp.total, 2 * 10 + 5 + 3 + 1 + 2 * 2 + 3 + 15);
  assert.equal(xp.streak, 2, "yesterday + today");
  assert.equal(xp.level.id, "sprout");
  assert.ok(xp.progress > 0 && xp.progress < 1);
  assert.equal(xp.toNext, LEVELS[2].xp - xp.total);
});

test("photos are capped so writing matters most; top level has no next", () => {
  const state = createInitialState(seed, "2026-11-09");
  state.entries.push({ id: "e", date: "2026-11-01", title: "x", body: "", layers: Array.from({ length: 500 }, () => ({ kind: "photo", mediaRef: "media:p" })), moments: [] });
  assert.equal(experience(state).breakdown.find((b) => b.id === "photo").count, 300);
  for (let i = 0; i < 700; i++) state.checks.push({ habitId: "move", date: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`, minutes: 0, note: "n" });
  const top = experience(state);
  assert.equal(top.level.id, "meadow");
  assert.equal(top.next, null);
  assert.equal(top.progress, 1);
});

test("inbox: system notes, friend requests, unread messages, simulated reactions", () => {
  const memory = { value: null, getItem: () => memory.value, setItem: (k, v) => (memory.value = v) };
  const demo = C.loadDemo(memory);
  let items = C.inboxItems(demo);
  assert.deepEqual([...new Set(items.map((i) => i.type))].sort(), ["friend", "message", "system"]);
  const unread = C.inboxUnread(demo);
  assert.equal(unread, items.length, "everything is new at first");
  C.markInboxRead(demo);
  assert.equal(C.inboxUnread(demo), 2, "pending request + unread chat still count");
  C.acceptFriend(demo, "u-mumu");
  C.markRead(demo, "u-xiaoman");
  assert.equal(C.inboxUnread(demo), 0);
  // Level-up notes once per level.
  assert.equal(C.noteLevel(demo, 1, "sprout"), true);
  assert.equal(C.noteLevel(demo, 1, "sprout"), false);
  assert.equal(C.inboxUnread(demo), 1);
  // Publishing brings a (simulated) like and comment.
  const journal = createInitialState(seed, "2026-11-09");
  const candidates = C.publishCandidates(journal, "2026-11-09");
  C.publishDay(demo, journal, "2026-11-09", { confirmed: true, pages: [candidates.pages[0].id], media: [] });
  items = C.inboxItems(demo);
  assert.ok(items.some((i) => i.type === "like" && i.simulated));
  assert.ok(items.some((i) => i.type === "comment" && i.simulated));
  // Blocking hides that person's notes.
  const liker = items.find((i) => i.type === "like").userId;
  C.block(demo, liker);
  assert.ok(!C.inboxItems(demo).some((i) => i.userId === liker));
  // Old demo saves get an inbox.
  memory.value = JSON.stringify({ ...C.createDemoState(), inbox: undefined, levelSeen: undefined });
  assert.ok(C.loadDemo(memory).inbox.length >= 2);
});
