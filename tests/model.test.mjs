import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  Store,
  createInitialState,
  addDays,
  weekStart,
  weeklyCount,
  toggleCheck,
  saveEntry,
} from "../Public/js/model.mjs";

const seed = JSON.parse(
  readFileSync(
    new URL(
      "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/seed.json",
      import.meta.url,
    ),
  ),
);
const today = "2026-11-07";

test("generated Web fallback colors match the shared Swift resource", () => {
  const tokens = JSON.parse(
    readFileSync(
      new URL(
        "../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/design-tokens.json",
        import.meta.url,
      ),
    ),
  );
  const css = readFileSync(
    new URL("../Public/tokens.css", import.meta.url),
    "utf8",
  );
  for (const [key, value] of Object.entries(tokens.colors))
    assert.ok(css.toLowerCase().includes(`--${key}: ${value};`.toLowerCase()));
});

test("local calendar arithmetic crosses month/year and uses Monday weeks", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2024-03-01", -1), "2024-02-29");
  assert.equal(weekStart("2026-11-08"), "2026-11-02");
});
test("checks are unique per habit/date, carry minutes, and filter the correct week", () => {
  const state = createInitialState(seed, today);
  toggleCheck(state, "reading", today, 25);
  toggleCheck(state, "reading", "2026-11-01", 10);
  assert.equal(weeklyCount(state, "reading", today), 1);
  assert.equal(state.checks[0].minutes, 25);
  toggleCheck(state, "reading", today);
  assert.equal(weeklyCount(state, "reading", today), 0);
});
test("journal replaces the same day, consumes its draft, and keeps growth linked", () => {
  const state = createInitialState(seed, today);
  state.drafts[today] = { title: "草稿" };
  toggleCheck(state, "move", today);
  saveEntry(state, { ...state.entries[0], title: "真正的小日子" });
  assert.equal(state.entries.filter((e) => e.date === today).length, 1);
  assert.equal(state.entries[0].isDemo, false);
  assert.equal(state.drafts[today], undefined);
  assert.equal(state.checks[0].date, state.entries[0].date);
});
test("storage failure cannot commit in-memory state or report a persisted update", () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  };
  const store = new Store(storage, seed, today);
  assert.throws(
    () => store.update((s) => toggleCheck(s, "move", today)),
    /quota/,
  );
  assert.equal(store.state.checks.length, 0);
});
test("saved records survive reload; incompatible storage is never silently cleared", () => {
  let raw = null;
  const storage = {
    getItem: () => raw,
    setItem: (k, v) => {
      raw = v;
    },
  };
  const store = new Store(storage, seed, today);
  store.update((s) => toggleCheck(s, "move", today));
  assert.equal(new Store(storage, seed, today).state.checks.length, 1);
  raw = '{"schemaVersion":999}';
  assert.throws(() => new Store(storage, seed, today));
  assert.equal(raw, '{"schemaVersion":999}');
});

test("V3 normalizes old books privately without dropping content, IDs or unknown legacy fields", () => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        schemaVersion: 1,
        books: [
          {
            id: "legacy",
            title: "我的旧记录",
            category: "Any theme",
            color: "blue",
            cover: "🌷",
            oldFlag: 7,
          },
        ],
        entries: [
          {
            id: "day",
            date: "2026-11-07",
            title: "保留标题",
            body: "保留正文",
            photo: "data:image/jpeg;base64,AQID",
            layers: [
              {
                id: "old-emoji",
                kind: "sticker",
                text: "🌷",
                x: 20,
                y: 30,
                scale: 1,
                rotation: 0,
              },
            ],
          },
        ],
        habits: [],
        checks: [],
        drafts: {},
      }),
    setItem: () => {
      throw new Error("must not write during initialization");
    },
  };
  const store = new Store(storage, seed, today);
  assert.equal(store.state.books[0].visibility, "private");
  assert.equal(store.state.books[0].oldFlag, 7);
  assert.equal(store.state.entries[0].body, "保留正文");
  assert.equal(store.state.entries[0].layers[0].text, "🌷");
  assert.deepEqual(store.state.entries[0].media, []);
});
test("a stale tab cannot silently overwrite another tab’s newer records", () => {
  let raw = null;
  const storage = {
    getItem: () => raw,
    setItem: (key, value) => (raw = value),
  };
  const first = new Store(storage, seed, today),
    stale = new Store(storage, seed, today);
  first.update((s) => toggleCheck(s, "move", today));
  const saved = raw;
  assert.throws(
    () => stale.update((s) => s.books.push({ id: "new" })),
    (error) => error.code === "stale-state",
  );
  assert.equal(raw, saved);
});

test("a corrupt or prototype-bearing snapshot is rejected without clearing stored bytes", () => {
  const raw = JSON.stringify({
    schemaVersion: 1,
    books: [],
    entries: [null],
    habits: [],
    checks: [],
    drafts: {},
  });
  let writes = 0;
  assert.throws(
    () =>
      new Store({ getItem: () => raw, setItem: () => writes++ }, seed, today),
  );
  assert.equal(writes, 0);
  const polluted =
    '{"schemaVersion":1,"books":[],"entries":[],"habits":[],"checks":[],"drafts":{},"__proto__":{"admin":true}}';
  assert.throws(
    () =>
      new Store(
        { getItem: () => polluted, setItem: () => writes++ },
        seed,
        today,
      ),
  );
  assert.equal(writes, 0);
});
