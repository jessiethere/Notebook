// V10.18 · Captain on the web link is still rules (no AI in the release
// app), but understands the everyday lines people type: 48 lines that all
// came back as "I didn't get that" before now each get a fitting kind of
// reply; what they did is echoed with their own words; questions get an
// honest answer; the sad / tired lines never say "别难过" or push writing.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { understand, topicOf } from "../Public/js/keeper-chat.mjs";
import * as K from "../Public/js/keeper.mjs";

const i18n = JSON.parse(readFileSync(new URL("../Packages/LittleDaysCore/Sources/LittleDaysCore/Resources/i18n.json", import.meta.url), "utf8"));

test("48 everyday lines: each gets its own kind of reply (none is “I didn't get that”)", () => {
  const cases = {
    "你好": "greet", "你叫什么名字": "name", "你几岁了": "age", "你是猫吗": "whatAreYou", "你喜欢吃什么": "food",
    "我好饿": "hungry", "我今天去了咖啡店": "share", "今天吃了火锅": "share", "我和朋友去看电影了": "share",
    "今天上班好忙": "busy", "老板骂我了": "rough", "我考试考砸了": "rough", "我失恋了": "rough", "我有点想家": "miss",
    "明天要考试好紧张": "nervous", "我睡不着": "sleepless", "无聊": "bored", "讲个笑话": "joke", "你会说话吗": "question",
    "你真笨": "tease", "哈哈哈": "laugh", "嗯": "ack", "好的": "ack", "不知道写什么": "inspire", "给我点灵感": "inspire",
    "今天下雨了": "rain", "好热啊": "hot", "周末去哪玩": "question", "我养了一只猫": "share", "你喜欢我吗": "likeMe",
    "我爱你": "compliment", "你会陪着我吗": "likeMe", "我想你了": "likeMe", "你在干嘛": "care", "今天心情不错": "happy",
    "我升职了！": "goodNews", "生日快乐": "happy", "今天是我生日": "birthday", "晚安": "night", "早": "morning",
    "I had coffee with a friend": "share", "I'm bored": "bored", "Tell me a joke": "joke", "What's your name?": "name",
    "I miss home": "miss", "I'm nervous about tomorrow": "nervous", "lol": "laugh", "ok": "ack",
  };
  assert.equal(Object.keys(cases).length, 48);
  for (const [text, want] of Object.entries(cases)) assert.equal(understand(text).intent, want, text);
});

test("what they did is echoed back in their own words; questions are not taken for news", () => {
  for (const [text, thing] of [["我今天去了咖啡店", "咖啡店"], ["今天吃了火锅", "火锅"], ["刚吃了一个冰淇淋", "冰淇淋"], ["今天买了新裙子好开心", "新裙子"], ["I had coffee with a friend", "coffee"], ["I went to the beach!", "beach"], ["I watched a movie today", "movie"]])
    assert.equal(understand(text).topic, thing, text);
  assert.equal(understand("今天买了新裙子好开心").intent, "shareHappy");
  for (const text of ["周末去哪玩", "你去哪了", "今天吃什么"]) assert.equal(topicOf(text) && understand(text).topic, "", text);
  // Nothing from a page is ever echoed: the topic only comes from the line typed.
  assert.equal(understand("我写了一页").intent, "done");
  // Feelings and rough days win over news: never "哇，医院" .
  assert.equal(understand("今天去医院了，有点难过").intent, "rough");
  assert.equal(understand("今天去医院了，有点难过").mood, "sad");
  assert.equal(understand("今天去了公园，有点累").intent, "tired");
  // The echo line fills in their words.
  const line = K.contextLine("chat.share", { thing: "火锅" }, { seed: 0 });
  assert.equal(line.values.thing, "火锅");
  assert.match(i18n[line.key].zh, /\{thing\}/);
});

test("the new lines stay gentle and honest", () => {
  const gentle = ["rough", "nervous", "sleepless", "miss", "sad", "busy"];
  for (const name of gentle)
    for (let i = 0; i < K.LINE_COUNTS[`chat.${name}`]; i++) assert.doesNotMatch(i18n[`kc.chat.${name}.${i}`].zh, /别难过|不要难过|你应该|你要学会/, `${name}.${i}`);
  // Questions it can't answer are said so — never a made-up fact.
  for (let i = 0; i < K.LINE_COUNTS["chat.question"]; i++) assert.match(i18n[`kc.chat.question.${i}`].zh, /不知道|答不上|难倒/);
  // Bored points at the real Playroom.
  assert.ok(Array.from({ length: K.LINE_COUNTS["chat.bored"] }, (_, i) => i18n[`kc.chat.bored.${i}`].zh).some((s) => /玩耍/.test(s)));
});
