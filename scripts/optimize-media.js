// scripts/optimize-media.js
//
// 🎬🖼️  ضغط وتخفيف كل الصور والفيديوهات + أبديت المشاريع.
//
// بيشتغل على images/projects-by-name/ و videos/:
//   - صور (jpg/png)  → WebP (عرض 1600px، جودة 78)           [sharp]
//   - فيديو (mp4)    → إعادة تشفير أصغر (عرض 1280، crf 28)   [ffmpeg]
//   - between الحجم بينزل 70–90%
//   - increment: الملفات اللي اتعملها قبل كده بتتخطّى (ذاكرة في .media-cache.json)
//   - الصور الأصل بتمسح. الفيديو بيتبدّل بالأصغر (لو الأصغر أنفع).
//   - بيشيل صوت الفيديو (-an) لأن الموقع بيشتغلها muted.
//
// تشغيل:  node scripts/optimize-media.js      (أو من update-site.bat)
// محتاج:  npm install sharp ffmpeg-static   (update-site.bat بيثبّتهم لوحدهم)

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SCAN_DIRS = [
  path.join(ROOT, "images", "projects-by-name"),
  path.join(ROOT, "videos")
];
const CACHE_FILE = path.join(ROOT, ".media-cache.json");

const MAX_IMG = 1600, IMG_Q = 78;
const MAX_VID_W = 1280, VID_CRF = 28;
const IMG_EXT = new Set([".jpg", ".jpeg", ".png"]);
const VID_EXT = new Set([".mp4"]);

/* ─── المكتبات ─── */
let sharp = null;
try { sharp = require("sharp"); sharp.cache(false); } catch (e) {}

let ffmpegPath = null;
try { ffmpegPath = require("ffmpeg-static"); } catch (e) {}
if (!ffmpegPath) {
  try { ffmpegPath = require("child_process").execSync("command -v ffmpeg || where ffmpeg", { stdio: ["ignore"] }).toString().trim().split(/\r?\n/)[0]; }
  catch { ffmpegPath = null; }
}

/* ─── ذاكرة increment ─── */
let cache = {};
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); } catch {}
function saveCache() { try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 0)); } catch {} }
function sig(f) {
  try { const s = fs.statSync(f); return s.size + ":" + Math.floor(s.mtimeMs); }
  catch { return "0:0"; }
}

/* ─── مشي المجلدات ─── */
function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function fmt(b) {
  if (b >= 1048576) return (b / 1048576).toFixed(1) + "MB";
  if (b >= 1024) return (b / 1024).toFixed(0) + "KB";
  return b + "B";
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, args, { maxBuffer: 20 * 1024 * 1024 }, (err) => {
      if (err) reject(err); else resolve();
    });
  });
}

/* ─── ضغط صورة ─── */
async function optimizeImage(f) {
  const out = f.replace(/\.(jpe?g|png)$/i, ".webp");
  await sharp(f)
    .resize({ width: MAX_IMG, height: MAX_IMG, fit: "inside", withoutEnlargement: true })
    .webp({ quality: IMG_Q })
    .toFile(out);
  const before = fs.statSync(f).size;
  const after = fs.statSync(out).size;
  try { fs.unlinkSync(f); } catch {}
  return { before, after };
}

/* ─── ضغط فيديو ─── */
async function optimizeVideo(f) {
  const tmp = f + ".opt.mp4";
  const args = [
    "-y", "-i", f,
    "-vf", "scale='min(" + MAX_VID_W + ",iw)':-2",
    "-c:v", "libx264", "-crf", String(VID_CRF), "-preset", "fast",
    "-an",                       // بدون صوت (الموقع muted)
    "-movflags", "+faststart",   // streaming سريع
    tmp
  ];
  await runFfmpeg(args);
  const before = fs.statSync(f).size;
  const after = fs.statSync(tmp).size;
  if (after < before) {
    fs.unlinkSync(f);
    fs.renameSync(tmp, f);
    return { before, after, replaced: true };
  }
  try { fs.unlinkSync(tmp); } catch {}
  return { before, after: before, replaced: false };
}

async function main() {
  console.log("");
  console.log("🎬🖼️  ضغط وتخفيف الصور والفيديوهات ...");
  console.log("");

  const all = [];
  for (const d of SCAN_DIRS) if (fs.existsSync(d)) walk(d, all);

  const imgs = all.filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()));
  const vids = all.filter((f) => VID_EXT.has(path.extname(f).toLowerCase()));

  if (!sharp && imgs.length) console.log("⚠️  sharp مش متثبتة — هتتخطّى الصور. شغّل: npm install sharp");
  if (!ffmpegPath && vids.length) console.log("⚠️  ffmpeg مش متاح — هتتتخطّى الفيديوهات. شغّل: npm install ffmpeg-static");
  console.log("");

  let stats = { imgDone: 0, imgSkip: 0, vidDone: 0, vidSkip: 0, fail: 0, bImg: 0, aImg: 0, bVid: 0, aVid: 0 };

  /* ─── صور ─── */
  for (const f of imgs) {
    const out = f.replace(/\.(jpe?g|png)$/i, ".webp");
    const key = "i:" + path.relative(ROOT, out);
    if (cache[key] === sig(out) || cache[key] === sig(f)) { stats.imgSkip++; continue; }  // اتعملت قبل كده
    if (!sharp) { stats.imgSkip++; continue; }
    try {
      const r = await optimizeImage(f);
      stats.imgDone++; stats.bImg += r.before; stats.aImg += r.after;
      cache[key] = sig(out);
    } catch (e) { stats.fail++; console.error("   ✗ صورة:", path.basename(f), "—", e.message); }
  }

  /* ─── فيديو ─── */
  for (const f of vids) {
    const key = "v:" + path.relative(ROOT, f);
    if (cache[key] === sig(f)) { stats.vidSkip++; continue; }   // اتعمل قبل كده
    if (!ffmpegPath) { stats.vidSkip++; continue; }
    try {
      const r = await optimizeVideo(f);
      stats.bVid += r.before; stats.aVid += r.after;
      if (r.replaced) stats.vidDone++; else stats.vidSkip++;
      cache[key] = sig(f);
    } catch (e) { stats.fail++; console.error("   ✗ فيديو:", path.basename(f), "—", e.message); }
  }

  saveCache();

  /* ─── ملخص ─── */
  console.log("✅ صور: " + stats.imgDone + " اتعملت" + (stats.imgSkip ? " | " + stats.imgSkip + " اتخطّت" : ""));
  console.log("✅ فيديو: " + stats.vidDone + " اتعمل" + (stats.vidSkip ? " | " + stats.vidSkip + " اتخطّوا" : ""));
  if (stats.fail) console.log("⚠️  فشل: " + stats.fail);
  if (stats.bImg) console.log("🖼️  صور: " + fmt(stats.bImg) + " → " + fmt(stats.aImg) +
    "  (−" + ((1 - stats.aImg / stats.bImg) * 100).toFixed(0) + "%)");
  if (stats.bVid) console.log("🎬 فيديو: " + fmt(stats.bVid) + " → " + fmt(stats.aVid) +
    "  (−" + ((1 - stats.aVid / stats.bVid) * 100).toFixed(0) + "%)");
  console.log("");
}

main().catch((e) => { console.error(e); process.exit(1); });
