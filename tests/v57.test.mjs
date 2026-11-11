// V6.0: recommended background music — original pieces only, catalog,
// the day's music, and the shared player (one piece at a time).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { musicTracks, findTrack, trackName, trackMood, clock, dayMusic, bookMusic, pageMusic, musicChipHTML, createMusicPlayer, loadVolume, saveVolume, MUSIC_DIR, MUSIC_VOLUME } from "../Public/js/music.mjs";

const resources = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("library.json", resources), "utf8"));
const i18n = JSON.parse(readFileSync(new URL("i18n.json", resources), "utf8"));

test("eight original pieces, each with its file, notice and both languages", () => {
  const tracks = musicTracks(catalog);
  assert.equal(tracks.length, 8);
  assert.equal(new Set(tracks.map((t) => t.id)).size, 8);
  assert.deepEqual(tracks.slice(5).map((t) => t.moodZh), ["钢琴", "欢快", "咖啡馆"], "piano, cheerful and café styles");
  for (const track of tracks) {
    const file = new URL(`Music/${track.file}`, resources);
    assert.ok(existsSync(file), track.file);
    assert.ok(statSync(file).size > 100_000 && statSync(file).size < 1_500_000, `${track.file} size`);
    assert.equal(track.license, "LittleDays-Original-Music.txt");
    assert.match(track.source, /^original/);
    assert.ok(track.nameZh && track.nameEn && track.moodZh && track.moodEn);
    assert.ok(track.seconds > 30 && track.seconds < 70, `${track.id} loops in under a minute`);
  }
  assert.match(readFileSync(new URL("Music/LittleDays-Original-Music.txt", resources), "utf8"), /Original music[\s\S]*no samples/);
  for (const key of Object.keys(i18n).filter((k) => k.startsWith("music."))) assert.ok(i18n[key].zh && i18n[key].en, key);
});

test("names, moods and times; unknown ids are ignored", () => {
  const coffee = findTrack(catalog, "afternoon-coffee");
  assert.equal(trackName(coffee, "zh"), "午后咖啡");
  assert.equal(trackName(coffee, "en"), "Afternoon coffee");
  assert.equal(trackMood(coffee, "en"), "Easy");
  assert.equal(clock(49.3), "0:49");
  assert.equal(clock(125), "2:05");
  assert.equal(findTrack(catalog, "spotify:song"), null);
  assert.equal(findTrack(catalog, ""), null);
  assert.equal(findTrack({}, "seaside"), null);
});

test("the day's music: the cover's, else the first page that has one", () => {
  assert.equal(dayMusic(null), "");
  assert.equal(dayMusic({ moments: [{ id: "a" }, { id: "b", music: "seaside" }, { id: "c", music: "good-night" }] }), "seaside");
  assert.equal(dayMusic({ music: "rainy-window", moments: [{ music: "seaside" }] }), "rainy-window");
});

test("the chip names the piece and escapes it", () => {
  const html = musicChipHTML({ id: "x", nameZh: '<b>"雨"</b>', nameEn: "Rain" }, { language: "zh", t: (k, v) => `${k}:${v.name}` });
  assert.match(html, /data-action="music-toggle" data-music="x"/);
  assert.doesNotMatch(html, /<b>/);
  assert.equal(musicChipHTML(null, {}), "");
});

test("one shared player: plays from a blob, switches pieces, stops", async () => {
  class FakeAudio {
    constructor() {
      this.paused = true;
      this.dataset = {};
      this.attrs = {};
      this.events = {};
    }
    addEventListener(type, fn) {
      this.events[type] = fn;
    }
    set src(v) {
      this.attrs.src = v;
    }
    getAttribute(name) {
      return this.attrs[name] ?? null;
    }
    removeAttribute(name) {
      delete this.attrs[name];
    }
    async play() {
      this.paused = false;
      this.events.play?.();
    }
    pause() {
      this.paused = true;
      this.events.pause?.();
    }
  }
  const appended = [];
  const doc = { createElement: () => new FakeAudio(), body: { append: (el) => appended.push(el) } };
  const fetched = [];
  const fetcher = async (url) => (fetched.push(url), { ok: true, blob: async () => new Blob(["x"]) });
  const player = createMusicPlayer({ doc, fetcher });
  let changes = 0;
  player.onChange(() => changes++);
  const [coffee, sea] = [findTrack(catalog, "afternoon-coffee"), findTrack(catalog, "seaside")];
  assert.equal(await player.play(coffee), true);
  assert.equal(appended.length, 1);
  assert.equal(appended[0].loop, true);
  assert.equal(player.current(), "afternoon-coffee");
  assert.equal(player.playing(), true);
  assert.match(appended[0].getAttribute("src"), /^blob:/);
  assert.deepEqual(fetched, [MUSIC_DIR + coffee.file]);
  await player.play(sea);
  await player.play(coffee);
  assert.equal(fetched.length, 2, "each file is fetched once");
  assert.equal(appended.length, 1, "one player");
  player.pause();
  assert.equal(player.playing(), false);
  player.stop();
  assert.equal(player.current(), "");
  assert.equal(appended[0].getAttribute("src"), null);
  assert.ok(changes >= 4);
});

test("a book's music: used when the day or page has none of its own", () => {
  const books = [{ id: "us", music: "sunny-day" }, { id: "daily" }];
  assert.equal(bookMusic(books, "us"), "sunny-day");
  assert.equal(bookMusic(books, "daily"), "");
  assert.equal(dayMusic({ bookId: "us", moments: [] }, books), "sunny-day");
  assert.equal(dayMusic({ bookId: "us", moments: [{ music: "seaside" }] }, books), "seaside", "the page's own first");
  assert.equal(pageMusic({ bookId: "us" }, books), "sunny-day");
  assert.equal(pageMusic({}, books, "us"), "sunny-day", "a page without a book uses the day's book");
  assert.equal(pageMusic({ music: "cafe-corner", bookId: "us" }, books), "cafe-corner");
});

test("the music volume is remembered on this device and kept in range", () => {
  const data = new Map();
  const storage = { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)) };
  assert.equal(loadVolume(storage), MUSIC_VOLUME);
  assert.equal(saveVolume(0.35, storage), 0.35);
  assert.equal(loadVolume(storage), 0.35);
  assert.equal(saveVolume(4, storage), 1);
  assert.equal(saveVolume(-1, storage), 0);
  assert.equal(loadVolume({ getItem: () => { throw new Error("blocked"); } }), MUSIC_VOLUME);
  const el = { dataset: {}, addEventListener() {}, getAttribute: () => null };
  const player = createMusicPlayer({ doc: { createElement: () => el, body: { append() {} } }, fetcher: async () => ({ ok: false }), volume: 0.4 });
  assert.equal(player.volume(), 0.4);
  player.setVolume(0.9);
  assert.equal(player.volume(), 0.9);
});
