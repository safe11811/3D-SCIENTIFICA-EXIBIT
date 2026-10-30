"""
Generate second_floor_plan_meters.dxf  —  National Public School, Yeshwanthpur.

Source image: Fire Escape Route Plan, SECOND FLOOR board.
Structural skeleton is identical to first_floor_plan_meters.dxf
(same exterior walls, same courtyard voids, same staircase positions,
same grid lines).  Only the room labels change.

Orientation (same as all other floors):
  x=0  West  |  x=46  East (main entrance / road)
  y=0  South |  y=42.5 North

Room mapping  (first floor position → second floor label):
  TOP ROW (y 36–42.5)
    x 0–7.5    : CLASS ROOM-11 → CLASS ROOM-25
    x 7.5–15   : CLASS ROOM-12 → BOYS TOILET
    x 15–23    : PORTICO BELOW → (HISTORY LAB) CLASS ROOM-26
    x 23–31    : RECEPTION BLW → ASST. PRINCIPAL
    x 31–38.5  : CLASS ROOM-10 → STAFF TOILET / STORE ROOM
    x 38.5–46  : CLASS ROOM-14 → CLASS ROOM-15

  LEFT WING (x 0–7.5)
    y 28.5–36  : STAIRS        → STAIRS (DN / UP)   [unchanged]
    y 19–28.5  : CLASS ROOM-13 → CLASS ROOM-24
    y 9.5–19   : CLASS ROOM-9  → LIBRARY  (merges two bays)
    NOTE: no Dining Room.

  RIGHT WING (x 38.5–46)
    y 31–36    : BOYS T/DRNK W → STAFF TOILET
    y 20–31    : PHYSICS LAB   → CLASS ROOM-16  (11.0m x 7.5m)
    y 14.5–20  : SCI STAFF RM  → CLASS ROOM-17
    y 9.5–14.5 : STORE ROOM    → CLASS ROOM-18
    y 0–9.5    : SENIOR LAB    → CLASS ROOM-19

  CENTRAL (unchanged positions)
    STAIRS 2 / LIFT / ELEC

  BOTTOM ROW (y 0–7)
    x 0–7.5    : STAFF ROOM    → CLASS ROOM-22
    x 7.5–15   : ASST PRIN     → CLASS ROOM-23
    x 15–18.9  : STAFF TOILET  → STAFF TOILET
    x 18.9–22.8: GIRLS TOILET  → GIRLS TOILET
    x 22.8–30.5: CLASS ROOM-7  → CLASS ROOM-21
    x 30.5–38.5: CLASS ROOM-8  → (GEOGRAPHY LAB) CLASS ROOM-20
    x 38.5–46  : SENIOR LAB    → (part of CLASS ROOM-19, y 0–9.5)
"""

import ezdxf
from ezdxf import colors
from ezdxf.enums import TextEntityAlignment

# ── Build new document ────────────────────────────────────────────────────────
doc = ezdxf.new("R2010")
doc.header["$INSUNITS"] = 6
doc.header["$TEXTSIZE"] = 0.6
doc.header["$LIMMIN"] = (0, 0)
doc.header["$LIMMAX"] = (70, 55)

# Copy text styles from first floor reference
ref = ezdxf.readfile(
    r"c:\Users\safeg\Desktop\scientifica\floorplans\first_floor_plan_meters.dxf"
)
for style in ref.styles:
    if style.dxf.name != "Standard":
        try:
            s = doc.styles.new(style.dxf.name)
            s.dxf.font = style.dxf.font
        except Exception:
            pass

# Layers
LAYER_DEF = {
    "WALLS_EXTERIOR":  colors.WHITE,
    "WALLS_INTERIOR":  colors.WHITE,
    "COURTYARD_VOID":  colors.CYAN,
    "RAILINGS":        colors.BLUE,
    "STAIRS":          colors.YELLOW,
    "ROOM_LABELS":     colors.GREEN,
    "DIMENSIONS":      colors.MAGENTA,
    "COMPASS":         colors.RED,
}
for name, color in LAYER_DEF.items():
    l = doc.layers.new(name)
    l.color = color

msp = doc.modelspace()

# ── Helpers ───────────────────────────────────────────────────────────────────

def rect(x0, y0, x1, y1, layer):
    pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    msp.add_lwpolyline(pts, close=True, dxfattribs={"layer": layer})

def line(x0, y0, x1, y1, layer):
    msp.add_line((x0, y0), (x1, y1), dxfattribs={"layer": layer})

def txt(text, x, y, layer, h=0.6, style="OpenSans-Bold"):
    msp.add_text(
        text,
        dxfattribs={"layer": layer, "height": h, "style": style},
    ).set_placement((x, y), align=TextEntityAlignment.CENTER)

def room(name, dims, cx, cy, hn=0.6, hd=0.3):
    txt(name, cx, cy + 0.6, "ROOM_LABELS", h=hn)
    if dims:
        txt(dims, cx, cy - 0.3, "DIMENSIONS", h=hd, style="OpenSans-Light")

def stair_treads(x0, y0, x1, y1, n=7):
    step = (y1 - y0) / n
    mid  = (x0 + x1) / 2
    for i in range(1, n):
        line(x0 + 0.5, y0 + i * step, x1 - 0.5, y0 + i * step, "STAIRS")
    line(mid, y0, mid, y1, "STAIRS")

# ── 1. Exterior wall ──────────────────────────────────────────────────────────
rect(0, 0, 46, 42.5, "WALLS_EXTERIOR")

# ── 2. Courtyard voids (EXACT same coords as first floor) ─────────────────────
# Left courtyard:  x 10–20,  y 11.5–31.5
rect(10.0, 11.5, 20.0, 31.5, "COURTYARD_VOID")
rect(10.15, 11.65, 19.85, 31.35, "RAILINGS")   # inner railing line
txt("COURT YARD BELOW",      15.0, 23.0, "ROOM_LABELS", h=0.6)
txt("(CUT-OUT / OPEN TO SKY)",15.0, 21.8, "ROOM_LABELS", h=0.4)
txt("10.0m x 20.0m",         15.0, 20.8, "DIMENSIONS",  h=0.3, style="OpenSans-Light")

# Right courtyard: x 22.8–36,  y 11.5–31.5
rect(22.8, 11.5, 36.0, 31.5, "COURTYARD_VOID")
rect(22.95, 11.65, 35.85, 31.35, "RAILINGS")
txt("COURT YARD BELOW",  29.4, 23.0, "ROOM_LABELS", h=0.7)
txt("(OPEN TO SKY)",     29.4, 21.8, "ROOM_LABELS", h=0.4)
txt("13.2m x 20.0m",    29.4, 20.8, "DIMENSIONS",  h=0.3, style="OpenSans-Light")

# ── 3. Central corridor walls (EXACT same as first floor) ─────────────────────
line(20.0, 9.5,  20.0, 36.0, "WALLS_INTERIOR")
line(22.8, 9.5,  22.8, 36.0, "WALLS_INTERIOR")
txt("CENTRAL CORRIDOR (2.8m WIDE)", 21.4, 16.0, "ROOM_LABELS", h=0.5)

# ── 4. Top-row dividers (EXACT same as first floor) ───────────────────────────
line(23.0, 36.0, 23.0, 42.5, "WALLS_INTERIOR")   # splits middle top into two
# (the 7.5 x,15 x,31 x,38.5 x divisions come from the room rects below)

# ── 5. Top row (y 36–42.5) ───────────────────────────────────────────────────
# CLASS ROOM-25
rect(0.0,  36.0,  7.5,  42.5, "WALLS_INTERIOR")
room("CLASS ROOM-25", "7.5m x 6.5m", 3.8, 39.5)

# BOYS TOILET
rect(7.5,  36.0, 15.0,  42.5, "WALLS_INTERIOR")
txt("BOYS TOILET", 11.2, 39.5, "ROOM_LABELS", h=0.5)

# (HISTORY LAB) CLASS ROOM-26   x 15–23
rect(15.0, 36.0, 23.0, 42.5, "WALLS_INTERIOR")
txt("(HISTORY LAB)",  19.0, 40.2, "ROOM_LABELS", h=0.4)
txt("CLASS ROOM-26",  19.0, 39.0, "ROOM_LABELS", h=0.5)
txt("8.0m x 6.5m",   19.0, 37.8, "DIMENSIONS",  h=0.3, style="OpenSans-Light")

# ASST. PRINCIPAL   x 23–31
rect(23.0, 36.0, 31.0, 42.5, "WALLS_INTERIOR")
txt("ASST. PRINCIPAL", 27.0, 39.5, "ROOM_LABELS", h=0.5)
txt("8.0m x 6.5m",    27.0, 38.3, "DIMENSIONS",  h=0.3, style="OpenSans-Light")

# STORE ROOM  x 31–38.5
rect(31.0, 36.0, 38.5, 42.5, "WALLS_INTERIOR")
txt("STORE ROOM", 34.8, 39.5, "ROOM_LABELS", h=0.5)

# CLASS ROOM-15   x 38.5–46
rect(38.5, 36.0, 46.0, 42.5, "WALLS_INTERIOR")
room("CLASS ROOM-15", "7.5m x 6.5m", 42.2, 39.5)

# ── 6. Left wing (x 0–7.5) ───────────────────────────────────────────────────
line(7.5, 9.5, 7.5, 36.0, "WALLS_INTERIOR")

# Staircase 1  y 28.5–36   (EXACT position as first floor)
rect(0.0, 28.5, 7.5, 36.0, "STAIRS")
stair_treads(0.0, 28.5, 7.5, 36.0)
txt("STAIRS (DN / UP)", 3.8, 32.5, "ROOM_LABELS", h=0.5)

# CLASS ROOM-24   y 19–28.5
rect(0.0, 19.0, 7.5, 28.5, "WALLS_INTERIOR")
room("CLASS ROOM-24", "7.5m x 9.5m", 3.8, 24.0)

# LIBRARY   y 9.5–19  (takes same position as CLASS ROOM-9 on first floor)
rect(0.0, 9.5, 7.5, 19.0, "WALLS_INTERIOR")
txt("LIBRARY",       3.8, 14.8, "ROOM_LABELS", h=0.6)
txt("7.5m x 9.5m",  3.8, 13.5, "DIMENSIONS",  h=0.3, style="OpenSans-Light")

# ── 7. Right wing (x 38.5–46) ────────────────────────────────────────────────
line(38.5, 9.5, 38.5, 36.0, "WALLS_INTERIOR")
line(42.5, 31.0, 42.5, 36.0, "WALLS_INTERIOR")   # splits top-right sub-rooms

# STAFF TOILET + small room (y 31–36)
rect(38.5, 31.0, 42.5, 36.0, "WALLS_INTERIOR")
txt("STAFF TOILET", 40.5, 33.8, "ROOM_LABELS", h=0.4)
rect(42.5, 31.0, 46.0, 36.0, "WALLS_INTERIOR")
txt("STORE", 44.2, 33.8, "ROOM_LABELS", h=0.4)

# CLASS ROOM-16   y 20–31
rect(38.5, 20.0, 46.0, 31.0, "WALLS_INTERIOR")
room("CLASS ROOM-16", "7.5m x 11.0m", 42.2, 26.0)

# CLASS ROOM-17   y 14.5–20
rect(38.5, 14.5, 46.0, 20.0, "WALLS_INTERIOR")
room("CLASS ROOM-17", "7.5m x 5.5m", 42.2, 17.5)

# CLASS ROOM-18   y 9.5–14.5
rect(38.5, 9.5, 46.0, 14.5, "WALLS_INTERIOR")
room("CLASS ROOM-18", "7.5m x 5.0m", 42.2, 12.0)

# CLASS ROOM-19   y 0–9.5
rect(38.5, 0.0, 46.0, 9.5, "WALLS_INTERIOR")
room("CLASS ROOM-19", "7.5m x 9.5m", 42.2, 5.5)

# ── 8. Central staircase 2 + Lift/Elec (EXACT same as first floor) ────────────
rect(32.0, 25.5, 36.0, 31.5, "STAIRS")
stair_treads(32.0, 25.5, 36.0, 31.5, n=6)
txt("STAIRS (DN / UP)", 34.0, 28.5, "ROOM_LABELS", h=0.5)

rect(32.0, 22.0, 34.5, 25.5, "WALLS_INTERIOR")
txt("LIFT", 33.2, 23.8, "ROOM_LABELS", h=0.5)

rect(34.5, 22.0, 36.0, 25.5, "WALLS_INTERIOR")
txt("ELEC.", 35.2, 23.8, "ROOM_LABELS", h=0.3)

# ── 9. Horizontal grid lines (EXACT same as first floor) ─────────────────────
line(0.0,  7.0, 46.0,  7.0, "WALLS_INTERIOR")
line(0.0,  9.5, 46.0,  9.5, "WALLS_INTERIOR")
line(18.9, 0.0, 18.9,  7.0, "WALLS_INTERIOR")

# ── 10. Bottom row (y 0–7) ────────────────────────────────────────────────────
# CLASS ROOM-22   x 0–7.5
rect(0.0, 0.0, 7.5, 7.0, "WALLS_INTERIOR")
room("CLASS ROOM-22", "7.5m x 7.0m", 3.8, 4.0)

# CLASS ROOM-23   x 7.5–15
rect(7.5, 0.0, 15.0, 7.0, "WALLS_INTERIOR")
room("CLASS ROOM-23", "7.5m x 7.0m", 11.2, 4.0)

# STAFF TOILET   x 15–18.9
rect(15.0, 0.0, 18.9, 7.0, "WALLS_INTERIOR")
txt("STAFF TOILET", 16.9, 4.0, "ROOM_LABELS", h=0.4)

# GIRLS TOILET   x 18.9–22.8
rect(18.9, 0.0, 22.8, 7.0, "WALLS_INTERIOR")
txt("GIRLS TOILET", 20.9, 4.0, "ROOM_LABELS", h=0.4)

# CLASS ROOM-21   x 22.8–30.5
rect(22.8, 0.0, 30.5, 7.0, "WALLS_INTERIOR")
room("CLASS ROOM-21", "7.7m x 7.0m", 26.6, 4.0)

# (GEOGRAPHY LAB) CLASS ROOM-20   x 30.5–38.5
rect(30.5, 0.0, 38.5, 7.0, "WALLS_INTERIOR")
txt("(GEOGRAPHY LAB)", 34.5, 5.2, "ROOM_LABELS", h=0.4)
txt("CLASS ROOM-20",   34.5, 4.0, "ROOM_LABELS", h=0.5)
txt("8.0m x 7.0m",    34.5, 2.8, "DIMENSIONS",   h=0.3, style="OpenSans-Light")

# ── 11. Compass (EXACT same as first floor) ───────────────────────────────────
cx, cy, r = 55.0, 35.0, 5.0
msp.add_circle((cx, cy), r,    dxfattribs={"layer": "COMPASS"})
msp.add_circle((cx, cy), 0.75, dxfattribs={"layer": "COMPASS"})

arms = [
    ((cx, cy), (cx, cy + r)),    # N
    ((cx, cy), (cx, cy - r)),    # S
    ((cx, cy), (cx - r, cy)),    # W
    ((cx, cy), (cx + r, cy)),    # E
]
for s, e in arms:
    msp.add_line(s, e, dxfattribs={"layer": "COMPASS"})

# Arrowhead polys (match first floor)
msp.add_lwpolyline(
    [(cx, cy + r), (cx - 0.7, cy + r - 1.8), (cx + 0.7, cy + r - 1.8)],
    close=True, dxfattribs={"layer": "COMPASS"}
)
msp.add_lwpolyline(
    [(cx - r, cy), (cx - r + 1.8, cy + 0.7), (cx - r + 1.8, cy - 0.7)],
    close=True, dxfattribs={"layer": "COMPASS"}
)

for label, px, py in [
    ("N", cx, cy + r + 1.5),
    ("S", cx, cy - r - 1.5),
    ("W", cx - r - 1.5, cy),
    ("E", cx + r + 1.5, cy),
]:
    txt(label, px, py, "COMPASS", h=1.2, style="OpenSans-Bold")

# Compass direction text
txt("EAST (E)",              55.0, 41.0, "COMPASS", h=0.9, style="OpenSans-Bold")
txt("[MAIN ENTRANCE / ROAD]",55.0, 42.2, "COMPASS", h=0.5, style="OpenSans-Light")
txt("WEST (W)",              55.0, 29.0, "COMPASS", h=0.8, style="OpenSans-Bold")
txt("NORTH (N)",             47.5, 35.0, "COMPASS", h=0.8, style="OpenSans-Bold")
txt("SOUTH (S)",             62.5, 35.0, "COMPASS", h=0.8, style="OpenSans-Bold")

# ── 12. Dimension lines (EXACT same as first floor) ───────────────────────────
line(0.0, -0.5, 46.0, -0.5, "DIMENSIONS")
line(-1.0, 0.0, -1.0, 42.5, "DIMENSIONS")

# ── 13. Title block ───────────────────────────────────────────────────────────
txt("NATIONAL PUBLIC SCHOOL, YESHWANTHPUR",
    23.0, -3.0, "ROOM_LABELS", h=1.0, style="OpenSans-Bold")
txt("ARCHITECTURAL SECOND FLOOR PLAN",
    23.0, -4.5, "ROOM_LABELS", h=0.8, style="OpenSans-SemiBold")
txt("SCALE: 1 UNIT = 1.0 METER | DIMENSIONS IN METERS",
    23.0, -6.0, "DIMENSIONS", h=0.5, style="OpenSans-Light")
txt("TOTAL WIDTH = 46.00 m", 23.0, -0.2, "DIMENSIONS", h=0.5, style="OpenSans-Light")
txt("TOTAL DEPTH = 42.50 m", -1.3, 21.25, "DIMENSIONS", h=0.5, style="OpenSans-Light")

# ── Save ──────────────────────────────────────────────────────────────────────
out = r"c:\Users\safeg\Desktop\scientifica\floorplans\second_floor_plan_meters.dxf"
doc.saveas(out)
print(f"Saved: {out}")
