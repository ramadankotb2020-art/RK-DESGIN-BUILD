#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🪑  أضف صور أثاث AI فوتورياليستيك للمكتبة — أوتوماتيك.

إزاي تستخدمه:
  1) شغّل:  python scripts/ai-list.py
     → هيورّيك أسماء القطع (id) اللي تقدر تسمّي بيها صورك.
  2) ولّد صورة AI (flat top-down) لأي قطعة، وسمّها بـ id القطعة،
     وحطها في:  images/furniture/ai/
     مثال: images/furniture/ai/wardrobe-bed.png
  3) شغّل:  python scripts/add-ai-furniture.py
     → بيصنّع: إزالة الخلفية + ضبط النسبة + WebP + ربطها + إعادة بناء المكتبة.
  4) افتح room-designer.html → القطعة بقت بصورتها الواقعية.

ملاحظات:
  - الصورة أحسن ما تكون بخلفية موحّدة (أبيض/رمادي فاتح) عشان إزالة الخلفية تظبط.
  - متسمّش الملف بـ "-clean" (ده اسم الناتج التلقائي).
  - تقدر تحط كذا صورة ورا بعض وتشغّل السكريبت مرة واحدة.
  - السكريبت محتاج Pillow:  pip install Pillow
"""
import os, json, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI_DIR = os.path.join(ROOT, "images", "furniture", "ai")
JSON_PATH = os.path.join(os.path.dirname(__file__), "ai-furniture.json")
INDEX = os.path.join(ROOT, "js", "rk-assets-index.js")

def load_items():
    t = open(INDEX, encoding="utf-8").read()
    m = "window.__RK_ASSETS_INDEX__ = "; i = t.find(m) + len(m)
    d, _ = json.JSONDecoder().raw_decode(t[i:])
    return {it["id"]: it for it in d["items"]}

def remove_bg(im, tol=46):
    """إزالة الخلفية بناءً على لون الأركان (بيضبط مع الخلفيات الموحّدة)."""
    im = im.convert("RGBA"); w, h = im.size
    corners = [im.getpixel((2, 2)), im.getpixel((w - 3, 2)),
               im.getpixel((2, h - 3)), im.getpixel((w - 3, h - 3))]
    bg = tuple(sum(c[k] for c in corners) // 4 for k in range(3))
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if abs(r - bg[0]) < tol and abs(g - bg[1]) < tol and abs(b - bg[2]) < tol:
                px[x, y] = (0, 0, 0, 0)
    return im

def fit_pad(im, wcm, hcm, MAX=420):
    """ركزّز الصورة على كانفاس شفاف بنسبة مقاس القطعة (منغير تشويه)."""
    target = wcm / hcm
    cw, ch = (MAX, round(MAX / target)) if target >= 1 else (round(MAX * target), MAX)
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    iw, ih = im.size; s = min(cw / iw, ch / ih); nw, nh = round(iw * s), round(ih * s)
    r = im.resize((nw, nh), Image.LANCZOS)
    canvas.paste(r, ((cw - nw) // 2, (ch - nh) // 2), r)
    return canvas

def main():
    if not os.path.isdir(AI_DIR):
        os.makedirs(AI_DIR)
    items = load_items()
    ai = {}
    if os.path.exists(JSON_PATH):
        try: ai = json.load(open(JSON_PATH, encoding="utf-8"))
        except Exception: ai = {}

    found = [f for f in os.listdir(AI_DIR)
             if f.lower().endswith((".png", ".jpg", ".jpeg")) and "-clean" not in f]
    if not found:
        print("مفيش صور AI جديدة في images/furniture/ai/")
        print("سمّ صورك بـ id القطعة (شوف ai-list.py) وحطها هناك، بعدين شغّل السكريبت تاني.")
        return

    print("تصنيع صور AI ...")
    done = 0; skipped = 0
    for f in sorted(found):
        stem = os.path.splitext(f)[0]
        if stem not in items:
            print("  ⚠ '" + f + "' — مفيش قطعة بـ id '" + stem + "'. شوف ai-list.py.")
            skipped += 1; continue
        it = items[stem]
        wcm = it["width"] * 100; hcm = it["depth"] * 100
        try:
            im = Image.open(os.path.join(AI_DIR, f))
            im = remove_bg(im)
            im = fit_pad(im, wcm, hcm)
            out = os.path.join(AI_DIR, stem + "-clean.webp")
            im.save(out, "WEBP", quality=85, method=4)
            ai[stem] = "images/furniture/ai/" + stem + "-clean.webp"
            done += 1
            print("  ✓ " + stem + " (" + it["nameAr"] + ")")
        except Exception as e:
            print("  ✗ " + f + ": " + str(e)); skipped += 1

    json.dump(ai, open(JSON_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("\n✓ اتصنّع " + str(done) + " صورة | تخطّى " + str(skipped))
    if done:
        print("بناء المكتبة ...")
        subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "build-library.py")],
                       check=True, cwd=ROOT)
        print("✓ خلصت! افتح room-designer.html (Ctrl+Shift+R)")

if __name__ == "__main__":
    main()
