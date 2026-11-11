// V10.16 · The personal mark: five monograms + the sprout; old emoji avatars
// are kept and shown; the stored field and its old values are unchanged.
import test from "node:test";
import assert from "node:assert/strict";
import * as PM from "../Public/js/profile-mark.mjs";
import * as A from "../Public/js/account.mjs";

const memory = () => {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
};

test("what each stored value shows (no migration: old records read the same)", () => {
  assert.deepEqual(PM.markOf("🌷", "Jess"), { kind: "sprout" }, "nothing chosen → the sprout, with or without a name");
  assert.deepEqual(PM.markOf(undefined, ""), { kind: "sprout" });
  assert.deepEqual(PM.markOf("mark:sprout", "Jess"), { kind: "sprout" });
  assert.deepEqual(PM.markOf("mono:seal", "jess"), { kind: "mono", style: "seal", letter: "J", sample: false });
  assert.deepEqual(PM.markOf("mono:paper", "小满"), { kind: "mono", style: "paper", letter: "小", sample: false });
  assert.deepEqual(PM.markOf("mono:kraft", ""), { kind: "mono", style: "kraft", letter: "名", sample: true }, "no name: a faint sample letter");
  assert.deepEqual(PM.markOf("mono:kraft", "", { language: "en" }).letter, "A");
  for (const emoji of PM.LEGACY) assert.deepEqual(PM.markOf(emoji, "Jess"), { kind: "emoji", value: emoji }, "an old emoji avatar is shown as it is");
  assert.deepEqual(PM.markOf("mark:daisy", "x"), { kind: "sprout" }, "an unknown future mark falls back to the sprout");
});

test("the first letter: upper-case where letters have a case; whole characters otherwise", () => {
  assert.deepEqual(["jess", "émile", "小满", " ann", "", "😀abc"].map(PM.initialOf), ["J", "É", "小", "A", "", "😀"]);
});

test("five monograms and the sprout can be picked; no emoji is offered; the markup is the same everywhere", () => {
  assert.deepEqual(PM.MONOGRAMS, ["mono:paper", "mono:seal", "mono:kraft", "mono:sage", "mono:script"]);
  assert.deepEqual(PM.PICKABLE, [...PM.MONOGRAMS, "mark:sprout"]);
  assert.ok(PM.PICKABLE.every((v) => !/\p{Extended_Pictographic}/u.test(v)));
  const html = PM.markHTML(PM.markOf("mono:seal", "<b>"), { size: 64, label: "我的标记" });
  assert.match(html, /class="pmark pm-seal"/);
  assert.match(html, /--pm:64px/);
  assert.match(html, /&lt;/, "escaped");
  assert.match(html, /role="img" aria-label="我的标记"/);
  assert.match(PM.markHTML(PM.markOf("mono:paper", "小满")), /pm-wide/);
  assert.match(PM.markHTML({ kind: "sprout" }), /pm-sprout-chip[\s\S]*<svg/);
});

test("the account keeps one avatar string: marks are accepted, old emoji too, anything else keeps what was there", () => {
  const s = memory();
  assert.equal(A.signIn(s, { name: "Jess", avatar: "🐱" }).avatar, "🐱", "an old emoji record still saves");
  assert.equal(A.signIn(s, { avatar: "mono:sage" }).avatar, "mono:sage");
  assert.equal(A.signIn(s, { avatar: "mark:sprout" }).avatar, "mark:sprout");
  assert.equal(A.signIn(s, { avatar: "mono:neon" }).avatar, "mark:sprout", "an unknown style is ignored");
  assert.equal(A.signIn(s, { avatar: "💣" }).avatar, "mark:sprout");
  assert.equal(A.loadAccount(s).name, "Jess", "the name is kept");
  assert.throws(() => A.signIn({ getItem: () => null, setItem() { throw new Error("full"); } }, { name: "x" }), /full/, "a failed save is reported (the editor keeps the sheet open)");
});
