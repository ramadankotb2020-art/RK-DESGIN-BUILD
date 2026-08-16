#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""قائمة بأسماء القطع (id) اللي تقدر تسمّي بيها صورك AI.
شغّل: python scripts/ai-list.py"""
import os, json
INDEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "js", "rk-assets-index.js")
t = open(INDEX, encoding="utf-8").read()
m = "window.__RK_ASSETS_INDEX__ = "; i = t.find(m) + len(m)
d, _ = json.JSONDecoder().raw_decode(t[i:])
print("سمّ صورة الـ AI بـ (id) القطعة بالظبط، وحطها في: images/furniture/ai/")
print("مثال: images/furniture/ai/bed-double.png\n")
cat = ""
for it in sorted(d["items"], key=lambda x: (x["category"]["id"], x["id"])):
    c = it["category"]["nameAr"]
    if c != cat:
        cat = c; print("\n=== " + c + " ===")
    print("  {:20} | {:22} | {}".format(it["id"], it["nameAr"], it["realDimensions"]))
