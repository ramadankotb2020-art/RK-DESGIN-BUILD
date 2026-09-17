/* ═══════════════════════════════════════════════════════════
   RK Design Studio — Studio Edition
   stanzza-inspired interactions
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var R = "../"; // prefix: الصفحة داخل /stanzza/ والبيانات في جذر الموقع

  /* ── البيانات: نقرأ من ملف الموقع الأساسي (قراءة فقط) ── */
  var FALLBACK = [
    { title: "شقة عصرية — القاهرة", cat: "شقق سكنية", area: "120 م²", loc: "القاهرة", year: "2024", url: "../index.html", img: R + "images/homepage/hero-slide-1-interior.webp" },
    { title: "هوية بصرية متكاملة", cat: "هوية بصرية", area: null, loc: "القاهرة", year: "2025", url: "../index.html", img: R + "images/homepage/hero-slide-2-graphic.webp" },
    { title: "واجهة معمارية ولاندسكيب", cat: "تصميم خارجي ولاندسكيب", area: null, loc: "القاهرة", year: "2025", url: "../index.html", img: R + "images/homepage/hero-slide-3-exterior.webp" },
    { title: "مكتب إداري", cat: "مكاتب ادارية", area: "140 م²", loc: "المنصورة", year: "2026", url: "../index.html", img: R + "images/homepage/service-01-interior-residential.webp" },
    { title: "مطعم — القاهرة", cat: "مطاعم", area: "150 م", loc: "القاهرة", year: "2024", url: "../index.html", img: R + "images/homepage/service-02-interior-commercial.webp" }
  ];

  function normalize(items) {
    return items.map(function (f) {
      f.candidates = [f.img];
      return f;
    });
  }

  function loadProjects() {
    var data = (typeof projectsData !== "undefined") ? projectsData : (window.projectsData || null);
    if (!data || !data.length) {
      var fb = normalize(FALLBACK.slice());
      return { work: fb, thumbs: fb.slice(0, 5), hero: [
        { img: R + "images/homepage/hero-slide-1-interior.webp", alt: "تصميم داخلي" },
        { img: R + "images/homepage/hero-slide-2-graphic.webp", alt: "هوية بصرية" },
        { img: R + "images/homepage/hero-slide-3-exterior.webp", alt: "واجهة معمارية" }
      ] };
    }
    var bySlug = function (hash) {
      for (var i = 0; i < data.length; i++) {
        if ((data[i].slug || "").indexOf(hash) !== -1 || (data[i].legacyId || "").indexOf(hash) !== -1) return data[i];
      }
      return null;
    };
    var map = function (hash, imgOverride) {
      var p = bySlug(hash);
      if (!p) return null;
      var candidates = [];
      var push = function (s) { if (s && candidates.indexOf(s) === -1) candidates.push(s); };
      push(imgOverride || p.cover);
      (p.gallery || []).forEach(function (g) {
        if (typeof g === "string" && /\.webp(\?|$)/i.test(g)) push(g);
      });
      push(R + "images/homepage/hero-slide-1-interior.webp");
      return {
        title: p.title,
        cat: p.category,
        area: p.area || null,
        loc: p.location || null,
        year: p.year || null,
        url: p.url ? R + p.url : "../index.html",
        candidates: candidates.map(function (s) { return R + s; })
      };
    };

    // 8 أعمال مختارة: داخلي · خارجي · جرافيك
    var WORK_HASHES = [
      "914225e47c", // بنزية توتال سمنود (داتا الغلاف قديمة → override للمسار الصحيح)
      "1d92b09064", // شقة الشروق
      "2fe1f9c086", // شركة MEEM مكاتب اداريه
      "e3362dcb0f", // غرفة نوم ومعيشة التجمع
      "e22126e2de", // مطعم الحياة
      "35b76057a9", // بنزية توتال سمنود — التصميم الخارجي
      "d9140e1865", // Nike AirStep Bloom Edition
      "2e5cb5b159"  // AURION X
    ];
    var WORK_IMG_OVERRIDES = {
      "914225e47c": "images/projects-by-name/interior/بنزية توتال سمنود- التصميم الخارجي/بنزية توتال سمنود (1).webp"
    };
    var work = WORK_HASHES.map(function (h) { return map(h, WORK_IMG_OVERRIDES[h]); }).filter(Boolean);
    if (!work.length) {
      var fb = normalize(FALLBACK.slice());
      return { work: fb, thumbs: fb.slice(0, 5), hero: [
        { img: R + "images/homepage/hero-slide-1-interior.webp", alt: "تصميم داخلي" },
        { img: R + "images/homepage/hero-slide-2-graphic.webp", alt: "هوية بصرية" },
        { img: R + "images/homepage/hero-slide-3-exterior.webp", alt: "واجهة معمارية" }
      ] };
    }

    // 5 مصغرات في قسم الفلسفة
    var THUMB_HASHES = ["1d92b09064", "2fe1f9c086", "914225e47c", "2e5cb5b159", "e22126e2de"];
    var thumbs = THUMB_HASHES.map(function (h) { return map(h, WORK_IMG_OVERRIDES[h]); }).filter(Boolean);

    // شريط الهيرو: 3 شرائح من الصفحة الرئيسية + 3 من الأعمال
    var hero = [
      { img: R + "images/homepage/hero-slide-1-interior.webp", alt: "تصميم داخلي" },
      (function () { var p = map("35b76057a9"); return p ? { img: p.candidates[0], alt: p.title } : null; })(),
      { img: R + "images/homepage/hero-slide-2-graphic.webp", alt: "هوية بصرية" },
      (function () { var p = map("1d92b09064"); return p ? { img: p.candidates[0], alt: p.title } : null; })(),
      { img: R + "images/homepage/hero-slide-3-exterior.webp", alt: "واجهة معمارية" },
      (function () { var p = map("d9140e1865"); return p ? { img: p.candidates[0], alt: p.title } : null; })()
    ].filter(Boolean);

    return { work: work, thumbs: thumbs, hero: hero };
  }

  var DATA = loadProjects();

  /* ── التحميل الأولي ─────────────────────────────────── */
  var readyDone = false;
  var pending = [];
  function flushPending() {
    pending.forEach(function (el) { el.classList.add("in"); });
    pending.length = 0;
  }
  function markReady() {
    if (readyDone) return;
    readyDone = true;
    var loader = $("#loader");
    if (loader) loader.classList.add("done");
    document.body.classList.add("ready");
    flushPending();
  }
  window.addEventListener("load", function () { setTimeout(markReady, 1400); });
  setTimeout(markReady, 3200); // حد أقصى أماناً

  /* ── تقسيم العناوين كلمات + كشف عند التمرير ───────── */
  function splitWords(el) {
    var i = 0;
    function wrapText(text) {
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
        var w = document.createElement("span");
        w.className = "w";
        var wi = document.createElement("span");
        wi.className = "wi";
        wi.textContent = tok;
        wi.style.setProperty("--i", i++);
        w.appendChild(wi);
        frag.appendChild(w);
      });
      return frag;
    }
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) { // نص
          if (!child.textContent.trim()) return;
          node.replaceChild(wrapText(child.textContent), child);
        } else if (child.nodeType === 1) { // عنصر
          if (child.childNodes.length === 1 && child.firstChild.nodeType === 3) {
            // عنصر بسيط فيه نص (مثل span.accent) → نقسم نصه الداخلي
            var t = child.firstChild.textContent;
            child.textContent = "";
            child.appendChild(wrapText(t));
          } else {
            walk(child); // br يمشي من هنا بدون تغيير
          }
        }
      });
    })(el);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      io.unobserve(el);
      if (readyDone) el.classList.add("in");
      else pending.push(el);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });

  $$("[data-words]").forEach(function (el) { splitWords(el); io.observe(el); });
  $$(".reveal").forEach(function (el) { io.observe(el); });

  /* ── كلمة COMPOSED الرأسية ─────────────────────────── */
  (function () {
    var track = $("#vwordTrack");
    if (!track) return;
    var word = "COMPOSED";
    var html = "";
    for (var r = 0; r < 2; r++) { // نسخة مضاعفة للحلقة
      for (var c = 0; c < word.length; c++) {
        html += '<b' + (c === word.length - 1 ? ' class="gold"' : "") + ">" + word[c] + "</b>";
      }
    }
    track.innerHTML = html;
  })();

  /* ── هيرو: صور متقاطعة مع Ken Burns ────────────────── */
  (function () {
    var media = $("#heroMedia");
    if (!media || !DATA.hero.length) return;
    var slides = DATA.hero;
    var layers = [document.createElement("img"), document.createElement("img")];
    layers.forEach(function (img) {
      img.alt = "";
      img.decoding = "async";
      media.appendChild(img);
    });
    var cur = -1;
    var num = $("#heroNum"), total = $("#heroTotal"), prog = $("#heroProg");
    if (total) total.textContent = pad2(slides.length);
    var HERO_MS = 5200;

    function show(i) {
      cur = i;
      var img = layers[i % 2];
      function setOn() {
        layers.forEach(function (l) { l.classList.remove("on", "kb"); });
        void img.offsetWidth;
        if (!reduced) img.classList.add("kb");
        img.classList.add("on");
        if (num) num.textContent = pad2(i + 1);
        if (prog && !reduced) {
          prog.classList.remove("run");
          void prog.offsetWidth;
          prog.classList.add("run");
          prog.style.setProperty("--dur", HERO_MS + "ms");
        }
      }
      if (img.getAttribute("src") !== slides[i].img) {
        var done = false;
        var finish = function () {
          if (done || cur !== i) return;
          done = true;
          setOn();
        };
        img.onload = finish;
        img.src = slides[i].img;
        if (img.complete && img.naturalWidth) finish();
        // الصورة القديمة تبقى ظاهرة لحد ما الجديدة تخلص التحميل
      } else {
        setOn();
      }
    }

    // تحميل مسبق لكل الصور
    slides.forEach(function (s) { var p = new Image(); p.src = s.img; });

    show(0);
    if (!reduced) setInterval(function () {
      if (document.hidden) return;
      show((cur + 1) % slides.length);
    }, HERO_MS);
  })();

  /* ── شريط الأعمال ───────────────────────────────────── */
  (function () {
    var wrap = $("#workMedia");
    var info = $("#workInfo");
    if (!wrap || !info || !DATA.work.length) return;

    var items = DATA.work;
    var imgs = items.map(function (it, i) {
      var img = document.createElement("img");
      img.alt = it.title;
      img.loading = "lazy";
      img.decoding = "async";
      wrap.appendChild(img);
      return img;
    });
    var num = $("#wNum"), total = $("#wTotal"),
        wCat = $("#wCat"), wTitle = $("#wTitle"),
        wArea = $("#wArea"), wLoc = $("#wLoc"), wYear = $("#wYear"),
        wLink = $("#wLink"), prog = $("#wProg");
    if (total) total.textContent = pad2(items.length);

    var cur = -1;
    var timer = null;
    var WORK_MS = 6800;

    function fillMeta(el, v) {
      if (el === null) return;
      if (v) { el.textContent = v; el.classList.remove("none"); }
      else { el.textContent = "—"; el.classList.add("none"); }
    }

    function loadNear(i) {
      [i, (i + 1) % items.length, (i - 1 + items.length) % items.length].forEach(function (k) {
        var img = imgs[k];
        if (img.dataset.loaded) return;
        var it = items[k];
        var ci = 0;
        img.dataset.fail = "0";
        img.onload = null;
        img.onerror = function () {
          ci = (+img.dataset.fail || 0) + 1;
          if (ci < it.candidates.length) {
            img.dataset.fail = String(ci);
            img.src = it.candidates[ci];
          }
        };
        img.dataset.loaded = "1";
        img.src = it.candidates[0];
      });
    }

    function show(i, manual) {
      cur = (i + items.length) % items.length;
      var it = items[cur];
      loadNear(cur);
      imgs.forEach(function (img, k) { img.classList.toggle("on", k === cur); });
      if (num) num.textContent = pad2(cur + 1);

      info.classList.add("swap");
      setTimeout(function () {
        wCat.textContent = it.cat || "مشروع";
        wTitle.textContent = it.title;
        fillMeta(wArea, it.area);
        fillMeta(wLoc, it.loc);
        fillMeta(wYear, it.year);
        if (wLink) wLink.href = it.url;
        info.classList.remove("swap");
      }, 320);

      if (prog && !reduced) {
        prog.classList.remove("run");
        void prog.offsetWidth;
        prog.classList.add("run");
        prog.style.setProperty("--dur", WORK_MS + "ms");
      }
      if (manual) restart();
    }

    function restart() {
      if (reduced) return;
      clearInterval(timer);
      timer = setInterval(function () {
        if (document.hidden || sectionHover) return;
        show(cur + 1);
      }, WORK_MS);
    }

    var section = $("#work");
    var sectionHover = false;
    if (section) {
      section.addEventListener("mouseenter", function () { sectionHover = true; });
      section.addEventListener("mouseleave", function () { sectionHover = false; });
    }

    var next = $("#wNext"), prev = $("#wPrev");
    if (next) next.addEventListener("click", function () { show(cur + 1, true); });
    if (prev) prev.addEventListener("click", function () { show(cur - 1, true); });

    // سحب باللمس
    var startX = null;
    if (wrap) {
      wrap.addEventListener("pointerdown", function (e) { startX = e.clientX; });
      window.addEventListener("pointerup", function (e) {
        if (startX === null) return;
        var dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 44) show(cur + (dx < 0 ? 1 : -1), true);
      });
    }

    // الأسهم من الكيبورد (عندما يكون الشريط في الشاشة)
    window.addEventListener("keydown", function (e) {
      if (!section) return;
      var r = section.getBoundingClientRect();
      if (r.bottom < 120 || r.top > window.innerHeight - 120) return;
      if (e.key === "ArrowLeft") show(cur + 1, true);
      else if (e.key === "ArrowRight") show(cur - 1, true);
    });

    show(0);
    restart();
  })();

  /* ── مصغرات قسم الفلسفة ────────────────────────────── */
  (function () {
    var wrap = $("#thumbs");
    if (!wrap || !DATA.thumbs.length) return;
    DATA.thumbs.forEach(function (it, i) {
      var a = document.createElement("a");
      a.className = "thumb reveal";
      a.href = it.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.style.setProperty("--d", (i * 0.08) + "s");
      a.innerHTML =
        '<img src="' + it.candidates[0] + '" alt="' + it.title.replace(/"/g, "&quot;") + '" loading="lazy" width="600" height="800">' +
        '<span class="thumb-index">' + pad2(i + 1) + "</span>" +
        '<span class="thumb-label">view <span class="arr">↗</span></span>';
      a.querySelector("img").addEventListener("error", function () {
        this.src = R + "images/homepage/hero-slide-1-interior.webp";
        this.onerror = null;
      });
      wrap.appendChild(a);
    });
    $$(".thumb", wrap).forEach(function (el) { io.observe(el); });
  })();

  /* ── عدّادات الإحصائيات ────────────────────────────── */
  (function () {
    var counters = $$("[data-counter]");
    if (!counters.length) return;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        cio.unobserve(el);
        var target = +el.getAttribute("data-counter");
        if (reduced) { el.textContent = String(target); return; }
        var t0 = null, DUR = 1500;
        function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / DUR, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  })();

  /* ── ماركيا العملاء (تكرار الحلقة) ─────────────────── */
  (function () {
    var track = $("#mqTrack");
    if (!track) return;
    var g = track.querySelector(".mq-group");
    if (g) track.appendChild(g.cloneNode(true));
  })();

  /* ── الهيدر عند التمرير ─────────────────────────────── */
  (function () {
    var header = $("#site-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 40); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* ── قائمة الجوال ───────────────────────────────────── */
  (function () {
    var btn = $("#navToggle");
    var overlay = $("#menuOverlay");
    if (!btn || !overlay) return;
    function setOpen(v) {
      document.body.classList.toggle("menu-open", v);
      btn.setAttribute("aria-expanded", String(v));
      btn.setAttribute("aria-label", v ? "إغلاق القائمة" : "فتح القائمة");
    }
    btn.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("menu-open"));
    });
    $$("a", overlay).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  })();

  /* ── إدارة المظاهر (themes) ─────────────────────────── */
  (function () {
    var THEMES = {
      clay:     { bg: "#f4efe7" }, // طين (افتراضي)
      forest:   { bg: "#131812" }, // غابة
      espresso: { bg: "#171009" }, // إسبريسو
      midnight: { bg: "#0b0a08" }  // ليل (الأصلي)
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
      if (save !== false) {
        try { localStorage.setItem(KEY, t); } catch (e) {}
      }
      setTimeout(function () { html.classList.remove("theming"); }, 700);
    }

    $$(".theme-dot").forEach(function (d) {
      d.addEventListener("click", function () {
        apply(d.getAttribute("data-set-theme"));
      });
    });

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    apply(saved && THEMES[saved] ? saved : "clay", false);
  })();

  /* ── سنة الحقوق ──────────────────────────────────────── */
  var y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
