import ezdxf
import os
import json

def analyze_floor(fname):
    doc = ezdxf.readfile(os.path.join("floorplans", fname))
    msp = doc.modelspace()
    
    rooms = []
    # Find all ROOM_LABELS text
    room_labels = []
    dim_labels = []
    all_texts = []
    for e in msp:
        if e.dxftype() in ('TEXT', 'MTEXT'):
            txt = (e.dxf.text if hasattr(e.dxf, 'text') else getattr(e, 'text', '')).strip()
            pt = e.dxf.insert
            layer = e.dxf.layer
            all_texts.append({'text': txt, 'x': round(pt.x, 2), 'y': round(pt.y, 2), 'layer': layer})
            if layer == 'ROOM_LABELS':
                room_labels.append({'text': txt, 'x': round(pt.x, 2), 'y': round(pt.y, 2)})
            elif layer == 'DIMENSIONS':
                dim_labels.append({'text': txt, 'x': round(pt.x, 2), 'y': round(pt.y, 2)})
                
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
            if min_y < 0 or max_x > 50: # Skip title block and compass
                continue
            polys.append({
                'layer': layer,
                'min_x': min_x, 'max_x': max_x,
                'min_y': min_y, 'max_y': max_y,
                'w': w, 'd': d,
                'cx': cx, 'cy': cy,
                'pts': pts
            })
            
    return {'room_labels': room_labels, 'dim_labels': dim_labels, 'polys': polys, 'all_texts': all_texts}

for fname in ["basement_floor_plan_meters.dxf", "ground_floor_plan_meters.dxf", "first_floor_plan_meters.dxf"]:
    res = analyze_floor(fname)
    print("=" * 70)
    print(f"FILE: {fname}")
    for p in sorted(res['polys'], key=lambda x: (x['layer'], -x['cy'], x['cx'])):
        # match label inside
        matching_labels = [
            t['text'] for t in res['room_labels']
            if p['min_x'] - 0.2 <= t['x'] <= p['max_x'] + 0.2 and p['min_y'] - 0.2 <= t['y'] <= p['max_y'] + 0.2
        ]
        matching_dims = [
            t['text'] for t in res['dim_labels']
            if p['min_x'] - 0.2 <= t['x'] <= p['max_x'] + 0.2 and p['min_y'] - 0.2 <= t['y'] <= p['max_y'] + 0.2
        ]
        print(f"[{p['layer']:14}] X:[{p['min_x']:5.2f}, {p['max_x']:5.2f}] Y:[{p['min_y']:5.2f}, {p['max_y']:5.2f}] W:{p['w']:4.1f} D:{p['d']:4.1f} Center:({p['cx']:5.2f}, {p['cy']:5.2f}) -> {matching_labels} ({matching_dims})")
