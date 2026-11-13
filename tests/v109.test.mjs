// V10.9 · What a line typed to Captain is about (js/keeper-chat.mjs):
// sociable lines are not feature requests; what the person says happened is
// respected (done / planned / not yet / feelings); unknown stays honest.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { understand } from "../Public/js/keeper-chat.mjs";
import * as K from "../Public/js/keeper.mjs";

const i18n = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/i18n.json", import.meta.url), "utf8"));
const intent = (text) => understand(text).intent;

test("the ten lines from the review get the meaning that was meant", () => {
  const cases = {
    "你好可爱呀": "compliment",
    "你的柠檬帽好好看": "hat",
    "我想摸摸你": "pet",
    "今天有点累，但是写完了一页": "doneTired",
    "今天很开心": "happy",
    "谢谢你陪我": "thanks",
    "你会做什么": "abilities",
    "帮我整理今天的故事": "organize",
    "Hello, you’re adorable!": "compliment",
    "I’m tired, but I finished a journal page.": "doneTired",
  };
  for (const [text, want] of Object.entries(cases)) assert.equal(intent(text), want, text);
});

test("sociable lines are never taken for requests", () => {
  for (const [text, want] of [["你好", "greet"], ["早安", "morning"], ["晚安", "night"], ["你真乖", "compliment"], ["好可爱", "compliment"], ["you are so cute", "compliment"], ["你在干嘛", "care"], ["你开心吗", "care"], ["How are you?", "care"], ["抱抱", "pet"], ["Can I pet you?", "pet"], ["想和你玩", "play"], ["谢谢", "thanks"], ["thank you", "thanks"], ["hi captain", "greet"]])
    assert.equal(intent(text), want, text);
});

test("what happened is respected: done, planned, not yet, feelings", () => {
  for (const [text, want] of [["写完了", "done"], ["记了两页", "done"], ["今天很累，但写完了一页", "doneTired"], ["今天好开心，还写了一页", "doneHappy"], ["今天还没写", "notYet"], ["今天不写了", "notYet"], ["I haven’t written anything today", "notYet"], ["累死了，什么都没写", "notYetTired"], ["等会儿再写", "planned"], ["I will write later", "planned"], ["今天有点难过", "sad"], ["今天不开心", "sad"], ["我好困", "tired"], ["今天有点累", "tired"]])
    assert.equal(intent(text), want, text);
  // "…写完了一页" is about the day, not a request to write.
  assert.notEqual(intent("帮我写完了一页"), "write");
  // Asking after Captain is not a report of my own mood.
  assert.equal(understand("你开心吗").mood, null);
});

test("requests still work; only “what can you do” lists the abilities", () => {
  for (const [text, want] of [["回顾以前的回忆", "memory"], ["这周写了什么", "week"], ["看看书架", "shelf"], ["帮我写一句话", "write"], ["你能帮我做什么", "abilities"], ["what can you do", "abilities"]])
    assert.equal(intent(text), want, text);
  // V10.18: everyday lines have their own replies now (tests/v118.test.mjs); empty stays unknown.
  for (const [text, want] of [["今天天气不错", "sunny"], ["我饿了", "hungry"], ["今天想吃蛋糕", "hungry"], ["", "unknown"], ["   ", "unknown"]]) assert.equal(intent(text), want, JSON.stringify(text));
  // The feature list lives only in the abilities line.
  const lists = Object.entries(i18n).filter(([key, v]) => key.startsWith("kc.chat.") && /翻一页以前的回忆|look back at an old page/.test(v.zh + v.en)).map(([key]) => key);
  assert.deepEqual(lists, ["kc.chat.abilities.0"]);
  for (const [key, v] of Object.entries(i18n).filter(([key]) => key.startsWith("kc.chat.unknown."))) assert.doesNotMatch(v.zh + v.en, /会的是|I can do|What I can/, key);
});

test("every reply intent has lines in both languages, short and without emoji", () => {
  const replies = ["greet", "morning", "night", "compliment", "hat", "hatOff", "pet", "play", "care", "thanks", "happy", "sad", "tired", "done", "doneTired", "doneHappy", "notYet", "notYetTired", "planned", "abilities", "unknown", "name", "age", "whatAreYou", "food", "likeMe", "tease", "laugh", "ack", "bored", "joke", "hungry", "nervous", "sleepless", "miss", "busy", "rough", "goodNews", "birthday", "rain", "cold", "hot", "sunny", "share", "shareHappy", "meh", "inspire", "question", "listen"];
  for (const name of replies) {
    const count = K.LINE_COUNTS[`chat.${name}`];
    assert.ok(count >= 1, name);
    for (let i = 0; i < count; i++) {
      const line = i18n[`kc.chat.${name}.${i}`];
      assert.ok(line?.zh && line?.en, `kc.chat.${name}.${i}`);
      assert.doesNotMatch(line.zh + line.en, /\p{Extended_Pictographic}/u, `no emoji: ${name}.${i}`);
      if (name !== "abilities") assert.ok(line.zh.length <= 40, `short: ${name}.${i}`);
    }
  }
  // A tired day where the page got written is met as such — never “it's fine not to write”.
  for (let i = 0; i < K.LINE_COUNTS["chat.doneTired"]; i++) assert.doesNotMatch(i18n[`kc.chat.doneTired.${i}`].zh, /不写也没关系|不用写/);
});

test("no line claims Captain read a page without permission", () => {
  for (const [key, v] of Object.entries(i18n).filter(([key]) => key.startsWith("kc.")))
    assert.doesNotMatch(v.zh + v.en, /偷偷|多看了|sneak|每张都看了|looked at every|我听了/, key);
  // Without the title (no permission), no line that quotes it is chosen.
  for (let seed = 0; seed < 20; seed++) {
    const line = K.contextLine("tap", { pages: 1, photos: 0, title: "" }, { seed });
    assert.ok(!["tap.one.0", "tap.one.3"].includes(line.id), line.id);
  }
  // With it, those lines can be chosen.
  const ids = new Set(Array.from({ length: 8 }, (_, seed) => K.contextLine("tap", { pages: 1, photos: 0, title: "咖啡" }, { seed }).id));
  assert.ok(ids.has("tap.one.0") || ids.has("tap.one.3"));
});
