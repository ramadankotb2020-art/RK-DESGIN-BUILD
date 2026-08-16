#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""مولّد مكتبة الأثاث — v2 (أيقونات متناسقة بأبعاد حقيقية، شكل أنظف)."""
import json, base64, subprocess, os, tempfile, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "js", "rk-assets-index.js")
ORIG = os.path.join(ROOT, "js", "rk-assets-index.original.js.bak")

WOOD="#cda670"; WOOD2="#a98454"; WOOD3="#8a6a3f"; FAB="#a98a5c"; FAB2="#c2a578"; FAB3="#8c6f48"
METAL="#b9c0c7"; METAL2="#9aa2aa"; WHITE="#ece6da"; GLASS="#a3c3d4"; GREEN="#7d9c68"; GREEN2="#94b07c"
DARK="#2e2820"; GOLD="#c5a059"; CREAM="#efe7d6"; WATER="#7fb0c8"; RED="#b06a55"; STONE="#cfc8ba"

# normalized helpers (0..1) × (w,h)
def nR(u,v,u2,v2,w,h,fill="none",rxn=0.06,o=DARK,swn=0.014):
  m=min(w,h); return f'<rect x="{u*w:.1f}" y="{v*h:.1f}" width="{(u2-u)*w:.1f}" height="{(v2-v)*h:.1f}" rx="{rxn*m:.1f}" fill="{fill}" stroke="{o}" stroke-width="{swn*m:.1f}"/>'
def nE(cu,cv,ru,rv,w,h,fill="none",o=DARK,swn=0.014):
  m=min(w,h); return f'<ellipse cx="{cu*w:.1f}" cy="{cv*h:.1f}" rx="{ru*w:.1f}" ry="{rv*h:.1f}" fill="{fill}" stroke="{o}" stroke-width="{swn*m:.1f}"/>'
def nC(cu,cv,rn,w,h,fill="none",o=DARK,swn=0.014):
  m=min(w,h); return f'<circle cx="{cu*w:.1f}" cy="{cv*h:.1f}" r="{rn*m:.1f}" fill="{fill}" stroke="{o}" stroke-width="{swn*m:.1f}"/>'
def nL(u,v,u2,v2,w,h,o=DARK,swn=0.014):
  m=min(w,h); return f'<line x1="{u*w:.1f}" y1="{v*h:.1f}" x2="{u2*w:.1f}" y2="{v2*h:.1f}" stroke="{o}" stroke-width="{swn*m:.1f}" stroke-linecap="round"/>'
def nP(d,w,h,fill="none",o=DARK,swn=0.014):
  m=min(w,h); return f'<path d="{d}" fill="{fill}" stroke="{o}" stroke-width="{swn*m:.1f}" stroke-linejoin="round"/>'

G = {}  # generators: name -> fn(w,h)->svg
def g(name): 
  def deco(fn): G[name]=fn; return fn
  return deco

@g("sofa")
def _(w,h): return (nR(.02,.22,.98,.98,w,h,FAB,.10)+nR(.02,.22,.98,.46,w,h,FAB2,.08)+nR(.02,.22,.16,.98,w,h,FAB2,.07)+nR(.84,.22,.98,.98,w,h,FAB2,.07)+nL(.37,.46,.37,.96,w,h)+nL(.63,.46,.63,.96,w,h))
@g("loveseat")
def _(w,h): return (nR(.02,.22,.98,.98,w,h,FAB,.10)+nR(.02,.22,.98,.46,w,h,FAB2,.08)+nR(.02,.22,.15,.98,w,h,FAB2,.07)+nR(.85,.22,.98,.98,w,h,FAB2,.07)+nL(.50,.46,.50,.96,w,h))
@g("sectional")
def _(w,h): return (nR(.02,.30,.70,.55,w,h,FAB,.08)+nR(.55,.30,.98,.98,w,h,FAB,.08)+nR(.02,.30,.70,.16,w,h,FAB2,.06)+nR(.84,.30,.16,.98,w,h,FAB2,.06))
@g("armchair")
def _(w,h): return (nR(.10,.18,.90,.98,w,h,FAB,.10)+nR(.10,.18,.90,.42,w,h,FAB2,.08)+nR(.10,.18,.28,.98,w,h,FAB2,.07)+nR(.72,.18,.90,.98,w,h,FAB2,.07))
@g("chair")
def _(w,h): return (nR(.18,.14,.82,.98,w,h,FAB,.08)+nR(.18,.14,.82,.34,w,h,FAB2,.06))
@g("stool")
def _(w,h): return nC(.5,.5,.42,w,h,FAB)
@g("ottoman")
def _(w,h): return nR(.08,.20,.92,.92,w,h,FAB,.12)
@g("dining_table")
def _(w,h): return nR(.04,.06,.96,.94,w,h,WOOD,.05)+nP(f"M{.12*w},{.5*h} q{.38*w},-{.34*h} {.76*w},0",w,h,WOOD2,swn=0.008)
@g("table_round")
def _(w,h): return nE(.5,.5,.46,.46,w,h,WOOD)
@g("coffee_table")
def _(w,h): return (nR(.08,.14,.92,.86,w,h,WOOD,.10)+nR(.18,.24,.82,.76,w,h,WOOD2,.06,o=WOOD3,swn=0.008))
@g("side_table")
def _(w,h): return nR(.16,.16,.84,.84,w,h,WOOD,.08)
@g("console")
def _(w,h): return (nR(.03,.34,.97,.80,w,h,WOOD,.05)+nL(.5,.36,.5,.78,w,h))
@g("desk")
def _(w,h): return (nR(.03,.20,.97,.90,w,h,WOOD,.05)+nR(.03,.20,.30,.90,w,h,WOOD2,.04)+nL(.5,.22,.5,.88,w,h))
@g("bed_single")
def _(w,h): return (nR(.04,.04,.96,.96,w,h,WHITE,.06)+nR(.06,.06,.94,.20,w,h,FAB2,.05)+nL(.08,.30,.92,.30,w,h))
@g("bed_double")
def _(w,h): return (nR(.03,.03,.97,.97,w,h,WHITE,.06)+nR(.05,.05,.48,.20,w,h,FAB2,.05)+nR(.52,.05,.95,.20,w,h,FAB2,.05)+nL(.06,.30,.94,.30,w,h))
@g("bed_king")
def _(w,h): return (nR(.03,.04,.97,.96,w,h,WHITE,.06)+nR(.05,.05,.49,.22,w,h,FAB2,.05)+nR(.51,.05,.95,.22,w,h,FAB2,.05)+nL(.06,.32,.94,.32,w,h))
@g("nightstand")
def _(w,h): return (nR(.10,.12,.90,.88,w,h,WOOD,.07)+nL(.5,.14,.5,.86,w,h))
@g("dresser")
def _(w,h): return (nR(.04,.16,.96,.84,w,h,WOOD,.05)+nL(.5,.18,.5,.82,w,h)+nC(.38,.5,.025,w,h,GOLD,o=None,swn=0)+nC(.62,.5,.025,w,h,GOLD,o=None,swn=0))
@g("wardrobe")
def _(w,h): return (nR(.03,.06,.97,.94,w,h,WOOD,.04)+nL(.5,.08,.5,.92,w,h)+nC(.42,.5,.02,w,h,GOLD,o=None,swn=0)+nC(.58,.5,.02,w,h,GOLD,o=None,swn=0))
@g("chest")
def _(w,h): return (nR(.06,.10,.94,.90,w,h,WOOD2,.05)+nL(.08,.46,.92,.46,w,h))
@g("bookshelf")
def _(w,h): s="".join(nL(.05,y,.95,y,w,h,WOOD3,swn=0.01) for y in [.22,.40,.58,.76]); v="".join(nL(x,.08,x,.92,w,h,WOOD3,swn=0.01) for x in [.34,.66]); return nR(.03,.06,.97,.94,w,h,WOOD2,.04)+s+v
@g("tv_unit")
def _(w,h): return (nR(.03,.22,.97,.78,w,h,WOOD2,.05)+nL(.5,.24,.5,.76,w,h))
@g("tv")
def _(w,h): return nR(.06,.30,.94,.70,w,h,DARK,.04,o=METAL)
@g("kitchen_counter")
def _(w,h): return (nR(.02,.18,.98,.82,w,h,STONE,.04)+nL(.30,.20,.30,.80,w,h)+nL(.60,.20,.60,.80,w,h))
@g("island")
def _(w,h): return (nR(.08,.12,.92,.88,w,h,WOOD,.07)+nR(.16,.20,.84,.80,w,h,WOOD2,.05,o=WOOD3,swn=0.008))
@g("fridge")
def _(w,h): return (nR(.14,.04,.86,.96,w,h,METAL,.06)+nL(.16,.32,.84,.32,w,h)+nC(.78,.44,.025,w,h,DARK,o=None,swn=0))
@g("stove")
def _(w,h): return (nR(.06,.06,.94,.94,w,h,METAL,.05)+nC(.30,.30,.13,w,h,DARK)+nC(.70,.30,.13,w,h,DARK)+nC(.30,.70,.13,w,h,DARK)+nC(.70,.70,.13,w,h,DARK))
@g("oven")
def _(w,h): return (nR(.08,.08,.92,.92,w,h,METAL,.05)+nC(.5,.56,.22,w,h,DARK)+nR(.14,.16,.86,.22,w,h,DARK,.03,o=None,swn=0))
@g("sink")
def _(w,h): return (nR(.04,.16,.96,.84,w,h,METAL,.05)+nE(.5,.52,.34,.20,w,h,GLASS)+nR(.46,.06,.54,.20,w,h,METAL,.03))
@g("dishwasher")
def _(w,h): return (nR(.08,.08,.92,.92,w,h,METAL,.05)+nL(.10,.26,.90,.26,w,h)+nR(.26,.16,.74,.22,w,h,DARK,.03,o=None,swn=0))
@g("washer")
def _(w,h): return (nR(.12,.06,.88,.94,w,h,METAL,.06)+nC(.5,.52,.28,w,h,WATER)+nC(.5,.52,.13,w,h,METAL))
@g("toilet")
def _(w,h): return (nR(.26,.06,.74,.30,w,h,WHITE,.05)+nE(.5,.62,.32,.32,w,h,WHITE))
@g("bidet")
def _(w,h): return nE(.5,.5,.34,.40,w,h,WHITE)
@g("bathtub")
def _(w,h): return (nR(.03,.08,.97,.92,w,h,WHITE,.16)+nR(.12,.16,.88,.84,w,h,WATER,.12,o=None,swn=0))
@g("shower")
def _(w,h): return (nR(.06,.06,.94,.94,w,h,WHITE,.04)+nL(.10,.10,.90,.90,w,h,GLASS,swn=0.02)+nC(.5,.5,.06,w,h,WATER,o=None,swn=0))
@g("vanity")
def _(w,h): return (nR(.04,.14,.96,.86,w,h,WOOD,.05)+nE(.5,.5,.32,.24,w,h,GLASS))
@g("plant")
def _(w,h): return (nE(.5,.38,.40,.30,w,h,GREEN2)+nE(.34,.30,.22,.16,w,h,GREEN)+nE(.66,.30,.22,.16,w,h,GREEN)+nR(.40,.60,.60,.90,w,h,WOOD2,.05))
@g("tree")
def _(w,h): return (nC(.5,.40,.42,w,h,GREEN)+nC(.36,.34,.20,w,h,GREEN2,o=None,swn=0)+nC(.66,.36,.18,w,h,GREEN2,o=None,swn=0)+nR(.46,.74,.54,.96,w,h,WOOD2,.03))
@g("rug")
def _(w,h): return (nR(.03,.05,.97,.95,w,h,RED,.06,o=None,swn=0)+nR(.10,.12,.90,.88,w,h,CREAM,.05,o=GOLD,swn=0.015)+nC(.5,.5,.04,w,h,GOLD,o=None,swn=0))
@g("lamp_floor")
def _(w,h): return (nC(.5,.5,.42,w,h,CREAM,o=GOLD,swn=0.02)+nC(.5,.5,.08,w,h,GOLD,o=None,swn=0))
@g("lamp_table")
def _(w,h): return (nC(.5,.5,.30,w,h,CREAM,o=GOLD,swn=0.02)+nC(.5,.5,.06,w,h,GOLD,o=None,swn=0))
@g("fireplace")
def _(w,h): return (nR(.04,.18,.96,.82,w,h,STONE,.04)+nR(.16,.30,.84,.78,w,h,RED,.04,o=DARK)+nP("M {a},{b} q {c},{d} {e},0 q {f},{g} {h2},0".format(a=0.38*w,b=0.72*h,c=0.12*w,d=-0.22*h,e=0.24*w,f=-0.12*w,g=-0.08*h,h2=-0.24*w),w,h,GOLD,o=None,swn=0))
@g("piano")
def _(w,h): return (nR(.03,.20,.97,.80,w,h,WOOD2,.05)+nR(.03,.20,.97,.30,w,h,DARK,.03,o=None,swn=0)+"".join(nL(x,.22,x,.78,w,h,o=WHITE,swn=0.02) for x in [.16,.30,.44,.58,.72,.86]))
@g("office_chair")
def _(w,h): return (nC(.5,.44,.30,w,h,FAB)+nC(.5,.44,.10,w,h,METAL2)+nL(.5,.58,.5,.84,w,h)+nC(.32,.86,.10,w,h,METAL)+nC(.68,.86,.10,w,h,METAL))
@g("reception_desk")
def _(w,h): return (nP("M {a},{b} Q {a},{c} {d},{c} L {e},{c} Q {f},{c} {f},{b} L {f},{g} L {a},{g} Z".format(a=0.04*w,b=0.34*h,c=0.18*h,d=0.20*w,e=0.80*w,f=0.96*w,g=0.86*h),w,h,WOOD2)+nR(.06,.34,.94,.80,w,h,WOOD,o=None,swn=0))
@g("meeting_table")
def _(w,h): return nE(.5,.5,.46,.40,w,h,WOOD)
@g("workstation")
def _(w,h): return (nR(.03,.20,.97,.90,w,h,WOOD2,.04)+nR(.03,.20,.97,.30,w,h,DARK,.03,o=None,swn=0)+nL(.40,.32,.40,.88,w,h)+nL(.66,.32,.66,.88,w,h))
@g("whiteboard")
def _(w,h): return (nR(.04,.16,.96,.84,w,h,WHITE,.03,o=METAL,swn=0.02)+nR(.10,.22,.90,.78,w,h,GLASS,.02,o=None,swn=0))
@g("filing_cabinet")
def _(w,h): return (nR(.20,.04,.80,.96,w,h,METAL,.04)+nL(.22,.36,.78,.36,w,h)+nL(.22,.68,.78,.68,w,h)+nC(.72,.24,.02,w,h,DARK,o=None,swn=0)+nC(.72,.56,.02,w,h,DARK,o=None,swn=0))
@g("restaurant_table")
def _(w,h): return (nC(.5,.5,.42,w,h,WHITE)+nC(.5,.5,.42,w,h,o=GOLD,swn=0.015))
@g("bar_stool")
def _(w,h): return (nC(.5,.40,.30,w,h,FAB)+nL(.5,.54,.5,.88,w,h)+nL(.38,.88,.62,.88,w,h)+nC(.5,.44,.12,w,h,FAB2,o=None,swn=0))
@g("bar_counter")
def _(w,h): return (nR(.03,.30,.97,.80,w,h,WOOD2,.04)+nL(.30,.32,.30,.78,w,h)+nL(.60,.32,.60,.78,w,h))
@g("booth")
def _(w,h): return (nR(.03,.06,.97,.24,w,h,FAB,.06)+nR(.03,.76,.97,.94,w,h,FAB,.06)+nR(.16,.36,.84,.64,w,h,WOOD,.05))
@g("pos_counter")
def _(w,h): return (nR(.06,.16,.94,.90,w,h,WOOD2,.04)+nR(.40,.10,.80,.30,w,h,DARK,.04,o=None,swn=0)+nC(.66,.30,.03,w,h,GOLD,o=None,swn=0))
@g("display_shelf")
def _(w,h): s="".join(nL(.05,y,.95,y,w,h,WOOD3,swn=0.01) for y in [.24,.42,.60,.78]); return nR(.03,.06,.97,.94,w,h,WOOD2,.04)+s
@g("fitting_room")
def _(w,h): return (nR(.08,.08,.92,.92,w,h,METAL,.04)+nL(.5,.08,.5,.92,w,h,GLASS,swn=0.02)+nR(.36,.26,.64,.78,w,h,CREAM,.04,o=None,swn=0))
@g("exam_table")
def _(w,h): return (nR(.04,.26,.96,.74,w,h,WHITE,.05)+nR(.04,.26,.28,.74,w,h,METAL,.04,o=None,swn=0))
@g("hospital_bed")
def _(w,h): return (nR(.04,.10,.96,.90,w,h,WHITE,.05)+nR(.04,.10,.96,.26,w,h,FAB2,.05)+nL(.06,.38,.94,.38,w,h)+nC(.16,.94,.06,w,h,METAL)+nC(.84,.94,.06,w,h,METAL))
@g("wheelchair")
def _(w,h): return (nC(.5,.36,.26,w,h,METAL)+nC(.5,.80,.20,w,h,METAL)+nL(.5,.48,.5,.66,w,h))
@g("medicine_cabinet")
def _(w,h): return (nR(.14,.04,.86,.96,w,h,WHITE,.04)+nR(.20,.10,.80,.90,w,h,GLASS,.04,o=None,swn=0)+nL(.5,.10,.5,.90,w,h,o=WHITE,swn=0.02))
@g("treadmill")
def _(w,h): return (nR(.10,.20,.90,.80,w,h,DARK,.05)+nR(.18,.28,.82,.72,w,h,METAL2,.03,o=None,swn=0)+nL(.22,.40,.78,.40,w,h,METAL,swn=0.02)+nL(.22,.60,.78,.60,w,h,METAL,swn=0.02))
@g("gym_bike")
def _(w,h): return (nC(.30,.66,.24,w,h,METAL)+nC(.30,.66,.10,w,h,DARK,o=None,swn=0)+nR(.58,.22,.84,.50,w,h,FAB,.05)+nL(.30,.46,.60,.40,w,h)+nL(.60,.52,.74,.78,w,h))
@g("bench_press")
def _(w,h): return (nR(.06,.36,.94,.56,w,h,FAB,.05)+nC(.14,.50,.08,w,h,METAL)+nC(.86,.50,.08,w,h,METAL)+nR(.12,.46,.88,.52,w,h,METAL,.03,o=None,swn=0))
@g("yoga_mat")
def _(w,h): return (nR(.26,.04,.74,.96,w,h,RED,.05,o=None,swn=0)+nR(.32,.10,.68,.90,w,h,CREAM,.04,o=None,swn=0))
@g("salon_chair")
def _(w,h): return (nC(.5,.44,.30,w,h,FAB)+nC(.5,.44,.10,w,h,METAL2)+nL(.5,.58,.5,.84,w,h)+nC(.32,.86,.10,w,h,METAL)+nC(.68,.86,.10,w,h,METAL))
@g("mirror_station")
def _(w,h): return (nR(.10,.04,.90,.96,w,h,GLASS,.04,o=GOLD,swn=0.02)+nR(.18,.12,.82,.88,w,h,CREAM,.04,o=None,swn=0)+nC(.5,.5,.06,w,h,GOLD,o=None,swn=0))
@g("bench")
def _(w,h): return (nR(.04,.28,.96,.66,w,h,WOOD,.06)+nR(.04,.28,.96,.40,w,h,WOOD2,.04,o=None,swn=0)+nL(.14,.66,.14,.94,w,h)+nL(.86,.66,.86,.94,w,h))
@g("sun_lounger")
def _(w,h): return (nR(.05,.06,.95,.94,w,h,FAB,.07)+nL(.08,.32,.92,.32,w,h)+nL(.08,.56,.92,.56,w,h)+nL(.05,.06,.05,.94,w,h)+nL(.95,.06,.95,.94,w,h))
@g("umbrella")
def _(w,h): return (nC(.5,.40,.46,w,h,GREEN2)+nC(.5,.40,.46,w,h,o=DARK,swn=0.015)+nL(.5,.40,.5,.94,w,h,WOOD2))
@g("pool")
def _(w,h): return (nR(.04,.08,.96,.92,w,h,WATER,.14,o=GLASS,swn=0.03)+nR(.12,.16,.88,.84,w,h,"#9fc6d8",.10,o=None,swn=0))
@g("grill")
def _(w,h): return (nR(.16,.20,.84,.74,w,h,METAL,.05)+nR(.24,.28,.76,.66,w,h,DARK,.04,o=None,swn=0)+nL(.28,.40,.72,.40,w,h,METAL,swn=0.02)+nL(.28,.52,.72,.52,w,h,METAL,swn=0.02)+nC(.5,.86,.06,w,h,METAL)+nC(.30,.86,.06,w,h,METAL)+nC(.70,.86,.06,w,h,METAL))
@g("stairs")
def _(w,h): return (nR(.08,.04,.92,.96,w,h,STONE,.04)+"".join(nL(.08,y,.92,y,w,h,o=WOOD3,swn=0.012) for y in [.18,.30,.42,.54,.66,.78,.90])+nL(.08,.04,.08,.96,w,h,WOOD3,swn=0.02)+nL(.92,.04,.92,.96,w,h,WOOD3,swn=0.02))
@g("stairs_l")
def _(w,h): return (nR(.08,.50,.60,.36,w,h,STONE,.04)+nR(.50,.14,.44,.72,w,h,STONE,.04)+"".join(nL(.08,y,.60,y,w,h,o=WOOD3,swn=0.01) for y in [.56,.68,.80])+"".join(nL(x,.14,x,.86,w,h,o=WOOD3,swn=0.01) for x in [.56,.64,.72,.80,.88])+nL(.08,.50,.08,.86,w,h,WOOD3,swn=0.02))
@g("stairs_u")
def _(w,h): return (nR(.06,.14,.42,.72,w,h,STONE,.04)+nR(.54,.14,.42,.72,w,h,STONE,.04)+"".join(nL(x,.14,x,.86,w,h,o=WOOD3,swn=0.01) for x in [.14,.22,.30,.38,.62,.70,.78,.86])+nR(.46,.14,.54,.86,w,h,STONE,.02,o=None,swn=0))

CATS=[("living","غرفة معيشة"),("bedroom","غرفة نوم"),("kids","غرفة أطفال"),("kitchen","مطبخ"),("bathroom","حمام"),("laundry","غسيل ومغسلة"),("dining-office","طعام ومكتب"),("decor","ديكور وإضاءة"),("office","مكتب تجاري"),("restaurant","مطعم وكافيه"),("retail","محل تجاري"),("clinic","عيادة"),("gym","جيم ولياقة"),("salon","صالون وسبا"),("outdoor","حديقة وخارجي"),("stairs","سلالم")]
CBY={c[0]:{"id":c[0],"name":c[0],"nameAr":c[1]} for c in CATS}

# (id, عربي, cat, sub, جنّريتر, عرض_سم, عمق_سم, fill)
I=[
("sofa3","كنبة 3 مقاعد","living","كنب","sofa",210,90),("sofa2","كنبة مقعد","living","كنب","loveseat",150,90),("corner-sofa","كنبة زاوية","living","كنب","sectional",250,180),("armchair-l","كرسي فوتيه","living","كراسي","armchair",90,90),("living-chair","كرسي","living","كراسي","chair",52,52),("ottoman","بوفية قدم","living","إكسسوار","ottoman",70,70),("coffee-table","طاولة وسط","living","طاولات","coffee_table",110,60),("side-table","طاولة جانبية","living","طاولات","side_table",45,45),("tv-unit","وحدة تلفزيون","living","تلفزيون","tv_unit",180,45),("rug-living","سجادة","living","إكسسوار","rug",250,180),("plant-living","نبتة","living","إكسسوار","plant",50,50),("floor-lamp","أباجورة أرضية","living","إكسسوار","lamp_floor",40,40),("fireplace","مدفأة","living","إكسسوار","fireplace",120,30),
("bed-double","سرير مزدوج","bedroom","أسرة","bed_double",180,200),("bed-king","سرير كينج","bedroom","أسرة","bed_king",200,210),("bed-single","سرير فردي","bedroom","أسرة","bed_single",100,200),("nightstand","كومودينو","bedroom","تخزين","nightstand",50,45),("dresser","تسريحة","bedroom","تخزين","dresser",120,50),("wardrobe-bed","دولاب","bedroom","تخزين","wardrobe",180,60),("chest-bed","صندوق تخزين","bedroom","تخزين","chest",100,45),
("kids-bed","سرير أطفال","kids","أسرة","bed_single",90,190),("kids-desk","مكتب دراسة","kids","مكاتب","desk",110,55),("kids-shelf","مكتبة","kids","تخزين","bookshelf",80,35),("kids-cab","خزانة","kids","تخزين","wardrobe",100,55),("kids-chair","كرسي","kids","كراسي","chair",48,48),
("k-counter","خزانة مطبخ","kitchen","وحدات","kitchen_counter",160,60),("k-island","جزيرة","kitchen","وحدات","island",140,90),("k-fridge","ثلاجة","kitchen","أجهزة","fridge",75,70),("k-stove","بوتاجاز","kitchen","أجهزة","stove",70,60),("k-oven","فرن","kitchen","أجهزة","oven",70,65),("k-sink","حوض مطبخ","kitchen","أجهزة","sink",90,55),("k-dish","غسالة صحون","kitchen","أجهزة","dishwasher",70,65),("k-hood","شفاط","kitchen","أجهزة","console",90,50),
("b-toilet","مرحاض","bathroom","أدوات","toilet",42,65),("b-bidet","بيديه","bathroom","أدوات","bidet",40,55),("b-tub","بانيو","bathroom","أدوات","bathtub",170,80),("b-shower","دش","bathroom","أدوات","shower",90,90),("b-vanity","وحدة حمام","bathroom","أدوات","vanity",90,50),("b-sink","حوض حمام","bathroom","أدوات","sink",55,45),
("washer","غسالة ملابس","laundry","أجهزة","washer",60,60),("dryer","نشافة","laundry","أجهزة","washer",60,60),("ironing","طاولة كي","laundry","إكسسوار","console",120,40),("l-sink","حوض غسيل","laundry","أجهزة","sink",70,50),
("dining-table","ترابيزة طعام","dining-office","طاولات","dining_table",180,90),("dining-round","ترابيزة مدورة","dining-office","طاولات","table_round",120,120),("dining-chair","كرسي طعام","dining-office","كراسي","chair",48,48),("desk-home","مكتب","dining-office","مكاتب","desk",140,65),("office-chair-h","كرسي مكتب","dining-office","كراسي","office_chair",60,60),("console-table","كونسول","dining-office","طاولات","console",120,35),
("plant-decor","نبتة زينة","decor","نباتات","plant",50,50),("tree-decor","شجرة","decor","نباتات","tree",80,80),("table-lamp","أباجورة","decor","إكسسوار","lamp_table",35,35),("rug-decor","سجادة","decor","إكسسوار","rug",200,150),("piano","بيانو","decor","إكسسوار","piano",150,60),("shelf-decor","مكتبة كتب","decor","تخزين","bookshelf",100,35),("tv-decor","تلفزيون","decor","إكسسوار","tv",120,15),
("reception","ركيشن","office","استقبال","reception_desk",180,60),("meeting","طاولة اجتماعات","office","طاولات","meeting_table",240,110),("workstation","محطة عمل","office","مكاتب","workstation",160,80),("office-chair","كرسي مكتب","office","كراسي","office_chair",65,65),("whiteboard","سبورة","office","إكسسوار","whiteboard",180,15),("filing","خزانة ملفات","office","تخزين","filing_cabinet",50,60),
("rest-table","طاولة مطعم","restaurant","طاولات","restaurant_table",80,80),("rest-table-4","طاولة 4 أشخاص","restaurant","طاولات","dining_table",100,100),("bar-stool","كرسي بار","restaurant","كراسي","bar_stool",45,45),("bar-counter","بار","restaurant","كاونتر","bar_counter",180,55),("booth","كابينة","restaurant","جلسات","booth",180,110),("pos","كاشير","restaurant","كاونتر","pos_counter",120,60),
("display","رف عرض","retail","عرض","display_shelf",120,40),("retail-counter","كاونتر محل","retail","كاونتر","pos_counter",150,55),("fitting","قاعة قياس","retail","غرف","fitting_room",120,120),("showcase","فترينة","retail","عرض","display_shelf",180,40),
("exam","سرير فحص","clinic","أجهزة","exam_table",180,60),("hosp-bed","سرير عيادة","clinic","أسرة","hospital_bed",200,90),("med-cab","خزانة أدوية","clinic","تخزين","medicine_cabinet",80,30),("wheelchair","كرسي متحرك","clinic","إكسسوار","wheelchair",70,70),("clinic-desk","مكتب استقبال","clinic","مكاتب","desk",140,65),
("treadmill","مشاية","gym","أجهزة","treadmill",180,80),("gym-bike","دراجة ثابتة","gym","أجهزة","gym_bike",100,60),("bench-press","بنش رفع","gym","أجهزة","bench_press",180,60),("yoga","سجادة يوجا","gym","إكسسوار","yoga_mat",60,180),("weights","أثقال","gym","إكسسوار","bench_press",120,40),
("salon-chair","كرسي صالون","salon","كراسي","salon_chair",70,70),("salon-wash","حوض غسيل شعر","salon","أجهزة","vanity",80,55),("mirror-st","محطة مرايا","salon","إكسسوار","mirror_station",80,40),("spa-bed","سرير سبا","salon","أسرة","hospital_bed",190,80),
("out-tree","شجرة","outdoor","نباتات","tree",100,100),("out-plant","نبتة","outdoor","نباتات","plant",60,60),("g-bench","مقعد حديقة","outdoor","جلوس","bench",140,45),("lounger","كرسي استرخاء","outdoor","جلوس","sun_lounger",200,65),("umbrella","مظلة","outdoor","إكسسوار","umbrella",180,180),("pool","مسبح","outdoor","مياه","pool",300,180),("grill","مشوية","outdoor","إكسسوار","grill",110,70),("stairs","سلم مستقيم","outdoor","معماري","stairs",100,300),("stairs-l","سلم L","outdoor","معماري","stairs_l",200,300),("stairs-u","سلم U","outdoor","معماري","stairs_u",180,300),
]
CACHE={}
def raster(inner,w,h,size):
  key=(inner,w,h,size)
  if key in CACHE: return CACHE[key]
  ar=w/h; pw=size; ph=round(size/ar) if ar>=1 else size; Wd=size if ar>=1 else round(size*ar)
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{Wd}" height="{ph}" viewBox="0 0 {w} {h}">{inner}</svg>'
  sf=tempfile.NamedTemporaryFile(suffix=".svg",delete=False); sf.write(svg.encode()); sf.close()
  pf=tempfile.NamedTemporaryFile(suffix=".png",delete=False); pf.close()
  try:
    subprocess.run(["magick","-background","transparent",sf.name,"-resize",f"{Wd}x{ph}",pf.name],check=True,capture_output=True)
    b=base64.b64encode(open(pf.name,"rb").read()).decode()
  except Exception: b=""
  os.unlink(sf.name); os.unlink(pf.name)
  r=f"data:image/png;base64,{b}"; CACHE[key]=r; return r

def main():
  AI = {}
  _ai_json = os.path.join(os.path.dirname(__file__), "ai-furniture.json")
  if os.path.exists(_ai_json):
    try: AI = json.load(open(_ai_json, encoding="utf-8"))
    except Exception: AI = {}
  items=[]
  for (iid,ar,cat,sub,genr,wcm,dcm) in I:
    ap = os.path.join(ROOT, AI[iid]) if iid in AI else ""
    if ap and os.path.exists(ap):
      ext = os.path.splitext(ap)[1].lstrip(".").lower()
      mime = "image/webp" if ext=="webp" else ("image/jpeg" if ext in ("jpg","jpeg") else "image/png")
      b64="data:"+mime+";base64,"+base64.b64encode(open(ap,"rb").read()).decode()
      thumb=asset=b64; genr="ai"
    else:
      fn=G.get(genr,G["chair"]); inner=fn(wcm,dcm)
      thumb=raster(inner,wcm,dcm,90); asset=raster(inner,wcm,dcm,260)
    items.append({"id":iid,"name":ar,"nameAr":ar,"category":CBY[cat],"subcategory":{"id":sub,"name":sub,"nameAr":sub},
      "width":round(wcm/100,2),"depth":round(dcm/100,2),"rotationCenter":[.5,.5],"defaultScale":1,"minScale":.3,"maxScale":5,
      "collisionBox":{"type":"rect","collide":True},"layer":"object","snapPoints":[[.5,.5],[0,0],[1,0],[0,1],[1,1]],
      "aliases":[iid,ar],"tags":[iid,ar],"preview":"","thumbnail":thumb,"asset":asset,
      "vectorFallback":genr,"fill":WOOD,"realDimensions":f"{wcm} × {dcm} cm","source":"vector","status":"done"})
  cats=[{"id":c[0],"name":c[0],"nameAr":c[1]} for c in CATS]
  idx={"version":3,"app":"RK-DESIGN Room Planner","categories":cats,"items":items}
  portfolio=""
  if os.path.exists(ORIG):
    t=open(ORIG,encoding="utf-8").read(); m=re.search(r'(window\.__RK_PORTFOLIO__\s*=\s*\{.*?\};)',t,re.S)
    if m: portfolio=m.group(1)+"\n"
  out=("/* توليد تلقائي من scripts/build-library.py — متعدّلوش يدويًا. */\n"
       "window.__RK_ASSETS_INDEX__ = "+json.dumps(idx,ensure_ascii=False)+";\n"+portfolio)
  open(OUT,"w",encoding="utf-8").write(out)
  print(f"✓ {len(items)} قطعة، {len(cats)} تصنيف | {os.path.getsize(OUT)//1024} KB")

if __name__=="__main__": main()
