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
// V10.18 (the web link felt "dumb": 42 of 48 everyday lines came back as
// "I didn't get that") adds the everyday kinds a person actually types:
//   · questions about Captain (name, age, a cat?, food), affection, teasing,
//     a laugh, "ok / 嗯";
//   · how life is going: busy, hungry, bored, nervous, can't sleep, missing
//     home, a rough day, good news, a birthday, "so-so", the weather;
//   · "I don't know what to write" (a small writing prompt);
//   · telling Captain what they did ("今天吃了火锅", "I had coffee") — the
//     thing is echoed back as `topic` (a few words of their own line, never
//     anything from a page).
// Anything else is "listen" (a longer line: Captain listens), "question"
// (an honest "that one's beyond a little cat") or "unknown" — never a list
// of features, never a made-up fact. Still rules on this device, not AI.
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
const HAPPY = /(?<!不)(开心|高兴)|快乐|好棒|太好了|幸福|好爽|(?<!不)(不错|挺好|很好|真好)|happy|glad\b|great day|good day|wonderful|so good|excited|delighted/i;

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
// V10.18 · everyday lines.
const NAME = /你叫(什么|啥)|你的名字|你是谁|what'?s your name|who are you|your name/i;
const AGE = /你(今年)?(几|多大)(岁|了)|你多大|how old are you|your age/i;
const WHAT_ARE_YOU = /你是(一只)?(猫|小猫|猫咪|真的猫|什么)|你是真(的|猫)|are you (a|really a) (cat|kitty)|what are you\b/i;
const FOOD = /你(喜欢|爱|最爱)吃|你吃(什么|啥)|你要吃|what do you (like to )?eat|favou?rite food|are you hungry|你饿(吗|不|了吗)/i;
const LIKE_ME = /你(喜欢|爱)我(吗|嘛|么)?|你会(一直)?陪(着)?我|陪陪我|我想你了|想你了|我好想你|do you (like|love) me|will you stay|stay with me|i missed you|miss(ed)? you/i;
const TEASE = /你(真|好|太)?(笨|傻|蠢)|笨蛋|傻瓜|呆子|讨厌你|你不懂|你好烦|dumb|stupid|silly cat|you don'?t understand|you'?re useless/i;
const LAUGH = /^(哈{2,}|嘿{2,}|呵{2,}|嘻{2,}|h{3,}|233+|笑死|lol|lmao|haha+|hehe+)[!！。.~～]*$|笑死我了|哈哈哈/i;
const ACK = /^(嗯+|唔+|好的?|好吧|行吧?|ok(ay)?|知道了|收到|哦+|噢+|喔+|啊+|sure|got it|alright|i see|cool|fine)[!！。.~～、,，]*$/i;
const BORED = /无聊|没意思|好闲|没事做|bored|boring|nothing to do/i;
const JOKE = /讲个?笑话|说个?笑话|逗我(笑)?|tell me a joke|make me laugh|\bjoke\b/i;
const HUNGRY = /(好|很|有点|太|快)饿|饿了|饿死|想吃|好想吃|hungry|starving|craving/i;
const NERVOUS = /紧张|压力|焦虑|担心|害怕|不安|慌|nervous|worried|anxious|stress|scared|afraid/i;
const SLEEPLESS = /睡不着|失眠|睡不好|can'?t sleep|insomnia|awake at night/i;
const MISS = /想家|想(我)?(妈|爸|家人|外婆|奶奶|朋友)|好想念|想念|homesick|miss (home|my)/i;
const BUSY = /(好|很|超|太|特别)忙|忙死|忙了一天|加班|上班好|工作好多|事情好多|好多事|busy|worked late|overtime|so much work/i;
const ROUGH = /被(骂|批评|说)|骂我|考砸|没考好|挂科|失恋|分手|吵架|生病|感冒|发烧|头疼|搞砸|倒霉|被拒|医院|看病|打针|住院|bad day|broke up|got sick|i'?m sick|failed|argument|fight with|messed up|got rejected/i;
const GOOD_NEWS = /升职|加薪|考过了?|通过了|拿到了?offer|被录取|录取了|中奖|成功了|找到工作|得奖|got (promoted|the job|accepted|a raise)|passed (the|my)|i won\b/i;
const BIRTHDAY = /我(的)?生日|今天(是)?我(的)?生日|my birthday|it'?s my birthday/i;
const RAIN = /下雨|雨天|大雨|小雨|淋雨|\brain(y|ing)?\b/i;
const SNOW_COLD = /下雪|雪天|好冷|很冷|冷死|降温|\bsnow|freezing|so cold|cold today/i;
const HOT = /好热|很热|热死|太热|高温|so hot|hot today|heat wave/i;
const SUNNY = /天气(真|很|挺|不错|好|晴)|晴天|太阳|阳光|出太阳|sunny|nice weather|lovely weather|sunshine/i;
const MEH = /^(还行|一般|凑合|还好吧?|马马虎虎|就那样|没什么特别|so-so|meh|not bad|nothing special|just okay|ok-ish)[!！。.~～,，]*$|一般般|还行吧/i;
const INSPIRE = /不知道(该)?写(什么|啥|点什么)|没(有)?灵感|写(什么|啥)好|给我(点|个|一些)?(灵感|题目|主题|建议)|what (should|to|do) i write|no idea what to write|writing prompt|inspire me|need (an )?idea/i;
const QUESTION = /[?？]\s*$|(吗|呢|么|嘛)[\s~～。.!！]*$|哪(儿|里|个|玩|去)?|什么|怎么|为什么|几点|多少|^(为什么|怎么|什么|哪|谁|多少|是不是|能不能|可不可以|why|how|what|where|who|when|can you|do you|is it|are you)(?![a-z])/i;

// "我今天去了咖啡店" → "咖啡店"; "I had coffee with a friend" → "coffee".
// A few words of the person's own line, only to echo them back.
const SHARE_ZH = /(去了|去|吃了|喝了|看了|买了|做了|见了|玩了|逛了|听了|学了|拍了|养了|跑了|练了|画了|种了|收到了?)([^\s，。,.!！?？~～]{1,10}?)(了|啦|呀|啊|呢|哦|的时候|回来|[，。,.!！?？~～\s]|$)/;
const SHARE_EN = /\bi (?:just )?(went to|had|ate|watched|saw|bought|made|met|played|visited|read|cooked|baked|tried|got|finished reading)\s+(.{2,28}?)(?=\s+(?:with|today|this|at|in|for|and)\b|[.!?,;]|$)/i;
export function topicOf(text) {
  const said = String(text || "").trim();
  const zh = said.match(SHARE_ZH);
  if (zh) {
    const thing = zh[2].replace(/^(一下|一个|一只|一些|一点|一部|一本|一杯|一碗|一场|一顿|一家|一次|了)/, "").replace(/(好|很|太|真|超|特别|有点|非常).*$/, "").replace(/[了啦呀啊呢哦吧]+$/, "");
    // "去哪玩" / "吃什么" are questions, not things done.
    return thing.length >= 1 && !/^(写|记)|哪|什么|啥|谁/.test(thing) ? thing : "";
  }
  const en = said.match(SHARE_EN);
  return en ? en[2].replace(/^(a|an|the|some|my)\s+/i, "").trim() : "";
}

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
  const result = { intent: "unknown", mood: null, done: false, planned: false, notYet: false, topic: "" };
  if (!said) return result;
  // 0. "I don't know what to write" asks for a nudge, not for writing help.
  if (has(said, INSPIRE)) return { ...result, intent: "inspire" };
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
  // 2. Asking after Captain ("你开心吗") is not a report of my own mood;
  //    questions about who Captain is.
  if (has(said, NAME)) return { ...result, intent: "name", mood: null };
  if (has(said, AGE)) return { ...result, intent: "age", mood: null };
  if (has(said, FOOD)) return { ...result, intent: "food", mood: null };
  if (has(said, WHAT_ARE_YOU)) return { ...result, intent: "whatAreYou", mood: null };
  if (has(said, CARE)) return { ...result, intent: "care", mood: null };
  if (has(said, LIKE_ME)) return { ...result, intent: "likeMe", mood: null };
  if (has(said, TEASE)) return { ...result, intent: "tease", mood: null };
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
  // 5. Something that happened, then a feeling on its own.
  if (has(said, BIRTHDAY)) return { ...result, intent: "birthday" };
  if (has(said, GOOD_NEWS)) return { ...result, intent: "goodNews" };
  if (has(said, ROUGH)) return { ...result, intent: "rough", mood: mood || "sad" };
  if (has(said, SLEEPLESS)) return { ...result, intent: "sleepless" };
  if (has(said, NERVOUS)) return { ...result, intent: "nervous" };
  if (has(said, MISS)) return { ...result, intent: "miss" };
  if (mood === "sad" || mood === "tired") return { ...result, intent: mood };
  if (has(said, BUSY)) return { ...result, intent: "busy" };
  if (has(said, HUNGRY)) return { ...result, intent: "hungry" };
  if (has(said, BORED)) return { ...result, intent: "bored" };
  if (has(said, JOKE)) return { ...result, intent: "joke" };
  // The weather (before "不错" reads as a happy day).
  if (has(said, RAIN)) return { ...result, intent: "rain" };
  if (has(said, SNOW_COLD)) return { ...result, intent: "cold" };
  if (has(said, HOT)) return { ...result, intent: "hot" };
  if (has(said, SUNNY)) return { ...result, intent: "sunny" };
  // Telling Captain what they did: echo it back.
  const topic = has(said, QUESTION) ? "" : topicOf(said);
  if (topic) return { ...result, intent: mood === "happy" ? "shareHappy" : "share", topic };
  if (mood) return { ...result, intent: mood };
  if (has(said, MEH)) return { ...result, intent: "meh" };
  if (has(said, MORNING)) return { ...result, intent: "morning" };
  if (has(said, NIGHT)) return { ...result, intent: "night" };
  if (has(said, GREET)) return { ...result, intent: "greet" };
  if (has(said, LAUGH)) return { ...result, intent: "laugh" };
  if (has(said, ACK)) return { ...result, intent: "ack" };
  // 6. Not understood: a question gets an honest "beyond a little cat"; a
  //    longer line is listened to; anything else is a gentle "hm?".
  if (has(said, QUESTION)) return { ...result, intent: "question" };
  if ([...said].length >= 8 || said.split(/\s+/).length >= 4) return { ...result, intent: "listen" };
  return result;
}

// The intents that are requests (handled by the app's own flows), as opposed
// to lines that only need a spoken reply.
export const REQUEST_INTENTS = ["organize", "memory", "week", "shelf", "write"];
