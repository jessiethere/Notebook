// Runs in the page: rebuilds the lower Home from what the real Home shows
// (today's pages and photos, the real planner, the user's real book covers).
(opts = {}) => {
  const en = document.documentElement.lang?.startsWith("en") || opts.en;
  const T = en
    ? { story: "Today's Story", storySub: (n) => (n ? `${n} PAGE${n > 1 ? "S" : ""} KEPT TODAY` : "NOTHING KEPT YET"), read: "Read this page", also: "Also today", todo: "To do today", left: (n) => (n ? `${n} left` : "all done"), habits: "Habits", lib: "My Library", libSub: (n) => `${n} JOURNALS`, all: "All", now: "CONTINUING", go: "Write the next page →", more: (n) => `+${n}`, emptyT: "Nothing kept yet today", emptyS: "One photo or one line is enough.", emptyGo: "Choose a photo →" }
    : { story: "Today's Story", storySub: (n) => (n ? `今天留下的 ${n} 页` : "今天还没有记录"), read: "翻开这一页", also: "今天还有", todo: "今天要做的事", left: (n) => (n ? `还有 ${n} 件` : "都做完了"), habits: "习惯", lib: "My Library", libSub: (n) => `我的手帐 · ${n} 本`, all: "全部", now: "正在记录", go: "接着记一页 →", more: (n) => `+${n}`, emptyT: "今天还没有留下故事", emptyS: "一张照片、一句话就够了。", emptyGo: "选一张照片 →" };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const hero = document.querySelector(".v9-home");
  // ---- data from the real Home ----
  const slides = [...document.querySelectorAll(".v9-today .peek-slide")];
  const pages = [];
  for (const s of slides) {
    const id = s.dataset.moment || "";
    let pg = pages.find((x) => x.id === id);
    if (!pg) pages.push((pg = { id, date: s.dataset.date, photos: [], title: "", words: "", time: "" }));
    const img = s.querySelector("img");
    if (img) pg.photos.push(img.getAttribute("src"));
    pg.title ||= s.querySelector("b")?.textContent || "";
    pg.words ||= s.querySelector(".peek-words-text")?.textContent || "";
    pg.time ||= (s.querySelector(".hero-kicker")?.textContent.match(/\d\d:\d\d/) || [""])[0];
  }
  if (opts.photos != null) pages.forEach((pg, i) => i === 0 && (pg.photos = pg.photos.slice(0, opts.photos)));
  if (opts.enText) { pages[0].title = "A slow afternoon with coffee"; pages[0].words = "Sat at the corner café with Lin all afternoon, talking about every place we still want to go."; if (pages[1]) pages[1].title = "An evening walk"; }
  if (opts.empty) pages.length = 0;
  const streak = document.querySelector(".v9-today .streak-chip")?.textContent.trim() || "";
  const d = new Date();
  const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][d.getMonth()], WD = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()];
  // ---- Remember ----
  const lead = pages[0];
  const pol = (src, cls) => `<figure class="hs-pol ${cls}"><img src="${esc(src)}" alt="" width="400" height="500" loading="lazy"></figure>`;
  const photosHTML = (pg) => {
    const n = Math.min(pg.photos.length, 3);
    if (!n) return '<div class="hs-quote" aria-hidden="true"></div>';
    return `<div class="hs-photos" data-n="${n}">${pol(pg.photos[0], "main")}<i class="hs-tape" aria-hidden="true"></i>${n > 1 ? pol(pg.photos[1], "s1") : ""}${n > 2 ? pol(pg.photos[2], "s2") : ""}${pg.photos.length > 3 ? `<span class="hs-more">${T.more(pg.photos.length - 3)}</span>` : ""}${opts.video ? '<span class="hs-play" aria-hidden="true">▶</span>' : ""}</div>`;
  };
  const story = lead
    ? `<div class="hs-wrap"><button class="hs-story" data-action="open-day" data-date="${esc(lead.date)}" data-moment="${esc(lead.id)}"><div class="hs-meta"><span>${MON} ${d.getDate()} · ${WD}</span><b>${esc(lead.time)}</b></div>${photosHTML(lead)}<h3 class="hs-title">${esc(opts.title || lead.title)}</h3>${(opts.words ?? lead.words) ? `<p class="hs-words">${esc(opts.words ?? lead.words)}</p>` : ""}${opts.video ? `<div class="hs-chips"><span>▶ 0:12</span><span>♪ 0:31</span></div>` : ""}<div class="hs-foot"><span><b>01</b> / ${String(pages.length).padStart(2, "0")}</span><em>${T.read} →</em></div></button></div>${
        pages.length > 1
          ? `<ul class="hs-also" aria-label="${T.also}">${pages.slice(1, 3).map((pg, i) => `<li><button data-action="open-day" data-date="${esc(pg.date)}" data-moment="${esc(pg.id)}"><span class="thumb">${pg.photos[0] ? `<img src="${esc(pg.photos[0])}" alt="">` : ""}</span><span><b>${esc(pg.title)}</b><small>${T.also} · ${esc(pg.time)}</small></span><i>${String(i + 2).padStart(2, "0")}</i></button></li>`).join("")}</ul>`
          : ""
      }`
    : `<button class="hs-empty" data-action="today-photos"><i class="ghost" aria-hidden="true"></i><b>${T.emptyT}</b><small>${T.emptyS}</small><em>${T.emptyGo}</em></button>`;
  const remember = document.createElement("section");
  remember.className = "hs hs-remember";
  remember.innerHTML = `<div class="hs-head"><h2>${T.story}<small>${T.storySub(pages.length)}</small></h2>${streak ? `<button class="hs-aside" data-action="streak-open"><i aria-hidden="true"></i>${esc(streak)}</button>` : ""}</div>${story}`;
  // ---- Quiet utility: the real planner, folded ----
  const planner = document.querySelector(".today-planner");
  const plans = planner?.querySelector(".today-plans");
  const total = plans ? plans.querySelectorAll("li").length : 0, done = plans ? plans.querySelectorAll("li.done").length : 0;
  const habitsBtn = planner?.querySelector(".today-habits-link");
  const habitsText = habitsBtn?.querySelector("small")?.textContent.match(/\d+\/\d+/)?.[0] || "";
  const util = document.createElement("section");
  util.className = "hs hs-util";
  util.dataset.open = String(Boolean(opts.open));
  util.innerHTML = `<div class="hs-util-row"><button class="todo" aria-expanded="${Boolean(opts.open)}"><i class="box" aria-hidden="true"></i>${T.todo}<small>· ${total ? T.left(total - done) : en ? "add one" : "写一件"}</small><span class="chev" aria-hidden="true">▾</span></button><button class="habits" data-action="nav" data-page="growth">${T.habits}<small>${habitsText}</small><small aria-hidden="true">›</small></button></div><div class="hs-util-body"></div>`;
  if (plans) util.querySelector(".hs-util-body").append(plans);
  util.querySelector(".todo").addEventListener("click", () => { const open = util.dataset.open !== "true"; util.dataset.open = String(open); util.querySelector(".todo").setAttribute("aria-expanded", String(open)); });
  // ---- Collect: the user's own covers ----
  const old = document.querySelector(".home-books");
  const books = [...old.querySelectorAll(".home-book")].map((a) => ({ id: a.querySelector("[data-book]")?.dataset.book, cover: a.querySelector(".book-cover"), title: a.querySelector(":scope > b")?.textContent || "", meta: a.querySelector(":scope > small")?.textContent || "" }));
  if (opts.books != null) books.length = Math.min(books.length, opts.books);
  const lib = document.createElement("section");
  lib.className = "hs hs-collect";
  const bookBtn = (bk, cls = "") => { const b = document.createElement("button"); b.className = "hs-book " + cls; b.dataset.action = "book"; b.dataset.book = bk.id; b.setAttribute("aria-label", bk.title); b.append(bk.cover.cloneNode(true)); return b; };
  lib.innerHTML = `<div class="hs-head"><h2>${T.lib}<small>${T.libSub(books.length)}</small></h2><button class="hs-aside" data-action="nav" data-page="books">${T.all} ›</button></div><div class="hs-lib"><div class="hs-shelf"><div class="hs-slot"></div><div class="hs-side"><div class="hs-now"><small>${T.now}</small><b></b><span></span><button data-action="book-write"></button></div><div class="hs-others"></div></div></div><div class="hs-names"><span></span><div></div></div></div><p class="hs-colophon">Collect moments, grow gently.</p>`;
  if (books[0]) {
    const f = books[0];
    lib.querySelector(".hs-slot").append(bookBtn(f, "hs-feature"));
    lib.querySelector(".hs-now b").textContent = f.title;
    lib.querySelector(".hs-now span").textContent = f.meta.split("·").pop().trim() + (en ? " · updated today" : " · 今天更新");
    const go = lib.querySelector(".hs-now button"); go.textContent = T.go; go.dataset.book = f.id;
    const others = lib.querySelector(".hs-others");
    books.slice(1, 3).forEach((bk) => others.append(bookBtn(bk)));
    if (books.length > 3) others.insertAdjacentHTML("beforeend", `<button class="hs-count" data-action="nav" data-page="books">${T.more(books.length - 3)}</button>`);
    lib.querySelector(".hs-names > span").textContent = "";
    lib.querySelector(".hs-names div").innerHTML = books.slice(1, 3).map((bk) => `<span>${esc(bk.title)}</span>`).join("");
  }
  // ---- swap ----
  document.querySelector(".v9-today")?.remove();
  planner?.remove();
  document.querySelector(".home-quote")?.remove();
  hero.append(remember, util);
  old.replaceWith(lib);
  return { pages: pages.length, books: books.length, total, done };
}
