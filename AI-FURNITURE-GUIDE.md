# 🪑 دليل صور الأثاث AI — المكتبة الفوتورياليستيك

أضيف صور أثاث **فوتورياليستيك** (top-down مسطح) للمكتبة أوتوماتيك.

---

## الخطوات (3 خطوات بس)

### 1) اعرف أسماء القطع
```
python scripts/ai-list.py
```
هيورّيك كل قطعة و**id** بتاعها + مقاسها. (الـ id ده اللي هتسمّي بيه صورتك)

### 2) ولّد صورة AI وسمّها بـ id القطعة
استخدم أي أداة AI (ChatGPT / Gemini / Midjourney) ببرومبت **flat top-down مسطح**،
واحفظ الصورة باسم **id القطعة** في فولدر `images/furniture/ai/`.

مثال: عايز دولاب؟
```
images/furniture/ai/wardrobe-bed.png
```
(اسم id الدولاب هو `wardrobe-bed` — من القائمة)

> البرومبت المقترح:
> *"Pure FLAT top-down ORTHOGRAPHIC view, looking straight down from 90°, NO tilt, NO perspective, flat bird's-eye view of [القطعة], realistic materials, isolated on a solid light background."*

### 3) شغّل السكريبت
```
python scripts/add-ai-furniture.py
```
بيعمل أوتوماتيك:
- ✂️ **إزالة الخلفية** (بناءً على لون الأركان)
- 📐 **ضبط النسبة** لمقاس القطعة (من غير تشويه)
- 🗜️ **تحويل WebP** (خفيف)
- 🔗 **ربطها** بالمكتبة + **إعادة بناء** الفهرس

→ افتح `room-designer.html` → القطعة بقت بصورتها الواقعية ✨

---

## نصائح
- 🎨 خلفية الصورة يفضل **موحّدة فاتحة** (أبيض/رمادي) عشان إزالة الخلفية تظبط.
- 📦 تقدر تحط **كذا صورة** في الفولدر وتشغّل السكريبت مرة واحدة.
- 🔄 لو أعدت توليد صورة بنفس الاسم → السكريبت يستبدلها.
- 💻 السكريبت محتاج **Pillow**: `pip install Pillow`

## الملفات
- `scripts/ai-list.py` → قائمة أسماء القطع (id)
- `scripts/add-ai-furniture.py` → السكريبت الأساسي
- `scripts/ai-furniture.json` → الربط الحالي (id → صورة) — يتم تحديثه تلقائيًا
- `images/furniture/ai/` → تحط صورك هنا

## مثال كامل
```
python scripts/ai-list.py
# شفت إن id السرير = bed-double
# ولّدت صورة سرير → حفظتها images/furniture/ai/bed-double.png
python scripts/add-ai-furniture.py
# ✓ خلصت
```
