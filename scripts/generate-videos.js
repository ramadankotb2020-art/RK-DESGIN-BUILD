// scripts/generate-videos.js
//
// 🎬 يولّد فيديو (Ken Burns + انتقالات) من صور أي مشروع ماعندهوش cover.mp4.
// → كده كل مشروع يبقى ليه فيديو حتى اللي بصور بس.
//
// تشغيل:  node scripts/generate-videos.js   (أو من update-site.bat تلقائي)
// محتاج:  npm install ffmpeg-static

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PROJECTS_ROOT = path.join(ROOT, "images", "projects-by-name");
const IMG_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const PER_IMG = 3.5;      // ثانية لكل صورة
const FADE = 1.0;         // مدة الانتقال (dissolve ناعم)
const MAX_IMGS = 3;       // أقصى صور في الفيديو (أخف)
const FPS = 30;
const W = 1280, H = 720;  // 16:9

/* 🎬 تدرج سينمائي فاخر: تباين غني، دفء ذهبي، vignette، grain خفيف */
const CINEMA_GRADE =
  "eq=contrast=1.15:brightness=-0.03:saturation=1.12," +
  "colorbalance=rs=0.05:gs=0.0:bs=-0.04:rm=0.03:gm=0.0:bm=-0.02," +  // دفء ذهبي
  "vignette=PI/4.2," +                                                 // تعتيم الحواف
  "noise=alls=7";                                                       // grain سينمائي خفيف

let ffmpegPath = null;
try { ffmpegPath = require("ffmpeg-static"); } catch (e) {}
if (!ffmpegPath) {
  try { ffmpegPath = require("child_process").execSync("command -v ffmpeg || where ffmpeg", { stdio: ["ignore"] }).toString().trim().split(/\r?\n/)[0]; }
  catch { ffmpegPath = null; }
}

function listProjects() {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(PROJECTS_ROOT, { withFileTypes: true }); } catch { return out; }
  for (const disc of entries) {
    if (!disc.isDirectory()) continue;
    const dp = path.join(PROJECTS_ROOT, disc.name);
    for (const proj of fs.readdirSync(dp, { withFileTypes: true })) {
      if (!proj.isDirectory()) continue;
      out.push({ disc: disc.name, proj: proj.name, path: path.join(dp, proj.name) });
    }
  }
  return out;
}

function imagesOf(folder) {
  let files;
  try { files = fs.readdirSync(folder); } catch { return []; }
  return files
    .filter(f => IMG_EXT.includes(path.extname(f).toLowerCase()))
    .filter(f => { try { return fs.statSync(path.join(folder, f)).size > 0; } catch { return false; } })
    .sort()
    .map(f => path.join(folder, f));
}

function makeKenBurns(images, outPath) {
  const n = Math.min(images.length, MAX_IMGS);
  const imgs = images.slice(0, n);
  const inputs = [];
  imgs.forEach(im => inputs.push("-loop", "1", "-t", String(PER_IMG), "-i", im));

  let filter = "", last;
  if (n === 1) {
    /* صورة واحدة → زووم بطيء ناعم (زي dolly سينمائي) */
    const bigW = Math.round(W * 1.5), bigH = Math.round(H * 1.5);
    filter = `[0:v]scale=${bigW}:${bigH}:force_original_aspect_ratio=increase,crop=${bigW}:${bigH},` +
             `zoompan=z='min(zoom+0.0009,1.22)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(PER_IMG * FPS)}:s=${W}x${H}:fps=${FPS},format=yuv420p[v0]`;
    last = "v0";
  } else {
    /* صور متعددة → dissolve ناعم (مش flashy) */
    for (let i = 0; i < n; i++) {
      filter += `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},format=yuv420p[v${i}];`;
    }
    let prev = "v0", off = PER_IMG - FADE;
    for (let i = 1; i < n; i++) {
      const lbl = i === n - 1 ? "vout" : "x" + i;
      filter += `[${prev}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${off.toFixed(2)}[${lbl}];`;
      prev = lbl; off += PER_IMG - FADE;
    }
    filter = filter.replace(/;$/, "");
    last = "vout";
  }

  /* طبّق التدرج السينمائي على الناتج النهائي */
  filter += `;[${last}]${CINEMA_GRADE},format=yuv420p[vg]`;

  const args = [...inputs, "-filter_complex", filter, "-map", "[vg]",
    "-c:v", "libx264", "-crf", "28", "-preset", "fast", "-an",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", outPath];
  execFileSync(ffmpegPath, args, { stdio: ["ignore", "ignore", "ignore"] });
}

function main() {
  console.log("");
  console.log("🎬 توليد فيديوهات من الصور للمشاريع اللي ملهاش فيديو ...");
  if (!ffmpegPath) { console.log("⚠️ ffmpeg مش متاح — شغّل: npm install ffmpeg-static"); return; }

  const projects = listProjects();
  let made = 0, skip = 0, fail = 0;
  for (const p of projects) {
    const coverMp4 = path.join(p.path, "cover.mp4");
    if (fs.existsSync(coverMp4) && fs.statSync(coverMp4).size > 0) { skip++; continue; } // عنده فيديو خلاص
    const imgs = imagesOf(p.path);
    if (!imgs.length) { skip++; continue; }
    try {
      makeKenBurns(imgs, coverMp4);
      if (fs.existsSync(coverMp4) && fs.statSync(coverMp4).size > 0) { made++; console.log("  ✓ " + p.proj); }
      else { fail++; }
    } catch (e) { fail++; }
  }
  console.log("");
  console.log("✅ تم توليد: " + made + " فيديو | تخطّى: " + skip + " | فشل: " + fail);
  console.log("");
}

main();
