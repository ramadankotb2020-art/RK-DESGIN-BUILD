/* ============================================================
   RK DESIGN — OG Tags للـ Crawlers (فيسبوك، واتساب، تيليجرام)
   بيشتغل على /project?id=xxx
   لو الطلب من crawler بيرجع HTML فيه OG tags صح
   لو مش crawler بيمشيه للصفحة العادية
   ============================================================ */

const SITE = 'https://rk-desgin-build-2an.pages.dev';
const DATA_URL = `${SITE}/js/projects-data.js`;

export async function onRequestGet(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // لو مفيش id روح للصفحة العادية
  if (!id) return next();

  // تحقق لو crawler
  const ua = request.headers.get('user-agent') || '';
  const isCrawler = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Googlebot|bingbot|Slackbot/i.test(ua);

  if (!isCrawler) return next();

  try {
    // جيب بيانات المشاريع
    const dataRes = await fetch(DATA_URL, {
      cf: { cacheEverything: true, cacheTtl: 300 }
    });
    const dataText = await dataRes.text();

    // استخرج الـ JSON
    const match = dataText.match(/const PROJECTS_FALLBACK\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) return next();

    const projects = JSON.parse(match[1]);
    const project = projects.find(p => p.id === id);
    if (!project) return next();

    const title = `${project.title} — RK Design Studio`;
    const desc = project.excerpt || project.description || 'تصميم داخلي وخارجي وجرافيك — رمضان قطب';
    const image = project.cover
      ? `${SITE}/${project.cover}`
      : `${SITE}/images/homepage/hero-slide-1-interior.webp`;
    const pageUrl = `${SITE}/project?id=${id}`;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${title}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:site_name" content="RK Design Studio">
<meta property="og:locale" content="ar_EG">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0;url=${pageUrl}">
</head>
<body>
<p>جاري التحويل...</p>
<script>window.location.href="${pageUrl}";</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-store'
      }
    });

  } catch(e) {
    return next();
  }
}
