// Collaborative Journal demo section shown inside a book's detail page.
// Always labelled "演示 · 未联网"; the private pages above it are never shared.
import { escapeHTML as esc } from "./personal-ui.mjs";
import * as C from "./community.mjs";
import * as K from "./collab.mjs";

function person(demo, id, ctx) {
  if (id === "me")
    return { name: demo.profile?.name || ctx.t("community.me"), avatar: demo.profile?.avatar || "🌷" };
  return C.userById(demo, id) || { name: "?", avatar: "✿" };
}
const when = (iso, ctx) =>
  new Date(iso).toLocaleString(ctx.locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function memberRow(demo, bookId, member, ctx) {
  const { t } = ctx;
  const user = person(demo, member.userId, ctx);
  const u = esc(member.userId);
  const role = `<select data-collab-role="${u}" aria-label="${t("collab.role")} · ${esc(user.name)}">${K.ROLES.map((r) => `<option value="${r}" ${member.role === r ? "selected" : ""}>${t("collab.role." + r)}</option>`).join("")}</select>`;
  const actions =
    member.status === "pending"
      ? `<button class="text-button" data-action="collab-accept" data-user="${u}">${t("collab.simAccept")}</button><button class="text-button" data-action="collab-cancel-invite" data-user="${u}">${t("collab.cancelInvite")}</button>`
      : `<button class="text-button" data-action="collab-remove" data-user="${u}">${t("collab.remove")}</button><button class="text-button" data-action="collab-leave" data-user="${u}">${t("collab.simLeave")}</button>`;
  return `<li class="collab-member ${member.status}"><span class="c-avatar xs" aria-hidden="true">${esc(user.avatar)}</span><span class="collab-name"><b>${esc(user.name)}</b><small>${t(member.status === "pending" ? "collab.pending" : "collab.active")}</small></span>${role}<span class="collab-actions">${actions}</span></li>`;
}

function pageCard(demo, item, ctx, collab) {
  const { t } = ctx;
  const by = person(demo, item.authorId, ctx);
  const edited = item.editedBy && item.editedBy !== item.authorId ? person(demo, item.editedBy, ctx) : null;
  const stillMember = item.authorId === "me" || K.memberOf(collab, item.authorId);
  return `<article class="collab-page" data-collab-page="${esc(item.id)}"><header><span class="collab-mark" title="${esc(t("collab.wroteBy", { name: by.name }))}">${esc(by.avatar)} ${esc(by.name)}${stillMember ? "" : ` · ${t("collab.former")}`}</span>${item.mood ? `<i>${esc(item.mood)}</i>` : ""}</header><h3>${esc(item.title || t("entry.untitled"))}</h3>${item.body ? `<p>${esc(item.body)}</p>` : ""}<footer><small>${esc(when(item.updatedAt, ctx))}${edited ? ` · ${t("collab.editedBy", { name: edited.name })}` : ""}</small><span><button class="text-button" data-action="collab-edit-page" data-page="${esc(item.id)}">${t("edit")}</button><button class="text-button" data-action="collab-conflict" data-page="${esc(item.id)}">${t("collab.simConflict")}</button></span></footer></article>`;
}

function conflictHTML(demo, collab, ctx) {
  const { t } = ctx;
  const c = collab.conflict;
  if (!c) return "";
  const other = person(demo, c.userId, ctx);
  return `<section class="collab-conflict" role="alert"><b>⚠︎ ${t("collab.conflictTitle")}</b><p>${t("collab.conflictBody", { name: other.name })}</p><div class="collab-conflict-grid"><div><small>${t("collab.mine")}</small><p>${esc(c.mine.body)}</p></div><div><small>${esc(other.name)}</small><p>${esc(c.theirs.body)}</p></div></div><div class="collab-conflict-actions"><button class="secondary" data-action="collab-resolve" data-choice="mine">${t("collab.keepMine")}</button><button class="secondary" data-action="collab-resolve" data-choice="theirs">${t("collab.keepTheirs")}</button><button class="primary" data-action="collab-resolve" data-choice="both">${t("collab.keepBoth")}</button></div></section>`;
}

export function collabSectionHTML(demo, book, ctx, open) {
  const { t } = ctx;
  const collab = K.collabFor(demo, book.id);
  const head = `<button class="collab-toggle" data-action="collab-toggle" aria-expanded="${open}"><span>👥 ${t("collab.title")}</span><small>${t("collab.demoLabel")} · ${t("collab.memberCount", { count: K.activeMembers(collab).length + 1 })}</small><i>${open ? "⌄" : "›"}</i></button>`;
  if (!open) return `<section class="collab">${head}</section>`;
  const invitable = (demo.friends || []).filter(
    (id) => !K.memberOf(collab, id) && !(demo.blocked || []).includes(id),
  );
  const me = person(demo, "me", ctx);
  const inviteRow = invitable.length
    ? `<div class="collab-invite"><select id="collab-invite-user" aria-label="${t("collab.inviteWho")}">${invitable.map((id) => `<option value="${esc(id)}">${esc(person(demo, id, ctx).name)}</option>`).join("")}</select><select id="collab-invite-role" aria-label="${t("collab.role")}">${K.ROLES.map((r) => `<option value="${r}">${t("collab.role." + r)}</option>`).join("")}</select><button class="primary" data-action="collab-invite">${t("collab.invite")}</button></div>`
    : `<p class="subtext">${t("collab.noFriends")} <button class="text-button" data-action="community-tab" data-tab="friends">${t("collab.findFriends")}</button></p>`;
  const blockers = K.publishBlockers(collab);
  const versions = collab.versions.length
    ? `<details class="collab-versions"><summary>${t("collab.history", { count: collab.versions.length })}</summary><ol>${collab.versions
        .map((v, i) => `<li><span>${esc(when(v.at, ctx))} · ${esc(person(demo, v.by, ctx).name)} · ${t("collab.v." + v.label.replace(/^resolved-.*/, "resolved"))} · ${t("collab.pageCount", { count: v.pages.length })}</span>${i ? `<button class="text-button" data-action="collab-restore" data-version="${esc(v.id)}">${t("collab.restore")}</button>` : `<small>${t("collab.current")}</small>`}</li>`)
        .join("")}</ol></details>`
    : "";
  return `<section class="collab open">${head}<div class="demo-banner"><b>${t("collab.demoLabel")}</b>${t("collab.demoNote")}</div><h3 class="collab-sub">${t("collab.members")}</h3><ul class="collab-members"><li class="collab-member owner"><span class="c-avatar xs" aria-hidden="true">${esc(me.avatar)}</span><span class="collab-name"><b>${esc(me.name)}</b><small>${t("collab.role.owner")}</small></span></li>${collab.members.map((m) => memberRow(demo, book.id, m, ctx)).join("")}</ul>${inviteRow}${conflictHTML(demo, collab, ctx)}<div class="collab-sub-row"><h3 class="collab-sub">${t("collab.sharedPages")}</h3><button class="secondary" data-action="collab-write">✎ ${t("collab.write")}</button></div>${collab.pages.length ? collab.pages.map((p) => pageCard(demo, p, ctx, collab)).join("") : `<p class="subtext">${t("collab.noPages")}</p>`}${versions}<div class="collab-publish"><button class="secondary" disabled>${t("collab.publish")}</button><small>${t(blockers.length ? "collab.publishNeeds" : "collab.publishSolo", { count: blockers.length + 1 })}</small></div></section>`;
}
