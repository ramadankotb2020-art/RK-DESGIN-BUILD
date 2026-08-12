# اقتراحات تحسين موقع RK Design
### الهدف: موقع جرافيك مبهر من أول لحظة الدخول — حركة وإفكتات وإيموشن — من غير ما يثقل

> راجعت الكود كامل. الأساس احترافي جدًا (تحكم في الحركة، احترام `prefers-reduced-motion`، كشف `saveData`، lazy-load).
> الملاحظات تحت مقسّمة حسب الأولوية: 🔴 حرجة / 🟡 مهمة / 🟢 تحسين إبهار.

---

## 🎯 الخلاصة في 3 نقط

1. **الإبهار الحقيقي بيبدأ بالسرعة.** أول إفكت بيخسّر الانطباع هو الصور الثقيلة (الصور 625 ميجا! وصور الهيرو لوحدها 1.5–2.8 ميجا). لازم نصلّح ده الأول، لأن أي "wow" مش هيبان لو الصفحة بتاخد وقت في الفتح.
2. **الحركة الموجودة كويسة بس "هادية" ومتكررة.** نرفع مستواها لإبهار سينمائي بإفكتات خفيفة على الـ GPU (تقسيم نص الهيرو، Intro reveal، Cursor & Magnetic، Marquee، Sheen على الصور).
3. **فيه bug صغير بيسبّب 404** (`js/page-bg.js` مش موجود) + صور مكررة بقال placeholder — سهل الأصلح.

---

## 🔴 1) إصلاحات حرجة (دلوقتي — بتعمل أخطاء فعلية)

| # | المشكلة | الحل |
|---|---------|------|
| 1 | `index.html` بيحمّل `<script src="js/page-bg.js" defer>` لكن **الملف مش موجود** → خطأ 404 في الكونسول، وعنصرَي `#page-bg` / `#page-bg-2` ملوشم أي كود بيحرّكهم. | إما احذف السطر من `index.html`، أو أنشئ `js/page-bg.js` فعلي. |
| 2 | صور مكررة بأسماء `*-PLACEHOLDER.jpg`: `hero-slide-3-exterior-PLACEHOLDER.jpg` (2.8M) نسخة من `hero-slide-3-exterior.jpg`، ونفس الحكاية في `service-03`. | احذف ملفات الـ PLACEHOLDER (توفير ~5.4M من الرفع). |
| 3 | السنة hardcoded `2025` في الفوتر (`data-year` بيبدّلها بالـ JS — تمام — بس تأكد إنها بتشتغل لو الـ JS اتأخّر). | مقبول، بس خلّي `data-year` دايمًا آخر سنة كـ fallback. |

---

## 🚀 2) الأداء = الإبهار (الأهم — بدون سرعة مفيش wow)

ده أساس "الإبهار من أول ما يدخل". الأرقام اللي شفتها:

- **صور المشاريع: 599 ميجا!** (241 صورة PNG، كتير منها 2.9–3.3 ميجا للصورة).
- **صور الهيرو: 1.5–2.8 ميجا للصورة.**
- صيغ حديثة شبه معدومة: **12 WebP و 0 AVIF**.

### الحلول (مرتّبة بالأثر):

**أ. تحويل الصور لـ WebP/AVIF + تصغير الأبعاد** 🟡
- لكل الصور: export لـ WebP بجودة 80 → هينزل الحجم **70–85%**. للهيرو استخدم AVIF (أخف وأوضح).
- لصور المشاريع (الـ thumbnails): العرض 800–1200px كافي. للهيرو 1920px.
- استخدم `<picture>` بـ `srcset` عشان الموبايل يحمل صورة أصغر.
- سكريبت `build-projects.js` موجود بالفعل — ممكن نعمل سكريبت `optimize-images` يمر على المجلد كله دفعة واحدة.

**ب. الهيرو لازم يظهر فورًا (LCP)** 🟡
```html
<!-- preload لأول صورة هيرو + الأولوية العالية -->
<link rel="preload" as="image"
      href="images/homepage/hero-slide-1-interior.webp"
      fetchpriority="high" type="image/webp">
```
- حط `width`/`height` على كل `<img>` عشان تمنع **layout shift (CLS)** — ده بيحسّس العميل إن الموقع "سريع ومظبوط".

**ج. `room-designer.html` حجمه 1.8 ميجا!** 🟡
- ده على الأغلب فيه data ضخمة مدموجة (inline). اطلع الداتا لملف JS خارجي وحمّله `defer`، أو حمّل صفحة الـ room-designer بس لما العميل يضغط عليها (lazy route).

**د. `projects-data.js` = 78KB** يتحمّل في الصفحة الرئيسية 🟢
- لازمه للبحث. ممكن نشغّل البحث بس لما العميل يفتح الـ search overlay (dynamic `import`) → الصفحة الرئيسية تفتح أسرع.

**هـ. `content-visibility: auto`** على الأقسام الطويلة 🟢
```css
.section { content-visibility: auto; contain-intrinsic-size: 1200px; }
```
المتصفح بيتخطّى رسم الأقسام اللي برّا الشاشة → سرعة scroll أنعم.

---

## ✨ 3) الإبهار والحركة (قلب الطلب) — كله خفيف على الـ GPU

> **القاعدة الذهبية:** نحرّك `transform` و `opacity` بس (أبدًا `width/height/top/left/margin`)، نحترم `prefers-reduced-motion`، ونوقف الإفكتات اللي برّا الشاشة بـ `IntersectionObserver`. كده 60fps من غير تقليل.

### A. إبهار الدخول (أول 1.5 ثانية = الانطباع كله)

**1) Intro / Preloader سينمائي** 🟡
- دلوقتي اللودر "RK + شريط" بيختفي ببساطة. نحوّله لـ: المونوجرام "RK" بيتقمّص (يترسم لـ SVG stroke)، وبعدين **ستارة (curtain wipe)** بتفتح من النص وتكشف الهيرو. إحساس فخم/سينمائي، تكلفته شبه صفرية.

**2) تقسيم نص الهيرو (Split-Text Reveal) — أكتر إفكت بيعمل wow** 🟡
- بدل ما العنوان كله يطلع بـ fade، نقسّمه كلمات/حروف، وكل كلمة تطلع من تحت قناع (mask) بتأخير بسيط (stagger).
```html
<h1 class="hero-title" id="hero-title">
  <span class="word"><span>أحوّل</span></span>
  <span class="word"><span>مساحتك</span></span> ...
</h1>
```
```css
.word { display:inline-block; overflow:hidden; vertical-align:top; }
.word > span {
  display:inline-block; transform: translateY(110%);
  transition: transform .7s cubic-bezier(.16,1,.3,1);
}
.hero-title.is-in .word > span { transform: translateY(0); }
/* stagger */
.hero-title.is-in .word:nth-child(2) > span { transition-delay:.06s; }
.hero-title.is-in .word:nth-child(3) > span { transition-delay:.12s; }
```
- الكلمة المميّزة (`تحفة معمارية`) ممكن تترسم تحتها خط ذهبي.

### B. تفاعلات الماوس (إحساس "بورتفوليو ديزاينر")

**3) Cursor مخصص (desktop فقط)** 🟢
- نقطة ذهبية بتتبع الماوس، وتكبر/تتغير لما تمر على صورة أو لينك. خفيفة جدًا (`transform` + `requestAnimationFrame` بـ lerp). بيتعطّل تلقائيًا على الموبايل و `reduced-motion`.

**4) أزرار مغناطيسية (Magnetic Buttons)** 🟢
```js
btn.addEventListener('mousemove', e=>{
  const r = btn.getBoundingClientRect();
  const x = e.clientX - r.left - r.width/2;
  const y = e.clientY - r.top  - r.height/2;
  btn.style.transform = `translate(${x*0.25}px, ${y*0.35}px)`;
});
btn.addEventListener('mouseleave', ()=> btn.style.transform='');
```
الزر بيميل ناحية الماوس عند المرور — إحساس بريميوم فخم.

**5) الصور حيّة (Tilt + Sheen + Reveal)** 🟡
- **Reveal curtain:** لما الصورة تدخل الشاشة، تظهر من خلف قناع (clip-path wipe) بدل fade بسيط.
- **Tilt خفيف:** عند المرور بالماوس، الصورة تميل 3D خفيف (`rotateX/rotateY` صغيرة).
- **Sheen ذهبي:** لمعة ذهبية بتمرّ على الصورة عند الـ hover (gradient بـ `translateX`).

```css
/* لمعة ذهبية على الصور */
.service-card::after{
  content:''; position:absolute; inset:0;
  background:linear-gradient(120deg, transparent 30%, rgba(197,160,89,.25) 50%, transparent 70%);
  transform:translateX(-120%); transition:transform .8s;
}
.service-card:hover::after{ transform:translateX(120%); }
```

### C. الحركة المرتبطة بالـ scroll (إحساس سينمائي)

**6) Reveal مرتبط بالـ scroll (Scrubbed)** 🟡
- دلوقتي العناصر بتظهر on/off. نخلي الحركة تتبع سرعة السكرول (الصور تتحرك أبطأ شوية من النص = Parallax خفيف بين الطبقات). `transform` بس عبر `IntersectionObserver + rAF`.
- الهيرو نفسه يتحرك للخلف ببطء (parallax) لما تنزل — عمق سينمائي.

**7) شريط ماركيز (Marquee) لا نهائي** 🟢
- شريط أفقى بيمرّ فيه أسماء الخدمات أو لوجوهات/كلمات مفتاحية بلا توقف. بيدّي طاقة وحركة دايمة، شائع جدًا في بورتفوليوهات الديزاينرز، وبتكلفة شبه صفرية:
```css
.marquee{ display:flex; gap:48px; animation: scrollX 30s linear infinite; }
@keyframes scrollX{ to{ transform: translateX(-50%);} }
```

### D. تفاصيل إيموشن (Micro-interactions)

**8) مؤشر تنقّل ذكي (Sliding nav indicator)** 🟢 — مستطيل ذهبي بيتزلق تحت رابط القائمة اللي بتمر عليه.

**9) خلفية Aurora/Gradient متحركة** 🟢 — الهيرو فيه orbs خفيفة بالفعل؛ ممكن نزوّد طبقة conic-gradient بتدور ببطء (CSS بس، مركّبة على GPU) عشان ندي "مود/إيموشن".

**10) عدّادات أنعم** 🟢 — الكاونتر موجود؛ نحسّن الـ easing (easeOutExpo) ونخليه يبدأ مع الـ reveal.

---

## 🎨 4) تركيز الجرافيك (عايزه موقع "جرافى")

- **الهيرو يبدأ بشغل الجرافيك / تايبوجرافي:** قدّم في أول شريحة عمل هوية بصرية قوي، وأضف عنصر **Kinetic Typography** (نص بيتحرّك/يتغير) في التاج.
- **أضف قسم "Showreel" / Motion Reel** قصير (فيديو loop خفيف ~1–2ميجا مضغوط) لأعمال الجرافيك المتحركة.
- **Portfolio grid بـ masonry + filter** وانتقالات بين التصنيفات (راجع `projects.js`).
- ارفع وزن قسم الجرافيك بصريًا فوق الديكور لو ده هو التخصص الأساسي اللي عايز تبيعه.

---

## 🛡️ 5) قواعد أداء لازم نلتزم بيها (عشان ميثقّلش)

1. حرّك `transform` و `opacity` فقط (GPU/مركّب) — أبدًا `width/top/margin`.
2. احترم `prefers-reduced-motion` (أنت بالفعل بتعمل — استمر!).
3. أوقف/ادفن الإفكتات اللي برّا الشاشة بـ `IntersectionObserver`.
4. **بلاش مكتبات حركة تقيلة** (GSAP كاملة ~60KB). اللي فوق كله CSS + vanilla JS. لو محتاج GSAP، استخدم `ScrollTrigger` بس و dynamic import.
5. اضغط الفيديوهات (h264/aac، bitrate أقل، resolution مناسب) واستخدم `preload="none"` + poster (أنت بتعمل ده ✅).

---

## 📋 6) خطة تنفيذ مقترحة (مراحل)

| المرحلة | المهمات | النتيجة |
|---------|---------|---------|
| **1) صحة + أداء** | أصلح 404 `page-bg.js`، احذف PLACEHOLDERs، حوّل الصور WebP/AVIF، preload الهيرو، CLS fix. | الموقع يفتح أسرع بمرتين-تلاتة. |
| **2) إبهار الدخول** | Intro/Preloader سينمائي + Split-Text للهيرو + Aurora. | أول 1.5 ثانية = wow حقيقي. |
| **3) التفاعلات** | Cursor + Magnetic + Image Tilt/Sheen + Sliding nav. | إحساس بورتفوليو ديزاينر فخم. |
| **4) Scroll & Motion** | Scrubbed reveals + Parallax + Marquee + Showreel جرافيك. | تجربة سينمائية كاملة من غير تقليل. |

---

> قوللي تحب نبدأ بإيه — وأقدر أعملك **نسخة ديمو شغّالة** لأي بند من دول (مثلاً: الهيرو الجديد + Intro) عشان تشوفها بعينك قبل ما نطبّق على كله.
