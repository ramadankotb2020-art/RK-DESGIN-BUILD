// scripts/optimize-images.js
//
// 🖼️  تحويل وتخفيف كل صور المشاريع لـ WebP تلقائيًا.
//
// بيشتغل على images/projects-by-name/:
//   - بيحوّل كل صورة (jpg/jpeg/png) لـ WebP (عرض أقصى 1600px، جودة 78)
//   - between الحجم بينزل 80–90% تقريبًا
//   - increment: لو الـ webp موجود وأحدث من الأصل بيتخطّى (سريع)
//   - بيمسح الأصل بعد التحويل الناجح (عشان يخفّف) — إلا لو شغّلته بـ --keep-originals
//   - ما بيلمسش الفيديوهات (.mp4/.webm)
//
// بيشتغل مع update-site.bat أو لوحده:  node scripts/optimize-images.js
//
// محتاج مكتبة sharp — تثبّتها مرة:  npm install sharp
// لو sharp مش متثبتة، السكريبت بيحذّر ومبيقفش الـ build.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMAGES_ROOT = path.join(ROOT, "images", "projects-by-name");
const MAX_DIM = 1600;          // أقصى عرض/ارتفاع
const QUALITY = 78;            // جودة WebP
const IMG_EXT = new Set([".jpg", ".jpeg", ".png"]);
const KEEP_ORIGINALS = process.argv.includes("--keep-originals");

/* ─── محاولة تحميل sharp ─── */
let sharp;
try {
  sharp = require("sharp");
  sharp.cache(false);
} catch (e) {
  console.log("");
  console.log("⚠️  مكتبة sharp مش متثبتة — تخطّيت تحسين الصور.");
  console.log("    عشان تشغّل التحسين، افتح Terminal هنا واكتب مرة واحدة:");
  console.log("       npm install sharp");
  console.log("");
  process.exit(0);   // non-fatal: الـ build يكمّل بالصور الأصلية
}

/* ─── اجمع كل الصور recursively ─── */
function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && IMG_EXT.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

function fmt(b) {
  if (b >= 1048576) return (b / 1048576).toFixed(1) + "MB";
  return (b / 1024).toFixed(0) + "KB";
}

async function main() {
  console.log("🖼️  تحسين صور المشاريع → WebP ...");
  if (!fs.existsSync(IMAGES_ROOT)) {
    console.log("   مفيش مجلد images/projects-by-name — مفيش حاجة نحسّنها.");
    return;
  }

  const files = walk(IMAGES_ROOT);
  if (!files.length) {
    console.log("   مفيش صور (jpg/png) لتحسينها — كله WebP خلاص.");
    return;
  }

  let converted = 0, skipped = 0, failed = 0;
  let beforeBytes = 0, afterBytes = 0;

  for (const f of files) {
    const out = f.replace(/\.(jpe?g|png)$/i, ".webp");

    // increment: skip if webp موجود وأحدث
    try {
      if (fs.existsSync(out) &&
          fs.statSync(out).mtimeMs >= fs.statSync(f).mtimeMs) {
        skipped++;
        continue;
      }
    } catch { /* ignore stat errors */ }

    try {
      const srcSize = fs.statSync(f).size;
      await sharp(f)
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out);

      const outSize = fs.statSync(out).size;
      beforeBytes += srcSize;
      afterBytes += outSize;

      if (!KEEP_ORIGINALS) {
        try { fs.unlinkSync(f); } catch { /* keep if can't delete */ }
      }
      converted++;
    } catch (err) {
      failed++;
      console.error("   ✗ فشل:", path.basename(f), "—", err.message);
    }
  }

  console.log("");
  console.log("✅ اتعمل: " + converted + " صورة → WebP");
  if (skipped) console.log("⏭️  اتخطّى: " + skipped + " (محوّلة قبل كده)");
  if (failed) console.log("⚠️  فشل: " + failed);
  if (beforeBytes > 0) {
    console.log("📦 الحجم: " + fmt(beforeBytes) + "  →  " + fmt(afterBytes) +
                "  (−" + ((1 - afterBytes / beforeBytes) * 100).toFixed(0) + "%)");
  }
  if (KEEP_ORIGINALS) console.log("(الأصول الأصلية محتفظ بيها)");
  console.log("");
}

main().catch((e) => { console.error(e); process.exit(1); });
