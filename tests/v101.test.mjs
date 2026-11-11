// V10.1: alignment chosen for a page's title / words is an optional style
// field; old pages (no align) render exactly as before.
import test from "node:test";
import assert from "node:assert/strict";
import { alignCSS, styleExtra, textCSS } from "../Public/js/canvas.mjs";

test("alignment: only left / center / right are written; nothing for old pages", () => {
  assert.equal(alignCSS({ align: "center" }), ";text-align:center");
  assert.equal(alignCSS({ align: "right" }), ";text-align:right");
  assert.equal(alignCSS({}), "");
  assert.equal(alignCSS(undefined), "");
  assert.equal(alignCSS({ align: "justify;color:red" }), "", "anything else is ignored");
});

test("title / words styles carry the alignment next to size and colour", () => {
  assert.equal(styleExtra({}), "", "an old page adds nothing");
  assert.match(styleExtra({ size: 24, color: "#B5838D", align: "left" }), /font-size:7\.5cqw;color:#B5838D;text-align:left$/);
  const catalog = { fonts: [] };
  assert.doesNotMatch(textCSS({ size: 20 }, "serif", 20, catalog), /text-align/);
  assert.match(textCSS({ size: 20, align: "right" }, "serif", 20, catalog), /;text-align:right$/);
});
