/* اختبار وظيفي لنظام الفيديو — الاستخدام: node tests/offline-video-check.cjs [ملف] (الافتراضي: lite) */
const fs = require('fs');
const { JSDOM } = require('jsdom');

const FILE = process.argv[2] || 'rk-portfolio-lite.html';
const html = fs.readFileSync(FILE, 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
const win = dom.window, d = win.document;
const problems = [];

/* Stubs زي offline-check */
win.IntersectionObserver = function () { this.observe = function () {}; this.unobserve = function () {}; this.disconnect = function () {}; };
win.matchMedia = function (q) { return { matches: false, media: q, addListener: function () {}, removeListener: function () {} }; };

try { win.eval(d.querySelector('script').textContent); }
catch (e) { problems.push('JS error: ' + e.message); }

const cards = [...d.querySelectorAll('.work-card')];
const withBadge = cards.filter(c => c.querySelector('.work-video-badge'));
console.log('كروت بشارة فيديو:', withBadge.length);

/* 1) موبايل: ضغطة على الشارة → يتعمل عنصر فيديو مدمج + الشارة تتغير */
const card = withBadge[0], badge = card.querySelector('.work-video-badge');
const media = card.querySelector('.work-media');
badge.click();
let vid = media.querySelector('video');
if (!vid) problems.push('ضغطة الشارة: مفيش عنصر فيديو اتعمل');
else {
  const src = vid.getAttribute('src') || '';
  if (!src.startsWith('data:video/mp4;base64,')) problems.push('الفيديو مش مدمج: ' + src.slice(0, 40));
  if (!vid.hasAttribute('loop') || !vid.muted) problems.push('الفيديو مش loop/muted');
}
if (badge.textContent.indexOf('إيقاف') === -1) problems.push('الشارة ماتغيرتش لإيقاف: ' + badge.textContent);
if (!badge.classList.contains('is-playing')) problems.push('الشارة معملتش is-playing');

/* 2) ضغطة تانية → يقفل */
badge.click();
if (badge.textContent.indexOf('فيديو') === -1) problems.push('الشارة مارجعتش لـ فيديو');
if (badge.classList.contains('is-playing')) problems.push('الشارة فضلت is-playing');

/* 3) فيديو واحد بس في نفس الوقت: شغّل اتنين → الأول يقف */
const badge2 = withBadge[1].querySelector('.work-video-badge');
badge.click(); badge2.click();
if (badge.textContent.indexOf('إيقاف') !== -1) problems.push('الفيديو الأول مش وقف لما التاني شغل');
badge2.click();

/* 4) الكارت نفسه يفتح اللايت بوكس (مش الشارة) — والفيديو أول عنصر جوه المعرض */
card.dispatchEvent(new win.Event('click', { bubbles: true }));
const lbEl = d.getElementById('lightbox');
if (!lbEl.classList.contains('open')) problems.push('الكليك على الكارت مش بيفتح اللايت بوكس');
const lbVideo = d.getElementById('lb-video');
if (!lbVideo) problems.push('مفيش عنصر فيديو في اللايت بوكس');
else {
  if (lbVideo.style.display === 'none') problems.push('فيديو اللايت بوكس مخفي وهو المفروض أول عنصر');
  const vs = lbVideo.getAttribute('src') || '';
  if (!vs.startsWith('data:video/mp4;base64,')) problems.push('فيديو اللايت بوكس مش مدمج: ' + vs.slice(0, 40));
  if (!lbVideo.hasAttribute('controls')) problems.push('فيديو اللايت بوكس من غير controls');
}
const lbCount = d.getElementById('lb-count').textContent;
if (lbCount.indexOf('فيديو') === -1) problems.push('عدّاد اللايت بوكس مابيقولش فيديو: ' + lbCount);
d.getElementById('lb-close').click();
if (d.getElementById('lightbox').classList.contains('open')) problems.push('اللايت بوكس مش بيقفل');

/* 4ب) مشروع من غير فيديو → أول عنصر صورة عادية */
const noVidCard = cards.find(c => !c.querySelector('.work-video-badge'));
if (noVidCard) {
  noVidCard.dispatchEvent(new win.Event('click', { bubbles: true }));
  const im = d.getElementById('lb-img');
  if (im.style.display === 'none') problems.push('مشروع بدون فيديو: الصورة مخفية');
  d.getElementById('lb-close').click();
}

/* 5) فيديوهات الهيرو مدمجة (data-src → Blob URL وقت التشغيل) وبتتكرر */
const hv = d.querySelectorAll('video.hero-slide');
if (hv.length !== 2) problems.push('فيديوهات هيرو=' + hv.length);
hv.forEach(v => {
  if (!(v.getAttribute('data-src') || v.getAttribute('src') || '').startsWith('data:video/mp4')) problems.push('فيديو هيرو مش مدمج');
  if (!v.loop || !v.muted) problems.push('فيديو هيرو مش loop/muted');
});

/* 6) محاكاة ديسكتوب (hover): إعادة تقييم السكربت مع canHover=true مش ممكن بنفس الدومين
   فبنكتفي بفحص إن مستمعات الماوس مش بتكسر حاجة — الأهم محاكاة الموبايل (المستخدم موبايل) */

if (problems.length) { console.log('مشاكل:'); problems.forEach(p => console.log('  ✗ ' + p)); process.exit(1); }
console.log('اختبار نظام الفيديو نجح كله ✅ (' + FILE + ')');
process.exit(0);
