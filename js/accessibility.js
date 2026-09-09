/* Shared progressive enhancement; no external dependencies. */
(function () {
  'use strict';
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav-links');
  const mobile = matchMedia('(max-width:1199px)');
  if (toggle && nav) {
    const setOpen = open => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      setOpen(open);
      if (open) nav.querySelector('a')?.focus();
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', e => { if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (!nav.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setOpen(false); toggle.focus(); }
      if (e.key === 'Tab') {
        const links = [...nav.querySelectorAll('a[href]')];
        const first = links[0], last = links[links.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); toggle.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); toggle.focus(); }
        else if (document.activeElement === toggle) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      }
    });
    mobile.addEventListener('change', () => setOpen(false));
  }
  // Trap focus in the search overlay and return it to the opener.
  document.addEventListener('keydown', e => {
    const search = document.getElementById('search-overlay');
    if (!search || search.style.display === 'none') return;
    if (e.key !== 'Tab') return;
    const items = [...search.querySelectorAll('input,button,a[href]')];
    const first = items[0], last = items[items.length-1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.querySelectorAll('nav a[href]').forEach(a => {
    const normalize = path => path.replace(/\.html$/, '').replace(/\/index$/, '/');
    if (normalize(new URL(a.href).pathname) === normalize(location.pathname)) a.setAttribute('aria-current','page');
  });
})();
