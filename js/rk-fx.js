/* ══════════════════════════════════════════════════════════════
   RK DESIGN STUDIO — FX Engine
   إبهار + حركة + إيموشن — كله خفيف على الـ GPU (transform/opacity فقط)
   بيحترم prefers-reduced-motion وبيتعطّل تلقائيًا على اللمس حيث يلزم.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var canHover= window.matchMedia('(hover: hover)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {

    /* ─────────────────────────────────────────
       1) PRELOADER — فعّل ستارة الـ curtain
       ───────────────────────────────────────── */
    var loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('rk-enhanced');
      setTimeout(function () { if (loader) { loader.style.opacity = '0'; loader.style.visibility = 'hidden'; } }, 2000);
    }

    /* ─────────────────────────────────────────
       1.5) صور المشاريع المكسورة → بديل أنيق
       (capture-phase عشان error مش بيتعمله bubble)
       ───────────────────────────────────────── */
    document.addEventListener('error', function (e) {
      var el = e.target;
      if (!el || el.tagName !== 'IMG' || el.dataset.rkFixed) return;
      var media = el.closest('.project-card-media');
      if (!media) return;
      el.dataset.rkFixed = '1';
      var card = media.closest('.project-card');
      var h3 = card ? card.querySelector('h3') : null;
      var ph = document.createElement('div');
      ph.className = 'rk-img-fallback';
      if (h3 && h3.textContent) ph.setAttribute('data-text', h3.textContent);
      el.replaceWith(ph);
    }, true);

    /* ─────────────────────────────────────────
       2) SPLIT-TEXT — تقسيم كلمات العناوين + reveal
       (هيرو الرئيسية + عناوين page-hero في صفحات الأقسام)
       ───────────────────────────────────────── */
    function splitEl(el) {
      el.classList.add('rk-split');
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);

      var idx = 0;
      nodes.forEach(function (node) {
        var parent = node.parentNode;
        var parts = node.nodeValue.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (p === '') return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          var o = document.createElement('span'); o.className = 'rk-word';
          var i = document.createElement('span'); i.className = 'rk-word-i';
          i.textContent = p;
          i.style.transitionDelay = (idx * 0.045) + 's';
          o.appendChild(i); frag.appendChild(o); idx++;
        });
        parent.replaceChild(frag, node);
      });
    }

    function revealEl(el) {
      el.classList.remove('rk-split-in');
      void el.offsetWidth;
      el.classList.add('rk-split-in');
      el.querySelectorAll('.rk-word-i').forEach(function (w) {
        setTimeout(function () { w.style.transform = 'translateY(0)'; }, 1000);
      });
    }

    var splitTargets = Array.prototype.slice.call(
      document.querySelectorAll('#hero-title')   /* split للرئيسية فقط — صفحات الأقسام بتظهر طبيعي */
    );

    splitTargets.forEach(function (el) {
      splitEl(el);
      // الديناميك بس: هيرو الرئيسية بيتغيّر مع كل شريحة
      if (el.id === 'hero-title') {
        var mo = new MutationObserver(function () {
          mo.disconnect();
          splitEl(el);
          revealEl(el);
          mo.observe(el, { childList: true, characterData: true, subtree: true });
        });
        mo.observe(el, { childList: true, characterData: true, subtree: true });
      }
    });

    function revealAllSplits() { splitTargets.forEach(revealEl); }

    if (loader && splitTargets.length) {
      var lmo = new MutationObserver(function () {
        if (loader.classList.contains('loaded')) {
          lmo.disconnect();
          setTimeout(revealAllSplits, 350);
        }
      });
      lmo.observe(loader, { attributes: true, attributeFilter: ['class'] });
      setTimeout(revealAllSplits, 1800);   // fallback
    } else if (splitTargets.length) {
      setTimeout(revealAllSplits, 400);
    }

    /* ─────────────────────────────────────────
       3) AURORA — طبقة ضوء ذهبية بتدور فوق الهيرو
       ───────────────────────────────────────── */
    var hero = document.querySelector('.hero');
    if (hero && !reduced) {
      var aurora = document.createElement('div');
      aurora.className = 'rk-aurora';
      hero.insertBefore(aurora, hero.firstChild);
    }

    /* ─────────────────────────────────────────
       10) GRAIN + SPOTLIGHT (حقن)
       ───────────────────────────────────────── */
    // 10a) طبقة الحبيبات السينمائية
    var grain = document.createElement('div');
    grain.id = 'rk-grain';
    grain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grain);

    // 10b) بقعة ضوء على الهيرو بتتبع الماوس (desktop)
    if (hero && fine && !reduced) {
      var spot = document.createElement('div');
      spot.className = 'rk-spotlight';
      hero.insertBefore(spot, hero.firstChild);
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        spot.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        spot.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    }

    if (reduced) return;                    // الباقي حركة — نوقفه لـ reduced-motion

    /* ─────────────────────────────────────────
       5) CUSTOM CURSOR — حلقة + نقطة (desktop)
       ───────────────────────────────────────── */
    if (fine) {
      document.body.classList.add('rk-has-cursor');
      var dot = document.createElement('div'); dot.className = 'rk-cursor-dot';
      var ring = document.createElement('div'); ring.className = 'rk-cursor-ring';
      document.body.append(dot, ring);

      var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      });
      (function loop() {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
        requestAnimationFrame(loop);
      })();

      var sel = 'a,button,.service-card,.pillar,.project-card,.feature,.step,[data-cursor]';
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest(sel)) ring.classList.add('rk-active');
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest(sel)) ring.classList.remove('rk-active');
      });
      window.addEventListener('mousedown', function () { ring.style.height = ring.style.width = '30px'; ring.style.margin = '-15px 0 0 -15px'; });
      window.addEventListener('mouseup',   function () { ring.style.height = ring.style.width = ''; ring.style.margin = ''; });
      document.addEventListener('mouseleave', function () { dot.style.opacity = ring.style.opacity = '0'; });
      document.addEventListener('mouseenter', function () { dot.style.opacity = ring.style.opacity = '1'; });
    }

    /* ─────────────────────────────────────────
       6) MAGNETIC BUTTONS — الزرار بتميل ناحية الماوس
       ───────────────────────────────────────── */
    if (canHover) {
      document.querySelectorAll('.btn-primary, .hero-btns .btn').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var x = e.clientX - r.left - r.width / 2;
          var y = e.clientY - r.top - r.height / 2;
          el.style.transform = 'translate(' + (x * 0.25) + 'px,' + (y * 0.4) + 'px)';
        });
        el.addEventListener('mouseleave', function () { el.style.transform = ''; });
      });
    }

    /* ─────────────────────────────────────────
       7) IMAGE TILT + SHEEN على كروت الخدمات
       ───────────────────────────────────────── */
    if (canHover) {
      var grid = document.querySelector('.services-grid');
      if (grid) grid.classList.add('rk-tilt-wrap');
      document.querySelectorAll('.service-card').forEach(function (card) {
        card.classList.add('rk-sheen', 'rk-tilt');
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          var rotX = (0.5 - py) * 7;
          var rotY = (px - 0.5) * 7;
          card.style.transform = 'perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
        });
        card.addEventListener('mouseleave', function () { card.style.transform = ''; });
      });
    }

    /* ─────────────────────────────────────────
       8) PARALLAX خفيف — عمق سينمائي عند السكرول
       ───────────────────────────────────────── */
    var parEls = [];
    var aboutImg = document.querySelector('.about-img-wrap');
    if (aboutImg) { aboutImg.classList.add('rk-parallax'); aboutImg.setAttribute('data-rk-speed', '0.06'); parEls.push(aboutImg); }
    var statCard = document.querySelector('.about-stat-card');
    if (statCard) { statCard.setAttribute('data-rk-speed', '0.18'); parEls.push(statCard); }

    if (parEls.length) {
      var ticking = false;
      function update() {
        var vh = window.innerHeight;
        parEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var center = r.top + r.height / 2;
          var offset = (center - vh / 2) / vh;
          var speed = parseFloat(el.getAttribute('data-rk-speed')) || 0.1;
          el.style.transform = 'translate3d(0,' + (-offset * speed * 100).toFixed(2) + 'px,0)';
        });
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      update();
    }

  });

})();
