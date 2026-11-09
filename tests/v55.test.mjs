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
