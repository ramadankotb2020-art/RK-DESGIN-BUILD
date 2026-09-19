/* ═══════════════════════════════════════════════════════════
   RK Design Studio — pages.js
   صفحات المجالين (works.html) + صفحة المشروع (project.html)
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var R = "../";

  /* ── البيانات: كل المشاريع من ملف الموقع الأساسي (قراءة فقط) ── */
  var allProjects = (function () {
    var data = (typeof projectsData !== "undefined") ? projectsData : (window.projectsData || null);
    if (!data || !data.length) return [];
    return data.map(function (p) {
      var m = (p.slug || "").match(/([a-f0-9]{10})$/);
      return {
        hash: m ? m[1] : (p.legacyId || p.id || ""),
        slug: p.slug || "",
        title: p.title,
        cat: p.category || "",
        disc: p.discipline || "",
        area: p.area || null,
        loc: p.location || null,
        year: p.year || null,
        desc: p.excerpt || p.description || "",
        idea: p.idea || "",
        tags: p.tags || [],
        materials: p.materials || [],
        cover: p.cover || "",
        gallery: (p.gallery || []).filter(function (g) { return typeof g === "string" && g; }),
        oldUrl: p.url ? R + p.url : ""
      };
    });
  })();

  var FIELD_TAG = { interior: "داخلي", exterior: "خارجي", graphic: "جرافيك" };
  var FIELD_NAME = { interior: "التصميم الداخلي", exterior: "التصميم الخارجي", graphic: "الجرافيك والهوية البصرية" };

  function esc(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function isImage(s) { return /\.(webp|jpe?g|png)(\?|$)/i.test(s); }
  function isVideo(s) { return /\.mp4(\?|$)/i.test(s); }
  function galleryImages(it) { return it.gallery.filter(isImage); }
  function galleryVideo(it) {
    for (var i = 0; i < it.gallery.length; i++) if (isVideo(it.gallery[i])) return it.gallery[i];
    return "";
  }
  function descOf(it, full) {
    var d = (it.desc || "").replace(/\s+/g, " ").trim();
    if (!d || d.indexOf("مشروع " + it.title) === 0) d = (it.cat || "مشروع من أعمال الاستوديو") + " — رمضان قطب.";
    if (!full && d.length > 180) d = d.slice(0, 177).replace(/\s+\S*$/, "") + "…";
    return d;
  }

  /* ── التحميل الأولي ─────────────────────────────────── */
  var readyDone = false;
  var pendingEls = [];
  function markReady() {
    if (readyDone) return;
    readyDone = true;
    var l = $("#loader");
    if (l) l.classList.add("done");
    document.body.classList.add("ready");
    pendingEls.forEach(function (el) { el.classList.add("in"); });
    pendingEls = [];
  }
  window.addEventListener("load", function () { setTimeout(markReady, 900); });
  setTimeout(markReady, 2600);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      if (readyDone) en.target.classList.add("in");
      else pendingEls.push(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
  function observeReveals(scope) {
    $$(".reveal", scope || document).forEach(function (el) { io.observe(el); });
  }

  /* ── الهيدر عند التمرير ─────────────────────────────── */
  (function () {
    var header = $("#site-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 40); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* ── كرسور مخصص ────────────────────────────────────── */
  (function () {
    if (reduced) return;
    if (!window.matchMedia("(pointer:fine)").matches) return;
    var c = $("#cursor");
    if (!c) return;
    var label = c.querySelector(".cursor-label");
    document.documentElement.classList.add("fine-cursor");
    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var tx = x, ty = y, running = false;
    function loop() {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      c.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      requestAnimationFrame(loop);
    }
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!running) { running = true; c.style.opacity = "1"; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest ? e.target.closest("a,button,.pcard,.g-item") : null;
      var lab = "";
      if (t) {
        if (t.classList.contains("pcard")) lab = "عرض";
        else if (t.classList.contains("g-item")) lab = "كبير";
        else if (t.hasAttribute && t.hasAttribute("data-cursor-label")) lab = t.getAttribute("data-cursor-label");
      }
      label.textContent = lab;
      c.classList.toggle("big", !!lab);
    });
    document.documentElement.addEventListener("mouseleave", function () { c.style.opacity = "0"; });
  })();

  /* ── إدارة المظاهر (themes) ─────────────────────────── */
  (function () {
    var THEMES = {
      clay: { bg: "#f4efe7" },
      forest: { bg: "#131812" },
      espresso: { bg: "#171009" },
      midnight: { bg: "#0b0a08" }
    };
    var KEY = "rk-studio-theme";
    var meta = document.querySelector('meta[name="theme-color"]');
    var html = document.documentElement;
    function apply(t, save) {
      if (!THEMES[t]) t = "clay";
      html.classList.add("theming");
      if (t === "clay") delete html.dataset.theme;
      else html.dataset.theme = t;
      if (meta) meta.setAttribute("content", THEMES[t].bg);
      $$(".theme-dot").forEach(function (d) {
        d.classList.toggle("active", d.getAttribute("data-set-theme") === t);
      });
      if (save !== false) { try { localStorage.setItem(KEY, t); } catch (e) {} }
      setTimeout(function () { html.classList.remove("theming"); }, 700);
    }
    $$(".theme-dot").forEach(function (d) {
      d.addEventListener("click", function () { apply(d.getAttribute("data-set-theme")); });
    });
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    apply(saved && THEMES[saved] ? saved : "clay", false);
  })();

  /* ── سنة الحقوق ──────────────────────────────────────── */
  var y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());

  /* ── بناء كارت مشروع (نفس تصميم الرئيسية) ─────────── */
  function makeCard(it, delay) {
    var a = document.createElement("a");
    a.className = "pcard reveal";
    a.style.setProperty("--d", (delay % 3) * 0.07 + "s");
    a.href = "project.html?id=" + encodeURIComponent(it.hash);

    var tag = FIELD_TAG[it.disc] || "";
    var metaParts = [it.area, it.loc, it.year].filter(Boolean);
    var vidSrc = galleryVideo(it);
    var firstImg = galleryImages(it)[0] || it.cover;
    var extra = "";
    if (vidSrc) extra = '<video class="pcard-video" muted loop playsinline preload="none" playsinline aria-hidden="true"><source src="' + esc(R + vidSrc) + '"></video>';
    else if (it.gallery.length > 1) extra = '<img class="pcard-peek" src="' + esc(R + galleryImages(it)[1] || it.cover) + '" alt="" loading="lazy" aria-hidden="true">';
    if (vidSrc) a.classList.add("pcard-has-video");

    a.innerHTML =
      '<div class="pcard-media">' +
        '<img alt="' + esc(it.title) + '" loading="lazy" width="800" height="600">' +
        extra +
        (it.cat ? '<span class="pcard-badge">' + esc(it.cat) + "</span>" : "") +
        (tag ? '<span class="pcard-field">' + tag + "</span>" : "") +
        '<span class="pcard-cta">عرض المشروع <span class="arr">←</span></span>' +
      "</div>" +
      '<div class="pcard-info">' +
        "<h3>" + esc(it.title) + "</h3>" +
        "<p>" + esc(descOf(it)) + "</p>" +
        '<div class="pcard-meta">' + (metaParts.length ? metaParts.map(esc).join(" · ") : "—") + "</div>" +
      "</div>";

    var img = a.querySelector("img");
    var ci = 0;
    var imgs = galleryImages(it);
    img.onerror = function () {
      ci++;
      if (ci < imgs.length) img.src = R + imgs[ci];
      else { img.src = R + "images/homepage/hero-slide-1-interior.webp"; img.onerror = null; }
    };
    img.src = R + (it.cover || "images/homepage/hero-slide-1-interior.webp");

    if (vidSrc && window.matchMedia("(hover:hover)").matches) {
      var vid = a.querySelector(".pcard-video");
      a.addEventListener("mouseenter", function () {
        if (vid.readyState === 0) vid.load();
        vid.play().catch(function () {});
      });
      a.addEventListener("mouseleave", function () { vid.pause(); });
    }
    return a;
  }

  var page = document.body.getAttribute("data-page");

  /* ═══════════════════════════════════════════════════════
     صفحة المجال (works.html?f=space|brand)
     ═══════════════════════════════════════════════════════ */
  if (page === "works") {
    var params = new URLSearchParams(location.search);
    var f = params.get("f") === "brand" ? "brand" : "space";

    var items = allProjects.filter(function (it) {
      return f === "brand" ? it.disc === "graphic" : (it.disc === "interior" || it.disc === "exterior");
    });

    $("#phKicker").textContent = f === "brand" ? "المجال 02 — الأعمال" : "المجال 01 — الأعمال";
    $("#phTitle").textContent = f === "brand" ? "الجرافيك والهوية البصرية" : "التصميم الداخلي والخارجي";
    $("#phSub").textContent = f === "brand"
      ? "شعارات وهويات كاملة ومطبوعات وتغليف وحملات سوشيال — نفس دقة التصميم الداخلي، لكن على ورقة وشاشة ولون."
      : "سكني وتجاري، واجهات معمارية ولاندسكيب — نسبة ومادة ونور، ورندر ثلاثي الأبعاد تثق فيه وقت التنفيذ.";
    document.title = (f === "brand" ? "أعمال الجرافيك والهوية" : "أعمال التصميم الداخلي والخارجي") + " — RK Design Studio | رمضان قطب";

    var chipsWrap = $("#chips");
    var modes = f === "brand"
      ? []
      : [
          { id: "all", label: "الكل" },
          { id: "interior", label: "داخلي" },
          { id: "exterior", label: "خارجي" }
        ];
    if (!modes.length) chipsWrap.style.display = "none";

    var current = "all";
    var grid = $("#grid");

    function render() {
      var list = items.filter(function (it) { return current === "all" || it.disc === current; });
      grid.innerHTML = "";
      list.forEach(function (it, i) { grid.appendChild(makeCard(it, i)); });
      observeReveals(grid);
      document.title = (f === "brand" ? "أعمال الجرافيك والهوية" : "أعمال التصميم الداخلي والخارجي") + " (" + list.length + ") — RK Design Studio";
    }

    modes.forEach(function (m, i) {
      var n = items.filter(function (it) { return m.id === "all" || it.disc === m.id; }).length;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (i === 0 ? " active" : "");
      b.innerHTML = esc(m.label) + " <span>" + n + "</span>";
      b.addEventListener("click", function () {
        if (b.classList.contains("active")) return;
        $$(".chip", chipsWrap).forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        current = m.id;
        render();
      });
      chipsWrap.appendChild(b);
    });

    if (!items.length) {
      grid.innerHTML = '<p style="color:var(--faint);grid-column:1/-1;padding:60px 0;text-align:center;">لا توجد مشاريع في هذا المجال حتى الآن.</p>';
    } else {
      render();
    }
    observeReveals(document);
  }

  /* ═══════════════════════════════════════════════════════
     صفحة المشروع (project.html?id=...)
     ═══════════════════════════════════════════════════════ */
  if (page === "project") {
    var id = new URLSearchParams(location.search).get("id") || "";
    var it = null;
    allProjects.forEach(function (p) {
      if (!it && (p.hash === id || (id.length > 12 && p.hash === id.slice(-10)) || (id.length > 12 && p.slug && p.slug.indexOf(id) !== -1))) it = p;
    });

    if (!it) {
      document.title = "المشروع غير موجود — RK Design Studio";
      $(".project-hero").innerHTML =
        '<div class="container">' +
          '<h1 style="font-weight:200;font-size:clamp(2rem,4vw,3rem);">المشروع غير موجود</h1>' +
          '<p class="project-desc">ربما تغيّر الرابط. تصفح الأعمال أو ارجع للرئيسية.</p>' +
          '<div style="margin-top:34px;display:flex;gap:14px;flex-wrap:wrap;">' +
            '<a class="pill pill-ink" href="works.html?f=space">أعمال الداخل</a>' +
            '<a class="pill pill-ink" href="works.html?f=brand">أعمال الجرافيك</a>' +
            '<a class="pill" href="./">الرئيسية</a>' +
          "</div>" +
        "</div>";
      $("#gallery").parentElement.style.display = "none";
      $("#projectCta").style.display = "none";
      $("#projectNav").style.display = "none";
      observeReveals(document);
      return;
    }

    var fieldF = it.disc === "graphic" ? "brand" : "space";
    document.title = it.title + " — RK Design Studio | رمضان قطب";

    $("#headBack").href = "works.html?f=" + fieldF;
    $("#backLink").href = "works.html?f=" + fieldF;
    $("#pDisc").textContent = FIELD_NAME[it.disc] || "مشروع";
    $("#pCat").textContent = it.cat || FIELD_TAG[it.disc] || "";
    $("#pTitle").textContent = it.title;
    $("#pDesc").textContent = descOf(it, true);
    var ideaEl = $("#pIdea");
    if (it.idea && it.idea.trim()) ideaEl.textContent = "الفكرة: " + it.idea.replace(/\s+/g, " ").trim();
    else ideaEl.style.display = "none";

    /* المواصفات */
    var meta = $("#pMeta");
    var rows = [
      ["المساحة", it.area],
      ["الموقع", it.loc],
      ["السنة", it.year],
      ["التصنيف", it.cat],
      ["الوسوم", it.tags.length ? it.tags.join("، ") : null],
      ["الخامات", it.materials.length ? it.materials.join("، ") : null]
    ];
    meta.innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
      return '<div class="row"><dt>' + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("");
    if (!meta.children.length) meta.style.display = "none";

    /* الجاليري */
    var mediaList = it.gallery;
    var gallery = $("#gallery");
    if (!mediaList.length && it.cover) mediaList = [it.cover];

    mediaList.forEach(function (src, i) {
      var d = document.createElement("div");
      d.className = "g-item reveal";
      d.style.setProperty("--d", (i % 3) * 0.06 + "s");
      if (isVideo(src)) {
        d.innerHTML = '<video muted loop playsinline preload="metadata" playsinline aria-hidden="true"><source src="' + esc(R + src) + '"></video>';
        var v = d.querySelector("video");
        if (window.matchMedia("(hover:hover)").matches) {
          d.addEventListener("mouseenter", function () { v.play().catch(function () {}); });
          d.addEventListener("mouseleave", function () { v.pause(); });
        }
      } else {
        d.innerHTML = '<img src="' + esc(R + src) + '" alt="' + esc(it.title) + " — " + (i + 1) + '" loading="lazy" width="1200" height="900">';
      }
      d.addEventListener("click", function () { openLB(i); });
      gallery.appendChild(d);
    });
    observeReveals(gallery);
    observeReveals(document);

    /* Lightbox */
    var lb = $("#lightbox"), stage = $("#lbStage"), count = $("#lbCount");
    var lbIdx = 0;
    function renderLB() {
      var src = mediaList[lbIdx];
      stage.innerHTML = "";
      if (isVideo(src)) {
        var v = document.createElement("video");
        v.src = R + src;
        v.controls = true;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.setAttribute("playsinline", "");
        if (!reduced) v.autoplay = true;
        stage.appendChild(v);
      } else {
        var im = document.createElement("img");
        im.src = R + src;
        im.alt = it.title;
        im.onload = function () { im.classList.add("ld"); };
        if (im.complete && im.naturalWidth) im.classList.add("ld");
        stage.appendChild(im);
      }
      count.textContent = pad2(lbIdx + 1) + " / " + pad2(mediaList.length);
    }
    function openLB(i) {
      lbIdx = i;
      renderLB();
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeLB() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      stage.innerHTML = "";
    }
    $("#lbClose").addEventListener("click", closeLB);
    $("#lbPrev").addEventListener("click", function () {
      lbIdx = (lbIdx - 1 + mediaList.length) % mediaList.length;
      renderLB();
    });
    $("#lbNext").addEventListener("click", function () {
      lbIdx = (lbIdx + 1) % mediaList.length;
      renderLB();
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLB(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLB();
      else if (e.key === "ArrowLeft") $("#lbNext").click();
      else if (e.key === "ArrowRight") $("#lbPrev").click();
    });

    /* المشروع السابق / التالي في نفس المجال */
    var fieldItems = allProjects.filter(function (p) {
      return fieldF === "brand" ? p.disc === "graphic" : (p.disc === "interior" || p.disc === "exterior");
    });
    var fi = -1;
    fieldItems.forEach(function (p, i) { if (p.hash === it.hash) fi = i; });
    if (fi > -1 && fieldItems.length > 1) {
      var prev = fieldItems[(fi - 1 + fieldItems.length) % fieldItems.length];
      var next = fieldItems[(fi + 1) % fieldItems.length];
      var nav = $("#projectNav");
      nav.innerHTML =
        '<a class="pn-card" href="project.html?id=' + prev.hash + '">' +
          "<small>المشروع السابق</small>" +
          "<b>" + esc(prev.title) + "</b>" +
        "</a>" +
        '<a class="pn-card next" href="project.html?id=' + next.hash + '">' +
          "<small>المشروع التالي</small>" +
          "<b>" + esc(next.title) + "</b>" +
        "</a>";
    } else {
      $("#projectNav").style.display = "none";
    }

    if (it.oldUrl) $("#oldProjectLink").href = it.oldUrl;
    else $("#oldProjectLink").style.display = "none";
  }
})();
