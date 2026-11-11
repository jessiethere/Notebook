// Local sign-in, welcome tour state and photo-edit maths.
import test from "node:test";
import assert from "node:assert/strict";
import * as A from "../Public/js/account.mjs";
import * as PE from "../Public/js/photo-edit.mjs";

const memory = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), data };
};

test("local sign-in: create, tour once, sign out keeps the record", () => {
  const storage = memory();
  assert.equal(A.loadAccount(storage), null);
  const account = A.signIn(storage, { name: "  小满  ", avatar: "🐰" });
  assert.deepEqual([account.name, account.avatar, account.method, account.signedIn, account.onboarded], ["小满", "🐰", "local", true, false]);
  A.finishTour(storage);
  assert.equal(A.loadAccount(storage).onboarded, true);
  const out = A.signOut(storage);
  assert.equal(out.signedIn, false);
  assert.equal(out.name, "小满", "signing out keeps the local profile");
  const back = A.signIn(storage, {});
  assert.deepEqual([back.name, back.avatar, back.onboarded, back.createdAt], ["小满", "🐰", true, account.createdAt]);
  A.replayTour(storage);
  assert.equal(A.loadAccount(storage).onboarded, false);
  assert.equal(A.signIn(storage, { avatar: "💣" }).avatar, "🐰", "unknown avatars are ignored");
  storage.setItem(A.ACCOUNT_KEY, "{broken");
  assert.equal(A.loadAccount(storage), null, "a broken record never throws");
  assert.ok(A.TOUR.length >= 5);
});

test("photo edit: normalize, identity and CSS filter", () => {
  assert.ok(PE.isIdentity(PE.defaultEdit()));
  assert.ok(PE.isIdentity({}));
  assert.equal(PE.cssFilter({}), "none");
  assert.ok(!PE.isIdentity({ filter: "warm" }));
  assert.ok(!PE.isIdentity({ text: { value: "Hi" } }));
  assert.ok(PE.isIdentity({ text: { value: "   " } }), "blank title is no edit");
  const e = PE.normalizeEdit({ filter: "nope", brightness: 999, zoom: 9, rotate: 45, ratio: "2:1", text: { value: "x", color: "red", size: 99 } });
  assert.deepEqual([e.filter, e.brightness, e.zoom, e.rotate, e.ratio, e.text.color, e.text.size], ["original", 50, 3, 0, "original", "#FFFFFF", 18]);
  assert.equal(PE.cssFilter({ filter: "mono" }), "grayscale(1) contrast(1.1)");
  assert.match(PE.cssFilter({ brightness: 20, warmth: -10 }), /^brightness\(1\.2\) hue-rotate\(4deg\) saturate\(/);
});

test("photo edit: colour matrix matches the filter maths", () => {
  const px = (edit, rgb) => [...PE.applyMatrix(new Uint8ClampedArray([...rgb, 255]), PE.colorMatrix(edit))].slice(0, 3);
  assert.deepEqual(px({}, [10, 120, 250]), [10, 120, 250], "identity");
  assert.deepEqual(px({ brightness: 50 }, [100, 100, 100]), [150, 150, 150]);
  const [r, g, b] = px({ filter: "mono" }, [200, 40, 90]);
  assert.ok(r === g && g === b, "mono is grey");
  const [wr, , wb] = px({ warmth: 50 }, [128, 128, 128]);
  assert.ok(wr > wb, "warmth pushes towards orange");
  assert.deepEqual(px({ contrast: 50 }, [128, 128, 128]), [128, 128, 128], "contrast pivots on mid-grey");
  assert.deepEqual(px({ contrast: 50 }, [255, 0, 0]), [255, 0, 0], "values stay in range");
});

test("photo edit: crop rectangles for ratios, zoom and centre", () => {
  assert.deepEqual(PE.cropRect(400, 300, {}), { sx: 0, sy: 0, sw: 400, sh: 300, ratio: 400 / 300 });
  const square = PE.cropRect(400, 300, { ratio: "1:1" });
  assert.deepEqual([square.sx, square.sy, square.sw, square.sh], [50, 0, 300, 300]);
  const left = PE.cropRect(400, 300, { ratio: "1:1", x: 0 });
  assert.equal(left.sx, 0, "centre is clamped to the picture");
  const zoom = PE.cropRect(400, 300, { zoom: 2 });
  assert.deepEqual([zoom.sx, zoom.sy, zoom.sw, zoom.sh], [100, 75, 200, 150]);
  const tall = PE.cropRect(400, 300, { ratio: "9:16" });
  assert.ok(Math.abs(tall.ratio - 9 / 16) < 1e-9 && tall.sh === 300);
  assert.deepEqual(PE.rotatedSize(400, 300, 90), { width: 300, height: 400 });
});
