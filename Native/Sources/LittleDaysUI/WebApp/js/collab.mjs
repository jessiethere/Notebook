// Collaborative Journal — LOCAL DEMO ONLY ("演示 · 未联网").
// Lives inside the community demo state (little-days.demo-social), never in
// the private journal data. Members are the virtual friends of the demo;
// invitations, replies and edits are simulated in this browser. Real shared
// books need accounts, server storage and access control (Phase 3).
//
// Rules the demo already follows so the real version can keep them:
// - Friends are not access: only an explicit invitation adds a member.
// - Owner ("me") manages members; Editors write pages; Viewers only read.
// - Every change is a version; restoring makes a new version (nothing lost).
// - Publishing a shared book needs every active member's consent (not open).
export const ROLES = ["editor", "viewer"];
const MAX_VERSIONS = 30;
const newId = () => globalThis.crypto.randomUUID();
const now = () => new Date().toISOString();

// Synthetic pages a virtual friend "writes" after accepting.
const FRIEND_PAGES = {
  "u-xiaoman": { title: "一起吃的早餐", body: "我们都点了南瓜汤，你说下次换我请。", mood: "😊", addendum: "补一句：下次换我请你喝咖啡。" },
  "u-river": { title: "Rainy walk together", body: "We shared one umbrella and still got wet.", mood: "🌧️", addendum: "P.S. next time we bring two umbrellas." },
  "u-mumu": { title: "猫咪也来串门", body: "它在你的手帐本上踩了一个小脚印。", mood: "🐾", addendum: "补一句：脚印我拍下来了。" },
  "u-lin": { title: "一起跑完 5 公里", body: "最后一公里是聊着天跑完的。", mood: "💪", addendum: "补一句：配速比上次快了 10 秒。" },
  "u-june": { title: "Scones for two", body: "Your half came out better than mine.", mood: "🍓", addendum: "P.S. less sugar next time." },
  "u-tutu": { title: "两家人的野餐", body: "宝宝们分享了同一块蛋糕。", mood: "🧺", addendum: "补一句：下周还约。" },
};

export function collabFor(demo, bookId) {
  demo.collab ||= {};
  return (demo.collab[bookId] ||= {
    members: [],
    pages: [],
    versions: [],
    conflict: null,
    log: [],
  });
}
export const memberOf = (collab, userId) =>
  collab.members.find((member) => member.userId === userId) || null;
export const activeMembers = (collab) =>
  collab.members.filter((member) => member.status === "active");

function snapshot(collab, by, label) {
  collab.versions.unshift({
    id: newId(),
    at: now(),
    by,
    label,
    pages: structuredClone(collab.pages),
  });
  collab.versions.length = Math.min(collab.versions.length, MAX_VERSIONS);
}
function note(collab, by, action, userId = null) {
  collab.log.unshift({ id: newId(), at: now(), by, action, userId });
  collab.log.length = Math.min(collab.log.length, 30);
}

/* ---------- Members ---------- */

export function invite(demo, bookId, userId, role = "editor") {
  if (!ROLES.includes(role)) throw new Error("collab.badRole");
  if (demo.blocked?.includes(userId)) throw new Error("community.blocked");
  // Friends are not access by themselves, but only friends can be invited.
  if (!demo.friends?.includes(userId)) throw new Error("collab.friendsOnly");
  const collab = collabFor(demo, bookId);
  if (memberOf(collab, userId)) throw new Error("collab.already");
  collab.members.push({ userId, role, status: "pending", invitedAt: now() });
  note(collab, "me", "invited", userId);
  return collab;
}
export function cancelInvite(demo, bookId, userId) {
  const collab = collabFor(demo, bookId);
  collab.members = collab.members.filter(
    (member) => !(member.userId === userId && member.status === "pending"),
  );
}
// The friend accepts (simulated) and, as an Editor, adds a page of their own.
export function simulateAccept(demo, bookId, userId) {
  const collab = collabFor(demo, bookId);
  const member = memberOf(collab, userId);
  if (!member || member.status !== "pending") throw new Error("collab.noInvite");
  member.status = "active";
  member.joinedAt = now();
  note(collab, userId, "joined");
  if (member.role === "editor") {
    const sample = FRIEND_PAGES[userId] || { title: "Hello", body: "", mood: "✿" };
    addPage(demo, bookId, userId, sample);
  }
  return member;
}
export function setRole(demo, bookId, userId, role) {
  if (!ROLES.includes(role)) throw new Error("collab.badRole");
  const member = memberOf(collabFor(demo, bookId), userId);
  if (!member) throw new Error("collab.notMember");
  member.role = role;
  note(collabFor(demo, bookId), "me", "role-" + role, userId);
}
// Removing someone (owner) or leaving (member) keeps the pages they wrote,
// still marked with their name, so the book doesn't lose memories.
export function removeMember(demo, bookId, userId, { left = false } = {}) {
  const collab = collabFor(demo, bookId);
  if (!memberOf(collab, userId)) throw new Error("collab.notMember");
  collab.members = collab.members.filter((member) => member.userId !== userId);
  note(collab, left ? userId : "me", left ? "left" : "removed", userId);
}

/* ---------- Pages, versions and conflicts ---------- */

export function canEdit(collab, userId) {
  if (userId === "me") return true;
  const member = memberOf(collab, userId);
  return member?.status === "active" && member.role === "editor";
}
export function addPage(demo, bookId, authorId, values) {
  const collab = collabFor(demo, bookId);
  if (!canEdit(collab, authorId)) throw new Error("collab.viewerOnly");
  const title = String(values.title || "").trim().slice(0, 80);
  const body = String(values.body || "").trim().slice(0, 2000);
  if (!title && !body) throw new Error("collab.empty");
  const item = {
    id: newId(),
    authorId,
    editedBy: authorId,
    title,
    body,
    mood: values.mood || "",
    createdAt: now(),
    updatedAt: now(),
  };
  collab.pages.unshift(item);
  snapshot(collab, authorId, "added");
  return item;
}
export function editPage(demo, bookId, pageId, editorId, values) {
  const collab = collabFor(demo, bookId);
  if (!canEdit(collab, editorId)) throw new Error("collab.viewerOnly");
  const item = collab.pages.find((p) => p.id === pageId);
  if (!item) throw new Error("collab.noPage");
  Object.assign(item, {
    title: String(values.title ?? item.title).trim().slice(0, 80),
    body: String(values.body ?? item.body).trim().slice(0, 2000),
    editedBy: editorId,
    updatedAt: now(),
  });
  snapshot(collab, editorId, "edited");
  return item;
}
export function restoreVersion(demo, bookId, versionId) {
  const collab = collabFor(demo, bookId);
  const version = collab.versions.find((v) => v.id === versionId);
  if (!version) throw new Error("collab.noVersion");
  collab.pages = structuredClone(version.pages);
  collab.conflict = null;
  snapshot(collab, "me", "restored");
}
// Two people edited the same page at once: keep both texts until the owner
// chooses. Nothing is overwritten silently.
export function simulateConflict(demo, bookId, pageId) {
  const collab = collabFor(demo, bookId);
  const item = collab.pages.find((p) => p.id === pageId);
  const other = activeMembers(collab).find((m) => m.role === "editor");
  if (!item || !other) throw new Error("collab.noEditor");
  collab.conflict = {
    pageId,
    userId: other.userId,
    mine: { title: item.title, body: item.body },
    theirs: { title: item.title, body: `${item.body}\n${FRIEND_PAGES[other.userId]?.addendum || "+"}`.trim() },
    at: now(),
  };
  return collab.conflict;
}
export function resolveConflict(demo, bookId, choice) {
  const collab = collabFor(demo, bookId);
  const conflict = collab.conflict;
  if (!conflict) return;
  const item = collab.pages.find((p) => p.id === conflict.pageId);
  if (item) {
    if (choice === "theirs") Object.assign(item, conflict.theirs, { editedBy: conflict.userId });
    else if (choice === "both")
      collab.pages.splice(collab.pages.indexOf(item) + 1, 0, {
        ...item,
        ...conflict.theirs,
        id: newId(),
        authorId: conflict.userId,
        editedBy: conflict.userId,
      });
    item.updatedAt = now();
  }
  collab.conflict = null;
  snapshot(collab, "me", "resolved-" + choice);
}

// Publishing a shared book needs consent from everyone who wrote in it.
export function publishBlockers(collab) {
  return activeMembers(collab).map((member) => member.userId);
}
