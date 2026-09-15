/* فحص ملف البورتفوليو الأوفلاين — dev-only (jsdom) */
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('rk-portfolio-offline.html', 'utf8');
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
const counts = {
  tabs: d.querySelectorAll('.rk-tab').length,
  workCards: d.querySelectorAll('.work-card').length,
  serviceCards: d.querySelectorAll('.service-card').length,
  heroSlides: d.querySelectorAll('.hero-slide').length,
  dataImgs: d.querySelectorAll('img[src^="data:"]').length,
  counters: d.querySelectorAll('[data-counter]').length
};
if (counts.tabs !== 5) problems.push('تبويبات=' + counts.tabs);
if (counts.workCards !== 9) problems.push('كروت أعمال=' + counts.workCards);
if (counts.serviceCards !== 6) problems.push('كروت خدمات=' + counts.serviceCards);
if (counts.heroSlides !== 3) problems.push('شرائح هيرو=' + counts.heroSlides);
if (counts.counters !== 4) problems.push('عدادات=' + counts.counters);

/* 3) تشغيل السكربت + اللايت بوكس */
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
try {
  d.querySelector('.work-card').click();
  const opened = d.getElementById('lightbox').classList.contains('open');
  if (!opened) problems.push('اللايت بوكس مش بيفتح');
  const src = d.getElementById('lb-img').getAttribute('src') || '';
  if (!src.startsWith('data:')) problems.push('صورة اللايت بوكس مش data URI');
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
const sample = (d.querySelector('.work-card img').getAttribute('src') || '').split(',')[1];
if (!sample || !/^[A-Za-z0-9+/=]+$/.test(sample.slice(0, 200))) problems.push('base64 تالف');

console.log('الأرقام:', JSON.stringify(counts));
console.log('الحجم:', (fs.statSync('rk-portfolio-offline.html').size / 1024 / 1024).toFixed(2) + 'MB');
if (problems.length) { console.log('مشاكل:'); problems.forEach(p => console.log('  ✗ ' + p)); process.exit(1); }
console.log('كل فحوصات الملف الأوفلاين نجحت ✅');
process.exit(0);
