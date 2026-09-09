'use strict';
const fs = require('fs');
const path = require('path');
const config = require('../site.config.json');
const root = path.join(__dirname, '..');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const absolute = src => new URL(src.replace(/\.html$/, ''), config.url + '/').href;
const types = { interior: 'التصميم الداخلي', exterior: 'التصميم الخارجي واللاندسكيب', graphic: 'الجرافيك والهوية البصرية', landscape:'لاندسكيب', '3d':'التصور ثلاثي الأبعاد', branding:'الهوية البصرية', printing:'المطبوعات والتغليف' };
const sections = { interior:'interior-design.html', exterior:'exterior-design.html', graphic:'graphic-design.html' };
const isVideo = src => /\.(mp4|webm)$/i.test(src);
const dims = (p, src) => p.imageMeta[src] ? ` width="${p.imageMeta[src].width}" height="${p.imageMeta[src].height}"` : '';
const srcset = (p, eager) => !eager && p.coverSources?.length ? ` srcset="${p.coverSources.map(s=>esc(s.src)+' '+s.width+'w').join(', ')}" sizes="(min-width:900px) 33vw, (min-width:600px) 50vw, 100vw"` : '';
const img = (p, src, alt, eager = false) => `<img src="${esc(src)}" alt="${esc(alt)}"${dims(p, src)}${src===p.cover?srcset(p,eager):''} loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
function meta(title, description, url, image) {
  return `<title>${esc(title)}</title>\n<meta name="description" content="${esc(description)}">\n<link rel="canonical" href="${esc(url)}">\n<meta property="og:type" content="website">\n<meta property="og:title" content="${esc(title)}">\n<meta property="og:description" content="${esc(description)}">\n<meta property="og:url" content="${esc(url)}">\n<meta property="og:image" content="${esc(image)}">\n<meta property="og:image:alt" content="${esc(title)}">\n<meta property="og:locale" content="ar_EG">\n<meta property="og:site_name" content="RK Design Studio">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(title)}">\n<meta name="twitter:description" content="${esc(description)}">\n<meta name="twitter:image" content="${esc(image)}">`;
}
module.exports = async function buildPages(projects) {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const header = home.match(/<header\b[\s\S]*?<\/header>/)[0].replace(/class="active"/g, '');
  const footer = home.match(/<footer\b[\s\S]*?<\/footer>/)[0];
  const shell = (title, description, route, image, body, schema, base) => `<!doctype html>\n<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><base href="${base}">${meta(title,description,absolute(route),absolute(image))}<link rel="icon" href="favicon.svg"><meta name="theme-color" content="#c5a059"><link rel="stylesheet" href="css/style.css"><link rel="stylesheet" href="css/responsive.css"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json">${json(schema)}</script></head><body><a class="skip-link" href="#main-content">انتقل للمحتوى الرئيسي</a>${header}<main id="main-content" class="project-document container">${body}</main>${footer}<script src="js/projects-data.js" defer></script><script src="js/main.js" defer></script><script src="js/accessibility.js" defer></script><script src="js/project-gallery.js" defer></script></body></html>`;
  const out = path.join(root, 'projects');
  fs.mkdirSync(out, { recursive:true });
  // Only remove pages previously owned by this generator; never remove user project folders.
  const manifestPath = path.join(root, '.generated-projects.json');
  const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath)) : [];
  const current = projects.map(p => p.slug);
  for (const slug of previous) if (!current.includes(slug) && !slug.includes('/') && !slug.includes('..')) {
    fs.rmSync(path.join(out, slug, 'index.html'), { force:true });
  }
  const card = p => `<a class="project-card" href="${esc(p.url)}"><div class="project-card-media">${img(p,p.cover,p.alt)}</div><div class="project-info"><p>${esc(p.category || types[p.discipline] || p.discipline)}</p><h2>${esc(p.title)}</h2></div></a>`;
  for (const p of projects) {
    const route = p.url;
    const section = sections[p.discipline] || 'projects/';
    const label = types[p.discipline] || p.discipline;
    const crumbs = [{name:'الرئيسية',item:absolute('/')},{name:label,item:absolute(section)},{name:p.title,item:absolute(route)}];
    const schema = {'@context':'https://schema.org','@graph':[
      {'@type':'CreativeWork','@id':absolute(route)+'#project',name:p.title,description:p.seoDescription,url:absolute(route),image:absolute(p.cover),creator:{'@id':config.url+'/#person'},keywords:p.tags.join(', '),...(p.year && /^\d{4}$/.test(p.year) ? {dateCreated:p.year} : {})},
      {'@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,...c}))}
    ]};
    const gallery = p.gallery.map((src,i) => isVideo(src)
      ? `<figure><video controls playsinline preload="none" aria-label="فيديو ${esc(p.title)} — ${i+1}"><source src="${esc(src)}" type="${/\.webm$/i.test(src)?'video/webm':'video/mp4'}"></video><figcaption>فيديو المشروع — ${i+1}</figcaption></figure>`
      : `<figure><button type="button" class="gallery-open" data-gallery-src="${esc(src)}" aria-label="تكبير ${esc(p.alt)} — لقطة ${i+1}">${img(p,src,p.alt+' — لقطة '+(i+1))}</button><figcaption>${esc(p.title)} — لقطة ${i+1}</figcaption></figure>`).join('');
    const details = [['التصنيف',p.category||label],['الموقع',p.location],['السنة',p.year],['المساحة',p.area]].filter(x=>x[1]).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    const related = projects.filter(x=>x.id!==p.id && x.discipline===p.discipline).slice(0,3);
    const body = `<nav class="breadcrumbs" aria-label="مسار الصفحة"><a href="index.html">الرئيسية</a><span aria-hidden="true"> / </span><a href="${section}">${esc(label)}</a><span aria-hidden="true"> / </span><span aria-current="page">${esc(p.title)}</span></nav><header class="project-heading"><p class="eyebrow">${esc(label)}</p><h1>${esc(p.title)}</h1><p>${esc(p.description)}</p></header><dl class="project-facts">${details}</dl><figure class="project-cover">${img(p,p.cover,p.alt,true)}</figure>${p.idea?`<section class="section-sm"><h2>فكرة المشروع</h2><p>${esc(p.idea)}</p></section>`:''}${p.services.length?`<section class="section-sm"><h2>الخدمات المقدمة</h2><ul>${p.services.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></section>`:''}${gallery?`<section class="section-sm"><h2>صور وفيديوهات المشروع</h2><div class="project-gallery">${gallery}</div></section>`:''}<section class="project-cta"><h2>عندك مشروع مشابه؟</h2><p>تواصل مع رمضان قطب لمناقشة احتياجات مشروعك.</p><a class="btn btn-primary" href="https://wa.me/${config.whatsapp}?text=${encodeURIComponent('مرحبًا رمضان، أرغب في استشارة بخصوص مشروع مشابه لـ '+p.title+'\n'+absolute(route))}" target="_blank" rel="noopener">طلب استشارة عبر واتساب</a><a class="btn btn-outline" href="contact.html">أرسل تفاصيل مشروعك</a></section><section class="section-sm"><h2>أعمال ذات صلة</h2><div class="portfolio-grid">${related.map(card).join('')}</div><a class="btn btn-outline" href="projects/">شاهد كل المشاريع</a></section>`;
    const dir = path.join(out,p.slug); fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'),shell(p.seoTitle,p.seoDescription,route,p.cover,body,schema,'../../').replace('</head>',`<meta name="rk-project-id" content="${esc(p.id)}"></head>`));
  }
  fs.writeFileSync(path.join(out,'index.html'),shell('كل مشاريع رمضان قطب | RK Design Studio','تصفح أعمال التصميم الداخلي والخارجي والجرافيك والهوية البصرية من RK Design Studio.','projects/','images/homepage/hero-slide-1-interior.webp',`<h1>مشاريع RK Design Studio</h1><p>تصميم داخلي وخارجي، جرافيك وهوية بصرية — اختر مشروعًا للتعرف على تفاصيله.</p><div class="portfolio-grid">${projects.map(card).join('')}</div>`,{'@context':'https://schema.org','@type':'CollectionPage',name:'مشاريع RK Design Studio',url:absolute('projects/')},'../'));
  fs.writeFileSync(manifestPath,JSON.stringify(current,null,2)+'\n');
  // Only opt-in published projects enter the social queue; no credentials or private drafts.
  const posts = projects.filter(p=>p.facebook).map(p=>({id:p.id,status:'published',url:absolute(p.url),image:absolute(p.cover),title:p.title,message:[p.title,p.description,p.category||types[p.discipline],'شاهد المشروع كاملًا:',absolute(p.url),'لطلب استشارة تواصل مع RK Design Studio.'].filter(Boolean).join('\n\n')}));
  fs.writeFileSync(path.join(root,'social-posts.json'),JSON.stringify(posts,null,2)+'\n');
  const routes = ['','about.html','interior-design.html','exterior-design.html','graphic-design.html','contact.html','room-designer.html','projects/',...projects.map(p=>p.url)];
  fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+routes.map(r=>`  <url><loc>${esc(absolute(r))}</loc></url>`).join('\n')+'\n</urlset>\n');
  fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\nDisallow: /api/\nDisallow: /functions/\n\nSitemap: ${config.url}/sitemap.xml\n`);
};
