/* ================================================================
   RK DESIGN STUDIO — Category Hero Slideshow v1.2
   Ken Burns · Fade · IntersectionObserver · Lazy · تحقق من الصور
   (بيعرض بس الصور الموجودة فعلاً — لو واحدة ناقصة بيتخطاها)
================================================================ */
(function () {
  'use strict';

  const heroSection = document.querySelector('[data-category-hero]');
  if (!heroSection) return;

  const discipline = heroSection.getAttribute('data-category-hero');
  const container  = heroSection.querySelector('.page-hero-slideshow');
  if (!container) return;

  /* ─── Wait for projectsData ─── */
  function init() {
    const allProjects = window.projectsData || window.PROJECTS_FALLBACK || [];
    const projects    = allProjects.filter(p => p.discipline === discipline);
    if (!projects.length) return;

    /* ─── Collect one unique image per project ─── */
    const seen   = new Set();
    const images = [];
    projects.forEach(p => {
      const candidates = [
        p.cover, p.thumbnail, p.featuredImage, p.image,
        ...(p.gallery || [])
      ].filter(Boolean);
      for (const src of candidates) {
        if (!seen.has(src)) { seen.add(src); images.push(src); break; }
      }
    });
    if (!images.length) return;

    /* ─── Validate: keep only images that actually load ─── */
    function filterValid(urls, cb) {
      const ok = [];
      let pending = urls.length;
      if (!pending) return cb([]);
      urls.forEach(u => {
        const t = new Image();
        t.onload  = () => { ok.push(u); if (!--pending) cb(ok); };
        t.onerror = () => { if (!--pending) cb(ok); };
        t.src = u;
      });
    }

    filterValid(images, function (validImages) {
      if (!validImages.length) return;
      build(validImages);
    });
  }

  /* ─── Build the slideshow from validated images ─── */
  function build(images) {
    /* Shuffle */
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }

    /* Ken Burns keyframes (once) */
    const KB = ['rk-kb-1','rk-kb-2','rk-kb-3','rk-kb-4','rk-kb-5','rk-kb-6'];
    if (!document.getElementById('rk-kb-styles')) {
      const s = document.createElement('style');
      s.id = 'rk-kb-styles';
      s.textContent = `
        @keyframes rk-kb-1{from{transform:scale(1.0) translate(0,0)}    to{transform:scale(1.05) translate(-0.5%,-0.5%)}}
        @keyframes rk-kb-2{from{transform:scale(1.05) translate(0,0)}   to{transform:scale(1.0)  translate(0.5%, 0.5%)}}
        @keyframes rk-kb-3{from{transform:scale(1.0) translate(0.5%,0)} to{transform:scale(1.04) translate(-0.5%,0.3%)}}
        @keyframes rk-kb-4{from{transform:scale(1.04) translate(-0.5%,0)} to{transform:scale(1.0) translate(0.5%,-0.3%)}}
        @keyframes rk-kb-5{from{transform:scale(1.0) translate(0,0.5%)} to{transform:scale(1.05) translate(0,-0.5%)}}
        @keyframes rk-kb-6{from{transform:scale(1.05) translate(0,-0.5%)} to{transform:scale(1.0) translate(0, 0.5%)}}
      `;
      document.head.appendChild(s);
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const INTERVAL = 6000;
    const FADE_DUR = 1200;

    const slideEls = images.map((src, i) => {
      const slide = document.createElement('div');
      slide.style.cssText = `
        position:absolute;inset:0;
        opacity:${i === 0 ? 1 : 0};
        transition:opacity ${FADE_DUR}ms ease-in-out;
      `;
      const img = document.createElement('div');
      img.style.cssText = `
        position:absolute;inset:0;
        background-size:cover;
        background-position:center;
        transform-origin:center;
        ${!reducedMotion ? `animation:${KB[i % KB.length]} 12s ease-in-out infinite alternate;` : ''}
      `;
      if (i === 0) img.style.backgroundImage = `url('${src}')`;
      else img.dataset.bg = src;
      slide.appendChild(img);
      container.appendChild(slide);
      return { slide, img, src, loaded: i === 0 };
    });

    function ensureLoaded(idx) {
      const e = slideEls[idx];
      if (!e || e.loaded) return;
      e.img.style.backgroundImage = `url('${e.src}')`;
      e.loaded = true;
    }

    let current = 0;
    let timer   = null;

    function nextSlide() {
      const prev = current;
      current    = (current + 1) % slideEls.length;
      ensureLoaded(current);
      ensureLoaded((current + 1) % slideEls.length);
      if (!reducedMotion) {
        slideEls[current].img.style.animationName = KB[(current + 2) % KB.length];
      }
      slideEls[current].slide.style.opacity = '1';
      setTimeout(() => { slideEls[prev].slide.style.opacity = '0'; }, FADE_DUR);
    }

    function startTimer() {
      if (slideEls.length <= 1) return;
      clearInterval(timer);
      timer = setInterval(nextSlide, INTERVAL);
    }
    function stopTimer() { clearInterval(timer); timer = null; }

    let started = false;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!started) { ensureLoaded(1 % slideEls.length); started = true; }
        if (!reducedMotion) startTimer();
      } else {
        stopTimer();
      }
    }, { threshold: 0.05 });
    observer.observe(heroSection);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopTimer();
      else if (started && !reducedMotion) startTimer();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
