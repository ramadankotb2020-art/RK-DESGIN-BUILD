/* فحص سلامة الفيديوهات المدمجة: استخراج + فك ترميز بـ ffmpeg — الاستخدام: node tests/offline-video-extract.cjs [ملف] */
const fs = require('fs');
const { execSync } = require('child_process');
const { path: FFMPEG } = require('@ffmpeg-installer/ffmpeg');

const FILE = process.argv[2] || 'rk-portfolio-lite.html';
const html = fs.readFileSync(FILE, 'utf8');
const uris = html.match(/data:video\/mp4;base64,[A-Za-z0-9+/=]+/g) || [];
console.log('فيديوهات مدمجة:', uris.length);

// فحص أول 3 فيديوهات + أكبر واحد
const picks = [0, 1, 2, uris.reduce((best, u, i) => (u.length > uris[best].length ? i : best), 0)];
for (const i of new Set(picks)) {
  const b64 = uris[i].split(',')[1];
  const buf = Buffer.from(b64, 'base64');
  const f = '/tmp/extracted-' + i + '.mp4';
  fs.writeFileSync(f, buf);
  let info = '';
  try { info = execSync(`"${FFMPEG}" -i "${f}" 2>&1 | grep -E "Duration|Video:" || echo NO_STREAM`, { encoding: 'utf8', shell: '/bin/bash' }); }
  catch (e) { info = 'FFMPEG_ERR: ' + e.message.split('\n')[0]; }
  // فك ترميز كامل: لو فيه خطأ في البيانات هيظهر
  let decode = 'OK';
  try { execSync(`"${FFMPEG}" -v error -i "${f}" -f null - 2>/tmp/decode-err.txt`, { stdio: 'ignore' }); }
  catch (e) { decode = 'DECODE_FAIL'; }
  const errTxt = (fs.readFileSync('/tmp/decode-err.txt', 'utf8') || '').trim();
  console.log(`#${i}: ${buf.length} bytes | decode=${decode} ${errTxt ? '| ' + errTxt.slice(0, 120) : ''}`);
  console.log('   ' + info.trim().split('\n').map(l => l.trim()).join(' | ').slice(0, 160));
}
