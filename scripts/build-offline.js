// scripts/build-offline.js
// يولّد ملف HTML واحد مكتفٍ بذاته (بورتفوليو أوفلاين) — كل الأنماط والسكربتات
// والصور (WebP مدمج base64) جوه ملف واحد يفتح بالدبل كليك من غير سيرفر ونت.
// التشغيل:  node scripts/build-offline.js
// الناتج:   rk-portfolio-offline.html في جذر المستودع

'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'rk-portfolio-offline.html');
const SITE = 'https://rk-desgin-build-2an.pages.dev';
const WA = '201112630681';
const PHONE = '01112630681';

/* ─── بيانات المشاريع ─── */
const dataSrc = fs.readFileSync(path.join(ROOT, 'js/projects-data.js'), 'utf8');
const projects = new Function(dataSrc + '; return PROJECTS_FALLBACK;')();
const featured = (projects.filter(p => p.featured).length ? projects.filter(p => p.featured) : projects.slice(0, 6))
  .filter(p => p.status === 'published')
  .slice(0, 9);

/* ─── خط الأصول: قراءة/ضغط → data URI ─── */
const report = [];
async function toDataUri(file, opts = {}) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) throw new Error('missing asset: ' + file);
  let buf;
  if (opts.width || opts.quality) {
    let img = sharp(abs).rotate();
    if (opts.width) img = img.resize({ width: opts.width, withoutEnlargement: true });
    buf = await img.webp({ quality: opts.quality || 70 }).toBuffer();
    if (opts.maxKb && buf.length > opts.maxKb * 1024) {
      buf = await sharp(abs).rotate().resize({ width: Math.round((opts.width || 1100) * 0.75), withoutEnlargement: true })
        .webp({ quality: 58 }).toBuffer();
    }
  } else {
    buf = fs.readFileSync(abs);
  }
  report.push({ file, kb: Math.round(buf.length / 1024) });
  return 'data:image/webp;base64,' + buf.toString('base64');
}

/* ─── جمع الصور ─── */
(async () => {
  /* هيرو */
  const heroImgs = [];
  for (const f of ['hero-slide-1-interior', 'hero-slide-2-graphic', 'hero-slide-3-exterior']) {
    heroImgs.push(await toDataUri('images/homepage/' + f + '.webp', { width: 1280, quality: 70, maxKb: 150 }));
  }

  /* الخدمات */
  const serviceDefs = [
    { img: 'service-01-interior-residential', title: 'التصميم الداخلي السكني' },
    { img: 'service-02-interior-commercial', title: 'التصميم الداخلي التجاري' },
    { img: 'service-03-exterior-landscape', title: 'الواجهات المعمارية واللاندسكيب' },
    { img: 'service-04-graphic-identity', title: 'الهوية البصرية والشعارات' },
    { img: 'service-05-graphic-print', title: 'المطبوعات والتغليف' },
    { img: 'service-06-graphic-social', title: 'حملات السوشيال ميديا' }
  ];
  const services = [];
  for (const s of serviceDefs) {
    services.push({ title: s.title, src: await toDataUri('images/homepage/' + s.img + '.webp', { width: 820, quality: 70, maxKb: 95 }) });
  }

  /* صورة النبذة */
  const portrait = await toDataUri('images/homepage/about-portrait.webp', { width: 760, quality: 72, maxKb: 110 });

  /* المشاريع المميزة: كارت 480 + لايت بوكس (غلاف 800 + حتى 3 صور معرض) */
  const workItems = [];
  for (const p of featured) {
    const cover480 = p.coverSources.find(s => s.width === 480) || p.coverSources[0];
    const cover800 = p.coverSources.find(s => s.width === 800) || p.coverSources[p.coverSources.length - 1];
    const cardSrc = await toDataUri(cover480.src);
    const lightImgs = [await toDataUri(cover800.src)];
    const galleryFiles = (p.gallery || []).filter(g => /\.(webp|jpe?g|png)$/i.test(g) && fs.existsSync(path.join(ROOT, g))).slice(0, 3);
    for (const g of galleryFiles) {
      lightImgs.push(await toDataUri(g, { width: 1100, quality: 68, maxKb: 115 }));
    }
    workItems.push({
      title: p.title,
      category: p.category || '',
      url: SITE + '/' + p.url.replace(/^\//, ''),
      card: cardSrc,
      light: lightImgs
    });
  }

  /* ─── بناء الـ HTML ─── */
  const cardsHtml = workItems.map((w, i) =>
    '<a class="work-card" href="#works" data-work="' + i + '">' +
      '<div class="work-media"><img src="' + w.card + '" alt="' + escAttr(w.title) + '" loading="lazy" decoding="async">' +
      '<span class="work-badge">' + escHtml(w.category) + '</span>' +
      '<span class="work-count">📷 ' + w.light.length + '</span></div>' +
      '<div class="work-info"><h3>' + escHtml(w.title) + '</h3><span>اضغط لعرض المعرض ←</span></div>' +
    '</a>'
  ).join('\n          ');

  const servicesHtml = services.map(s =>
    '<div class="service-card"><img src="' + s.src + '" alt="' + escAttr(s.title) + '" loading="lazy" decoding="async">' +
    '<div class="service-overlay"><h3>' + escHtml(s.title) + '</h3></div></div>'
  ).join('\n          ');

  const slidesHtml = heroImgs.map((src, i) =>
    '<img class="hero-slide' + (i === 0 ? ' active' : '') + '" src="' + src + '" alt="أعمال RK Design Studio" decoding="async">'
  ).join('\n        ');
  const dotsHtml = heroImgs.map((_, i) =>
    '<button class="hero-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '" aria-label="الشريحة ' + (i + 1) + '"></button>'
  ).join('');

  const workData = JSON.stringify(workItems.map(w => ({ t: w.title, c: w.category, u: w.url, i: w.light })));

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#c5a059">
<title>رمضان قطب | RK Design Studio — بورتفوليو أعمال التصميم والجرافيك</title>
<meta name="description" content="بورتفوليو رمضان قطب — تصميم داخلي وخارجي، جرافيك وهوية بصرية. نسخة أوفلاين شغالة من غير إنترنت.">
<style>
:root{
  --gold:#c5a059; --gold-light:#d4b878; --gold-dim:#a38345;
  --gold-line:rgba(197,160,89,.22); --gold-glow:rgba(197,160,89,.15);
  --bg:#0a0a0a; --bg-2:#101010; --bg-3:#141414; --bg-4:#1a1a1a;
  --ink:#e8e8e8; --ink-2:#b8b8b8; --ink-3:#787878;
  --line:rgba(255,255,255,.07); --line-2:rgba(255,255,255,.12);
  --radius:12px; --radius-lg:20px;
  --safe-b:env(safe-area-inset-bottom,0px);
  --tabbar-h:62px;
  --font:'Cairo',Tahoma,'Segoe UI','Noto Kufi Arabic','Noto Naskh Arabic',sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{font-family:var(--font);background:var(--bg);color:var(--ink);line-height:1.75;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:rgba(197,160,89,.22)}
:focus-visible{outline:3px solid var(--gold-light);outline-offset:3px;border-radius:3px}
section{scroll-margin-top:64px}
.container{width:100%;max-width:1200px;margin-inline:auto;padding-inline:clamp(16px,4vw,48px)}
.section{padding-block:clamp(52px,9vw,104px)}
.eyebrow{display:inline-flex;align-items:center;gap:10px;color:var(--gold);font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase}
.eyebrow::before{content:"";width:26px;height:1px;background:var(--gold)}
.headline-xl{font-size:clamp(2rem,7.5vw,4.2rem);font-weight:900;line-height:1.35;color:#fff;letter-spacing:0}
.headline-md{font-size:clamp(1.5rem,4.5vw,2.6rem);font-weight:800;line-height:1.4;color:#fff;letter-spacing:0}
.gold{color:var(--gold)}
.body-lg{font-size:clamp(1rem,2.4vw,1.15rem);color:var(--ink-2)}
.label-center{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;margin-bottom:clamp(28px,5vw,52px)}
.label-center p{color:var(--ink-2);max-width:560px}

/* ─── هيدر ─── */
.site-header{position:fixed;top:0;inset-inline:0;z-index:1000;padding:10px 0;background:rgba(10,10,10,.9);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;gap:16px}
.brand{display:flex;align-items:center;gap:10px}
.brand-mark{background:var(--gold);color:#0a0a0a;font-weight:900;font-size:16px;padding:5px 12px;border-radius:4px;letter-spacing:1px}
.brand-text span{display:block;color:#fff;font-weight:700;font-size:14px;line-height:1.25}
.brand-text small{display:block;color:var(--gold);font-size:8.5px;letter-spacing:2.4px}
.nav-links{display:none;gap:4px}
.nav-links a{color:var(--ink-2);font-size:13.5px;font-weight:700;padding:8px 12px;border-radius:6px}
.nav-links a:hover,.nav-links a.is-active{color:var(--gold)}

/* ─── هيرو ─── */
.hero{position:relative;min-height:100vh;min-height:100svh;display:flex;align-items:center;justify-content:center;overflow:hidden;text-align:center}
.hero-slides{position:absolute;inset:0}
.hero-slide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 1.1s ease}
.hero-slide.active{opacity:1}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.5) 45%,rgba(0,0,0,.3) 100%)}
.hero-content{position:relative;z-index:2;width:100%;max-width:860px;padding:110px 20px calc(var(--tabbar-h) + var(--safe-b) + 64px)}
.hero-tag{display:inline-block;border:1px solid rgba(197,160,89,.35);color:var(--gold);background:rgba(197,160,89,.08);padding:7px 18px;border-radius:30px;font-size:11px;font-weight:800;letter-spacing:1.5px;margin-bottom:20px}
.hero-title{font-size:clamp(2.1rem,8.5vw,4.6rem);font-weight:900;line-height:1.4;color:#fff;margin-bottom:18px}
.hero-title em{font-style:normal;color:var(--gold)}
.hero-sub{font-size:clamp(1rem,2.6vw,1.2rem);color:rgba(255,255,255,.75);max-width:560px;margin:0 auto 30px}
.hero-btns{display:flex;flex-direction:column;align-items:center;gap:12px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:15px;padding:15px 30px;border-radius:8px;border:1px solid transparent;min-height:50px;max-width:100%}
.btn-primary{background:var(--gold);color:#0a0a0a}
.btn-outline{background:transparent;color:var(--gold);border-color:rgba(197,160,89,.4)}
.btn:active{transform:scale(.97)}
.hero-dots{position:absolute;bottom:calc(var(--tabbar-h) + var(--safe-b) + 16px);left:50%;transform:translateX(-50%);z-index:3;display:flex;gap:10px}
.hero-dot{width:44px;height:44px;min-width:44px;border:0;background:transparent;border-radius:50%;position:relative}
.hero-dot::after{content:"";position:absolute;inset:17px;border-radius:50%;background:rgba(255,255,255,.35);transition:background .3s}
.hero-dot.active::after{background:var(--gold)}

/* ─── أرقام ─── */
.stats-row{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}
.stat-cell{background:var(--bg-3);padding:22px 12px;text-align:center}
.stat-cell .num{font-size:clamp(1.9rem,6vw,3rem);font-weight:900;color:var(--gold);line-height:1.1}
.stat-cell .lbl{font-size:13px;color:var(--ink-3);font-weight:700;margin-top:4px}

/* ─── الأعمال ─── */
.works-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
.work-card{position:relative;display:block;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;-webkit-tap-highlight-color:rgba(197,160,89,.18)}
.work-media{position:relative;aspect-ratio:4/3;background:var(--bg-4)}
.work-media img{width:100%;height:100%;object-fit:cover;filter:brightness(.92)}
.work-media::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55),transparent 55%)}
.work-badge{position:absolute;top:10px;inset-inline-end:10px;z-index:2;background:rgba(10,10,10,.82);color:var(--gold);font-size:10.5px;font-weight:800;padding:4px 12px;border-radius:30px;border:1px solid rgba(197,160,89,.3)}
.work-count{position:absolute;bottom:10px;inset-inline-end:10px;z-index:2;background:rgba(10,10,10,.78);color:var(--ink-2);font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px}
.work-info{padding:14px 16px 16px;border-top:1px solid var(--line)}
.work-info h3{color:#fff;font-size:15.5px;font-weight:800;line-height:1.5}
.work-info span{color:var(--gold);font-size:12px;font-weight:700}

/* ─── الخدمات ─── */
.services-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.service-card{position:relative;aspect-ratio:4/3;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}
.service-card img{width:100%;height:100%;object-fit:cover;filter:grayscale(.2) brightness(.68);transition:transform .6s,filter .4s}
.service-overlay{position:absolute;inset:0;display:flex;align-items:flex-end;padding:20px;background:linear-gradient(to top,rgba(0,0,0,.85),rgba(0,0,0,.05) 60%)}
.service-overlay h3{color:#fff;font-size:clamp(1.05rem,3vw,1.35rem);font-weight:800}

/* ─── عن رمضان ─── */
.about-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:36px;align-items:center}
.about-img{border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;aspect-ratio:1}
.about-img img{width:100%;height:100%;object-fit:cover}
.about-text p{color:var(--ink-2);margin-bottom:16px}
.about-text .btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}

/* ─── تواصل ─── */
.contact-cards{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;max-width:640px;margin-inline:auto}
.contact-card{display:flex;align-items:center;gap:16px;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius);padding:20px 22px;min-height:64px}
.contact-card .ico{font-size:26px;flex-shrink:0}
.contact-card .lbl{font-size:12px;color:var(--ink-3);font-weight:700;margin-bottom:2px}
.contact-card .val{font-size:clamp(1.05rem,4vw,1.35rem);font-weight:800;color:var(--gold);direction:ltr}
a.contact-card:active{transform:scale(.98)}
.offline-note{max-width:640px;margin:22px auto 0;background:rgba(197,160,89,.07);border:1px solid var(--gold-line);border-radius:var(--radius);padding:16px 20px;color:var(--ink-2);font-size:13.5px;text-align:center}
.offline-note b{color:var(--gold)}

/* ─── فوتر ─── */
.site-footer{border-top:1px solid var(--line);background:var(--bg-2);padding:30px 0 calc(var(--tabbar-h) + var(--safe-b) + 26px);text-align:center;margin-top:56px}
.site-footer p{color:var(--ink-3);font-size:13px}
.site-footer .gold{font-weight:800}
.site-footer a{color:var(--gold)}

/* ─── شريط التنقل السفلي ─── */
.rk-tabbar{position:fixed;bottom:0;inset-inline:0;z-index:1200;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));background:rgba(10,10,10,.94);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);border-top:1px solid var(--gold-line);box-shadow:0 -10px 34px rgba(0,0,0,.5);padding-bottom:var(--safe-b)}
.rk-tab{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:var(--tabbar-h);color:var(--ink-3);transition:transform .16s,color .2s}
.rk-tab:active{transform:scale(.92)}
.rk-tab svg{width:23px;height:23px}
.rk-tab .lbl{font-size:10px;font-weight:800;line-height:1;white-space:nowrap}
.rk-tab.is-active{color:var(--gold)}
.rk-tab.is-active::before{content:"";position:absolute;top:0;inset-inline:24%;height:3px;border-radius:0 0 3px 3px;background:linear-gradient(to left,var(--gold-dim),var(--gold))}
.rk-tab-wa{width:54px;height:54px;min-height:0;justify-self:center;align-self:start;margin-top:-20px;border-radius:50%;background:linear-gradient(160deg,var(--gold-light),var(--gold));color:#0a0a0a;box-shadow:0 0 0 5px #0c0c0c,0 10px 26px rgba(197,160,89,.4)}
.rk-tab-wa svg{width:26px;height:26px}
body{padding-bottom:calc(var(--tabbar-h) + var(--safe-b))}

/* ─── لايت بوكس ─── */
.lightbox{position:fixed;inset:0;z-index:2000;display:none;flex-direction:column;background:rgba(5,5,5,.97);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.lightbox.open{display:flex}
.lb-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top,0px))}
.lb-title{color:#fff;font-weight:800;font-size:14px;line-height:1.5;flex:1;min-width:0}
.lb-count{color:var(--gold);font-size:12.5px;font-weight:800;flex-shrink:0}
.lb-close{width:44px;height:44px;min-width:44px;border:1px solid var(--line-2);background:transparent;color:#fff;border-radius:8px;font-size:20px}
.lb-stage{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0 8px}
.lb-stage img{max-width:100%;max-height:calc(100dvh - 170px);max-height:calc(100vh - 170px);object-fit:contain;border-radius:8px;touch-action:pan-y}
.lb-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px calc(14px + var(--safe-b))}
.lb-arrow{min-width:52px;height:52px;border-radius:10px;border:1px solid var(--gold-line);background:rgba(197,160,89,.08);color:var(--gold);font-size:24px;font-weight:800}
.lb-arrow:disabled{opacity:.3}
.lb-site{color:var(--gold);font-size:12.5px;font-weight:800;text-align:center;padding:0 8px}

/* ─── حركة الظهور ─── */
.reveal{opacity:0;transform:translateY(26px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal.is-in{opacity:1;transform:none}

/* ─── ديسكتوب (تحسينات فقط) ─── */
@media (min-width:600px){
  .works-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .services-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .stats-row{grid-template-columns:repeat(4,1fr)}
  .contact-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hero-btns{flex-direction:row;justify-content:center}
  .hero-btns .btn{width:auto;min-width:230px}
}
@media (min-width:821px){
  .rk-tabbar{display:none}
  body{padding-bottom:0}
  .site-footer{padding-bottom:30px}
  .hero-content{padding-block:120px 90px}
  .hero-dots{bottom:26px}
  .nav-links{display:flex}
  .works-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .services-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .about-grid{grid-template-columns:1fr 1fr;gap:56px}
  .work-card:hover img{filter:brightness(1.02)}
  .work-card:hover{border-color:rgba(197,160,89,.45)}
  .service-card:hover img{transform:scale(1.05);filter:grayscale(0) brightness(.85)}
  .btn-primary:hover{background:var(--gold-light)}
  .btn-outline:hover{background:var(--gold-glow)}
}
@media (max-width:360px){
  :root{--tabbar-h:56px}
  .rk-tab svg{width:21px;height:21px}
  .rk-tab .lbl{font-size:9px}
  .rk-tab-wa{width:50px;height:50px;margin-top:-18px}
}
@media (max-width:920px) and (max-height:500px) and (orientation:landscape){
  :root{--tabbar-h:46px}
  .rk-tab{min-height:46px}
  .rk-tab .lbl{display:none}
  .rk-tab-wa{width:42px;height:42px;margin-top:-12px}
  .hero{min-height:auto}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation:none!important;transition:none!important}
  .reveal{opacity:1;transform:none}
}
</style>
</head>
<body>

<header class="site-header">
  <div class="container nav">
    <a href="#home" class="brand">
      <div class="brand-mark">RK</div>
      <div class="brand-text"><span>رمضان قطب</span><small>DESIGN STUDIO</small></div>
    </a>
    <nav class="nav-links" aria-label="أقسام الصفحة">
      <a href="#home">الرئيسية</a>
      <a href="#works">الأعمال</a>
      <a href="#services">الخدمات</a>
      <a href="#about">عن رمضان</a>
      <a href="#contact">تواصل</a>
    </nav>
  </div>
</header>

<main>
  <!-- هيرو -->
  <section class="hero" id="home" aria-label="المقدمة">
    <div class="hero-slides" aria-hidden="true">
        ${slidesHtml}
    </div>
    <div class="hero-content">
      <span class="hero-tag">التصميم الداخلي والديكور</span>
      <h1 class="hero-title">أحوّل مساحتك<br>إلى <em>تحفة معمارية</em></h1>
      <p class="hero-sub">تصميم داخلي وجرافيك في القاهرة ومصر — رندر 3D ومخططات تنفيذية وهوية بصرية</p>
      <div class="hero-btns">
        <a href="#works" class="btn btn-primary">شاهد الأعمال المختارة</a>
        <a href="https://wa.me/${WA}" target="_blank" rel="noopener" class="btn btn-outline">طلب استشارة عبر واتساب 💬</a>
      </div>
    </div>
    <div class="hero-dots" role="tablist" aria-label="التنقل بين الشرائح">${dotsHtml}</div>
  </section>

  <!-- أرقام -->
  <section class="section" aria-label="إحصائيات">
    <div class="container">
      <div class="stats-row reveal">
        <div class="stat-cell"><div class="num" data-counter="150">150+</div><div class="lbl">مشروع ديكور</div></div>
        <div class="stat-cell"><div class="num" data-counter="80">80+</div><div class="lbl">هوية بصرية</div></div>
        <div class="stat-cell"><div class="num" data-counter="120">120+</div><div class="lbl">عميل راضٍ</div></div>
        <div class="stat-cell"><div class="num" data-counter="7">7+</div><div class="lbl">سنوات خبرة</div></div>
      </div>
    </div>
  </section>

  <!-- الأعمال -->
  <section class="section" id="works" style="background:var(--bg-2);border-block:1px solid var(--line)">
    <div class="container">
      <div class="label-center reveal">
        <span class="eyebrow">معرض الأعمال</span>
        <h2 class="headline-md">أعمال <span class="gold">مختارة</span></h2>
        <p>مجموعة من أفضل مشاريع التصميم الداخلي والخارجي — اضغط على أي مشروع لعرض معرضه كاملًا</p>
      </div>
      <div class="works-grid">
          ${cardsHtml}
      </div>
    </div>
  </section>

  <!-- الخدمات -->
  <section class="section" id="services">
    <div class="container">
      <div class="label-center reveal">
        <span class="eyebrow">الخدمات</span>
        <h2 class="headline-md">كل تصميم تحت <span class="gold">سقف واحد</span></h2>
        <p>من الديكور الداخلي للهوية البصرية الكاملة — خدمات تصميم متكاملة</p>
      </div>
      <div class="services-grid">
          ${servicesHtml}
      </div>
    </div>
  </section>

  <!-- عن رمضان -->
  <section class="section" id="about" style="background:var(--bg-2);border-block:1px solid var(--line)">
    <div class="container">
      <div class="label-center reveal">
        <span class="eyebrow">عن رمضان قطب</span>
        <h2 class="headline-md">مصمم بعقل <span class="gold">مهندس</span></h2>
      </div>
      <div class="about-grid">
        <div class="about-img reveal">
          <img src="${portrait}" alt="رمضان قطب — مصمم داخلي وجرافيك" decoding="async">
        </div>
        <div class="about-text reveal">
          <p>أنا رمضان قطب — مصمم داخلي ومصمم جرافيك ديزاين. جمعت بين المجالين لأن قناعتي إن الجمال مش موجود بس في الديكور أو بس في البراندينج — الجمال الحقيقي بيحصل لما الفضاء والهوية البصرية بيشتغلوا مع بعض.</p>
          <p>في مجال الديكور: بصمم مساحات سكنية وتجارية من الصفر — ديكور داخلي، واجهات خارجية، ولاندسكيب. كل مشروع بيبدأ باستماع حقيقي لاحتياجاتك وبيخلص بتسليم كامل جاهز للتنفيذ.</p>
          <p>في مجال الجرافيك: بصمم شعارات وهويات بصرية تعيش مع العلامة التجارية لسنين — منظومة بصرية كاملة تشمل المطبوعات والتغليف وحملات السوشيال ميديا.</p>
          <div class="btns">
            <a href="tel:${PHONE}" class="btn btn-primary">📞 اتصل بي</a>
            <a href="https://wa.me/${WA}" target="_blank" rel="noopener" class="btn btn-outline">واتساب مباشر 💬</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- تواصل -->
  <section class="section" id="contact">
    <div class="container">
      <div class="label-center reveal">
        <span class="eyebrow">تواصل مع رمضان</span>
        <h2 class="headline-md">هنبدأ مشروعك <span class="gold">من الصفر</span></h2>
        <p>استشارة أولى مجانية 100% — من غير أي التزام مسبق</p>
      </div>
      <div class="contact-cards">
        <a class="contact-card reveal" href="tel:${PHONE}">
          <span class="ico">📞</span>
          <span><span class="lbl">اتصل مباشرة</span><span class="val">${PHONE}</span></span>
        </a>
        <a class="contact-card reveal" href="https://wa.me/${WA}?text=${encodeURIComponent('مرحباً رمضان 👋 شفت البورتفوليو بتاعك وعايز أستفسر عن خدماتك')}" target="_blank" rel="noopener">
          <span class="ico">💬</span>
          <span><span class="lbl">واتساب مباشر</span><span class="val">ابعت رسالة الآن</span></span>
        </a>
      </div>
      <p class="offline-note reveal">📎 <b>نسخة أوفلاين:</b> الملف ده شغّال من غير إنترنت — أزرار الاتصال والواتساب والرابط اللي تحت هيتفتحوا لما النت يكون متاح.<br>المعرض الكامل بكل المشاريع: <a href="${SITE}" target="_blank" rel="noopener">rk-desgin-build-2an.pages.dev</a></p>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container">
    <p>© <span id="year">2026</span> رمضان قطب — جميع الحقوق محفوظة.</p>
    <p style="margin-top:6px">Designed by <span class="gold">RK Design Studio</span></p>
  </div>
</footer>

<!-- شريط التنقل السفلي (موبايل) -->
<nav class="rk-tabbar" aria-label="التنقل السريع">
  <a href="#home" class="rk-tab is-active" data-sec="home">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.8 12 3l9 6.8"/><path d="M5.2 9v11a1.6 1.6 0 0 0 1.6 1.6h10.4A1.6 1.6 0 0 0 18.8 20V9"/><path d="M9.6 21.4v-6.6h4.8v6.6"/></svg>
    <span class="lbl">الرئيسية</span>
  </a>
  <a href="#works" class="rk-tab" data-sec="works">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 10.5V7.5A3.5 3.5 0 0 1 9.5 4h5A3.5 3.5 0 0 1 18 7.5v3"/><path d="M4 12.5a2 2 0 0 1 4 0V15h8v-2.5a2 2 0 0 1 4 0v4.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17Z"/><path d="M6.5 19.5v1.7M17.5 19.5v1.7"/></svg>
    <span class="lbl">الأعمال</span>
  </a>
  <a href="https://wa.me/${WA}" class="rk-tab rk-tab-wa" target="_blank" rel="noopener" aria-label="تواصل عبر واتساب">
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
  </a>
  <a href="#about" class="rk-tab" data-sec="about">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/></svg>
    <span class="lbl">عن رمضان</span>
  </a>
  <a href="#contact" class="rk-tab" data-sec="contact">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z"/></svg>
    <span class="lbl">تواصل</span>
  </a>
</nav>

<!-- لايت بوكس المعرض -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="معرض المشروع">
  <div class="lb-top">
    <span class="lb-title" id="lb-title">—</span>
    <span class="lb-count" id="lb-count"></span>
    <button class="lb-close" id="lb-close" aria-label="إغلاق المعرض">✕</button>
  </div>
  <div class="lb-stage"><img id="lb-img" alt="صورة من المشروع"></div>
  <div class="lb-nav">
    <button class="lb-arrow" id="lb-next" aria-label="الصورة التالية">‹</button>
    <a class="lb-site" id="lb-site" href="#" target="_blank" rel="noopener">شاهد المشروع على الموقع ←</a>
    <button class="lb-arrow" id="lb-prev" aria-label="الصورة السابقة">›</button>
  </div>
</div>

<script>
(function () {
  'use strict';
  var WORKS = ${workData};

  document.getElementById('year').textContent = new Date().getFullYear();

  /* شرائح الهيرو */
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var cur = 0, timer = null;
  function go(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.classList.toggle('active', i === cur); });
    dots.forEach(function (d, i) { d.classList.toggle('active', i === cur); });
  }
  function play() { timer = setInterval(function () { go(cur + 1); }, 5000); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  dots.forEach(function (d, i) { d.addEventListener('click', function () { stop(); go(i); play(); }); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });
  play();

  /* عدّادات */
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nums = document.querySelectorAll('[data-counter]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    nums.forEach(function (el) { el.textContent = el.getAttribute('data-counter') + '+'; });
  } else {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = +el.getAttribute('data-counter'), v = 0;
        var step = Math.max(1, Math.ceil(target / 50));
        (function tick() {
          v = Math.min(v + step, target);
          el.textContent = v + '+';
          if (v < target) requestAnimationFrame(tick);
        })();
        cObs.unobserve(el);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { cObs.observe(n); });
  }

  /* ظهور الأقسام */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (r) { r.classList.add('is-in'); });
  } else {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rObs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (r) { rObs.observe(r); });
  }

  /* التبويب النشط حسب موضع التمرير */
  var tabs = document.querySelectorAll('.rk-tab[data-sec]');
  var secs = ['home', 'works', 'services', 'about', 'contact'].map(function (id) { return document.getElementById(id); });
  function onScroll() {
    var y = window.scrollY + window.innerHeight * 0.35, active = 'home';
    secs.forEach(function (s) { if (s && s.offsetTop <= y) active = s.id; });
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-sec') === active || (active === 'services' && t.getAttribute('data-sec') === 'works');
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href').slice(1);
      a.classList.toggle('is-active', href === active || (active === 'services' && href === 'works'));
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* اللايت بوكس */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbTitle = document.getElementById('lb-title');
  var lbCount = document.getElementById('lb-count');
  var lbSite = document.getElementById('lb-site');
  var lbPrev = document.getElementById('lb-prev');
  var lbNext = document.getElementById('lb-next');
  var pIdx = 0, iIdx = 0, lastFocus = null;

  function render() {
    var p = WORKS[pIdx];
    lbImg.src = p.i[iIdx];
    lbImg.alt = p.t + ' — صورة ' + (iIdx + 1);
    lbTitle.textContent = p.t;
    lbCount.textContent = (iIdx + 1) + ' / ' + p.i.length;
    lbPrev.disabled = iIdx === 0;
    lbNext.disabled = iIdx === p.i.length - 1;
    lbSite.href = p.u;
    lbSite.style.display = p.u ? '' : 'none';
  }
  function openLb(idx) {
    pIdx = idx; iIdx = 0; lastFocus = document.activeElement;
    render(); lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('lb-close').focus();
  }
  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.work-card').forEach(function (card) {
    card.addEventListener('click', function (e) { e.preventDefault(); openLb(+card.getAttribute('data-work')); });
  });
  document.getElementById('lb-close').addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb(); });
  lbPrev.addEventListener('click', function () { if (iIdx > 0) { iIdx--; render(); } });
  lbNext.addEventListener('click', function () { if (iIdx < WORKS[pIdx].i.length - 1) { iIdx++; render(); } });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') lbNext.click();
    if (e.key === 'ArrowRight') lbPrev.click();
  });

  /* سحب باللمس داخل اللايت بوكس */
  var touchX = null;
  lbImg.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lbImg.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) { dx > 0 ? lbPrev.click() : lbNext.click(); }
    touchX = null;
  }, { passive: true });
})();
</script>
</body>
</html>`;

  fs.writeFileSync(OUT, html);
  const totalKb = Math.round(fs.statSync(OUT).size / 1024);
  const imgsKb = report.reduce((a, r) => a + r.kb, 0);
  console.log('✅ تم توليد: rk-portfolio-offline.html');
  console.log('   الحجم الكلي: ' + (totalKb / 1024).toFixed(2) + ' MB (الصور قبل base64: ' + (imgsKb / 1024).toFixed(2) + ' MB)');
  console.log('   المشاريع: ' + workItems.length + ' | صور اللايت بوكس: ' + workItems.reduce((a, w) => a + w.light.length, 0));
})().catch(e => { console.error('فشل البناء:', e.message); process.exit(1); });

/* ─── أدوات ─── */
function escHtml(s) { return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function escAttr(s) { return escHtml(s).replace(/"/g, '&quot;'); }
