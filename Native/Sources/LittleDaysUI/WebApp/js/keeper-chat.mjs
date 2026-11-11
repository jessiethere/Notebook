// What a line typed to Captain is about — read on this device with a small
// set of plain patterns. It is not understanding, and it is not meant to
// grow into a pile of rules: it only tells apart the common, obvious kinds
// of line so the reply fits what was meant —
//
//   · asking for one of the few things Captain can do (organize / memory /
//     week / shelf / write), or asking what it can do (abilities);
//   · talking about the day: something got done, is planned, has not
//     happened, with or without a feeling (tired / sad / happy);
//   · being sociable: a greeting, a compliment, thanks, asking after
//     Captain, wanting to pet or play.
//
// Anything else is "unknown" and gets a short, honest "I'm not sure" — never
// a list of features, never a made-up fact.
//
// Replaceable on purpose: the app only calls `understand(text)` and uses the
// returned `{ intent, mood, done, planned, notYet }`. A local language model
// (planned later) can provide the same shape without touching the app.

const has = (text, pattern) => pattern.test(text);

// The few things Captain really does (unchanged since V10.3).
const REQUESTS = [
  ["organize", /整理|今天的故事|小结|总结|理一理|organi[sz]e|today'?s story|summar/i],
  ["memory", /回忆|以前的|那年|旧的|翻一页|回看|memor|look back|old page|revisit/i],
  ["week", /这周|本周|最近写|这个星期|this week|lately/i],
  ["shelf", /书架|手帐本|标签|shelf|journals\b|tags?\b/i],
  ["write", /帮我写|写一句|润色|怎么写|代写|help me write|rewrite|polish|write (a|one) line/i],
];
const ABILITIES = /你(都|还)?(会|能)(做|干|帮)?(些)?(什么|啥)|能(做|干|帮我做?)(些)?(什么|啥)|有(什么|哪些)功能|怎么用你|what can you do|what do you do|what are you (able|for)|how do (i|you) use/i;

// About the day.
const NOT_YET = /还没(有)?(写|记|开始|动笔)|没(有)?(写|记)|不想(写|记)|懒得(写|记)|不(写|记)了|写不(出|下|动)|没(时间|空)(写|记)?|haven'?t (written|started|done)|didn'?t (write|journal)|not (written|done) yet|don'?t feel like writing|won'?t write|skip(ping)? (today|it)/i;
const DONE = /(写|记|做|画|贴|拍|弄|补)(完|好)了?|写了(一|两|几|\d|好)|记了(一|两|几|\d)|完成了|搞定了?|收好了|(finished|completed|wrote|made|did|filled) (a|an|the|my|one|two|today'?s|\d)|(page|entry|journal) (is )?(done|finished)|i'?m done|all done/i;
const PLANNED = /(等会儿?|等下|一会儿?|晚点|晚些|待会儿?|明天|回头|稍后|过会儿?)(再|就|要|去|来)?(写|记|补|弄)|(打算|准备|想要?)(写|记|补)(点|一|些|下)?|i('| wi)ll (write|do it|journal)|(write|do it|journal) (later|tomorrow|tonight)|going to write|plan to write/i;
const TIRED = /累|好困|很困|犯困|疲|没力气|没精神|tired|exhausted|worn out|sleepy|drained/i;
const SAD = /难过|伤心|不开心|不高兴|低落|很糟|好糟|糟糕|想哭|哭了|委屈|烦|焦虑|失落|sad\b|feeling down|upset|awful|terrible|miserable|unhappy|anxious/i;
const HAPPY = /(?<!不)(开心|高兴)|快乐|好棒|太好了|幸福|好爽|happy|glad\b|great day|wonderful|so good|excited|delighted/i;

// Being sociable. "你/you" marks a line as being about Captain.
const ABOUT_YOU = /你|妳|您|captain|\byou\b|\byour\b|you'?re/i;
const HAT = /帽子|帽|柠檬|hat\b|lemon/i;
const NICE = /可爱|好乖|真乖|乖乖|好看|漂亮|好帅|真帅|好萌|真萌|真棒|好棒|厉害|喜欢你|爱你|最好了|好软|毛茸茸|cute|adorable|sweet|pretty|lovely|fluffy|good (cat|kitty|boy|girl)|love you|like you|the best|so soft|nice (hat|look)/i;
const THANKS = /谢谢|多谢|感谢|谢啦|thank|thanks|thx/i;
const PET = /摸摸|摸你|摸一下|抱抱|抱一下|抱你|亲亲|蹭蹭|撸你|撸猫|挠挠|挠你|揉揉|rua|\bpet (you|your)|\bpat (you|your)|hug|cuddle|scratch your|boop/i;
const PLAY = /(想|要)?(和|跟|陪)(你|我)(一起)?玩|一起玩|玩一会|玩毛线|玩球|陪我玩|play with (you|me)|let'?s play|want to play|wanna play/i;
const CARE = /你在(干|做)(嘛|什么|啥)|你(现在)?(开心|高兴|快乐|好|还好|累|困|饿|无聊)(吗|嘛|么)|你(怎么样|还好吗|好不好|吃了吗|吃饭了吗|睡了吗)|你今天(怎么样|过得)|how are you|how'?s it going|what are you (doing|up to)|are you (ok|okay|happy|tired|hungry|bored|sleepy)|what'?s up/i;
const MORNING = /早安|早上好|早呀|早啊|^早[\s!！。~～]*$|good morning|^morning\b/i;
const NIGHT = /晚安|睡了|去睡|要睡|good ?night|\bnighty?\b|going to (bed|sleep)|off to bed/i;
const GREET = /^(你好|您好|嗨|嘿|哈喽|哈啰|在吗|在不在|hello|hi|hey|yo)(呀|啊|哦|哟|呢|吖|there)?[\s,，]*(captain|小猫|猫猫|咪咪)?[\s!！。.,，~～?？]*$/i;

// → { intent, mood, done, planned, notYet }
//   intent: organize | memory | week | shelf | write | abilities
//         | done | doneTired | doneHappy | notYet | notYetTired | planned
//         | tired | sad | happy
//         | hat | compliment | pet | play | care | thanks | morning | night | greet
//         | unknown
export function understand(text) {
  // Curly quotes from phone keyboards read like straight ones.
  const said = String(text || "").replace(/[\u2018\u2019\u02bc]/g, "'").trim();
  const result = { intent: "unknown", mood: null, done: false, planned: false, notYet: false };
  if (!said) return result;
  // 1. A request for something Captain does — unless the line is plainly
  //    about how the day went ("…写完了一页" is not a request to write).
  const notYet = has(said, NOT_YET);
  const done = !notYet && has(said, DONE);
  const planned = !done && !notYet && has(said, PLANNED);
  const mood = has(said, SAD) ? "sad" : has(said, TIRED) ? "tired" : has(said, HAPPY) ? "happy" : null;
  Object.assign(result, { mood, done, planned, notYet });
  const request = REQUESTS.find(([, pattern]) => pattern.test(said));
  if (request && !(done || notYet)) return { ...result, intent: request[0] };
  if (has(said, ABILITIES)) return { ...result, intent: "abilities" };
  // 2. Asking after Captain ("你开心吗") is not a report of my own mood.
  if (has(said, CARE)) return { ...result, intent: "care", mood: null };
  // 3. How the day went.
  if (done) return { ...result, intent: mood === "tired" || mood === "sad" ? "doneTired" : mood === "happy" ? "doneHappy" : "done" };
  if (notYet) return { ...result, intent: mood === "tired" || mood === "sad" ? "notYetTired" : "notYet" };
  if (planned) return { ...result, intent: "planned" };
  // 4. Being sociable with Captain.
  const aboutYou = has(said, ABOUT_YOU);
  if (has(said, PLAY)) return { ...result, intent: "play" };
  if (has(said, PET)) return { ...result, intent: "pet" };
  if (has(said, HAT) && has(said, NICE)) return { ...result, intent: "hat" };
  if (has(said, NICE) && (aboutYou || said.length <= 6)) return { ...result, intent: "compliment" };
  if (has(said, THANKS)) return { ...result, intent: "thanks" };
  // 5. A feeling on its own.
  if (mood) return { ...result, intent: mood };
  if (has(said, MORNING)) return { ...result, intent: "morning" };
  if (has(said, NIGHT)) return { ...result, intent: "night" };
  if (has(said, GREET)) return { ...result, intent: "greet" };
  return result;
}

// The intents that are requests (handled by the app's own flows), as opposed
// to lines that only need a spoken reply.
export const REQUEST_INTENTS = ["organize", "memory", "week", "shelf", "write"];
