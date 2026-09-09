// scripts/build-projects.js
//
// السكريبت ده بيشتغل تلقائي مع كل رفعة على Cloudflare (Build command).
// شغله: يفتح مجلد images/projects-by-name، يقرا كل فولدر مشروع،
// ويولّد ملف js/projects-data.js اللي الموقع بيقرا منه.
//
// إزاي تضيف مشروع جديد:
//   1) روح لمجلد images/projects-by-name/<القسم>/  (تصميم-داخلي أو تصميم-خارجي أو تصميم-جرافيك)
//   2) اعمل فولدر جديد باسم المشروع اللي عايزه يظهر بيه على الموقع
//   3) حط جوّاه صور المشروع (أول صورة أبجديًا = صورة الغلاف)
//   4) (اختياري) اعمل ملف info.txt جواه لتفاصيل إضافية — لو مش عملته، الموقع
//      هيحط قيم افتراضية بسيطة وتقدر تعدّلها بعدين
//   5) ادفع (Commit + Push) — الموقع هيتحدث لوحده تلقائي
//
// إزاي تعدّل مشروع موجود:
//   - غيّر اسم الفولدر = يتغيّر اسم المشروع على الموقع
//   - ضيف/امسح صورة من جوه الفولدر = تتضاف/تتمسح من الموقع
//   - عدّل info.txt = تتحدث التفاصيل
//
// إزاي تمسح مشروع:
//   - امسح الفولدر بتاعه بالكامل
//
// إزاي تتحكم في صور "الأعمال المميزة" في الصفحة الرئيسية:
//   - افتح info.txt بتاع أي مشروع عايزه يظهر في الصفحة الرئيسية
//   - ضيف سطر: مميز: نعم
//   - تقدر تعمل كده لحد 6 مشاريع. لو معملتش أي مشروع "مميز"، الموقع
//     هيعرض تلقائي أول 6 مشاريع بس كحل بديل.

const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");

const ROOT = path.join(__dirname, "..");
const IMAGES_ROOT = path.join(ROOT, "images", "projects-by-name");
const OUTPUT_FILE = path.join(ROOT, "js", "projects-data.js");

const DISCIPLINE_FOLDERS = {
  "تصميم-داخلي": "interior",
  "تصميم-خارجي": "exterior",
  "تصميم-جرافيك": "graphic"
};

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const VIDEO_EXT = [".mp4", ".webm"];

function slugify(str) {
  return (
    (str || "")
      .toString()
      .toLowerCase()
      .replace(/[^\u0621-\u064Aa-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50) || "project"
  );
}

function parseInfoTxt(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const map = {
    "العنوان": "title",
    "التصنيف": "category",
    "الموقع": "location",
    "السنة": "year",
    "المساحة": "area",
    "الوصف": "description",
    "الفكرة": "idea",
    "الخامات": "materials",
    "الوسوم": "tags",
    "مميز": "featured",
    "الخدمات": "services",
    "عنوان SEO": "seoTitle",
    "وصف SEO": "seoDescription",
    "وصف الصورة": "alt",
    "الرابط": "slug",
    "الحالة": "status",
    "نوع المشروع": "categoryKey",
    "فيسبوك": "facebook",
    "status": "status", "slug": "slug", "facebook": "facebook"
  };
  const out = {};
  for (const line of text.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    const field = map[key];
    if (!field || !value) continue;
    if (field === "materials" || field === "tags" || field === "services") {
      out[field] = value.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (field === "featured") {
      out[field] = ["نعم", "yes", "true", "y"].includes(value.toLowerCase());
    } else {
      out[field] = value;
    }
  }
  return out;
}

function buildProjectFromFolder(disciplineKey, folderName, folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  /* ─── Collect images sorted — تفضيل WebP + تجاهل الصور الفاضية (0 بايت) ─── */
  const allImg = entries
    .filter((e) => e.isFile() && IMAGE_EXT.includes(path.extname(e.name).toLowerCase()))
    .map((e) => e.name);
  const isEmpty = (name) => {
    try { return fs.statSync(path.join(folderPath, name)).size === 0; }
    catch { return true; }
  };
  const empties = allImg.filter(isEmpty);
  if (empties.length) console.log("⚠️  \"" + folderName + "\" فيه " + empties.length + " صورة فاضية (0 بايت) — ارفعها تاني على git.");
  const imgNames = allImg.filter((n) => !isEmpty(n));
  const byBase = {};
  for (const name of imgNames) {
    const base = name.replace(/\.(jpe?g|png|webp|gif)$/i, "");
    if (!byBase[base] || /\.webp$/i.test(name)) byBase[base] = name; // فضّل webp
  }
  const images = Object.values(byBase).sort();

  if (!images.length) {
    /* فولدر فيديو بس = تنبيه واضح (محتاج صورة غلاف) */
    const vids = entries.filter((e) => e.isFile() && VIDEO_EXT.includes(path.extname(e.name).toLowerCase()));
    if (vids.length) console.log("⚠️  تخطّيت \"" + folderName + "\" — فيديو بس من غير صورة غلاف. ضيف صورة واحدة على الأقل جوّه الفولدر.");
    return null;
  }

  /* ─── Collect videos sorted ─── */
  const videos = entries
    .filter((e) => e.isFile() && VIDEO_EXT.includes(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort();

  const cover = `images/projects-by-name/${disciplineKey}/${folderName}/${images[0]}`;

  /* ─── Merge images (from index 1) + videos in sorted order ─── */
  /* cover.mp4 goes at start of gallery, numbered videos go in their natural position */
  const allGalleryFiles = [
    ...images.slice(1),
    ...videos.filter(v => v !== 'cover.mp4')  /* numbered videos like 1.mp4, 2.mp4 */
  ].sort();

  /* cover.mp4 gets prepended separately if exists */
  const hasCoverVideo = videos.includes('cover.mp4');

  const gallery = [
    ...(hasCoverVideo ? [`images/projects-by-name/${disciplineKey}/${folderName}/cover.mp4`] : []),
    ...allGalleryFiles.map((f) => `images/projects-by-name/${disciplineKey}/${folderName}/${f}`)
  ];

  const info = parseInfoTxt(path.join(folderPath, "info.txt"));
  const discipline = DISCIPLINE_FOLDERS[disciplineKey] || disciplineKey;
  const title = info.title || folderName;

  /* ─── الفيديو الأساسي للمشروع (للعرض التلقائي على الكارت) ─── */
  const primaryVideoName = hasCoverVideo ? "cover.mp4" : (videos[0] || null);
  const video = primaryVideoName
    ? "images/projects-by-name/" + disciplineKey + "/" + folderName + "/" + primaryVideoName
    : null;

  return {
    id: "project-" + createHash("sha256").update(disciplineKey + "/" + folderName).digest("hex").slice(0,16),
    legacyId: slugify(title) + "-" + Buffer.from(folderName).toString("hex").slice(0, 8),
    discipline,
    category: info.category || ({interior:"تصميم داخلي",exterior:"تصميم خارجي ولاندسكيب",graphic:"جرافيك وهوية بصرية"}[discipline] || discipline),
    categoryKey: info.categoryKey || discipline,
    title,
    slug: info.slug ? slugify(info.slug) : slugify(title) + "-" + createHash("sha256").update(disciplineKey + "/" + folderName).digest("hex").slice(0, 10),
    status: /^(draft|مسودة)$/i.test(info.status || "") ? "draft" : "published",
    facebook: /^(yes|true|نعم)$/i.test(info.facebook || ""),
    services: info.services || [],
    seoTitle: info.seoTitle || `${title}${info.location ? " — " + info.location : ""} | RK Design Studio`,
    seoDescription: info.seoDescription || info.description || `شاهد صور وتفاصيل مشروع ${title} من أعمال رمضان قطب — RK Design Studio.`,
    alt: info.alt || `${title}${info.location ? " — " + info.location : ""}`,
    location: info.location || "",
    area: info.area || null,
    year: info.year || "",
    cover,
    before: null,
    gallery,
    video,
    excerpt: info.description ? info.description.slice(0, 120) : `مشروع ${title}`,
    description: info.description || `مشروع ${title}.`,
    idea: info.idea || "",
    materials: info.materials || [],
    tags: info.tags || [],
    featured: !!info.featured
  };
}

async function main() {
  const projects = [];

  if (!fs.existsSync(IMAGES_ROOT)) {
    console.log("مفيش مجلد images/projects-by-name — هيتم الاحتفاظ بالبيانات الحالية.");
    return;
  }

  for (const disciplineFolder of fs.readdirSync(IMAGES_ROOT)) {
    const disciplinePath = path.join(IMAGES_ROOT, disciplineFolder);
    if (!fs.statSync(disciplinePath).isDirectory()) continue;

    for (const projectFolder of fs.readdirSync(disciplinePath)) {
      const projectPath = path.join(disciplinePath, projectFolder);
      if (!fs.statSync(projectPath).isDirectory()) continue;

      const project = buildProjectFromFolder(disciplineFolder, projectFolder, projectPath);
      if (project && project.status === "published") projects.push(project);
    }
  }

  // The same named project may legitimately exist in two service folders.
  const titleCounts = new Map();
  for (const p of projects) titleCounts.set(p.seoTitle, (titleCounts.get(p.seoTitle) || 0) + 1);
  for (const p of projects) {
    if (titleCounts.get(p.seoTitle) > 1) {
      const label = { interior: "التصميم الداخلي", exterior: "التصميم الخارجي", graphic: "الجرافيك" }[p.discipline] || p.discipline;
      p.seoTitle += " — " + label;
    }
  }
  const slugs = new Set();
  const sharp = require("sharp");
  for (const project of projects) {
    if (slugs.has(project.slug)) throw new Error("Duplicate project slug: " + project.slug);
    slugs.add(project.slug);
    project.url = "projects/" + encodeURIComponent(project.slug) + "/";
    project.imageMeta = {};
    const coverPath = path.join(ROOT, project.cover);
    const hash = createHash("sha256").update(fs.readFileSync(coverPath)).digest("hex").slice(0,16);
    const responsiveDir = path.join(ROOT, "images", "responsive");
    fs.mkdirSync(responsiveDir, { recursive: true });
    project.coverSources = [];
    const coverMeta = await sharp(coverPath).metadata();
    for (const width of [480, 800]) {
      if ((coverMeta.orientation >= 5 ? coverMeta.height : coverMeta.width) < width) continue;
      const dest = `images/responsive/${hash}-${width}.webp`;
      if (!fs.existsSync(path.join(ROOT, dest))) await sharp(coverPath).rotate().resize({ width, withoutEnlargement:true }).webp({ quality:84 }).toFile(path.join(ROOT, dest));
      project.coverSources.push({ src:dest, width });
    }
    for (const src of [project.cover, ...project.gallery].filter(src => IMAGE_EXT.includes(path.extname(src).toLowerCase()))) {
      const { width, height, orientation } = await sharp(path.join(ROOT, src)).metadata();
      project.imageMeta[src] = orientation >= 5 ? { width: height, height: width } : { width, height };
    }
  }
  const fileContent =
    "/* الملف ده بيتولّد تلقائيًا من مجلدات المشاريع — متعدّلوش يدويًا. */\n" +
    "const PROJECTS_FALLBACK = " +
    JSON.stringify(projects, null, 2) +
    ";\n" +
    "const projectsData = PROJECTS_FALLBACK;\n";

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, fileContent, "utf8");

  await require("./enhance-pages.js")();
  await require("./build-pages.js")(projects);

  console.log(`تم توليد ${projects.length} مشروع في js/projects-data.js`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
