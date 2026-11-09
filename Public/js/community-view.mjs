// Community demo views. Every screen carries the "demo / not online" label.
import { escapeHTML as esc } from "./personal-ui.mjs";
import { stickerURL, coverColor } from "./library.mjs";
import { coverHTML } from "./personal-ui.mjs";
import * as C from "./community.mjs";

// Four main sections; Discover has its own feed filters and search.
// "Me" lives in My Books → 我的主页 (one place for my books and my presence).
const TABS = ["discover", "friends", "messages"];
const FEEDS = ["all", "following", "popular", "categories"];

function avatar(user, size = "") {
  return `<span class="c-avatar ${size}" aria-hidden="true">${esc(user?.avatar || "✿")}</span>`;
}
function author(demo, id, ctx) {
  return id === "me"
    ? { name: demo.profile?.name || ctx.t("community.me"), handle: "@me", avatar: demo.profile?.avatar || "🌷" }
    : C.userById(demo, id);
}

export function workCoverHTML(work, ctx, large = false) {
  const photo = (work.media || []).find((item) => item.kind === "photo");
  const src = photo ? ctx.media.resolve(photo.ref) : "";
  const sticker = stickerURL(work.sticker, ctx.catalog);
  return `<div class="work-cover journal-canvas ${esc(work.paper || "cute")} ${large ? "large" : ""}">${src ? `<img class="work-photo" src="${esc(src)}" alt="">` : sticker ? `<img class="work-sticker" src="${esc(sticker)}" alt="">` : ""}<b>${esc(work.title)}</b></div>`;
}

function workCardHTML(demo, work, ctx, rank = 0) {
  const user = author(demo, work.authorId, ctx);
  return `<button class="work-card" data-action="community-open-work" data-work="${esc(work.id)}">${rank ? `<span class="work-rank">${rank}</span>` : ""}${workCoverHTML(work, ctx)}<span class="work-meta"><strong>${esc(work.title)}</strong><small>${avatar(user, "xs")} ${esc(user?.name || "")}</small><small>♡ ${work.likes} · 💬 ${C.commentCount(work)} · ☆ ${work.saves}</small></span></button>`;
}
const grid = (demo, works, ctx, ranked = false) =>
  works.length
    ? `<div class="work-grid">${works.map((work, i) => workCardHTML(demo, work, ctx, ranked ? i + 1 : 0)).join("")}</div>`
    : "";

function commentHTML(demo, workItem, comment, ctx, isReply = false) {
  const { t } = ctx;
  const user = author(demo, comment.authorId, ctx);
  return `<li class="comment ${isReply ? "reply" : ""}">${avatar(user, "xs")}<div><b>${esc(user?.name || "")}</b><p>${esc(comment.text)}</p>${!isReply && workItem.commentsOpen ? `<button class="text-button" data-action="community-reply" data-comment="${esc(comment.id)}">${t("community.reply")}</button>` : ""}${comment.replies?.length ? `<ul>${comment.replies.map((r) => commentHTML(demo, workItem, r, ctx, true)).join("")}</ul>` : ""}</div></li>`;
}

function relationButtons(demo, userId, ctx) {
  const { t } = ctx;
  if (userId === "me") return "";
  const following = demo.following.includes(userId);
  const friend = demo.friends.includes(userId);
  const pending = demo.requests.outgoing.includes(userId);
  const incoming = demo.requests.incoming.includes(userId);
  return `<span class="c-relations"><button class="${following ? "secondary" : "primary"} small" data-action="community-follow" data-user="${esc(userId)}">${t(following ? "community.following" : "community.follow")}</button>${
    friend
      ? `<button class="secondary small" data-action="community-open-chat" data-user="${esc(userId)}">${t("community.message")}</button>`
      : incoming
        ? `<button class="secondary small" data-action="community-friend-accept" data-user="${esc(userId)}">${t("community.accept")}</button>`
        : `<button class="secondary small" data-action="community-friend-request" data-user="${esc(userId)}" ${pending ? "disabled" : ""}>${t(pending ? "community.requested" : "community.addFriend")}</button>`
  }</span>`;
}

function workDetailHTML(demo, view, ctx, helpers) {
  const { t } = ctx;
  const work = demo.works.find((item) => item.id === view.workId);
  if (!work) return `<div class="empty">${t("community.missing")}</div>`;
  const user = author(demo, work.authorId, ctx);
  const mine = work.authorId === "me";
  const photos = (work.media || []).filter((item) => item.kind === "photo").map((item) => ctx.media.resolve(item.ref)).filter(Boolean);
  const clips = (work.media || []).filter((item) => item.kind !== "photo");
  const saveMenu = view.saveMenu
    ? `<div class="c-choices">${C.SAVE_TYPES.map((type) => `<button class="${work.savedAs === type ? "selected" : ""}" data-action="community-save" data-type="${type}">${t("community.save." + type)}</button>`).join("")}${work.savedAs ? `<button data-action="community-save" data-type="">${t("community.unsave")}</button>` : ""}<p class="save-help">${t("community.saveNote")}</p></div>`
    : "";
  const reportMenu = view.reportMenu
    ? `<div class="c-choices"><span class="small-label">${t("community.reportWhy")}</span>${C.REPORT_REASONS.map((reason) => `<button data-action="community-report" data-reason="${reason}">${t("community.reason." + reason)}</button>`).join("")}</div>`
    : "";
  const replyTo = view.replyTo && work.comments.find((c) => c.id === view.replyTo);
  return `<article class="work-detail"><button class="back-button" data-action="community-back">${helpers.icon("back")} ${t("community.title")}</button>${workCoverHTML(work, ctx, true)}${photos.length > 1 ? `<div class="work-photos">${photos.slice(1).map((src) => `<img src="${esc(src)}" alt="" data-action="zoom-photo" data-src="${esc(src)}">`).join("")}</div>` : ""}<h2 class="work-title">${esc(work.title)}</h2><div class="work-author">${avatar(user)}<span><b>${esc(user?.name || "")}</b><small>${esc(user?.handle || "")} · ${esc(work.category)}</small></span>${relationButtons(demo, work.authorId, ctx)}</div>${(work.pages || [{ title: "", body: work.excerpt }]).map((page) => `<section class="work-page">${page.title ? `<h3>${esc(page.title)}</h3>` : ""}<p>${esc(page.body)}</p></section>`).join("")}${clips.length ? `<p class="save-help">${t("community.mediaCount", { count: clips.length })}</p>` : ""}<div class="work-actions"><button class="${work.likedByMe ? "selected" : ""}" data-action="community-like" aria-pressed="${work.likedByMe}">${work.likedByMe ? "♥" : "♡"} ${work.likes}</button><button data-action="community-save-menu" class="${work.savedAs ? "selected" : ""}">☆ ${work.saves}</button><button data-action="community-share">↗ ${t("community.share")}</button>${mine ? "" : `<button data-action="community-report-menu">⚑ ${t("community.report")}</button>`}</div>${saveMenu}${reportMenu}${
    mine
      ? `<div class="c-owner"><label class="check-label"><input type="checkbox" data-action="community-toggle-comments" ${work.commentsOpen ? "checked" : ""}> ${t("community.commentsOpen")}</label><button class="secondary danger small" data-action="community-unpublish">${t("community.unpublish")}</button></div>`
      : ""
  }<section class="c-comments"><h3>💬 ${t("community.comments")} · ${C.commentCount(work)}</h3><ul>${work.comments.map((c) => commentHTML(demo, work, c, ctx)).join("")}</ul>${work.extraComments ? `<p class="save-help">${t("community.moreComments", { count: work.extraComments })}</p>` : ""}${
    work.commentsOpen
      ? `<div class="c-compose">${replyTo ? `<span class="c-replying">${t("community.replyingTo")} “${esc(replyTo.text.slice(0, 20))}” <button class="text-button" data-action="community-reply" data-comment="">×</button></span>` : ""}<textarea id="community-comment" maxlength="500" placeholder="${t("community.commentPlaceholder")}"></textarea><button class="primary small" data-action="community-comment">${t("community.send")}</button></div>`
      : `<p class="save-help">${t("community.commentsClosed")}</p>`
  }</section></article>`;
}

function friendsHTML(demo, view, ctx) {
  const { t } = ctx;
  const row = (userId, buttons) => {
    const user = C.userById(demo, userId);
    return user ? `<li class="c-user">${avatar(user)}<span><b>${esc(user.name)}</b><small>${esc(user.handle)} · ${esc(user.bio || "")}</small></span><span class="c-relations">${buttons}</span></li>` : "";
  };
  const btn = (action, userId, label, cls = "secondary") => `<button class="${cls} small" data-action="${action}" data-user="${esc(userId)}">${t(label)}</button>`;
  const incoming = C.visibleIncoming(demo);
  const waiting = demo.requests.incoming.length - incoming.length;
  const pending = [...demo.requests.incoming, ...demo.requests.outgoing];
  const q = (view.peopleQuery || "").trim().toLowerCase();
  const others = demo.users.filter(
    (u) =>
      !demo.friends.includes(u.id) &&
      !demo.blocked.includes(u.id) &&
      !pending.includes(u.id) &&
      (!q || `${u.name} ${u.handle} ${u.bio}`.toLowerCase().includes(q)),
  );
  return `<section class="friend-list"><h3 class="c-h">${t("community.myFriends")} · ${demo.friends.length}</h3><ul class="c-list">${demo.friends.map((id) => row(id, btn("community-open-chat", id, "community.message", "primary") + btn("community-friend-remove", id, "community.removeFriend") + btn("community-block", id, "community.block"))).join("") || `<li class="save-help">${t("community.noFriends")}</li>`}</ul></section>${
    incoming.length || waiting
      ? `<h3 class="c-h">${t("community.incoming")} · ${incoming.length}</h3><ul class="c-list">${incoming.map((id) => row(id, btn("community-friend-accept", id, "community.accept", "primary") + btn("community-friend-decline", id, "community.decline"))).join("")}</ul>${waiting ? `<p class="save-help">${t("community.requestsWaiting", { count: waiting })}</p>` : ""}`
      : ""
  }${
    demo.requests.outgoing.length
      ? `<h3 class="c-h">${t("community.outgoing")}</h3><ul class="c-list">${demo.requests.outgoing.map((id) => row(id, btn("community-simulate-accept", id, "community.simulateAccept") + btn("community-friend-cancel", id, "community.cancelRequest"))).join("")}</ul>`
      : ""
  }<h3 class="c-h">${t("community.people")}</h3><input class="c-search" id="people-search" data-people-search value="${esc(view.peopleQuery || "")}" placeholder="${t("community.peopleSearch")}" aria-label="${t("community.peopleSearch")}"><ul class="c-list">${others.map((u) => row(u.id, relationButtons(demo, u.id, ctx) + btn("community-block", u.id, "community.block") + btn("community-report-user", u.id, "community.report"))).join("") || `<li class="save-help">${t("community.nothing")}</li>`}</ul><div class="c-explain"><b>${t("community.followVsFriends")}</b><p>${t("community.followVsFriendsText")}</p></div>`;
}

// Who can see what: every book is private; a cover can be shown on my
// profile (demo) — only the cover and title, never the pages.
function whoCanSeeHTML(demo, books, ctx) {
  const { t } = ctx;
  const rows = books
    .map((book) => {
      const on = C.isShowcased(demo, book.id);
      const members = (demo.collab?.[book.id]?.members || []).filter((m) => m.status === "active").length;
      return `<li class="who-row"><span class="who-spine" style="--spine:${coverColor(book, ctx.tokens)}" aria-hidden="true"></span><span class="who-copy"><b>${esc(book.title)}</b><small>${t(on ? "who.coverShown" : "who.onlyMe")}${members ? ` · ${t("who.collab", { count: members })}` : ""}</small></span><select data-showcase="${esc(book.id)}" aria-label="${t("who.label")} · ${esc(book.title)}"><option value="private" ${on ? "" : "selected"}>🔒 ${t("who.private")}</option><option value="cover" ${on ? "selected" : ""}>🖼 ${t("who.cover")}</option></select></li>`;
    })
    .join("");
  return `<section id="p-visibility" class="p-section who-see"><h3>${t("who.title")}</h3><p class="save-help">${t("who.help")}</p><ul class="who-list">${rows || `<li class="save-help">${t("books.empty")}</li>`}</ul><ul class="who-facts"><li>📝 ${t("who.factPosts", { count: C.myWorks(demo).length })}</li><li>💬 ${t("who.factMessages")}</li><li>👥 ${t("who.factFriends")}</li></ul></section>`;
}
function visitorPreviewHTML(demo, books, ctx) {
  const { t } = ctx;
  const v = C.visitorView(demo, books);
  return `<details class="visitor-preview" id="p-preview"><summary>👀 ${t("who.preview")}</summary><div class="visitor-card"><div class="visitor-head">${avatar({ avatar: v.avatar }, "lg")}<div><b>${esc(v.name || t("community.me"))}</b><p>${esc(v.bio || "")}</p></div></div><h4>${t("who.previewCovers")}</h4>${v.covers.length ? `<div class="visitor-covers">${v.covers.map((book) => `<div>${coverHTML({ ...book, coverImage: "" }, ctx)}<small>${esc(book.title)}</small></div>`).join("")}</div>` : `<p class="save-help">${t("who.noCovers")}</p>`}<h4>${t("who.previewWorks")}</h4>${v.works.length ? `<ul class="visitor-works">${v.works.map((w) => `<li>${esc(w.title)}</li>`).join("")}</ul>` : `<p class="save-help">${t("community.noWorks")}</p>`}<p class="save-help">${t("who.previewNote")}</p></div></details>`;
}

export function profileHTML(demo, view, ctx, books = []) {
  const { t } = ctx;
  const me = author(demo, "me", ctx);
  const stats = C.myStats(demo);
  const stat = (value, label, jump) => `<button class="p-stat" data-action="community-jump" data-target="${jump}"><b>${value}</b><span>${t(label)}</span></button>`;
  const edit = view.editProfile
    ? `<div class="p-edit"><span class="small-label">${t("community.avatar")}</span><div class="p-avatars">${C.AVATARS.map((a) => `<button data-action="community-avatar" data-avatar="${a}" class="${demo.profile.avatar === a ? "selected" : ""}" aria-pressed="${demo.profile.avatar === a}">${a}</button>`).join("")}</div><label class="field">${t("community.profileName")}<input id="profile-name" maxlength="30" value="${esc(demo.profile.name)}" placeholder="${t("community.me")}"></label><label class="field">${t("community.profileBio")}<textarea id="profile-bio" maxlength="120" placeholder="${t("community.bioPlaceholder")}">${esc(demo.profile.bio)}</textarea></label><div class="dialog-actions"><button class="secondary" data-action="community-profile-cancel">${t("cancel")}</button><button class="primary" data-action="community-profile-save">${t("save")}</button></div></div>`
    : "";
  const savedType = view.savedType || "";
  const saved = C.savedWorks(demo, savedType);
  const mine = C.myWorks(demo);
  const manage = mine
    .map(
      (work) =>
        `<li class="p-work">${workCoverHTML(work, ctx)}<span class="p-work-copy"><b>${esc(work.title)}</b><small>♡ ${work.likes} · 💬 ${C.commentCount(work)} · ☆ ${work.saves}</small><span class="c-relations"><button class="secondary small" data-action="community-open-work" data-work="${esc(work.id)}">${t("community.view")}</button><label class="check-label"><input type="checkbox" data-action="community-toggle-comments" data-work="${esc(work.id)}" ${work.commentsOpen ? "checked" : ""}> ${t("community.commentsOpen")}</label><button class="secondary danger small" data-action="community-unpublish" data-work="${esc(work.id)}">${t("community.unpublish")}</button></span></span></li>`,
    )
    .join("");
  const following = demo.following
    .map((id) => C.userById(demo, id))
    .filter(Boolean)
    .map((u) => `<li class="c-user">${avatar(u)}<span><b>${esc(u.name)}</b><small>${esc(u.handle)}</small></span><span class="c-relations"><button class="secondary small" data-action="community-follow" data-user="${esc(u.id)}">${t("community.unfollow")}</button></span></li>`)
    .join("");
  const blocked = demo.blocked
    .map((id) => C.userById(demo, id))
    .filter(Boolean)
    .map((u) => `<li class="c-user">${avatar(u)}<span><b>${esc(u.name)}</b></span><span class="c-relations"><button class="secondary small" data-action="community-unblock" data-user="${esc(u.id)}">${t("community.unblock")}</button></span></li>`)
    .join("");
  return `<section class="p-card">${avatar(me, "lg")}<div class="p-who"><h2>${esc(me.name)}</h2><small>@me · ${t("community.privateJournal")}</small><p>${esc(demo.profile.bio || t("community.bioEmpty"))}</p></div><button class="secondary small" data-action="community-profile-edit">${t("community.editProfile")}</button></section>${edit}<div class="p-stats">${stat(stats.works, "community.statWorks", "p-works")}${stat(stats.likes, "community.statLikes", "p-works")}${stat(stats.following, "community.statFollowing", "p-following")}${stat(stats.friends, "community.statFriends", "friends")}${stat(stats.saved, "community.statSaved", "p-saved")}</div>${whoCanSeeHTML(demo, books, ctx)}${visitorPreviewHTML(demo, books, ctx)}<section id="p-works" class="p-section"><div class="section-heading"><h3>${t("community.myPosts")}</h3></div><button class="primary full-width" data-action="community-publish-start">＋ ${t("community.publishStart")}</button><p class="save-help">${t("community.privateDefault")}</p><ul class="p-works">${manage || `<li class="save-help">${t("community.noWorks")}</li>`}</ul></section><section id="p-saved" class="p-section"><h3>${t("community.mySaved")}</h3><div class="material-categories"><button data-action="community-saved-type" data-type="" class="${savedType ? "" : "selected"}">${t("all")}</button>${C.SAVE_TYPES.map((type) => `<button data-action="community-saved-type" data-type="${type}" class="${savedType === type ? "selected" : ""}">${t("community.savedType." + type)}</button>`).join("")}</div>${saved.length ? `<div class="work-grid">${saved.map((w) => workCardHTML(demo, w, ctx)).join("")}</div>` : `<p class="save-help">${t("community.noSaved")}</p>`}</section><section id="p-following" class="p-section"><h3>${t("community.myFollowing")} · ${demo.following.length}</h3><ul class="c-list">${following || `<li class="save-help">${t("community.followingEmpty")}</li>`}</ul></section><section class="p-section"><h3>${t("community.settings")}</h3><label class="check-label"><input type="checkbox" data-profile-setting="defaultCommentsOpen" ${demo.profile.defaultCommentsOpen ? "checked" : ""}> ${t("community.defaultComments")}</label><label class="field">${t("community.whoCanRequest")}<select data-profile-setting="friendRequests"><option value="everyone" ${demo.profile.friendRequests === "everyone" ? "selected" : ""}>${t("community.requestsEveryone")}</option><option value="following" ${demo.profile.friendRequests === "following" ? "selected" : ""}>${t("community.requestsFollowing")}</option></select></label><p class="save-help">${t("community.messagesFriendsOnly")}</p></section><section class="p-section"><h3>${t("community.blocked")} · ${demo.blocked.length}</h3><ul class="c-list">${blocked || `<li class="save-help">${t("community.noBlocked")}</li>`}</ul></section><button class="secondary full-width" data-action="community-reset">↺ ${t("community.reset")}</button>`;
}

function messagesHTML(demo, view, ctx, helpers) {
  const { t } = ctx;
  if (view.chatUser) {
    const user = C.userById(demo, view.chatUser);
    const conversation = C.conversationWith(demo, view.chatUser);
    const allowed = C.canMessage(demo, view.chatUser);
    const stickers = ["tulip", "coffee", "cat", "daisy", "berry", "leaf"];
    return `<div class="chat"><div class="chat-top"><button class="back-button" data-action="community-chat-back">${helpers.icon("back")} ${t("community.messages")}</button><span>${avatar(user, "xs")} ${esc(user?.name || "")}</span><button class="text-button" data-action="community-delete-chat" data-user="${esc(view.chatUser)}">${t("community.deleteChat")}</button></div><ul class="chat-messages">${conversation.messages
      .map((m) => {
        const shared = m.workId && demo.works.find((w) => w.id === m.workId);
        return `<li class="bubble ${m.from === "me" ? "mine" : ""}">${m.text ? `<p>${esc(m.text)}</p>` : ""}${m.sticker ? `<img class="bubble-sticker" src="${esc(stickerURL(m.sticker, ctx.catalog))}" alt="">` : ""}${shared ? `<button class="bubble-work" data-action="community-open-work" data-work="${esc(shared.id)}">📔 ${esc(shared.title)}</button>` : ""}<small>${esc(new Date(m.at).toLocaleTimeString(ctx.locale, { hour: "2-digit", minute: "2-digit" }))}${m.simulated ? ` · ${t("community.simulated")}` : ""}${m.from === "me" ? ` <button class="text-button" data-action="community-delete-message" data-message="${esc(m.id)}" aria-label="${t("delete")}">×</button>` : ""}</small></li>`;
      })
      .join("") || `<li class="save-help">${t("community.chatEmpty")}</li>`}</ul>${
      allowed
        ? `<div class="chat-compose"><div class="chat-stickers">${stickers.map((s) => `<button data-action="community-sticker" data-sticker="${s}" aria-label="${s}"><img src="${esc(stickerURL(s, ctx.catalog))}" alt=""></button>`).join("")}<select id="chat-share-work" aria-label="${t("community.shareWork")}"><option value="">${t("community.shareWork")}</option>${C.discover(demo).slice(0, 12).map((w) => `<option value="${esc(w.id)}">${esc(w.title)}</option>`).join("")}</select></div><div class="chat-input"><input id="chat-text" maxlength="1000" placeholder="${t("community.messagePlaceholder")}"><button class="primary small" data-action="community-send">${t("community.send")}</button></div><p class="save-help">${t("community.chatNote")}</p></div>`
        : `<p class="save-help">${t("community.friendsOnly")}</p>`
    }<div class="c-relations end"><button class="secondary small" data-action="community-block" data-user="${esc(view.chatUser)}">${t("community.block")}</button><button class="secondary small" data-action="community-report-user" data-user="${esc(view.chatUser)}">${t("community.report")}</button></div></div>`;
  }
  const list = demo.conversations
    .filter((c) => !demo.blocked.includes(c.userId))
    .map((c) => {
      const user = C.userById(demo, c.userId);
      const last = c.messages.at(-1);
      const unread = C.unreadCount(demo, c);
      return `<li><button class="c-thread" data-action="community-open-chat" data-user="${esc(c.userId)}">${avatar(user)}<span><b>${esc(user?.name || "")}</b><small>${esc(last ? last.text || (last.sticker ? t("community.stickerMsg") : t("community.workMsg")) : t("community.chatEmpty"))}</small></span>${unread ? `<i class="c-badge">${unread}</i>` : ""}</button></li>`;
    })
    .join("");
  return `<ul class="c-threads">${list || `<li class="save-help">${t("community.noChats")}</li>`}</ul><p class="save-help">${t("community.friendsOnly")}</p>`;
}

function publishHTML(demo, view, journal, ctx) {
  const { t } = ctx;
  const p = view.publish;
  const dates = journal.entries.map((e) => e.date).sort().reverse();
  const candidates = p.date ? C.publishCandidates(journal, p.date) : null;
  const pages = candidates
    ? candidates.pages
        .map((page) => {
          const checked = p.pages.includes(page.id);
          const media = page.media
            .map((item) => {
              const src = item.kind === "photo" ? ctx.media.resolve(item.ref) : "";
              return `<label class="pub-media"><input type="checkbox" data-publish-media="${esc(item.id)}" ${p.media.includes(item.id) ? "checked" : ""} ${checked ? "" : "disabled"}>${src ? `<img src="${esc(src)}" alt="">` : `<span>${item.kind === "video" ? "◈" : "♫"}</span>`}</label>`;
            })
            .join("");
          return `<li class="pub-page ${page.private ? "locked" : ""}"><label class="check-label"><input type="checkbox" data-publish-page="${esc(page.id)}" ${checked ? "checked" : ""} ${page.private ? "disabled" : ""}> <b>${esc(page.id === "day" ? t("day.cover") : page.title || t("moment.untitled"))}</b></label>${page.private ? `<small>🔒 ${t("community.moneyLocked")}</small>` : `<small>${esc(page.body.slice(0, 60))}</small>`}${media ? `<div class="pub-media-row">${media}</div>` : ""}</li>`;
        })
        .join("")
    : "";
  const ready = p.confirmed && p.pages.length;
  return `<section class="publish-sheet"><h3>${t("community.publishTitle")}</h3><p class="save-help">${t("community.publishHelp")}</p><label class="field">${t("community.pickDay")}<select data-publish="date"><option value="">—</option>${dates.map((d) => `<option value="${d}" ${p.date === d ? "selected" : ""}>${d}</option>`).join("")}</select></label>${candidates ? `<ul class="pub-pages">${pages || `<li class="save-help">${t("community.nothingToShare")}</li>`}</ul><label class="field">${t("community.workTitle")}<input data-publish="title" maxlength="60" value="${esc(p.title || "")}"></label><label class="field">${t("books.category")}<input data-publish="category" maxlength="30" value="${esc(p.category || "Daily Life")}"></label><label class="check-label"><input type="checkbox" data-publish="commentsOpen" ${p.commentsOpen !== false ? "checked" : ""}> ${t("community.allowComments")}</label><label class="check-label confirm"><input type="checkbox" data-publish="confirmed" ${p.confirmed ? "checked" : ""}> ${t("community.confirmPublish")}</label>` : ""}<div class="dialog-actions"><button class="secondary" data-action="community-publish-cancel">${t("cancel")}</button><button class="primary" data-action="community-publish-submit" ${ready ? "" : "disabled"}>${t("community.publish")}</button></div></section>`;
}

export function communityHTML(demo, view, journal, ctx, helpers) {
  const { t } = ctx;
  const unread = C.unreadCount(demo);
  const requests = C.visibleIncoming(demo).length;
  const me = author(demo, "me", ctx);
  // Sub-pages (a work, a chat) keep only a one-line demo label.
  const sub = Boolean(view.workId || view.chatUser);
  const header = sub ? `<p class="demo-chip">${t("community.demoLabel")}</p>` : `<header class="page-top"><div><h1 class="page-title">${t("community.title")}</h1><p class="page-subtitle">${t("community.subtitle")}</p></div><button class="me-chip" data-action="open-profile" aria-label="${t("me.open")}">${avatar(me, "xs")}<span>${t("me.short")}</span></button></header><div class="demo-banner"><b>${t("community.demoLabel")}</b>${t("community.demoNote")}</div>`;
  if (view.publish) return header + `<div class="community-body">${publishHTML(demo, view, journal, ctx)}</div>`;
  if (view.workId) return header + workDetailHTML(demo, view, ctx, helpers);
  const badge = (n) => (n ? ` <i class="c-badge">${n}</i>` : "");
  const tabs = `<nav class="community-tabs main" aria-label="${t("community.title")}">${TABS.map((tab) => `<button data-action="community-tab" data-tab="${tab}" class="${view.tab === tab ? "selected" : ""}" aria-pressed="${view.tab === tab}">${t("community.tab." + tab)}${tab === "messages" ? badge(unread) : tab === "friends" ? badge(requests) : ""}</button>`).join("")}</nav>`;
  let body = "";
  if (!TABS.includes(view.tab) || view.tab === "discover") {
    const feed = FEEDS.includes(view.feed) ? view.feed : "all";
    const query = view.query || "";
    const chips = `<div class="feed-chips">${FEEDS.map((f) => `<button data-action="community-feed" data-feed="${f}" class="${feed === f && !query ? "selected" : ""}">${t("community.feed." + f)}</button>`).join("")}</div>`;
    const searchBox = `<input class="c-search" id="community-search" data-community-search value="${esc(query)}" placeholder="${t("community.searchPlaceholder")}" aria-label="${t("community.tab.search")}">`;
    if (query) {
      const results = C.search(demo, query);
      body = `${searchBox}${chips}${results.users.length ? `<h3 class="c-h">${t("community.creators")}</h3><ul class="c-list">${results.users.map((u) => `<li class="c-user">${avatar(u)}<span><b>${esc(u.name)}</b><small>${esc(u.handle)} · ${esc(u.bio)}</small></span>${relationButtons(demo, u.id, ctx)}</li>`).join("")}</ul>` : ""}${results.works.length ? `<h3 class="c-h">${t("community.works")}</h3>${grid(demo, results.works, ctx)}` : `<div class="empty">${t("community.nothing")}</div>`}`;
    } else if (feed === "following")
      body = searchBox + chips + (grid(demo, C.followingFeed(demo), ctx) || `<div class="empty">${t("community.followingEmpty")}</div>`);
    else if (feed === "popular")
      body = `${searchBox}${chips}<div class="segmented"><button data-action="community-period" data-period="week" class="${view.period === "week" ? "selected" : ""}">${t("community.week")}</button><button data-action="community-period" data-period="month" class="${view.period === "month" ? "selected" : ""}">${t("community.month")}</button></div><p class="save-help">${t("community.popularHow")}</p>${grid(demo, C.popular(demo, view.period), ctx, true) || `<div class="empty">${t("community.nothing")}</div>`}`;
    else if (feed === "categories") {
      const list = C.categories(demo);
      const current = view.category || list[0];
      body = `${searchBox}${chips}<div class="material-categories">${list.map((c) => `<button data-action="community-category" data-category="${esc(c)}" class="${c === current ? "selected" : ""}">${esc(c)}</button>`).join("")}</div>${grid(demo, C.discover(demo).filter((w) => w.category === current), ctx)}`;
    } else body = searchBox + chips + grid(demo, C.discover(demo), ctx);
  } else if (view.tab === "friends") body = friendsHTML(demo, view, ctx);
  else if (view.tab === "messages") body = messagesHTML(demo, view, ctx, helpers);
  return header + tabs + `<div class="community-body">${body}</div>`;
}
