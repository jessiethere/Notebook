// V5.7: a gentle streak (one rest day a week), from the journal itself.
import test from "node:test";
import assert from "node:assert/strict";
import { recordedDays, streakInfo, bestStreak, MILESTONES } from "../Public/js/streak.mjs";

const days = (...list) => new Set(list);

test("days in a row; today counts once written, yesterday keeps it alive", () => {
  assert.equal(streakInfo(days("2026-11-09", "2026-11-08", "2026-11-07"), "2026-11-09").streak, 3);
  const notYet = streakInfo(days("2026-11-08", "2026-11-07"), "2026-11-09");
  assert.equal(notYet.streak, 2);
  assert.equal(notYet.today, false);
  assert.equal(streakInfo(days(), "2026-11-09").streak, 0);
});

test("one missed day a week is a rest day; two in a row end it", () => {
  const rested = streakInfo(days("2026-11-09", "2026-11-07", "2026-11-06"), "2026-11-09");
  assert.equal(rested.streak, 3);
  assert.equal(rested.restsUsed, 1);
  assert.equal(streakInfo(days("2026-11-09", "2026-11-07", "2026-11-05", "2026-11-04"), "2026-11-09").streak, 2, "only one rest within a week");
  assert.equal(streakInfo(days("2026-11-09", "2026-11-06"), "2026-11-09").streak, 1);
});

test("this week's dots, milestones and the best run", () => {
  const s = streakInfo(days("2026-11-09", "2026-11-10"), "2026-11-10");
  assert.deepEqual(s.week, [true, true, false, false, false, false, false], "Monday first");
  assert.equal(s.weekCount, 2);
  assert.equal(streakInfo(days("2026-11-07", "2026-11-08", "2026-11-09"), "2026-11-09").milestone, 3);
  assert.equal(streakInfo(days("2026-11-08", "2026-11-09"), "2026-11-09").next, 3);
  assert.deepEqual(MILESTONES.slice(0, 3), [3, 7, 14]);
  assert.equal(bestStreak(days("2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-09")), 4);
});

test("only real pages count: samples and empty days do not", () => {
  const state = {
    entries: [
      { date: "2026-11-08", isDemo: true, title: "示例", moments: [] },
      { date: "2026-11-07", title: "", body: "", photo: "", layers: [], media: [], moments: [{ id: "m", title: "我的一页", body: "", layers: [], media: [] }] },
      { date: "2026-11-06", title: "", body: "", photo: "", layers: [], media: [], moments: [] },
    ],
    drafts: { "2026-11-09": { date: "2026-11-09", title: "草稿也算", body: "", layers: [], media: [], moments: [] } },
  };
  assert.deepEqual([...recordedDays(state)].sort(), ["2026-11-07", "2026-11-09"]);
});

test("a sample cover that was saved as my own is cleared; my pages stay", async () => {
  const { normalizeState } = await import("../Public/js/model.mjs");
  const state = normalizeState({
    schemaVersion: 1,
    habits: [],
    books: [],
    checks: [],
    drafts: {},
    entries: [
      { id: "sample-today", date: "2026-11-09", isDemo: false, title: "把日子过成喜欢的样子", body: "一杯热咖啡，一点慢下来的时间。\n今天，也收集到了生活的小小美好。", photo: "/assets/coffee.jpg", layers: [], media: [], moments: [{ id: "m", title: "奔跑", body: "", layers: [], media: [] }] },
      { id: "sample-today", date: "2026-11-08", isDemo: false, title: "我改过的标题", body: "", photo: "/assets/coffee.jpg", layers: [], media: [], moments: [] },
    ],
  });
  const [cleared, mine] = state.entries;
  assert.deepEqual([cleared.title, cleared.body, cleared.photo], ["", "", ""]);
  assert.equal(cleared.moments[0].title, "奔跑");
  assert.equal(mine.title, "我改过的标题", "a changed cover is mine and stays");
});
