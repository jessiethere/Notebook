// Community / Friends / Messages — LOCAL DEMO ONLY.
// Virtual users and simulated replies live in this browser under a separate
// key; nothing is uploaded or made public. Real accounts, server storage and
// access control are Phase 3 (see docs/ARCHITECTURE.md).
export const DEMO_KEY = "little-days.demo-social";
export const SAVE_TYPES = ["work", "template", "recipe", "cover", "pack"];
export const REPORT_REASONS = ["spam", "harassment", "privacy", "copyright", "other"];
export const AVATARS = ["🌷", "🌼", "🍓", "🐰", "🐱", "🌿", "☁️", "📖", "☕", "🌙"];
export const DEFAULT_PROFILE = {
  name: "",
  avatar: "🌷",
  bio: "",
  defaultCommentsOpen: true,
  friendRequests: "everyone", // or "following"
  showcase: [], // book ids whose COVER (title + cover only) shows on my profile
};
const DAY = 24 * 60 * 60 * 1000;
const newId = () => globalThis.crypto.randomUUID();

const USERS = [
  { id: "u-xiaoman", name: "小满（虚拟）", handle: "@xiaoman.demo", avatar: "🌼", bio: "记录早餐和散步的小日子" },
  { id: "u-river", name: "River (demo)", handle: "@river.demo", avatar: "🌊", bio: "Travel sketches & film photos" },
  { id: "u-mumu", name: "木木（虚拟）", handle: "@mumu.demo", avatar: "🐱", bio: "和猫一起生活的第三年" },
  { id: "u-lin", name: "林间（虚拟）", handle: "@linjian.demo", avatar: "🌿", bio: "健身与读书打卡" },
  { id: "u-june", name: "June (demo)", handle: "@june.demo", avatar: "🍓", bio: "Recipes for slow weekends" },
  { id: "u-tutu", name: "兔兔妈妈（虚拟）", handle: "@tutu.demo", avatar: "🐰", bio: "亲子手帐 · 宝宝成长" },
];

const WORKS = [
  ["w1", "u-xiaoman", "三月的早餐角落", "Daily Life", "work", "cute", "coffee", "每天早上给自己留十分钟，写一句话。", 1, 42, 3, 12],
  ["w2", "u-river", "Kyoto in four photos", "Travel", "work", "kraft", "postcard", "Rain, temples and a very small coffee shop.", 3, 88, 5, 30],
  ["w3", "u-mumu", "猫咪体检日", "Pet", "work", "berry", "cat", "体重 4.2 kg，医生说很健康。", 2, 64, 4, 18],
  ["w4", "u-lin", "下肢训练第 30 天", "Fitness", "work", "grid", "dumbbell", "深蹲终于到 60kg，记录一下感受。", 5, 51, 6, 9],
  ["w5", "u-june", "Weekend scones (recipe)", "Food", "recipe", "gingham", "croissant", "Flour 250g · butter 60g · milk 120ml · bake 15 min.", 6, 120, 9, 44],
  ["w6", "u-tutu", "宝宝第一次说“月亮”", "Parenting", "work", "watercolor", "bunny", "晚饭后散步，她指着天空说了月亮。", 8, 97, 7, 25],
  ["w7", "u-xiaoman", "手帐模板：一周小确幸", "Daily Life", "template", "lined", "tulip", "七格小确幸模板，可以自己填。", 12, 75, 2, 61],
  ["w8", "u-river", "Postcard cover idea", "Travel", "cover", "vintage", "ticket", "A vintage leather cover with a ticket stub.", 16, 33, 1, 20],
  ["w9", "u-lin", "读书笔记：慢慢来", "Learning", "work", "minimal", "book", "今天读到：慢一点也是一种前进。", 20, 28, 2, 6],
  ["w10", "u-june", "Spring sticker pack", "Seasonal", "pack", "watercolor", "daisy", "Original flowers & tape (demo pack).", 26, 140, 8, 80],
  ["w11", "u-mumu", "和猫的冬天", "Pet", "work", "kraft", "snowflake", "窗边晒太阳的一整个下午。", 34, 210, 12, 70],
  ["w12", "u-tutu", "亲子食谱：南瓜饼", "Food", "recipe", "cute", "berry", "南瓜 200g · 糯米粉 150g · 少量糖。", 40, 160, 10, 66],
];

function starterInbox(now) {
  return [
    { id: newId(), type: "system", key: "welcome", at: new Date(now - 60 * 1000).toISOString() },
    { id: newId(), type: "system", key: "backup", at: new Date(now - 30 * 1000).toISOString() },
  ];
}
export function createDemoState(now = Date.now()) {
  const works = WORKS.map(([id, authorId, title, category, kind, paper, sticker, excerpt, daysAgo, likes, commentCount, saves]) => ({
    id, authorId, title, category, kind, paper, sticker, excerpt,
    createdAt: new Date(now - daysAgo * DAY).toISOString(),
    likes, saves, likedByMe: false, savedAs: null, commentsOpen: true,
    comments: Array.from({ length: Math.min(commentCount, 2) }, (_, i) => ({
      id: `${id}-c${i}`,
      authorId: USERS[(i + 2) % USERS.length].id,
      text: i ? "收藏了，谢谢分享 ✿" : "好喜欢这个排版！",
      createdAt: new Date(now - (daysAgo - 0.5) * DAY).toISOString(),
      replies: [],
    })),
    extraComments: Math.max(0, commentCount - 2),
  }));
  return {
    version: 1,
    profile: { ...DEFAULT_PROFILE },
    users: USERS.map((user) => ({ ...user })),
    works,
    following: ["u-xiaoman"],
    friends: ["u-xiaoman"],
    requests: { incoming: ["u-mumu"], outgoing: [] },
    blocked: [],
    reports: [],
    // Notifications: system notes and (simulated) interactions; friend
    // requests and unread messages are added live from the state.
    inbox: starterInbox(now),
    inboxReadAt: null,
    levelSeen: 0,
    conversations: [
      {
        id: "c-xiaoman",
        userId: "u-xiaoman",
        messages: [
          { id: "m1", from: "u-xiaoman", text: "今天的早餐好好看！", at: new Date(now - 2 * 60 * 60 * 1000).toISOString(), read: false },
        ],
      },
    ],
  };
}

export function loadDemo(storage) {
  try {
    const raw = storage.getItem(DEMO_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      if (state?.version === 1 && Array.isArray(state.works)) {
        // Older demo saves had no profile yet.
        state.profile = { ...DEFAULT_PROFILE, ...(state.profile || {}) };
        // Older demo saves had no notifications yet.
        state.inbox ||= starterInbox(Date.now());
        state.levelSeen ??= 0;
        return state;
      }
    }
  } catch {}
  return createDemoState();
}
export function saveDemo(storage, state) {
  storage.setItem(DEMO_KEY, JSON.stringify(state));
}

export const userById = (state, id) => state.users.find((user) => user.id === id) || null;
const visible = (state, work) => !state.blocked.includes(work.authorId) && !work.reported;

/* ---------- Discover / Following / Popular / Categories / Search ---------- */

export function discover(state) {
  return state.works.filter((work) => visible(state, work)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function followingFeed(state) {
  return discover(state).filter((work) => state.following.includes(work.authorId));
}
export function commentCount(work) {
  return work.comments.reduce((sum, c) => sum + 1 + c.replies.length, 0) + (work.extraComments || 0);
}
// Popular this week / month: likes, comments and saves, newer work counts more.
export function popular(state, period = "week", now = Date.now()) {
  const days = period === "month" ? 30 : 7;
  return discover(state)
    .filter((work) => now - Date.parse(work.createdAt) <= days * DAY)
    .map((work) => {
      const age = (now - Date.parse(work.createdAt)) / DAY;
      const score = (work.likes + 2 * commentCount(work) + 1.5 * work.saves) / Math.pow(age + 2, 0.6);
      return { work, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.work);
}
export function categories(state) {
  return [...new Set(discover(state).map((work) => work.category))];
}
export function search(state, query) {
  const q = query.trim().toLowerCase();
  if (!q) return { works: [], users: [] };
  return {
    works: discover(state).filter((work) => [work.title, work.category, work.excerpt].some((text) => text.toLowerCase().includes(q))),
    users: state.users.filter((user) => !state.blocked.includes(user.id) && [user.name, user.handle, user.bio].some((text) => text.toLowerCase().includes(q))),
  };
}

/* ---------- Work interactions ---------- */

const work = (state, id) => {
  const found = state.works.find((item) => item.id === id);
  if (!found) throw new Error("community.missing");
  return found;
};
export function toggleLike(state, id) {
  const item = work(state, id);
  item.likedByMe = !item.likedByMe;
  item.likes += item.likedByMe ? 1 : -1;
  return item;
}
// Saving keeps a reference; copying someone's work needs their licence
// (not offered in the demo).
export function saveAs(state, id, type) {
  if (type && !SAVE_TYPES.includes(type)) throw new Error("community.saveType");
  const item = work(state, id);
  if (!item.savedAs && type) item.saves++;
  if (item.savedAs && !type) item.saves--;
  item.savedAs = type || null;
  return item;
}
export function addComment(state, id, text, parentId = null) {
  const item = work(state, id);
  if (!item.commentsOpen) throw new Error("community.commentsClosed");
  const clean = String(text).trim().slice(0, 500);
  if (!clean) throw new Error("community.emptyComment");
  const comment = { id: newId(), authorId: "me", text: clean, createdAt: new Date().toISOString(), replies: [] };
  if (parentId) {
    const parent = item.comments.find((c) => c.id === parentId);
    if (!parent) throw new Error("community.missing");
    parent.replies.push(comment);
  } else item.comments.push(comment);
  return comment;
}
export function setCommentsOpen(state, id, open) {
  const item = work(state, id);
  if (item.authorId !== "me") throw new Error("community.notOwner");
  item.commentsOpen = Boolean(open);
}
export function unpublish(state, id) {
  const item = work(state, id);
  if (item.authorId !== "me") throw new Error("community.notOwner");
  state.works = state.works.filter((w) => w.id !== id);
}
export function report(state, targetType, targetId, reason) {
  if (!REPORT_REASONS.includes(reason)) throw new Error("community.reason");
  state.reports.push({ id: newId(), targetType, targetId, reason, at: new Date().toISOString() });
  if (targetType === "work") work(state, targetId).reported = true;
}

/* ---------- Publishing (explicit page + media confirmation) ---------- */

// Lists what COULD be shared from one saved day. Nothing is pre-selected;
// growth notes only appear when their own share switch was turned on, and
// fields from Money books are never offered.
export function publishCandidates(journal, date) {
  const entry = journal.entries.find((item) => item.date === date);
  if (!entry) return null;
  const book = (id) => journal.books.find((b) => b.id === id);
  const moneyBook = (id) => /money|账|钱|budget/i.test(`${book(id)?.category || ""} ${book(id)?.title || ""}`);
  const pages = [];
  const describe = (page, label, isDay) => ({
    id: isDay ? "day" : page.id,
    label,
    title: page.title || "",
    body: page.body || "",
    private: moneyBook(page.bookId),
    media: [
      ...(isDay && page.photo ? [{ id: `${page.id || "day"}:main`, kind: "photo", ref: page.photo }] : []),
      ...(page.layers || []).filter((l) => l.kind === "photo" && l.mediaRef).map((l) => ({ id: l.id, kind: "photo", ref: l.mediaRef })),
      ...(page.media || []).map((clip) => ({ id: clip.id, kind: clip.kind, ref: clip.source, name: clip.name })),
    ],
  });
  if (entry.title || entry.body || entry.photo || entry.layers?.length) pages.push(describe(entry, "day", true));
  for (const moment of entry.moments || []) pages.push(describe(moment, moment.title || "moment", false));
  const notes = journal.checks.filter((check) => check.date === date && check.note && check.shareNote === true);
  return { entry, pages, notes };
}

export function publishDay(state, journal, date, selection) {
  if (!selection?.confirmed) throw new Error("community.confirmRequired");
  const candidates = publishCandidates(journal, date);
  if (!candidates) throw new Error("community.missing");
  const pages = candidates.pages.filter((page) => selection.pages?.includes(page.id) && !page.private);
  if (!pages.length) throw new Error("community.noPages");
  const media = pages.flatMap((page) => page.media).filter((item) => selection.media?.includes(item.id));
  const item = {
    id: newId(),
    authorId: "me",
    title: selection.title?.trim() || pages[0].title || date,
    category: selection.category || "Daily Life",
    kind: "work",
    paper: candidates.entry.template || "cute",
    sticker: "tulip",
    excerpt: pages.map((page) => page.body).filter(Boolean).join("\n").slice(0, 200),
    pages: pages.map((page) => ({ title: page.title, body: page.body })),
    media: media.map((item) => ({ kind: item.kind, ref: item.ref })),
    source: { date },
    createdAt: new Date().toISOString(),
    likes: 0, saves: 0, likedByMe: false, savedAs: null, commentsOpen: selection.commentsOpen !== false,
    comments: [], extraComments: 0,
  };
  state.works.unshift(item);
  simulateInteractions(state, item);
  return item;
}
// A published work gets a couple of (clearly simulated) reactions so the
// notification center has something to show in the demo.
function simulateInteractions(state, work) {
  const fans = state.users.filter((user) => !state.blocked.includes(user.id)).slice(0, 2);
  const at = Date.now();
  if (fans[0]) {
    work.likes += 1;
    state.inbox.push({ id: newId(), type: "like", userId: fans[0].id, workId: work.id, at: new Date(at + 1000).toISOString(), simulated: true });
  }
  if (fans[1] && work.commentsOpen) {
    const text = "好温柔的一页 ✿";
    work.comments.push({ id: newId(), authorId: fans[1].id, text, createdAt: new Date(at + 2000).toISOString(), replies: [], simulated: true });
    state.inbox.push({ id: newId(), type: "comment", userId: fans[1].id, workId: work.id, text, at: new Date(at + 2000).toISOString(), simulated: true });
  }
}

/* ---------- Notifications ---------- */

// One list: stored notes + pending friend requests + unread messages.
export function inboxItems(state) {
  const items = (state.inbox || [])
    .filter((item) => !item.userId || !state.blocked.includes(item.userId))
    .map((item) => ({ ...item, category: item.type === "system" || item.type === "level" ? "system" : "interaction" }));
  for (const userId of visibleIncoming(state))
    items.push({ id: `friend-${userId}`, type: "friend", category: "friends", userId, at: state.requestAt?.[userId] || null, pending: true });
  for (const conversation of state.conversations || []) {
    if (state.blocked.includes(conversation.userId)) continue;
    const unread = conversation.messages.filter((m) => m.from !== "me" && !m.read);
    if (unread.length)
      items.push({ id: `chat-${conversation.userId}`, type: "message", category: "messages", userId: conversation.userId, text: unread.at(-1).text, count: unread.length, at: unread.at(-1).at, pending: true });
  }
  return items.sort((a, b) => Number(Boolean(b.pending && !b.at)) - Number(Boolean(a.pending && !a.at)) || String(b.at || "").localeCompare(String(a.at || "")));
}
export function isFresh(item) {
  return Boolean(item.pending || !item.seen);
}
export function inboxUnread(state) {
  return inboxItems(state).filter(isFresh).length;
}
export function markInboxRead(state) {
  state.inboxReadAt = new Date().toISOString();
  for (const item of state.inbox || []) item.seen = true;
}
// Level-up notes (levels come from the private journal, worked out locally).
export function noteLevel(state, levelIndex, levelId) {
  if (levelIndex <= (state.levelSeen || 0)) return false;
  state.levelSeen = levelIndex;
  state.inbox.push({ id: newId(), type: "level", key: levelId, at: new Date().toISOString() });
  return true;
}

/* ---------- Follow vs Friends ---------- */

export function toggleFollow(state, userId) {
  state.following = state.following.includes(userId) ? state.following.filter((id) => id !== userId) : [...state.following, userId];
}
export function requestFriend(state, userId) {
  if (state.blocked.includes(userId)) throw new Error("community.blocked");
  if (state.friends.includes(userId) || state.requests.outgoing.includes(userId)) return;
  if (state.requests.incoming.includes(userId)) return acceptFriend(state, userId);
  state.requests.outgoing.push(userId);
}
export function acceptFriend(state, userId) {
  state.requests.incoming = state.requests.incoming.filter((id) => id !== userId);
  state.requests.outgoing = state.requests.outgoing.filter((id) => id !== userId);
  if (!state.friends.includes(userId)) state.friends.push(userId);
}
export function declineFriend(state, userId) {
  state.requests.incoming = state.requests.incoming.filter((id) => id !== userId);
}
export function cancelRequest(state, userId) {
  state.requests.outgoing = state.requests.outgoing.filter((id) => id !== userId);
}
export function removeFriend(state, userId) {
  state.friends = state.friends.filter((id) => id !== userId);
}
export function block(state, userId) {
  removeFriend(state, userId);
  declineFriend(state, userId);
  cancelRequest(state, userId);
  state.following = state.following.filter((id) => id !== userId);
  if (!state.blocked.includes(userId)) state.blocked.push(userId);
}
export function unblock(state, userId) {
  state.blocked = state.blocked.filter((id) => id !== userId);
}

/* ---------- Direct messages (friends only) ---------- */

export function canMessage(state, userId) {
  return state.friends.includes(userId) && !state.blocked.includes(userId);
}
export function conversationWith(state, userId) {
  let conversation = state.conversations.find((c) => c.userId === userId);
  if (!conversation) {
    conversation = { id: newId(), userId, messages: [] };
    state.conversations.push(conversation);
  }
  return conversation;
}
export function sendMessage(state, userId, message) {
  if (!canMessage(state, userId)) throw new Error("community.friendsOnly");
  const text = String(message.text || "").trim().slice(0, 1000);
  if (!text && !message.sticker && !message.workId) throw new Error("community.emptyMessage");
  const item = { id: newId(), from: "me", text, sticker: message.sticker || null, workId: message.workId || null, at: new Date().toISOString(), read: true };
  conversationWith(state, userId).messages.push(item);
  return item;
}
export function simulateReply(state, userId, text) {
  const item = { id: newId(), from: userId, text, simulated: true, at: new Date().toISOString(), read: false };
  conversationWith(state, userId).messages.push(item);
  return item;
}
export function unreadCount(state, conversation = null) {
  const list = conversation ? [conversation] : state.conversations.filter((c) => !state.blocked.includes(c.userId));
  return list.reduce((sum, c) => sum + c.messages.filter((m) => m.from !== "me" && !m.read).length, 0);
}
export function markRead(state, userId) {
  for (const message of conversationWith(state, userId).messages) message.read = true;
}
export function deleteMessage(state, userId, messageId) {
  const conversation = conversationWith(state, userId);
  const message = conversation.messages.find((m) => m.id === messageId);
  if (!message || message.from !== "me") throw new Error("community.notOwner");
  conversation.messages = conversation.messages.filter((m) => m.id !== messageId);
}
export function deleteConversation(state, userId) {
  state.conversations = state.conversations.filter((c) => c.userId !== userId);
}

/* ---------- My profile (manage my own community presence) ---------- */

export function updateProfile(state, values) {
  const next = { ...state.profile };
  if (values.name != null) next.name = String(values.name).trim().slice(0, 30);
  if (values.bio != null) next.bio = String(values.bio).trim().slice(0, 120);
  if (values.avatar != null) {
    if (!AVATARS.includes(values.avatar)) throw new Error("community.avatar.error");
    next.avatar = values.avatar;
  }
  if (values.defaultCommentsOpen != null) next.defaultCommentsOpen = Boolean(values.defaultCommentsOpen);
  if (values.friendRequests != null) {
    if (!["everyone", "following"].includes(values.friendRequests)) throw new Error("community.setting");
    next.friendRequests = values.friendRequests;
  }
  state.profile = next;
  return next;
}
// Show a book's cover on my profile (demo). Only the cover and title are
// shown; the pages inside stay private. Off by default for every book.
export function setShowcase(state, bookId, on) {
  const list = (state.profile.showcase || []).filter((id) => id !== bookId);
  state.profile = { ...state.profile, showcase: on ? [...list, bookId] : list };
  return state.profile.showcase;
}
export function isShowcased(state, bookId) {
  return (state.profile?.showcase || []).includes(bookId);
}
// What a visitor would see on my profile: name, avatar, bio, showcased covers
// (only books that still exist) and my published works. Never journal pages.
export function visitorView(state, books) {
  return {
    name: state.profile.name,
    avatar: state.profile.avatar,
    bio: state.profile.bio,
    covers: books.filter((book) => isShowcased(state, book.id)),
    works: myWorks(state),
  };
}
export function myWorks(state) {
  return state.works.filter((work) => work.authorId === "me");
}
export function savedWorks(state, type = "") {
  return discover(state).filter((work) => work.savedAs && (!type || work.savedAs === type));
}
export function myStats(state) {
  const works = myWorks(state);
  return {
    works: works.length,
    likes: works.reduce((sum, work) => sum + work.likes, 0),
    following: state.following.length,
    friends: state.friends.length,
    saved: savedWorks(state).length,
  };
}
// Friend requests the person has chosen to see; with "following only" the
// rest wait quietly (they are never auto-accepted).
export function visibleIncoming(state) {
  const all = state.requests.incoming.filter((id) => !state.blocked.includes(id));
  return state.profile?.friendRequests === "following" ? all.filter((id) => state.following.includes(id)) : all;
}
