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
    return items.map(function (f, i) {
      f.candidates = [f.img];
      f.hash = f.hash || ("fb" + i);
      f.disc = f.disc || (/هوية|إعلان|جرافيك|شعار/.test(f.cat || "") ? "graphic" : "interior");
      f.field = f.disc === "graphic" ? "brand" : "space";
      f.desc = f.desc || "";
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
        disc: p.discipline || "",
        field: (p.discipline === "graphic") ? "brand" : "space",
        desc: p.excerpt || p.description || "",
        hash: hash,
        area: p.area || null,
        loc: p.location || null,
        year: p.year || null,
        url: p.url ? R + p.url : "../index.html",
        candidates: candidates.map(function (s) { return R + s; })
      };
    };

    // 8 أعمال مختارة متوازنة بين المجالين: 4 داخلي + 1 خارجي + 3 جرافيك
    var WORK_HASHES = [
      "914225e47c", // بنزية توتال سمنود (داتا الغلاف قديمة → override للمسار الصحيح)
      "1d92b09064", // شقة الشروق
      "2fe1f9c086", // شركة MEEM مكاتب اداريه
      "e3362dcb0f", // غرفة نوم ومعيشة التجمع
      "35b76057a9", // بنزية توتال سمنود — التصميم الخارجي
      "d9140e1865", // Nike AirStep Bloom Edition
      "2e5cb5b159", // AURION X
      "3209fdcb69"  // MILANO FOOTWEAR — هوية تجارية
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

    // 5 مصغرات في قسم الفلسفة: 3 داخلي + 2 جرافيك
    var THUMB_HASHES = ["1d92b09064", "2fe1f9c086", "914225e47c", "2e5cb5b159", "d9140e1865"];
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

  /* ── الأعمال المختارة — المجالين ────────────────────── */
  (function () {
    var spaceWrap = $("#spaceCards");
    var brandWrap = $("#brandCards");
    if (!spaceWrap || !brandWrap || !DATA.work.length) return;

    var esc = function (str) {
      return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    // نصوص مضبوطة على المساحات الفعلية (الأصلية فيها أخطاء نسخ)
    var DESC_OVERRIDES = {
      "1d92b09064": "شقة 120 مترًا — صالة استقبال تجمع البساطة والدفء: ألوان محايدة متناغمة، إضاءة مخفية بالأسقف الجبسية، وأثاث مختار بعناية يمنح إحساسًا بالرحابة.",
      "2fe1f9c086": "دور إداري 140 مترًا — مكاتب وغرفة اجتماعات بتصميم عملي وراقٍ يعكس هوية الشركة ويحافظ على اتساع الحركة.",
      "35b76057a9": "تصميم خارجي ولاندسكيب لمحطة وقود كاملة — حركة انسيابية للعملاء بين البنزين والصيانة والمطعم والسوبر ماركت."
    };

    function descOf(it) {
      var d = (DESC_OVERRIDES[it.hash] || it.desc || "").replace(/\s+/g, " ").trim();
      if (!d || d.indexOf("مشروع " + it.title) === 0) d = (it.cat || "مشروع من أعمال الاستوديو") + " — رمضان قطب.";
      if (d.length > 180) d = d.slice(0, 177).replace(/\s+\S*$/, "") + "…";
      return d;
    }

    var FIELD_TAG = { interior: "داخلي", exterior: "خارجي", graphic: "جرافيك" };

    function makeCard(it) {
      var a = document.createElement("a");
      a.className = "pcard reveal";
      a.href = it.url;
      a.target = "_blank";
      a.rel = "noopener";
      var tag = FIELD_TAG[it.disc] || "";
      var metaParts = [it.area, it.loc, it.year].filter(Boolean);
      a.innerHTML =
        '<div class="pcard-media">' +
          '<img alt="' + esc(it.title) + '" loading="lazy" width="800" height="600">' +
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
      img.onerror = function () {
        ci++;
        if (ci < it.candidates.length) { img.src = it.candidates[ci]; }
        else { img.src = R + "images/homepage/hero-slide-1-interior.webp"; img.onerror = null; }
      };
      img.src = it.candidates[0];
      return a;
    }

    var si = 0, bi = 0;
    DATA.work.forEach(function (it) {
      if (it.field === "brand") {
        var c = makeCard(it);
        c.style.setProperty("--d", (bi++ % 3) * 0.08 + "s");
        brandWrap.appendChild(c);
      } else {
        var c2 = makeCard(it);
        c2.style.setProperty("--d", (si++ % 3) * 0.08 + "s");
        spaceWrap.appendChild(c2);
      }
    });

    $$(".pcard").forEach(function (el) { io.observe(el); });
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
      var discTag = { interior: "داخلي", exterior: "خارجي", graphic: "جرافيك" }[it.disc] || "";
      a.innerHTML =
        '<img src="' + it.candidates[0] + '" alt="' + it.title.replace(/"/g, "&quot;") + '" loading="lazy" width="600" height="800">' +
        (discTag ? '<span class="thumb-tag">' + discTag + "</span>" : "") +
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
