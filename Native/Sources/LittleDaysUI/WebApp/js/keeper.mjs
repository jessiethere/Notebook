import { understand } from "./keeper-chat.mjs";
// Little Keeper (V7.7): an optional little companion who lives in the journal.
// "Your journal is the main character. Your little companion makes the
// journey warmer." Pure functions, no DOM (the art pictures are picked in keeper-art.mjs).
//
// Separate parts: profile & preferences (normalizeKeeper), growth
// (growthPoints / stageFor, thresholds from config), prompts (todayPrompt),
// feedback (localFeedback + createFeedbackService, which never sends a page
// to a remote AI service without consent) and the small chat (localChat).
// Everything here runs on the device; journal text is read only to compose a
// reply on the device, never stored or sent anywhere.
import { hasDayPageContent } from "./day.mjs";

// V8.0: Captain only (other animals wait for approved artwork). A journal
// that chose another animal earlier simply shows Captain.
export const ANIMALS = ["cat"];
export const MODES = ["quiet", "gentle", "interactive"];

// Configurable thresholds and points (features.json "keeper" can override).
export const DEFAULT_CONFIG = {
  stages: [
    { id: "new", min: 0 },
    { id: "growing", min: 15 },
    { id: "keeper", min: 45 },
  ],
  // Counted per day, never per word / page / photo, and never by mood.
  points: { day: 2, photo: 1, check: 1, revisit: 1, book: 2, tag: 1 },
  dayCap: 4,
};
export function keeperConfig(features) {
  const custom = features?.keeper || {};
  const stages = Array.isArray(custom.stages) && custom.stages.length ? [...custom.stages].sort((a, b) => a.min - b.min) : DEFAULT_CONFIG.stages;
  return { stages, points: { ...DEFAULT_CONFIG.points, ...(custom.points || {}) }, dayCap: Number(custom.dayCap) || DEFAULT_CONFIG.dayCap };
}

// The companion's profile and preferences (state.keeper, optional; old
// journals have none). Off until the person chooses it.
export function normalizeKeeper(raw = {}) {
  const k = raw && typeof raw === "object" ? raw : {};
  return {
    enabled: k.enabled === true,
    animal: ANIMALS.includes(k.animal) ? k.animal : "cat",
    // Which hat from the character art ("" = the animal's default outfit).
    outfit: typeof k.outfit === "string" && /^[a-z]{1,20}$/.test(k.outfit) ? k.outfit : "",
    name: typeof k.name === "string" ? k.name.trim().slice(0, 12) : "",
    mode: MODES.includes(k.mode) ? k.mode : "gentle",
    // Separate, revocable permissions.
    allowMemories: k.allowMemories === true, // may look at earlier pages (on this device)
    proactive: k.proactive === true, // may speak first (Interactive mode only)
    aiConsent: k.aiConsent === true, // may send a page to a secure AI service (none exists yet)
    invite: ["shown", "dismissed"].includes(k.invite) ? k.invite : "",
    lastStage: Number.isInteger(k.lastStage) ? k.lastStage : 0,
    revisits: Array.isArray(k.revisits) ? k.revisits.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-400) : [],
    recent: Array.isArray(k.recent) ? k.recent.filter((x) => typeof x === "string").slice(-12) : [],
    since: typeof k.since === "string" ? k.since : "",
  };
}
// Captain is the product owner's own grey cat, the model for Captain Cat.
const NAMES = { bunny: { zh: "小团", en: "Pip" }, cat: { zh: "Captain", en: "Captain" }, westie: { zh: "小白", en: "Snowy" } };
export const defaultName = (animal, language = "zh") => (NAMES[animal] || NAMES.bunny)[language === "en" ? "en" : "zh"];
export const keeperName = (keeper, language) => keeper.name || defaultName(keeper.animal, language);
// What each mode allows (one place, so the UI and tests agree).
export function modeAllows(keeper, what) {
  if (!keeper?.enabled) return false;
  const mode = keeper.mode;
  if (what === "invite") return mode !== "quiet"; // a journaling invitation on Today
  if (what === "feedback") return mode !== "quiet"; // a reply when asked
  if (what === "chat") return mode === "interactive";
  if (what === "proactive") return mode === "interactive" && keeper.proactive;
  // Earlier pages: only with the person's own "may look at earlier pages" (V10.3: Gentle too — it is asked for in the panel).
  if (what === "memories") return mode !== "quiet" && Boolean(keeper.allowMemories);
  return false;
}

const isPhoto = (ref) => /^(photo|media):/.test(String(ref || ""));
function ownDays(state) {
  const days = new Map();
  for (const entry of state.entries || []) if (!entry.isDemo) days.set(entry.date, entry);
  for (const [date, draft] of Object.entries(state.drafts || {})) if (!days.has(date) && !draft.isDemo) days.set(date, draft);
  return days;
}
const keptDay = (entry) => Boolean(entry && (hasDayPageContent(entry) || (entry.moments || []).some((m) => !m.isDemo)));
const pagesOf = (entry) => [entry, ...(entry.moments || [])].filter((p) => (p === entry ? hasDayPageContent(p) : !p.isDemo));
const hasPhoto = (page) => isPhoto(page.backdrop) || isPhoto(page.photo) || (page.layers || []).some((l) => l.kind === "photo" && l.mediaRef && !l.gen);

// Growth from everyday documentation. Each day can add at most `dayCap`
// points: kept a page, added a photo or story, looked after myself (a
// check-in), revisited a memory. Books: a journal with my pages, and tags.
// A sad day and a happy day count the same; missing days never subtract.
export function growthPoints(state, keeper = {}, config = DEFAULT_CONFIG) {
  const { points, dayCap } = config;
  const days = ownDays(state);
  const dates = new Set([...days.keys(), ...(state.checks || []).map((c) => c.date), ...(keeper.revisits || [])]);
  let total = 0;
  const reasons = { days: 0, photos: 0, checks: 0, revisits: 0, books: 0, tags: 0 };
  for (const date of dates) {
    const entry = days.get(date);
    let day = 0;
    if (keptDay(entry)) {
      day += points.day;
      reasons.days++;
      if (pagesOf(entry).some(hasPhoto)) {
        day += points.photo;
        reasons.photos++;
      }
    }
    if ((state.checks || []).some((c) => c.date === date)) {
      day += points.check;
      reasons.checks++;
    }
    if ((keeper.revisits || []).includes(date)) {
      day += points.revisit;
      reasons.revisits++;
    }
    total += Math.min(dayCap, day);
  }
  // My Books: each journal that holds my own pages, once; tags, once per book.
  const used = new Set();
  for (const entry of days.values()) for (const page of pagesOf(entry)) used.add(page.bookId || entry.bookId);
  for (const book of state.books || []) {
    if (used.has(book.id)) {
      total += points.book;
      reasons.books++;
    }
    if ((book.tags || []).length) {
      total += points.tag;
      reasons.tags++;
    }
  }
  return { total, reasons };
}
export function stageFor(points, config = DEFAULT_CONFIG) {
  const stages = config.stages;
  let index = 0;
  stages.forEach((stage, i) => {
    if (points >= stage.min) index = i;
  });
  const next = stages[index + 1] || null;
  const from = stages[index].min;
  return { index, id: stages[index].id, next: next?.id || null, progress: next ? Math.min(1, (points - from) / Math.max(1, next.min - from)) : 1 };
}

// The line in the speech bubble on Today (an i18n key and its values).
export function todayPrompt({ hour = 12, keptToday = false, keeper, memory = null } = {}) {
  if (!modeAllows(keeper, "invite")) return null;
  if (memory && modeAllows(keeper, "proactive") && modeAllows(keeper, "memories")) return { key: "keeper.prompt.memory", values: { title: memory.title || "", years: memory.years || 1 } };
  if (keptToday) return { key: "keeper.prompt.kept" };
  const part = hour < 11 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "night";
  return { key: `keeper.prompt.${part}` };
}

// ---------- Feedback, composed on this device (the "mock provider") ----------
// A few cues, read from the page only to choose words; nothing is kept. No
// diagnosis, no judging, no forced positivity: a hard day is met as a hard
// day, an ordinary day as an ordinary day.
const CUES = {
  tired: /累|疲惫|好困|忙了|忙到|没睡|exhaust|tired|sleepy|long day|busy/i,
  sad: /难过|伤心|哭|不开心|低落|失落|孤单|孤独|委屈|想家|sad|cried|upset|lonely|down today|miss (him|her|them|home)/i,
  proud: /骄傲|做到了|坚持|没有放弃|没放弃|完成了|终于|proud|did it|didn'?t give up|managed|finished|finally/i,
  workout: /运动|健身|跑步|锻炼|练腿|瑜伽|游泳|深蹲|workout|work out|worked out|gym|run|ran |yoga|swim/i,
  food: /吃|饭|咖啡|火锅|蛋糕|面包|早餐|午餐|晚餐|coffee|dinner|lunch|breakfast|cake|ate /i,
  people: /朋友|家人|妈妈|爸爸|一起|同事|宝宝|friend|family|mom|dad|together|colleague|baby/i,
  travel: /旅行|海边|机场|出发|旅|度假|trip|travel|beach|flight|vacation/i,
  learn: /学|读书|看书|上课|课程|duolingo|单词|learn|study|studied|read|lesson|class/i,
  ordinary: /平常|普通|没什么|一般般|无聊|ordinary|nothing much|quiet day|uneventful|boring/i,
  happy: /开心|高兴|快乐|幸福|好喜欢|笑|happy|fun|great|loved|laugh/i,
};
const LINES = {
  zh: {
    open: {
      tired: ["听起来今天很长、很累。", "辛苦了，今天好像消耗了你很多力气。", "这一天不轻松呢。"],
      sad: ["听起来今天不太容易。", "这样的日子，愿意写下来已经很好了。", "我在这里，慢慢来就好。"],
      ordinary: ["平平常常的一天，也值得被记住。", "安安静静的一天也很好。", "普通的日子，其实也藏着小小的东西。"],
      happy: ["读到这里我也跟着笑了。", "今天有好好被生活照顾到呢。", "这一页亮亮的。"],
      plain: ["谢谢你把今天写下来。", "我把这一页好好收起来了。", "这一页我读到了。"],
    },
    mid: {
      workout: ["还给自己留了时间动一动。", "在这样的一天里还去运动，很不简单。"],
      proud: ["你没有放弃，这件事值得被记住。", "做到了，就是做到了。"],
      people: ["有人一起，日子会更有温度。", "和重要的人在一起的时间，很珍贵。"],
      food: ["好好吃饭这件事，也是在照顾自己。", "这一口的味道，以后翻到会想起来的。"],
      travel: ["这一段路，以后翻到会很想念吧。", "新的地方，新的风景。"],
      learn: ["一点一点学下来，会慢慢变成你的。", "今天又多知道了一点点。"],
    },
    close: {
      gentle: ["每一小步都算数。", "今天就到这里也很好。", "明天的事，明天再说。"],
      hard: ["今晚对自己好一点。", "不用急着变好，先休息。", "写下来就够了。"],
    },
    tone: { bunny: "（轻轻点了点头）", cat: "（尾巴晃了晃）", westie: "（开心地摇尾巴）" },
  },
  en: {
    open: {
      tired: ["That sounds like a long day.", "It sounds like today took a lot out of you.", "Not an easy day, by the sound of it."],
      sad: ["That sounds like a hard day.", "On days like this, writing it down is already a lot.", "I'm here. No rush."],
      ordinary: ["A plain day is worth keeping too.", "A quiet day can be a good day.", "Ordinary days hold little things too."],
      happy: ["Reading this made me smile too.", "Sounds like life was kind to you today.", "This page feels bright."],
      plain: ["Thank you for writing today down.", "I've tucked this page away safely.", "I read this page."],
    },
    mid: {
      workout: ["I'm glad you made some time for yourself.", "Moving on a day like this is no small thing."],
      proud: ["You didn't give up — that's worth remembering.", "You did it, and that counts."],
      people: ["Days feel warmer with someone beside you.", "Time with people who matter is precious."],
      food: ["Eating well is a way of looking after yourself too.", "You'll remember that taste when you look back."],
      travel: ["You'll miss this road when you look back.", "New places, new views."],
      learn: ["Little by little, it becomes yours.", "A little more known today than yesterday."],
    },
    close: {
      gentle: ["Every little step counts!", "That's enough for today.", "Tomorrow can wait."],
      hard: ["Be kind to yourself tonight.", "No need to feel better right away — rest first.", "Writing it down is enough."],
    },
    tone: { bunny: "(nods softly)", cat: "(tail swishes)", westie: "(happy tail wag)" },
  },
};
const pick = (list, prefix, recent, seed) => {
  const options = list.map((text, i) => ({ id: `${prefix}${i}`, text }));
  const fresh = options.filter((o) => !recent.includes(o.id));
  const pool = fresh.length ? fresh : options;
  return pool[Math.abs(seed) % pool.length];
};
export function readCues(text) {
  return Object.keys(CUES).filter((key) => CUES[key].test(String(text || "")));
}
export function localFeedback({ text = "", language = "zh", animal = "bunny", recent = [], seed = 0, facts = null, say = null } = {}) {
  const words = LINES[language === "en" ? "en" : "zh"];
  const cues = readCues(text);
  // A tired day with something done is met warmly; a sad or plainly hard day gently.
  const hard = cues.includes("sad") || (cues.includes("tired") && !cues.includes("proud") && !cues.includes("workout"));
  const openKey = cues.includes("sad") ? "sad" : cues.includes("tired") ? "tired" : cues.includes("happy") ? "happy" : cues.includes("ordinary") || !String(text).trim() ? "ordinary" : "plain";
  const sep = language === "en" ? " " : "";
  // V10.3: when the words carry no feeling to answer, say something true about
  // the page itself (its photos, sound, being the first today) instead of a
  // general thank-you. `say(key, values)` turns a line key into words.
  const plain = openKey === "plain" || openKey === "ordinary";
  const fact = plain && facts && say ? contextLine("saved", facts, { recent, seed }) : null;
  if (fact) return { source: "local", text: say(fact.key, fact.values), tone: "", used: [fact.id], cues, line: fact.id };
  const parts = [pick(words.open[openKey], `o-${openKey}-`, recent, seed)];
  const midKey = ["workout", "proud", "people", "learn", "travel", "food"].find((key) => cues.includes(key));
  if (midKey) parts.push(pick(words.mid[midKey], `m-${midKey}-`, recent, seed));
  // A closing line only for a hard day, or when there is nothing else to say (no three-part formula).
  if (hard || parts.length < 2) parts.push(pick(words.close[hard ? "hard" : "gentle"], `c-${hard ? "h" : "g"}-`, recent, seed));
  // No stage direction after the words: how Captain moves is shown, not written.
  return { source: "local", text: parts.map((p) => p.text).join(sep), tone: "", used: parts.map((p) => p.id), cues };
}

// The AI service interface. `remote` is a future secure backend
// ({ available, respond(request) }). It is used only with the person's
// explicit consent; otherwise (and always today) the reply is made locally.
export function createFeedbackService({ remote = null } = {}) {
  return {
    canUseRemote: (keeper) => Boolean(remote?.available && keeper?.aiConsent === true),
    async respond(request, keeper) {
      if (!modeAllows(keeper, "feedback")) return null;
      if (remote?.available && keeper?.aiConsent === true) {
        try {
          return { source: "remote", ...(await remote.respond(request)) };
        } catch {
          // fall back to the local reply below
        }
      }
      return localFeedback({ ...request, animal: keeper.animal, recent: [...(keeper.recent || []), ...(request.recentLines || [])] });
    },
  };
}

// ---------- The little chat (Interactive mode) ----------
// A few things it can help with, all on this device. It mentions earlier
// pages only with "may look at earlier pages" switched on, and never claims
// to remember anything it wasn't shown.
export function localChat(intent, { state, keeper, language = "zh", today, seed = 0 } = {}) {
  const en = language === "en";
  const memories = modeAllows(keeper, "memories");
  const days = [...ownDays(state).entries()].filter(([date, entry]) => date < today && keptDay(entry)).sort(([a], [b]) => (a < b ? 1 : -1));
  if (intent === "memory") {
    if (!memories) return { key: "keeper.chat.needMemories" };
    if (!days.length) return { key: "keeper.chat.noMemories" };
    const [date, entry] = days[Math.abs(seed) % days.length];
    const page = pagesOf(entry).find((p) => p.title) || pagesOf(entry)[0];
    return { key: "keeper.chat.memory", values: { date, title: page?.title || (en ? "a page" : "那一页") }, open: { date, momentId: page && page !== entry ? page.id : null } };
  }
  if (intent === "week") {
    const start = new Date(`${today}T12:00:00`);
    start.setDate(start.getDate() - 6);
    const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const week = [...ownDays(state).entries()].filter(([date, entry]) => date >= from && date <= today && keptDay(entry));
    if (!week.length) return { key: "keeper.chat.weekNone" };
    if (!memories) return { key: "keeper.chat.weekCount", values: { count: week.length } };
    const titles = week.flatMap(([, entry]) => pagesOf(entry).map((p) => p.title).filter(Boolean)).slice(0, 3);
    return { key: titles.length ? "keeper.chat.weekTitles" : "keeper.chat.weekCount", values: { count: week.length, titles: titles.join(en ? ", " : "、") } };
  }
  if (intent === "shelf") {
    const books = state.books || [];
    const untagged = books.filter((b) => !(b.tags || []).length);
    return untagged.length ? { key: "keeper.chat.shelfTags", values: { count: books.length, untagged: untagged.length } } : { key: "keeper.chat.shelfTidy", values: { count: books.length } };
  }
  return { key: "keeper.chat.hello" };
}

// ---------- Contextual companion (V10.3): lines chosen from what happened ----------
// No AI: Captain looks at simple facts kept on this device (how many pages
// today, photos, the last title, how long since the last page, the hour) and
// picks a line that fits, avoiding the ones it used recently. Nothing here
// reads the words of a page except its title.
const photoCount = (page) => (isPhoto(page.backdrop) ? 1 : 0) + (isPhoto(page.photo) ? 1 : 0) + (page.layers || []).filter((l) => l.kind === "photo" && l.mediaRef && !l.gen && !l.drawing).length;
const dayDiff = (a, b) => Math.round((new Date(`${a}T12:00:00`) - new Date(`${b}T12:00:00`)) / 86400000);
export function dayFacts(state, today, hour = 12) {
  const days = ownDays(state);
  const entry = days.get(today);
  const pages = entry && keptDay(entry) ? pagesOf(entry) : [];
  const earlier = [...days.entries()].filter(([date, e]) => date < today && keptDay(e)).map(([date]) => date).sort();
  const lastDay = earlier.at(-1) || "";
  const titled = pages.filter((p) => String(p.title || "").trim());
  return {
    pages: pages.length,
    photos: pages.reduce((n, p) => n + photoCount(p), 0),
    videos: pages.reduce((n, p) => n + (p.layers || []).filter((l) => l.kind === "video").length, 0),
    audios: pages.reduce((n, p) => n + (p.layers || []).filter((l) => l.kind === "audio").length, 0),
    title: String(titled.at(-1)?.title || "").trim().slice(0, 24),
    gap: lastDay ? dayDiff(today, lastDay) : null,
    keptDays: earlier.length + (pages.length ? 1 : 0),
    night: hour >= 22 || hour < 5,
  };
}
// How many lines each situation has (the words are in i18n: kc.<event>.<situation>.<n>).
export const LINE_COUNTS = {
  "tap.none": 5, "tap.noneNight": 3, "tap.back": 3, "tap.first": 3, "tap.one": 6, "tap.many": 4, "tap.photos": 3,
  "saved.photos": 3, "saved.media": 2, "saved.first": 2, "saved.more": 2, "saved.words": 3,
  "shelf.count": 2, "shelf.latest": 2, "shelf.untagged": 1, "shelf.tidy": 2,
  "chat.greet": 3, "chat.morning": 2, "chat.night": 2, "chat.compliment": 3, "chat.hat": 3, "chat.hatOff": 1, "chat.pet": 3, "chat.play": 2, "chat.care": 3, "chat.thanks": 3, "chat.happy": 3, "chat.sad": 3, "chat.tired": 3, "chat.done": 3, "chat.doneTired": 3, "chat.doneHappy": 2, "chat.notYet": 3, "chat.notYetTired": 2, "chat.planned": 2, "chat.abilities": 1, "chat.unknown": 3,
  // V10.18 · everyday lines (see js/keeper-chat.mjs).
  "chat.name": 2, "chat.age": 2, "chat.whatAreYou": 2, "chat.food": 2, "chat.likeMe": 3, "chat.tease": 3, "chat.laugh": 2, "chat.ack": 3, "chat.bored": 3, "chat.joke": 3, "chat.hungry": 3, "chat.nervous": 3, "chat.sleepless": 3, "chat.miss": 2, "chat.busy": 3, "chat.rough": 3, "chat.goodNews": 3, "chat.birthday": 2, "chat.rain": 2, "chat.cold": 2, "chat.hot": 2, "chat.sunny": 2, "chat.share": 3, "chat.shareHappy": 2, "chat.meh": 2, "chat.inspire": 4, "chat.question": 3, "chat.listen": 3,
};
// Lines that quote a page's title: only when Captain may look at pages
// ("翻看以前的页面" switched on). Without it, `facts.title` is empty and
// these are never chosen — no line pretends to have read anything.
const TITLE_LINES = ["tap.one.0", "tap.one.3"];
function situationsFor(event, facts) {
  if (event === "tap") {
    if (!facts.pages) return [facts.keptDays === 0 ? "first" : facts.gap != null && facts.gap >= 3 ? "back" : facts.night ? "noneNight" : "none"];
    return [...(facts.photos >= 3 ? ["photos"] : []), facts.pages > 1 ? "many" : "one"];
  }
  if (event === "saved") {
    // `facts` here describes the page just saved (and how many pages today).
    return [...(facts.pagePhotos >= 2 ? ["photos"] : []), ...(facts.pageMedia ? ["media"] : []), ...(facts.pageWordsOnly ? ["words"] : []), facts.pages > 1 ? "more" : "first"];
  }
  if (event === "shelf") return [...(facts.untagged ? ["untagged"] : ["tidy"]), "count", ...(facts.latest ? ["latest"] : [])];
  return [event.split(".")[1] || "unknown"];
}
// → { id, key, values } — `recent` is a list of ids used lately (not repeated while others remain).
export function contextLine(event, facts = {}, { recent = [], seed = 0 } = {}) {
  const root = event.split(".")[0];
  const options = situationsFor(event, facts).flatMap((situation) => Array.from({ length: LINE_COUNTS[`${root}.${situation}`] || 0 }, (_, i) => `${root}.${situation}.${i}`));
  if (!options.length) return null;
  const allowed = facts.title ? options : options.filter((id) => !TITLE_LINES.includes(id));
  const usable = allowed.length ? allowed : options;
  const fresh = usable.filter((id) => !recent.includes(id));
  const pool = fresh.length ? fresh : usable;
  const id = pool[Math.abs(seed) % pool.length];
  return { id, key: `kc.${id}`, values: { count: facts.pages ?? facts.count ?? 0, photos: facts.pagePhotos ?? facts.photos ?? 0, title: facts.title || "", days: facts.gap ?? 0, untagged: facts.untagged ?? 0, thing: facts.thing || "" } };
}
// What a typed line is about: see js/keeper-chat.mjs (replaceable later by a
// local model with the same output). Kept for older callers: the feelings
// map to "feel", social lines to their own intents.
export function localIntent(text) {
  const { intent } = understand(text);
  return ["tired", "sad", "notYetTired"].includes(intent) ? "feel" : intent;
}
// One earlier page to look back at (never a sample day), skipping the ones just shown.
export function pickMemory(state, today, { exclude = [], seed = 0 } = {}) {
  const pages = [...ownDays(state).entries()]
    .filter(([date, entry]) => date < today && keptDay(entry))
    .flatMap(([date, entry]) => pagesOf(entry).map((page) => ({ date, entry, page })))
    .filter(({ page }) => String(page.title || page.body || "").trim() || hasPhoto(page));
  if (!pages.length) return null;
  const keyOf = (x) => `${x.date}|${x.page === x.entry ? "" : x.page.id}`;
  const fresh = pages.filter((x) => !exclude.includes(keyOf(x)));
  const pool = fresh.length ? fresh : pages;
  const pick = pool[Math.abs(seed) % pool.length];
  const photo = isPhoto(pick.page.backdrop) ? pick.page.backdrop : isPhoto(pick.page.photo) ? pick.page.photo : (pick.page.layers || []).find((l) => l.kind === "photo" && l.mediaRef && !l.gen)?.mediaRef || "";
  return { key: keyOf(pick), date: pick.date, momentId: pick.page === pick.entry ? "" : pick.page.id, title: String(pick.page.title || "").trim(), words: String(pick.page.body || "").replace(/\s+/g, " ").trim().slice(0, 90), bookId: pick.page.bookId || pick.entry.bookId || "", photo, more: pool.length > 1 };
}
