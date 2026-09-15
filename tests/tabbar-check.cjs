/* Mobile tab-bar injection check (dev-only, jsdom). Not part of npm test. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const mainJs = fs.readFileSync('js/main.js', 'utf8');
const root = 'https://rk.test';
const HREF = { home: 'index.html', interior: 'interior-design.html', graphic: 'graphic-design.html', contact: 'contact.html' };

const cases = [
  { file: 'index.html', url: root + '/', expect: ['home'] },
  { file: 'index.html', url: root + '/index.html', expect: ['home'] },
  { file: 'interior-design.html', url: root + '/interior-design.html', expect: ['interior'] },
  { file: 'exterior-design.html', url: root + '/exterior-design.html', expect: ['interior'] },
  { file: 'graphic-design.html', url: root + '/graphic-design.html', expect: ['graphic'] },
  { file: 'contact.html', url: root + '/contact.html', expect: ['contact'] },
  { file: 'about.html', url: root + '/about.html', expect: [] },
  { file: '404.html', url: root + '/nope-404', expect: [] },
  { file: 'projects/index.html', url: root + '/projects/', expect: [] },
  { file: 'project.html', url: root + '/project.html', expect: [] }
];

const projDir = fs.readdirSync('projects').filter(function (d) {
  return fs.statSync(path.join('projects', d)).isDirectory();
});
let interiorProj = null, graphicProj = null;
for (const d of projDir) {
  const html = fs.readFileSync(path.join('projects', d, 'index.html'), 'utf8');
  const crumbMatch = html.match(/class="breadcrumbs"[\s\S]{0,900}?<\/nav>/);
  const crumbs = crumbMatch ? crumbMatch[0] : '';
  if (!interiorProj && crumbs.indexOf('href="interior-design.html"') !== -1) interiorProj = d;
  if (!graphicProj && crumbs.indexOf('href="graphic-design.html"') !== -1) graphicProj = d;
}
if (interiorProj) cases.push({ file: 'projects/' + interiorProj + '/index.html', url: root + '/projects/' + interiorProj + '/', expect: ['interior'] });
if (graphicProj) cases.push({ file: 'projects/' + graphicProj + '/index.html', url: root + '/projects/' + graphicProj + '/', expect: ['graphic'] });

let failed = 0;
for (const c of cases) {
  const html = fs.readFileSync(c.file, 'utf8');
  const dom = new JSDOM(html, { url: c.url, runScripts: 'outside-only', pretendToBeVisual: true });
  const window = dom.window;
  // jsdom lacks IntersectionObserver (used by counters) — stub it like a real browser would provide it
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = function () { this.observe = function () {}; this.unobserve = function () {}; this.disconnect = function () {}; };
  }
  const errors = [];
  window.addEventListener('error', function (e) { errors.push(String(e.error)); });
  try { window.eval(mainJs); } catch (e) { errors.push('eval: ' + e.message); }
  if (window.document.readyState !== 'complete') {
    window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  }
  const bar = window.document.querySelector('.rk-tabbar');
  const name = c.file + ' @ ' + new URL(c.url).pathname;
  if (!bar) { console.log('FAIL ' + name + ' — no tabbar'); failed++; continue; }
  const tabs = Array.prototype.slice.call(bar.querySelectorAll('.rk-tab'));
  const active = tabs.filter(function (t) { return t.classList.contains('is-active'); }).map(function (t) { return t.getAttribute('href'); });
  const wa = bar.querySelector('.rk-tab-wa');
  const problems = [];
  if (tabs.length !== 5) problems.push('tabs=' + tabs.length);
  if (!wa || wa.getAttribute('href') !== 'https://wa.me/201112630681') problems.push('wa link wrong');
  const expectedHrefs = c.expect.map(function (k) { return HREF[k]; });
  const okActive = active.length === expectedHrefs.length && expectedHrefs.every(function (h) { return active.indexOf(h) !== -1; });
  if (!okActive) problems.push('active=[' + active + '] expected=[' + expectedHrefs + ']');
  if (errors.length) problems.push('js errors: ' + errors.join(' | '));
  if (!bar.querySelector('.rk-tab-label')) problems.push('no labels');
  if (tabs.filter(function (t) { return t.getAttribute('aria-current') === 'page'; }).length !== expectedHrefs.length) problems.push('aria-current mismatch');
  if (problems.length) { console.log('FAIL ' + name + ' — ' + problems.join('; ')); failed++; }
  else console.log('PASS ' + name + ' — active: [' + (active.join(', ') || 'none') + ']');
}
console.log(failed ? '\n' + failed + ' FAILURES' : '\nALL PASS');
process.exit(failed ? 1 : 0);
