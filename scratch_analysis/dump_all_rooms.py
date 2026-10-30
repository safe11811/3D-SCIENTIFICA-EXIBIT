import ezdxf
import os
import json

def get_dxf_rooms(filename):
    doc = ezdxf.readfile(os.path.join("floorplans", filename))
    msp = doc.modelspace()
    
    # Collect all text items
    texts = []
    for e in msp:
        if e.dxftype() in ('TEXT', 'MTEXT'):
            t = e.dxf.text if hasattr(e.dxf, 'text') else getattr(e, 'text', '')
            pt = e.dxf.insert
            layer = e.dxf.layer
            texts.append({
                'text': t.strip(),
                'x': round(pt.x, 2),
                'y': round(pt.y, 2),
                'layer': layer
            })
            
    # Collect polylines
    polys = []
    for e in msp:
        if e.dxftype() == 'LWPOLYLINE':
            pts = [(round(p[0], 2), round(p[1], 2)) for p in e.get_points()]
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            w = round(max_x - min_x, 2)
            d = round(max_y - min_y, 2)
            cx = round((min_x + max_x) / 2, 2)
            cy = round((min_y + max_y) / 2, 2)
            layer = e.dxf.layer
            polys.append({
                'layer': layer,
                'min_x': min_x, 'max_x': max_x,
                'min_y': min_y, 'max_y': max_y,
                'w': w, 'd': d,
                'cx': cx, 'cy': cy,
                'pts': pts
            })
            
    # Collect lines
    lines = []
    for e in msp:
        if e.dxftype() == 'LINE':
            lines.append({
                'layer': e.dxf.layer,
                'start': (round(e.dxf.start.x, 2), round(e.dxf.start.y, 2)),
                'end': (round(e.dxf.end.x, 2), round(e.dxf.end.y, 2))
            })
            
    return {'texts': texts, 'polys': polys, 'lines': lines}

for fname in ["basement_floor_plan_meters.dxf", "ground_floor_plan_meters.dxf", "first_floor_plan_meters.dxf"]:
    data = get_dxf_rooms(fname)
    print("=" * 60)
    print(f"FILE: {fname}")
    print(f"Polygons ({len(data['polys'])}):")
    for p in sorted(data['polys'], key=lambda p: (p['layer'], p['min_y'], p['min_x'])):
        # find matching texts inside or near this poly
        contained_texts = [
            t['text'] for t in data['texts'] 
            if p['min_x'] - 0.5 <= t['x'] <= p['max_x'] + 0.5 and p['min_y'] - 0.5 <= t['y'] <= p['max_y'] + 0.5
            and t['layer'] in ('ROOM_LABELS', 'DIMENSIONS')
        ]
        print(f"  Layer: {p['layer']:15} Box: [{p['min_x']}, {p['min_y']}] to [{p['max_x']}, {p['max_y']}] (w={p['w']}, d={p['d']}, center=({p['cx']}, {p['cy']})) -> Texts: {contained_texts}")
