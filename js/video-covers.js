/**
 * RK DESIGN Studio — Video Cover System
 * 🖥️  ديسكتوب: فيديو على الـ hover (صورة افتراضي).
 * 📱  موبايل: اضغط شارة "▶ فيديو" لتشغيل/إيقاف الفيديو (أخف داتا).
 * Lazy: الفيديو ما بيتحمّلش غير لما العميل يتفاعل. فيديو واحد بس في كل مرة.
 */
(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection && navigator.connection.saveData;
    const slowNet  = navigator.connection && ['slow-2g','2g','3g'].includes(navigator.connection.effectiveType);
    const skipVideo = prefersReducedMotion;  // بس لـ reduced-motion (مش لـ 3G ولا saveData)
    const canHover  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let activeMobile = null;   // الفيديو الشغّال على الموبايل (واحد بس)

    function buildVideo(mp4, webm, poster, title) {
        const vid = document.createElement('video');
        vid.setAttribute('data-rk-video', '');
        vid.className      = 'project-video';
        vid.muted          = true;
        vid.loop           = true;
        vid.playsInline    = true;
        vid.preload        = 'none';
        vid.setAttribute('aria-hidden', 'true');
        vid.setAttribute('tabindex', '-1');
        if (poster) vid.poster = poster;
        if (title)  vid.setAttribute('aria-label', title);
        if (webm) { const s = document.createElement('source'); s.src = webm; s.type = 'video/webm'; vid.appendChild(s); }
        if (mp4)  { const s = document.createElement('source'); s.src = mp4;  s.type = 'video/mp4';  vid.appendChild(s); }
        return vid;
    }

    function attachVideo(mediaEl, project) {
        const mp4    = project.video_mp4 || project.video || null;
        const webm   = project.video_webm || null;
        const poster = project.cover || null;
        if (!mp4 && !webm) return;

        /* شارة "▶ فيديو" */
        const badge = document.createElement('span');
        badge.className = 'project-video-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = '▶ فيديو';
        mediaEl.appendChild(badge);

        if (skipVideo) return;            /* reduced-motion / save-data / نت بطيء → صورة + شارة بس */

        const vid = buildVideo(mp4, webm, poster, project.title);
        vid.style.opacity = '0';
        vid.style.transition = 'opacity 0.45s ease';
        const img = mediaEl.querySelector('.project-img');
        if (img) mediaEl.insertBefore(vid, img);
        else mediaEl.prepend(vid);
        vid.addEventListener('error', () => { vid.remove(); });

        const card = mediaEl.closest('.project-card') || mediaEl;
        let started = false;

        function showVideo() { vid.style.opacity = '1'; if (img) img.style.opacity = '0'; }
        function hideVideo() { vid.style.opacity = '0'; if (img) img.style.opacity = ''; }

        function play() {
            if (!started) { started = true; vid.preload = 'metadata'; vid.load(); }
            const p = vid.play();
            if (p && p.then) p.then(showVideo).catch(() => {});
            else showVideo();
        }
        function pause() { vid.pause(); vid.currentTime = 0; hideVideo(); }

        if (canHover) {
            /* 🖥️ ديسكتوب: hover */
            card.addEventListener('mouseenter', play);
            card.addEventListener('mouseleave', pause);
            card.addEventListener('focusin', play);
            card.addEventListener('focusout', pause);
        } else {
            /* 📱 موبايل: اضغط الشارة لتشغيل/إيقاف */
            badge.style.cursor = 'pointer';
            let on = false;
            function toggle(e) {
                e.preventDefault();
                e.stopPropagation();
                if (activeMobile && activeMobile !== stop) { activeMobile(); }   /* وقّف أي فيديو تاني شغّال */
                if (!on) { on = true; play(); badge.textContent = '❚❚ إيقاف'; badge.classList.add('is-playing'); activeMobile = stop; }
                else { stop(); }
            }
            function stop() { on = false; pause(); badge.textContent = '▶ فيديو'; badge.classList.remove('is-playing'); if (activeMobile === stop) activeMobile = null; }
            badge.addEventListener('click', toggle);
            /* وقّف الفيديو لو العميل سكرل بعيد */
            new IntersectionObserver((es) => { es.forEach(en => { if (!en.isIntersecting && on) stop(); }); }, { threshold: 0.1 })
                .observe(card);
        }
    }

    function initVideoCovers() {
        if (typeof projectsData === 'undefined') return;
        document.querySelectorAll('.project-card').forEach(card => {
            const mediaEl = card.querySelector('.project-card-media');
            if (!mediaEl || mediaEl.dataset.rkVideoAttached) return;
            const href = card.getAttribute('href') || '';
            const idMatch = href.match(/[?&]id=([^&]+)/);
            if (!idMatch) return;
            const project = projectsData.find(p => String(p.id) === decodeURIComponent(idMatch[1]));
            if (!project) return;
            if (project.video || project.video_mp4 || project.video_webm) {
                mediaEl.dataset.rkVideoAttached = '1';
                attachVideo(mediaEl, project);
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initVideoCovers);
    else initVideoCovers();
    document.addEventListener('rk:projects-rendered', initVideoCovers);
    window.rkInitVideoCovers = initVideoCovers;

})();
