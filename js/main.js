(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ─── Page Loader ─── */
  const loader = document.getElementById('page-loader');
  if (loader) {
    const hideLoader = () => loader.classList.add('loaded');
    if (document.readyState === 'complete') {
      setTimeout(hideLoader, 300);
    } else {
      window.addEventListener('load', () => setTimeout(hideLoader, 300));
      setTimeout(hideLoader, 600);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {

    /* ─── Year ─── */
    document.querySelectorAll('[data-year]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });

    /* ─── Header Scroll State ─── */
    const header = document.getElementById('site-header');
    if (header) {
      const onHeaderScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 30);
      };
      window.addEventListener('scroll', onHeaderScroll, { passive: true });
      onHeaderScroll();
    }

    /* Mobile menu behavior lives in accessibility.js. */

    /* ─── Scroll Progress Bar ─── */
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-hidden', 'true');
    document.body.prepend(progressBar);

    /* ─── Back To Top ─── */
    const btt = document.createElement('button');
    btt.id = 'back-to-top';
    btt.setAttribute('aria-label', 'العودة للأعلى');
    btt.innerHTML = '↑';
    document.body.appendChild(btt);
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    /* ─── Mobile App Tab Bar (شريط التنقل السفلي) ─── */
    if (!document.querySelector('.rk-tabbar')) {
      const strokeIcon = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
      const waIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';

      const segs = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean);
      const page = segs.length === 1 ? segs[0].replace(/\.html$/, '') : (segs[0] === 'projects' ? 'project' : '');
      const onProjectPage = segs[0] === 'projects';
      const crumbs = document.querySelector('.breadcrumbs');
      const projectIn = names => onProjectPage && !!crumbs?.querySelector(`a[href$="${names}.html"]`);

      const isActive = {
        home: segs.length === 0 || page === 'index',
        interior: page === 'interior-design' || page === 'exterior-design' || projectIn('interior-design') || projectIn('exterior-design'),
        graphic: page === 'graphic-design' || projectIn('graphic-design'),
        contact: page === 'contact'
      };

      const tabs = [
        { key: 'home',     href: 'index.html',          label: 'الرئيسية', icon: strokeIcon('<path d="M3 9.8 12 3l9 6.8"/><path d="M5.2 9v11a1.6 1.6 0 0 0 1.6 1.6h10.4A1.6 1.6 0 0 0 18.8 20V9"/><path d="M9.6 21.4v-6.6h4.8v6.6"/>') },
        { key: 'interior', href: 'interior-design.html', label: 'الديكور',  icon: strokeIcon('<path d="M6 10.5V7.5A3.5 3.5 0 0 1 9.5 4h5A3.5 3.5 0 0 1 18 7.5v3"/><path d="M4 12.5a2 2 0 0 1 4 0V15h8v-2.5a2 2 0 0 1 4 0v4.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17Z"/><path d="M6.5 19.5v1.7M17.5 19.5v1.7"/>') },
        { key: 'wa',       href: 'https://wa.me/201112630681', label: 'واتساب', icon: waIcon, center: true },
        { key: 'graphic',  href: 'graphic-design.html',  label: 'الجرافيك', icon: strokeIcon('<path d="M12 19.5 19 12.5 22 15.5 15 22.5Z"/><path d="M18 13 16.5 5.5 2 2l3.5 14.5L13 18Z"/><path d="M2 2 9.9 9.9"/><circle cx="11.5" cy="11.5" r="1.9"/>') },
        { key: 'contact',  href: 'contact.html',         label: 'تواصل',    icon: strokeIcon('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z"/>') }
      ];

      const tabbar = document.createElement('nav');
      tabbar.className = 'rk-tabbar';
      tabbar.setAttribute('aria-label', 'التنقل السريع');
      tabbar.innerHTML = tabs.map(t => {
        const active = !t.center && isActive[t.key];
        return `<a href="${t.href}" class="rk-tab${t.center ? ' rk-tab-wa' : ''}${active ? ' is-active' : ''}"${t.center ? ' target="_blank" rel="noopener" aria-label="تواصل عبر واتساب"' : ''}${active ? ' aria-current="page"' : ''}>${t.icon}${t.center ? '' : `<span class="rk-tab-label">${t.label}</span>`}</a>`;
      }).join('');
      document.body.appendChild(tabbar);
    }

    /* ─── Unified Scroll Handler ─── */
    const onScroll = () => {
      const scrollTop  = window.scrollY;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      const frac       = docHeight > 0 ? scrollTop / docHeight : 0;

      progressBar.style.transform = `scaleX(${frac})`;
      btt.classList.toggle('visible', scrollTop > 500);

      document.querySelectorAll('.reveal:not(.is-visible),.reveal-scale:not(.is-visible),.reveal-left:not(.is-visible)').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight - 60) {
          el.classList.add('is-visible');
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ─── Counter Animation ─── */
    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length) {
      const counterObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el     = entry.target;
          const target = +el.getAttribute('data-counter');
          const suffix = el.nextElementSibling ? '' : '';
          const step   = Math.max(1, Math.ceil(target / 55));
          let cur      = 0;
          const tick   = () => {
            cur = Math.min(cur + step, target);
            el.textContent = cur + '+';
            if (cur < target) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          counterObs.unobserve(el);
        });
      }, { threshold: 0.5 });
      counters.forEach(c => counterObs.observe(c));
    }

    /* ─── Contact Form → WhatsApp ─── */
    const contactForm = document.querySelector('[data-contact-form]');
    if (contactForm) {
      const wa     = contactForm.getAttribute('data-whatsapp') || '201112630681';
      const status = contactForm.querySelector('[data-form-status]');

      contactForm.addEventListener('submit', e => {
        e.preventDefault();
        const name    = contactForm.querySelector('#name')?.value.trim() || '';
        const phone   = contactForm.querySelector('#phone')?.value.trim() || '';
        const service = contactForm.querySelector('input[name="service"]:checked')?.value || '';
        const message = contactForm.querySelector('#message')?.value.trim() || '';

        if (!name || !phone || !message || !service || !/^[+\d\s()-]{7,22}$/.test(phone)) {
          if (status) {
            status.style.color = '#e57373';
            status.textContent = 'يرجى ملء الحقول، اختيار الخدمة، وكتابة رقم هاتف صالح.';
          }
          return;
        }

        const text = [
          'مرحباً رمضان 👋',
          `الاسم: ${name}`,
          `الهاتف: ${phone}`,
          service ? `الخدمة: ${service}` : '',
          `التفاصيل: ${message}`
        ].filter(Boolean).join('\n');

        if (status) {
          status.style.color = 'var(--gold)';
          status.textContent = '✓ جاري تحويلك للواتساب...';
        }

        window.location.assign(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`);
      });
    }

    /* ─── Search Overlay ─── */
    const searchTrigger = document.querySelector('[data-search-trigger]');
    if (searchTrigger) {
      const overlay = document.createElement('div');
      overlay.id = 'search-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'البحث');
      overlay.style.cssText = [
        'display:none', 'position:fixed', 'inset:0',
        'background:rgba(0,0,0,0.94)', 'z-index:9999',
        'align-items:flex-start', 'justify-content:center',
        'padding-top:clamp(24px,12dvh,140px)', 'backdrop-filter:blur(16px)'
      ].join(';');
      overlay.innerHTML = `
        <div style="width:100%;max-width:600px;padding:0 24px;">
          <div style="position:relative;">
            <input id="search-input" type="search" placeholder="ابحث عن مشروع أو خدمة..."
              aria-label="البحث في المشاريع"
              style="width:100%;padding:18px 52px 18px 18px;background:#161616;
              border:1px solid rgba(197,160,89,0.35);border-radius:8px;color:#fff;font-size:17px;
              font-family:Cairo,sans-serif;outline:none;direction:rtl;">
            <button id="search-close" aria-label="إغلاق البحث"
              style="position:absolute;left:14px;top:50%;transform:translateY(-50%);
              background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;padding:8px;">✕</button>
          </div>
          <div id="search-results" style="margin-top:16px;" aria-live="polite"></div>
        </div>`;
      document.body.appendChild(overlay);

      const openSearch  = () => { overlay.style.display = 'flex'; document.getElementById('search-input').focus(); };
      const closeSearch = () => { const wasOpen = overlay.style.display !== 'none'; overlay.style.display = 'none'; if (wasOpen) searchTrigger.focus(); };

      searchTrigger.addEventListener('click', openSearch);
      document.getElementById('search-close').addEventListener('click', closeSearch);
      overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeSearch();
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      });

      document.getElementById('search-input').addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();
        const results = document.getElementById('search-results');
        if (!q || typeof projectsData === 'undefined') { results.innerHTML = ''; return; }
        const found = (window.projectsData || projectsData || []).filter(p =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        ).slice(0, 6);
        results.innerHTML = found.length
          ? found.map(p => `
              <a href="${p.url || `project.html?id=${encodeURIComponent(p.id)}`}"
                onclick="document.getElementById('search-overlay').style.display='none'"
                style="display:flex;align-items:center;gap:16px;padding:14px 16px;
                margin-bottom:8px;background:#161616;border:1px solid rgba(255,255,255,0.08);
                border-radius:8px;color:#e0e0e0;text-decoration:none;font-family:Cairo,sans-serif;
                direction:rtl;transition:border-color 0.2s;"
                onmouseover="this.style.borderColor='#c5a059'"
                onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
                <span style="color:#c5a059;font-size:10px;font-weight:700;white-space:nowrap;letter-spacing:1px;">${esc(p.category || p.discipline || '')}</span>
                <span style="font-size:14px;">${esc(p.title)}</span>
              </a>`).join('')
          : '<p style="color:#aaa;font-family:Cairo,sans-serif;padding:16px 0;font-size:14px;">لا توجد نتائج مطابقة</p>';
      });
    }

    /* ─── Project detail gallery count badge ─── */
    const countBadge = document.getElementById('gallery-count');
    if (countBadge) {
      const updateCount = () => {
        const imgs = document.querySelectorAll('[data-p-gallery] img');
        if (imgs.length) countBadge.textContent = `${imgs.length} صورة`;
      };
      setTimeout(updateCount, 600);
    }

  });

})();
