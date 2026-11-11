// Collaborative Journal demo model (synthetic virtual users only).
import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../Public/js/community.mjs";
import * as K from "../Public/js/collab.mjs";

const fresh = () => C.createDemoState(Date.parse("2026-11-08T12:00:00Z"));

test("only friends can be invited; friendship alone grants nothing", () => {
  const demo = fresh();
  const collab = K.collabFor(demo, "book-1");
  assert.equal(collab.members.length, 0, "friends are not members by default");
  assert.equal(K.canEdit(collab, "u-xiaoman"), false, "friend has no access before an invite");
  assert.throws(() => K.invite(demo, "book-1", "u-river", "editor"), /collab.friendsOnly/);
  K.invite(demo, "book-1", "u-xiaoman", "editor");
  assert.throws(() => K.invite(demo, "book-1", "u-xiaoman", "viewer"), /collab.already/);
  assert.equal(K.canEdit(collab, "u-xiaoman"), false, "pending invite cannot edit yet");
  assert.throws(() => K.invite(demo, "book-1", "u-mumu", "admin"), /collab.badRole/);
});

test("accept, roles, contributor marks, remove and leave keep pages", () => {
  const demo = fresh();
  C.acceptFriend(demo, "u-mumu");
  K.invite(demo, "b", "u-xiaoman", "editor");
  K.invite(demo, "b", "u-mumu", "viewer");
  K.simulateAccept(demo, "b", "u-xiaoman");
  K.simulateAccept(demo, "b", "u-mumu");
  const collab = K.collabFor(demo, "b");
  assert.equal(collab.pages.length, 1, "editor wrote a page; viewer did not");
  assert.equal(collab.pages[0].authorId, "u-xiaoman");
  assert.throws(() => K.addPage(demo, "b", "u-mumu", { title: "x" }), /collab.viewerOnly/);
  K.setRole(demo, "b", "u-mumu", "editor");
  K.addPage(demo, "b", "u-mumu", { title: "猫的一页", body: "喵" });
  const mine = K.addPage(demo, "b", "me", { title: "我的一页", body: "今天很好" });
  K.editPage(demo, "b", mine.id, "u-xiaoman", { body: "今天很好！" });
  assert.equal(collab.pages.find((p) => p.id === mine.id).authorId, "me");
  assert.equal(collab.pages.find((p) => p.id === mine.id).editedBy, "u-xiaoman");
  assert.throws(() => K.addPage(demo, "b", "me", { title: " ", body: "" }), /collab.empty/);
  K.removeMember(demo, "b", "u-mumu");
  K.removeMember(demo, "b", "u-xiaoman", { left: true });
  assert.equal(collab.members.length, 0);
  assert.equal(collab.pages.length, 3, "pages written by people who left stay");
  assert.deepEqual(collab.log.slice(0, 2).map((l) => l.action), ["left", "removed"]);
  assert.equal(K.canEdit(collab, "u-xiaoman"), false, "former members lose access");
});

test("versions restore without losing the current pages", () => {
  const demo = fresh();
  K.addPage(demo, "b", "me", { title: "one" });
  K.addPage(demo, "b", "me", { title: "two" });
  const collab = K.collabFor(demo, "b");
  const first = collab.versions.find((v) => v.pages.length === 1);
  K.restoreVersion(demo, "b", first.id);
  assert.deepEqual(collab.pages.map((p) => p.title), ["one"]);
  assert.equal(collab.versions[0].label, "restored");
  assert.ok(collab.versions.some((v) => v.pages.length === 2), "the two-page state is still in history");
  assert.throws(() => K.restoreVersion(demo, "b", "nope"), /collab.noVersion/);
});

test("conflicts keep both texts until the owner chooses", () => {
  const demo = fresh();
  const page = K.addPage(demo, "b", "me", { title: "t", body: "mine" });
  assert.throws(() => K.simulateConflict(demo, "b", page.id), /collab.noEditor/);
  K.invite(demo, "b", "u-xiaoman", "editor");
  K.simulateAccept(demo, "b", "u-xiaoman");
  const conflict = K.simulateConflict(demo, "b", page.id);
  assert.equal(conflict.mine.body, "mine");
  assert.match(conflict.theirs.body, /^mine\n/);
  const collab = K.collabFor(demo, "b");
  assert.equal(collab.pages.find((p) => p.id === page.id).body, "mine", "nothing overwritten silently");
  const count = collab.pages.length;
  K.resolveConflict(demo, "b", "both");
  assert.equal(collab.pages.length, count + 1);
  assert.equal(collab.conflict, null);
  assert.equal(collab.versions[0].label, "resolved-both");
});

test("publishing needs every member's consent; demo stays in demo storage", () => {
  const memory = { value: null, getItem: () => memory.value, setItem: (k, v) => (memory.value = v) };
  const demo = C.loadDemo(memory);
  K.invite(demo, "b", "u-xiaoman", "viewer");
  assert.deepEqual(K.publishBlockers(K.collabFor(demo, "b")), [], "pending members are not counted yet");
  K.simulateAccept(demo, "b", "u-xiaoman");
  assert.deepEqual(K.publishBlockers(K.collabFor(demo, "b")), ["u-xiaoman"]);
  C.saveDemo(memory, demo);
  assert.equal(C.loadDemo(memory).collab.b.members[0].status, "active");
  // A demo state saved before collaboration existed still loads.
  const old = fresh();
  memory.value = JSON.stringify(old);
  assert.equal(K.collabFor(C.loadDemo(memory), "x").members.length, 0);
});
