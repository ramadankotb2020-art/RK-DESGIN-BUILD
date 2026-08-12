(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     PARALLAX BANNERS — ديكور + جرافيك
     • ديسكتوب:  فيديو خلفية (mute + loop + lazy + pause off-screen)
     • موبايل / توفير بيانات / reduced-motion: صورة (أخف)
     • الصورة بتتغير كل ساعة + fallback لو الصورة ناقصة
     • الصورة بتظهر فوري، والفيديو بيعمل fade فوقها لما يجهز
     ══════════════════════════════════════════════════════════════ */

  const HOUR     = 60 * 60 * 1000;
  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const useVideo = !reduced && !saveData && !isMobile;   /* فيديو للديسكتوب بس */

  const elInterior = document.getElementById('parallax-img-interior');
  const elGraphic  = document.getElementById('parallax-img-graphic');
  if (!elInterior && !elGraphic) return;

  /* فيديو لكل تخصص (تقدر تغيّر المسارات من هنا) */
  const VIDEOS = {
    interior: 'videos/hero-bg.mp4',
    graphic:  'videos/2.mp4'
  };

  /* ─── مصدر الصور ─── */
  function getCovers(discipline) {
    const all = window.projectsData || window.PROJECTS_FALLBACK || [];
    return all.filter(p => p.discipline === discipline).map(p => p.cover).filter(Boolean);
  }

  function orderedCovers(discipline, offset) {
    const arr = getCovers(discipline);
    if (!arr.length) return [];
    const start = (Math.floor(Date.now() / HOUR) + (offset || 0)) % arr.length;
    return arr.slice(start).concat(arr.slice(0, start));
  }

  /* حمّل أول صورة شغّالة من القائمة (fallback chain) → خلفية فورية */
  function loadFirstAvailable(el, list, fade) {
    if (!el || !list.length) return;
    let i = 0;
    (function tryNext() {
      if (i >= list.length) return;
      const src = list[i++];
      const img = new Image();
      img.onload = () => {
        if (fade) {
          el.style.transition = 'opacity 1.5s ease-in-out';
          el.style.opacity = '0';
          setTimeout(() => { el.style.backgroundImage = `url('${src}')`; el.style.opacity = '1'; }, 600);
        } else {
          el.style.backgroundImage = `url('${src}')`;
        }
      };
      img.onerror = tryNext;
      img.src = src;
    })();
  }

  /* ─── فيديو خلفية للبانر ─── */
  function buildVideo(el, videoSrc) {
    if (!el || !videoSrc) return;
    const v = document.createElement('video');
    v.className = 'rk-parallax-video';
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    v.preload = 'none';
    v.disablePictureInPicture = true;
    v.src = videoSrc;
    /* fade فوق الصورة لما يبدأ يشغّل */
    v.addEventListener('playing', () => { v.style.opacity = '1'; });
    el.appendChild(v);

    /* شغّل لما البانر يدخل الشاشة، وقّف لما يطلع */
    const banner = el.closest('.parallax-banner') || el;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          v.load();
          const p = v.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.15 });
    obs.observe(banner);

    /* وقّف الفيديو لو التب اختفى (توفير موارد) */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) v.pause();
    }, { passive: true });
  }

  /* ─── فيديوهات مشاريع التخصص (للدوران التلقائي كل ساعة) ─── */
  function getProjectVideos(discipline) {
    const all = window.projectsData || window.PROJECTS_FALLBACK || [];
    return all.filter(p => p.discipline === discipline && p.video).map(p => p.video);
  }

  /* ─── تهيئة بانر واحد ─── */
  function setupBanner(el, discipline, offset) {
    if (!el) return;
    /* 1) صورة فورية (بتبان أول، وبتفضل كـ fallback لو الفيديو فشل) */
    loadFirstAvailable(el, orderedCovers(discipline, offset), false);
    /* 2) فيديو فوقها على الديسكتوب — يدور على فيديوهات المشاريع تلقائيًا،
          ولو لسه مفيش → بيستخدم الفيديو الثابت من VIDEOS */
    if (useVideo) {
      const vids = getProjectVideos(discipline);
      let src = null;
      if (vids.length) src = vids[(Math.floor(Date.now() / HOUR) + offset) % vids.length];
      if (!src) src = VIDEOS[discipline];
      buildVideo(el, src);
    }
  }

  /* ─── Mobile JS Parallax (للصور بس) ─── */
  function initMobileParallax() {
    if (!isMobile || useVideo) return;
    const banners = [
      { img: elInterior, banner: elInterior && elInterior.closest('.parallax-banner') },
      { img: elGraphic,  banner: elGraphic  && elGraphic.closest('.parallax-banner')  }
    ].filter(b => b.img && b.banner);
    if (!banners.length) return;
    let ticking = false;
    function updateParallax() {
      banners.forEach(({ img, banner }) => {
        const rect = banner.getBoundingClientRect();
        const viewH = window.innerHeight;
        if (rect.bottom < 0 || rect.top > viewH) return;
        const progress = 1 - (rect.bottom / (viewH + rect.height));
        const move = (progress - 0.5) * banner.offsetHeight * 0.3;
        img.style.transform = `translateY(${move}px)`;
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* ─── Init ─── */
  function init() {
    setupBanner(elInterior, 'interior', 0);
    setupBanner(elGraphic,  'graphic',  3);
    initMobileParallax();
    /* كل ساعة: جدّد الصورة (للموبايل/الـ fallback) */
    setInterval(() => {
      if (!useVideo) {
        loadFirstAvailable(elInterior, orderedCovers('interior', 0), true);
        loadFirstAvailable(elGraphic,  orderedCovers('graphic',  3), true);
      }
    }, HOUR);
  }

  function tryInit() {
    if (window.projectsData || window.PROJECTS_FALLBACK) init();
    else setTimeout(tryInit, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryInit);
  else tryInit();

})();
