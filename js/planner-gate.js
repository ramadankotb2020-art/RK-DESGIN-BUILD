/* ══════════════════════════════════════════════════════════════
   RK DESIGN — Planner Viral Gate (البوابة الفيروسية)
   أول استخدام مجاني. للتاني ولازم يشارك الأداة على السوشيال
   ميديا عشان يفتح جلسة رسم جديدة → الأداة بتعمل إعلاناتها بنفسها.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  // شغّال على صفحة المخطط بس
  if (!/[?&]|^\/room-designer/.test(location.pathname) && !location.pathname.endsWith('room-designer.html')) {
    if (!document.querySelector('[data-planner]') && !document.getElementById('exportBtn')) return;
  }

  var KEY = 'rk_planner_gate_v1';
  var SITE_URL = location.origin + location.pathname.replace(/\/$/, '') + '/room-designer.html';
  SITE_URL = location.origin + location.pathname; // رابط الصفحة الحالي
  var SHARE_TEXT = 'صمّمت مساحتي بأداة رمضان قطب المجانية للتصميم 🏠✨ — جرّبها بنفسك واحصل على استشارة ديكور مجانية:';

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  /* ─── حقن الستايل ─── */
  var css = document.createElement('style');
  css.textContent = '\
#rk-gate{position:fixed;inset:0;z-index:99990;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(8,7,5,.86);backdrop-filter:blur(14px);}\
#rk-gate.is-open{display:flex;animation:rkgIn .4s ease}\
@keyframes rkgIn{from{opacity:0}to{opacity:1}}\
.rk-gate-card{position:relative;width:100%;max-width:480px;background:linear-gradient(160deg,#15120c,#0c0a07);border:1px solid rgba(197,160,89,.35);border-radius:22px;padding:40px 32px 28px;text-align:center;box-shadow:0 40px 120px rgba(0,0,0,.7),0 0 60px rgba(197,160,89,.12);overflow:hidden}\
.rk-gate-card::before{content:"";position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(197,160,89,.18),transparent 70%);pointer-events:none}\
.rk-gate-emoji{font-size:46px;margin-bottom:14px;display:block}\
.rk-gate-title{font-size:24px;font-weight:900;color:#fff;margin-bottom:10px;letter-spacing:-.5px}\
.rk-gate-sub{color:rgba(255,255,255,.66);font-size:15px;line-height:1.7;margin-bottom:26px}\
.rk-gate-sub b{color:#c5a059}\
.rk-share-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}\
.rk-share-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;font-weight:700;font-size:14px;cursor:pointer;transition:.25s;font-family:inherit}\
.rk-share-btn:hover{transform:translateY(-2px);border-color:#c5a059;background:rgba(197,160,89,.12)}\
.rk-share-btn.wa{background:rgba(37,211,102,.12);border-color:rgba(37,211,102,.4)}\
.rk-share-btn.fb{background:rgba(24,119,242,.12);border-color:rgba(24,119,242,.4)}\
.rk-share-btn.x{background:rgba(255,255,255,.06)}\
.rk-share-btn.cp{grid-column:1/-1;background:rgba(197,160,89,.12);border-color:rgba(197,160,89,.4);color:#c5a059}\
.rk-gate-foot{margin-top:18px;font-size:12px;color:rgba(255,255,255,.4)}\
.rk-gate-thanks{font-size:40px;margin-bottom:12px}\
.rk-confetti{position:absolute;width:8px;height:8px;pointer-events:none}\
/* زر المشاركة العائم (دعوة دايمة) */\
#rk-float-share{position:fixed;bottom:20px;left:20px;z-index:9000;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:30px;background:linear-gradient(135deg,#c5a059,#a38345);color:#0a0a0a;font-weight:800;font-size:13px;box-shadow:0 10px 30px rgba(197,160,89,.35);cursor:pointer;border:none;font-family:inherit;transition:.25s}\
#rk-float-share:hover{transform:translateY(-2px) scale(1.03)}\
@media(max-width:560px){.rk-gate-card{padding:32px 22px 22px}.rk-gate-title{font-size:21px}.rk-share-row{grid-template-columns:1fr}}\
';
  document.head.appendChild(css);

  /* ─── بناء المودال ─── */
  var gate = document.createElement('div');
  gate.id = 'rk-gate';
  gate.innerHTML =
    '<div class="rk-gate-card" id="rkGateCard">' +
      '<span class="rk-gate-emoji">🎁</span>' +
      '<div class="rk-gate-title">تجربتك المجانية خلصت!</div>' +
      '<div class="rk-gate-sub">أول تصميم كان <b>مجاني</b> ✅<br>لكي ت افتتح جلسة رسم جديدة، <b>شارك الأداة</b> مع أصحابك على السوشيال ميديا — وكده بتحبّب غيرك في التصميم وتاخد جلسة جديدة مجانًا 🔥</div>' +
      '<div class="rk-share-row">' +
        '<button class="rk-share-btn wa" data-sh="wa">💬 واتساب</button>' +
        '<button class="rk-share-btn fb" data-sh="fb">📘 فيسبوك</button>' +
        '<button class="rk-share-btn x" data-sh="x">𝕏 تويتر</button>' +
        '<button class="rk-share-btn" data-sh="tg">✈️ تليجرام</button>' +
        '<button class="rk-share-btn cp" data-sh="cp">🔗 نسخ رابط الأداة</button>' +
      '</div>' +
      '<div class="rk-gate-foot">كل مشاركة = جلسة تصميم جديدة مجانًا ✨</div>' +
    '</div>';
  document.body.appendChild(gate);

  /* ─── منطق المشاركة ─── */
  function openShare(kind) {
    var url = encodeURIComponent(SITE_URL);
    var text = encodeURIComponent(SHARE_TEXT);
    var u = '';
    if (kind === 'wa') u = 'https://wa.me/?text=' + text + '%20' + url;
    else if (kind === 'fb') u = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
    else if (kind === 'x') u = 'https://twitter.com/intent/tweet?text=' + text + '&url=' + url;
    else if (kind === 'tg') u = 'https://t.me/share/url?url=' + url + '&text=' + text;
    else if (kind === 'cp') {
      try { navigator.clipboard.writeText(SITE_URL + ' — ' + SHARE_TEXT); } catch (e) {}
    }
    if (u) { try { window.open(u, '_blank', 'noopener'); } catch (e) {} }
    grantPass();
  }

  function grantPass() {
    var s = load();
    s.passes = (s.passes || 0) + 1;
    save(s);
    // شكر + قفل البوابة
    var card = document.getElementById('rkGateCard');
    if (card) {
      card.innerHTML = '<div class="rk-gate-thanks">🎉</div><div class="rk-gate-title">شكرًا لمشاركتك!</div><div class="rk-gate-sub">جلسة رسم جديدة <b>اتفتحتلك مجانًا</b> ✅<br>يلا صمّم مساحتك من تاني 💪</div>';
      setTimeout(closeGate, 1400);
    } else { closeGate(); }
  }

  function openGate() { gate.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeGate() { gate.classList.remove('is-open'); document.body.style.overflow = ''; }

  gate.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sh]');
    if (b) { e.preventDefault(); openShare(b.getAttribute('data-sh')); }
    else if (e.target === gate) { /* مينفعش يقفل من بره — لازم يشارك */ }
  });

  /* ─── تتبّع الاستخدام (علامة "اتستخدم") ─── */
  function markUsed() {
    var s = load();
    if (!s.freeUsed) { s.freeUsed = true; save(s); }
  }
  // أي زر تصدير/إرسال/حفظ = استخدام حقيقي
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[id]');
    if (!t) return;
    var id = (t.id || '').toLowerCase();
    if (/send|export|save|download|pjSave/.test(id) && !/share|gate|float/.test(id)) markUsed();
  }, true);

  /* ─── زر المشاركة العائم (دعوة دايمة بدون إجبار) ─── */
  var floatBtn = document.createElement('button');
  floatBtn.id = 'rk-float-share';
  floatBtn.innerHTML = '🎁 شارك الأداة';
  floatBtn.title = 'شارك أداة التصميم مع أصحابك';
  document.body.appendChild(floatBtn);
  floatBtn.addEventListener('click', function () {
    // البوابة العائمة دايمًا بتفتح نافذة مشاركة (مش بإجبار)
    openShare('wa');
  });

  /* ─── فحص البوابة عند الدخول ─── */
  function checkGate() {
    var s = load();
    s.freeUsed = !!s.freeUsed;
    s.passes = s.passes || 0;
    if (!s.freeUsed) return;            // أول مرة = مجاني
    if (s.passes > 0) { s.passes--; save(s); return; } // عنده جلسة مفتوحة
    openGate();                          // لازم يشارك
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(checkGate, 800); });
  else setTimeout(checkGate, 800);

})();
