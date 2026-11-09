// V6.0: recommended background music — original pieces only, catalog,
// the day's music, and the shared player (one piece at a time).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { musicTracks, findTrack, trackName, trackMood, clock, dayMusic, musicChipHTML, createMusicPlayer, MUSIC_DIR } from "../Public/js/music.mjs";

const resources = new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("library.json", resources), "utf8"));
const i18n = JSON.parse(readFileSync(new URL("i18n.json", resources), "utf8"));

test("five original pieces, each with its file, notice and both languages", () => {
  const tracks = musicTracks(catalog);
  assert.equal(tracks.length, 5);
  assert.equal(new Set(tracks.map((t) => t.id)).size, 5);
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
