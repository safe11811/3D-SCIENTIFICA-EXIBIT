import ezdxf
import os

files = [
    "basement_floor_plan_meters.dxf",
    "ground_floor_plan_meters.dxf",
    "first_floor_plan_meters.dxf"
]

for fname in files:
    path = os.path.join("floorplans", fname)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    doc = ezdxf.readfile(path)
    msp = doc.modelspace()
    print("=" * 60)
    print(f"FILE: {fname}")
    layers = [layer.dxf.name for layer in doc.layers]
    print(f"Layers: {layers}")
    
    entity_counts = {}
    texts = []
    min_x, min_y, max_x, max_y = float('inf'), float('inf'), float('-inf'), float('-inf')
    
    for e in msp:
        dxftype = e.dxftype()
        entity_counts[dxftype] = entity_counts.get(dxftype, 0) + 1
        
        # update bounding box
        if dxftype in ('LINE',):
            start = e.dxf.start
            end = e.dxf.end
            min_x = min(min_x, start.x, end.x)
            max_x = max(max_x, start.x, end.x)
            min_y = min(min_y, start.y, end.y)
            max_y = max(max_y, start.y, end.y)
        elif dxftype in ('LWPOLYLINE', 'POLYLINE'):
            try:
                for pt in e.vertices():
                    min_x = min(min_x, pt.dxf.location.x)
                    max_x = max(max_x, pt.dxf.location.x)
                    min_y = min(min_y, pt.dxf.location.y)
                    max_y = max(max_y, pt.dxf.location.y)
            except:
                for pt in e.get_points():
                    min_x = min(min_x, pt[0])
                    max_x = max(max_x, pt[0])
                    min_y = min(min_y, pt[1])
                    max_y = max(max_y, pt[1])
        elif dxftype in ('TEXT', 'MTEXT'):
            t = e.dxf.text if hasattr(e.dxf, 'text') else getattr(e, 'text', '')
            pt = e.dxf.insert
            texts.append((t, round(pt.x, 2), round(pt.y, 2), getattr(e.dxf, 'layer', '')))
            
    print(f"Entity counts: {entity_counts}")
    print(f"Bounds: X: [{min_x:.2f}, {max_x:.2f}] (W={max_x-min_x:.2f}), Y: [{min_y:.2f}, {max_y:.2f}] (H={max_y-min_y:.2f})")
    print(f"Total texts: {len(texts)}")
    print("Texts sample / list:")
    for t in texts:
        print(f"  [{t[3]}] ({t[1]}, {t[2]}): {repr(t[0])}")
