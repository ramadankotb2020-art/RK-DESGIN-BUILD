/* فحص ملف البورتفوليو الأوفلاين — dev-only (jsdom)
   الاستخدام: node tests/offline-check.cjs [rk-portfolio-lite.html] (الافتراضي: النسخة الكاملة) */
const fs = require('fs');
const { JSDOM } = require('jsdom');

const FILE = process.argv[2] || 'rk-portfolio-offline.html';
const html = fs.readFileSync(FILE, 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
const win = dom.window;
const d = win.document;
const problems = [];

/* 1) لا موارد خارجية */
d.querySelectorAll('img').forEach(img => {
  const s = img.getAttribute('src') || '';
  if (s && !s.startsWith('data:')) problems.push('img خارجي: ' + s.slice(0, 60)); // بدون src = عنصر اللايت بوكس قبل فتحه
});
d.querySelectorAll('script[src], link[href], source[src]').forEach(el =>
  problems.push('مورد خارجي: ' + (el.getAttribute('src') || el.getAttribute('href'))));

/* 2) الأقسام والعناصر */
['home', 'works', 'services', 'about', 'contact'].forEach(id => {
  if (!d.getElementById(id)) problems.push('قسم ناقص: ' + id);
});
const cards = d.querySelectorAll('.work-card');
const counts = {
  tabs: d.querySelectorAll('.rk-tab').length,
  workCards: cards.length,
  featuredBadges: d.querySelectorAll('.work-featured').length,
  chips: d.querySelectorAll('.chip').length,
  serviceCards: d.querySelectorAll('.service-card').length,
  heroSlides: d.querySelectorAll('.hero-slide').length,
  dataImgs: d.querySelectorAll('img[src^="data:"]').length,
  counters: d.querySelectorAll('[data-counter]').length,
  videoBadges: d.querySelectorAll('.work-video-badge').length,
  heroVideos: d.querySelectorAll('video.hero-slide').length
};
if (counts.tabs !== 5) problems.push('تبويبات=' + counts.tabs);
if (counts.workCards < 55) problems.push('كروت أعمال=' + counts.workCards + ' (المفروض 61)');
if (counts.featuredBadges !== 9) problems.push('شارات مميز=' + counts.featuredBadges);
if (counts.chips !== 4) problems.push('فلاتر=' + counts.chips);
if (counts.serviceCards !== 6) problems.push('كروت خدمات=' + counts.serviceCards);
if (counts.heroSlides !== 5) problems.push('شرائح هيرو=' + counts.heroSlides + ' (المفروض 5: 3 صور + 2 فيديو)');
if (counts.counters !== 4) problems.push('عدادات=' + counts.counters);
/* الفيديوهات: 34 مشروع + 2 هيرو (كروت الفيديو بتتعمل بالجافاسكريبت فبنشوفها في WORKS) */
if (counts.videoBadges !== 34) problems.push('شارات فيديو=' + counts.videoBadges + ' (المفروض 34)');
if (counts.heroVideos !== 2) problems.push('فيديوهات هيرو=' + counts.heroVideos);
const dataVids = (html.match(/data:video\/mp4;base64,/g) || []).length;
if (dataVids !== 36) problems.push('فيديوهات مدمجة=' + dataVids + ' (المفروض 36: 34 مشروع + 2 هيرو)');
const heroVidSrc = d.querySelectorAll('video.hero-slide')[0];
if (heroVidSrc && !(heroVidSrc.getAttribute('data-src') || '').startsWith('data:video/mp4')) problems.push('فيديو الهيرو مش مدمج (data-src)');
if (!d.getElementById('lb-video')) problems.push('مفيش عنصر فيديو في اللايت بوكس');

/* 3) تشغيل السكربت + الفلاتر + اللايت بوكس */
if (!win.IntersectionObserver) {
  win.IntersectionObserver = function () { this.observe = function () {}; this.unobserve = function () {}; this.disconnect = function () {}; };
}
if (!win.matchMedia) {
  win.matchMedia = function (q) { return { matches: false, media: q, addListener: function () {}, removeListener: function () {} }; };
}
try {
  win.eval(d.querySelector('script').textContent);
} catch (e) {
  problems.push('JS error: ' + e.message);
}

/* الفلاتر */
try {
  const countEl = d.getElementById('works-count');
  if (!/61/.test(countEl.textContent)) problems.push('عدد الكل غلط: ' + countEl.textContent);
  const graphicChip = d.querySelector('.chip[data-cat="graphic"]');
  graphicChip.click();
  const visibleGraphic = [...cards].filter(c => c.style.display !== 'none').length;
  const expectedGraphic = [...cards].filter(c => c.getAttribute('data-cat') === 'graphic').length;
  if (visibleGraphic !== expectedGraphic) problems.push('فلتر الجرافيك: ظاهر=' + visibleGraphic + ' متوقع=' + expectedGraphic);
  if (!/24/.test(countEl.textContent)) problems.push('عدد الجرافيك غلط: ' + countEl.textContent);
  d.querySelector('.chip[data-cat="all"]').click();
  const visibleAll = [...cards].filter(c => c.style.display !== 'none').length;
  if (visibleAll !== cards.length) problems.push('الكل مش بيرجع: ' + visibleAll + '/' + cards.length);
} catch (e) {
  problems.push('filter error: ' + e.message);
}

/* اللايت بوكس (الفيديو أول عنصر لو المشروع عنده فيديو) */
try {
  cards[0].click();
  const opened = d.getElementById('lightbox').classList.contains('open');
  if (!opened) problems.push('اللايت بوكس مش بيفتح');
  const lbVideo = d.getElementById('lb-video');
  const vSrc = lbVideo.getAttribute('src') || '';
  if (lbVideo.style.display !== 'none') {
    /* أول عنصر فيديو */
    if (!vSrc.startsWith('data:video/mp4;base64,')) problems.push('فيديو اللايت بوكس مش مدمج');
  } else {
    const src = d.getElementById('lb-img').getAttribute('src') || '';
    if (!src.startsWith('data:')) problems.push('صورة اللايت بوكس مش data URI');
  }
  d.getElementById('lb-close').click();
  if (d.getElementById('lightbox').classList.contains('open')) problems.push('اللايت بوكس مش بيقفل');
} catch (e) {
  problems.push('lightbox error: ' + e.message);
}

/* 4) روابط التواصل */
const wa = d.querySelector('.rk-tab-wa');
if (!wa || !/^https:\/\/wa\.me\/201112630681/.test(wa.getAttribute('href'))) problems.push('لينك واتساب غلط');
if (!d.querySelector('a[href^="tel:"]')) problems.push('مفيش لينك اتصال');

/* 5) التحقق من صحة base64 (عينة) */
const sample = (cards[0].querySelector('img').getAttribute('src') || '').split(',')[1];
if (!sample || !/^[A-Za-z0-9+/=]+$/.test(sample.slice(0, 200))) problems.push('base64 تالف');

console.log('الأرقام:', JSON.stringify(counts));
console.log('الحجم:', (fs.statSync(FILE).size / 1024 / 1024).toFixed(2) + 'MB');
if (problems.length) { console.log('مشاكل:'); problems.forEach(p => console.log('  ✗ ' + p)); process.exit(1); }
console.log('كل فحوصات الملف الأوفلاين نجحت ✅');
process.exit(0);
